import { describe, expect, it } from "vitest";

describe("Mercado Pago configuration", () => {
  it("validates the configured Public Key with the payment methods endpoint", async () => {
    const publicKey = process.env.VITE_MERCADO_PAGO_PUBLIC_KEY;
    expect(publicKey).toMatch(/^APP_USR-/);

    const response = await fetch(
      `https://api.mercadopago.com/v1/payment_methods?public_key=${encodeURIComponent(publicKey!)}`,
    );

    expect(response.ok).toBe(true);
    const methods = await response.json();
    expect(Array.isArray(methods)).toBe(true);
  }, 15000);
});
