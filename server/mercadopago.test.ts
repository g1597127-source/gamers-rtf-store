import { describe, expect, it } from "vitest";
import { mapPaymentStatus, normalizeCheckoutItems } from "./mercadopago";

describe("Mercado Pago checkout", () => {
  it("recalcula itens usando o catálogo do servidor", () => {
    const [line] = normalizeCheckoutItems([{ productId: 1, quantity: 2 }]);
    expect(line?.product.name).toBe("PlayStation 5 Slim + 2 controles");
    expect(line?.product.unitPriceCents).toBe(320000);
    expect(line?.quantity).toBe(2);
  });

  it("recusa produto desconhecido e quantidade inválida", () => {
    expect(() => normalizeCheckoutItems([{ productId: 999, quantity: 1 }])).toThrow("PRODUCT_NOT_FOUND");
    expect(() => normalizeCheckoutItems([{ productId: 1, quantity: 0 }])).toThrow("INVALID_CHECKOUT_ITEM");
  });

  it("normaliza os status recebidos do Mercado Pago", () => {
    expect(mapPaymentStatus("approved")).toBe("approved");
    expect(mapPaymentStatus("pending")).toBe("pending");
    expect(mapPaymentStatus("cc_rejected_bad_filled_card_number")).toBe("unknown");
    expect(mapPaymentStatus()).toBe("unknown");
  });
});
