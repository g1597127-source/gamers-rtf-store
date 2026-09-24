import { getCatalogItem } from "../shared/storeCatalog";
import { ENV } from "./_core/env";

export type ShippingService = "PAC" | "SEDEX";
export type ShippingQuoteItem = { productId: number; quantity: number };

const SERVICES: Record<ShippingService, { code: string; label: string }> = {
  PAC: { code: ENV.correiosPacCode || "03298", label: "PAC" },
  SEDEX: { code: ENV.correiosSedexCode || "03220", label: "SEDEX" },
};

function digits(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeCep(cep: string) {
  const normalized = digits(cep);
  if (!/^\d{8}$/.test(normalized)) throw new Error("INVALID_CEP");
  return normalized;
}

function buildPackage(items: ShippingQuoteItem[]) {
  let quantity = 0;
  let weightGrams = 1200;
  for (const line of items) {
    const product = getCatalogItem(line.productId);
    if (!product || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) {
      throw new Error("INVALID_SHIPPING_ITEM");
    }
    quantity += line.quantity;
    weightGrams += line.quantity * (product.category === "Consoles" ? 3200 : product.category === "Jogos" ? 180 : 700);
  }
  if (quantity < 1) throw new Error("EMPTY_SHIPPING_CART");
  return {
    weightGrams: Math.min(Math.max(weightGrams, 300), 30000),
    lengthCm: Math.min(60, 28 + Math.ceil(quantity / 2) * 4),
    widthCm: 24,
    heightCm: Math.min(40, 14 + Math.ceil(quantity / 3) * 3),
  };
}

function parseMoney(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const normalized = value.replace(/R\$\s?/g, "").replace(/\./g, "").replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function unwrapResponse(payload: any): any {
  if (Array.isArray(payload)) return payload[0] ?? {};
  if (payload?.preco) return payload.preco;
  if (payload?.resultado) return Array.isArray(payload.resultado) ? payload.resultado[0] ?? {} : payload.resultado;
  if (payload?.objetos) return Array.isArray(payload.objetos) ? payload.objetos[0] ?? {} : payload.objetos;
  return payload ?? {};
}

async function fetchPrice(service: { code: string }, cepDestino: string, pack: ReturnType<typeof buildPackage>) {
  const query = new URLSearchParams({
    cepDestino,
    cepOrigem: ENV.correiosOriginCep,
    psObjeto: String(pack.weightGrams),
    tpObjeto: "2",
    comprimento: String(pack.lengthCm),
    largura: String(pack.widthCm),
    altura: String(pack.heightCm),
  });
  if (ENV.correiosContract) query.set("nuContrato", ENV.correiosContract);
  if (ENV.correiosDr) query.set("nuDR", ENV.correiosDr);
  const response = await fetch(`${ENV.correiosPriceBaseUrl}/nacional/${service.code}?${query.toString()}`, {
    headers: { Authorization: `Bearer ${ENV.correiosAccessToken}`, Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`CORREIOS_PRICE_${response.status}`);
  const payload = unwrapResponse(await response.json());
  const price = parseMoney(payload.pcFinal ?? payload.precoFinal ?? payload.valor ?? payload.preco);
  if (price === null) throw new Error("CORREIOS_PRICE_UNREADABLE");
  return Math.round(price * 100);
}

async function fetchDeadline(service: { code: string }, cepDestino: string) {
  const query = new URLSearchParams({ cepOrigem: ENV.correiosOriginCep, cepDestino });
  const response = await fetch(`${ENV.correiosDeadlineBaseUrl}/nacional/${service.code}?${query.toString()}`, {
    headers: { Authorization: `Bearer ${ENV.correiosAccessToken}`, Accept: "application/json" },
  });
  if (!response.ok) return null;
  const payload = unwrapResponse(await response.json());
  const raw = payload.prazoEntrega ?? payload.prazo ?? payload.prazoDias;
  const days = Number.parseInt(String(raw ?? ""), 10);
  return Number.isFinite(days) ? days : null;
}

export async function quoteCorreiosShipping(input: { items: ShippingQuoteItem[]; cep: string }) {
  const cepDestino = normalizeCep(input.cep);
  if (!ENV.correiosAccessToken || !ENV.correiosOriginCep) {
    return {
      configured: false,
      options: [] as Array<{ service: ShippingService; label: string; priceCents: number; deliveryDays: number | null }>,
      message: "Frete dos Correios aguardando credenciais e CEP de origem da loja.",
    };
  }

  const pack = buildPackage(input.items);
  const options = await Promise.all(Object.entries(SERVICES).map(async ([service, config]) => {
    const [priceCents, deliveryDays] = await Promise.all([
      fetchPrice(config, cepDestino, pack),
      fetchDeadline(config, cepDestino).catch(() => null),
    ]);
    return {
      service: service as ShippingService,
      label: config.label,
      priceCents,
      deliveryDays,
    };
  }));

  return { configured: true, options, message: "Cotação atualizada pelos Correios." };
}
