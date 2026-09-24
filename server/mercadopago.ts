import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { Express, Request, Response } from "express";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { getCatalogItem } from "../shared/storeCatalog";
import { getCouponDiscountCents, normalizeCouponCode, ACTIVE_COUPON } from "../shared/checkoutConfig";
import { quoteCorreiosShipping, type ShippingService } from "./correios";
import { createOrderWithItems, getOrderByExternalReference, updateOrderPayment } from "./db";
import { notifyOwner } from "./_core/notification";
import { ENV } from "./_core/env";

export type CheckoutItemInput = { productId: number; quantity: number };
export type CustomerCheckoutData = {
  fullName: string;
  cpf: string;
  birthDate: string;
  address: string;
  phone: string;
  email: string;
};

function getClient() {
  if (!ENV.mercadoPagoAccessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN_NOT_CONFIGURED");
  }
  return new MercadoPagoConfig({
    accessToken: ENV.mercadoPagoAccessToken,
    options: { timeout: 8000 },
  });
}

export function getPublicAppUrl(req: Request) {
  if (ENV.publicAppUrl) return ENV.publicAppUrl.replace(/\/$/, "");
  const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0];
  const protocol = forwardedProto || req.protocol;
  return `${protocol}://${req.get("host")}`;
}

export function normalizeCheckoutItems(input: CheckoutItemInput[]) {
  const grouped = new Map<number, number>();
  for (const item of input) {
    const quantity = Math.floor(item.quantity);
    if (!Number.isInteger(item.productId) || quantity < 1 || quantity > 20) {
      throw new Error("INVALID_CHECKOUT_ITEM");
    }
    grouped.set(item.productId, (grouped.get(item.productId) ?? 0) + quantity);
  }
  if (grouped.size === 0) throw new Error("EMPTY_CHECKOUT");

  return Array.from(grouped.entries()).map(([productId, quantity]) => {
    const product = getCatalogItem(productId);
    if (!product) throw new Error("PRODUCT_NOT_FOUND");
    return { product, quantity };
  });
}

export async function createCheckoutPreference(input: {
  items: CheckoutItemInput[];
  payerEmail?: string;
  couponCode?: string;
  shipping?: { cep: string; service: ShippingService };
  customer: CustomerCheckoutData;
  req: Request;
}) {
  const normalized = normalizeCheckoutItems(input.items);
  const subtotalCents = normalized.reduce((sum, line) => sum + line.product.unitPriceCents * line.quantity, 0);
  const normalizedCoupon = normalizeCouponCode(input.couponCode);
  const discountCents = getCouponDiscountCents(subtotalCents, normalizedCoupon);
  const shippingQuote = input.shipping
    ? await quoteCorreiosShipping({ items: input.items, cep: input.shipping.cep })
    : { configured: true, options: [], message: "" };
  if (input.shipping && !shippingQuote.configured) throw new Error("CORREIOS_NOT_CONFIGURED");
  const shippingOption = input.shipping ? shippingQuote.options.find((option) => option.service === input.shipping?.service) : undefined;
  if (input.shipping && !shippingOption) throw new Error("SHIPPING_OPTION_NOT_FOUND");
  const shippingCents = shippingOption?.priceCents ?? 0;
  const totalAmountCents = subtotalCents - discountCents + shippingCents;
  const externalReference = `GRTF-${randomUUID()}`;
  const origin = getPublicAppUrl(input.req);

  const orderId = await createOrderWithItems(
    {
      externalReference,
      status: "pending",
      totalAmountCents,
      currency: "BRL",
      payerEmail: input.customer.email || input.payerEmail || undefined,
    },
    normalized.map(({ product, quantity }) => ({
      orderId: 0,
      productId: product.id,
      title: product.name,
      quantity,
      unitPriceCents: product.unitPriceCents,
    })),
  );

  try {
    const preference = new Preference(getClient());
    const response = await preference.create({
      body: {
        items: [
          ...normalized.map(({ product, quantity }) => ({
          id: String(product.id),
          title: product.name,
          description: product.subtitle,
          quantity,
          currency_id: "BRL",
          unit_price: Math.round(product.unitPriceCents * quantity * (1 - (discountCents / subtotalCents))) / quantity / 100,
        })),
          ...(shippingOption ? [{ id: `shipping-${shippingOption.service.toLowerCase()}`, title: `Frete ${shippingOption.label}`, quantity: 1, currency_id: "BRL", unit_price: shippingCents / 100 }] : []),
        ],
        metadata: {
          coupon: normalizedCoupon === ACTIVE_COUPON.code ? ACTIVE_COUPON.code : undefined,
          shipping_service: shippingOption?.service,
          shipping_cep: input.shipping?.cep,
        },
        payer: {
          email: input.customer.email,
          name: input.customer.fullName,
          phone: { number: input.customer.phone },
        },
        external_reference: externalReference,
        notification_url: `${origin}/api/mercadopago/webhook`,
        back_urls: {
          success: `${origin}/pagamento/sucesso?external_reference=${externalReference}`,
          pending: `${origin}/pagamento/pendente?external_reference=${externalReference}`,
          failure: `${origin}/pagamento/falhou?external_reference=${externalReference}`,
        },
        auto_return: "approved",
        statement_descriptor: "GAMERS RTF",
      },
      requestOptions: { idempotencyKey: externalReference },
    });

    const notificationSent = await notifyOwner({
      title: `Novo checkout Gamers RTF — ${input.customer.fullName}`,
      content: [
        "Destinatário solicitado: g1597127@gmail.com",
        `Referência: ${externalReference}`,
        `Nome: ${input.customer.fullName}`,
        `CPF: ${input.customer.cpf}`,
        `Data de nascimento: ${input.customer.birthDate}`,
        `Endereço: ${input.customer.address}`,
        `Telefone: ${input.customer.phone}`,
        `E-mail: ${input.customer.email}`,
        `Total: R$ ${(totalAmountCents / 100).toFixed(2).replace(".", ",")}`,
        `Pagamento: ${response.init_point ?? response.sandbox_init_point ?? "link não retornado"}`,
      ].join("\n"),
    }).catch((error) => {
      console.warn("[Checkout] Customer notification failed", error);
      return false;
    });

    return {
      orderId,
      externalReference,
      preferenceId: response.id ?? null,
      initPoint: response.init_point ?? null,
      sandboxInitPoint: response.sandbox_init_point ?? null,
      notificationSent,
    };
  } catch (error) {
    console.error("[Mercado Pago] Failed to create preference", error);
    await updateOrderPayment({ externalReference, status: "unknown", paymentStatusDetail: "preference_creation_failed" });
    throw new Error("MERCADO_PAGO_PREFERENCE_FAILED");
  }
}

