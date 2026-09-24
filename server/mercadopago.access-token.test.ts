import { describe, expect, it } from "vitest";

describe("Mercado Pago access token", () => {
  it("authenticates against the Mercado Pago account endpoint", async () => {
    const token = process.env.MP_ACCESS_TOKEN ?? process.env.MERCADO_PAGO_ACCESS_TOKEN;
    expect(token).toBeTruthy();
    expect(token!.length).toBeGreaterThan(20);

    const response = await fetch("https://api.mercadolibre.com/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(`Mercado Pago rejected token: HTTP ${response.status} ${JSON.stringify(payload)}`);
    }
    const account = payload;
    expect(account).toHaveProperty("id");
  }, 15000);
});