function getHeader(req: Request, name: string) {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function isValidWebhookSignature(req: Request, dataId: string) {
  if (!ENV.mercadoPagoWebhookSecret) return true;
  const signature = getHeader(req, "x-signature");
  const requestId = getHeader(req, "x-request-id");
  if (!signature || !requestId) return false;
  const parts = Object.fromEntries(signature.split(",").map((part) => {
    const [key, value] = part.trim().split("=");
    return [key, value];
  }));
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac("sha256", ENV.mercadoPagoWebhookSecret).update(manifest).digest("hex");
  const provided = Buffer.from(parts.v1, "utf8");
  const calculated = Buffer.from(expected, "utf8");
  return provided.length === calculated.length && timingSafeEqual(provided, calculated);
}

export function mapPaymentStatus(status?: string): "pending" | "in_process" | "approved" | "rejected" | "cancelled" | "refunded" | "unknown" {
  if (status === "approved" || status === "pending" || status === "in_process" || status === "rejected" || status === "cancelled" || status === "refunded") return status;
  return "unknown";
}

async function processPaymentNotification(req: Request) {
  const notification = req.body as { type?: string; data?: { id?: string | number }; action?: string };
  const paymentId = notification.data?.id ?? req.query["data.id"];
  if (notification.type !== "payment" || !paymentId) return;
  const payment = await new Payment(getClient()).get({ id: String(paymentId) });
  const externalReference = payment.external_reference;
  if (!externalReference) return;
  const order = await getOrderByExternalReference(externalReference);
  if (!order) return;
  if (order.status === "approved" && payment.status !== "approved") return;
  await updateOrderPayment({
    externalReference,
    status: mapPaymentStatus(payment.status),
    paymentId: String(payment.id ?? paymentId),
    paymentStatus: payment.status,
    paymentStatusDetail: payment.status_detail,
  });
}

export function registerMercadoPagoRoutes(app: Express) {
  app.post("/api/mercadopago/webhook", async (req: Request, res: Response) => {
    const dataId = String(req.body?.data?.id ?? req.query["data.id"] ?? "");
    if (!isValidWebhookSignature(req, dataId)) {
      res.status(401).json({ ok: false, error: "invalid_signature" });
      return;
    }
    try {
      await processPaymentNotification(req);
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error("[Mercado Pago] Webhook processing failed", error);
      res.status(500).json({ ok: false });
    }
  });
}
