import { describe, expect, it } from "vitest";
import { ACTIVE_COUPON, getCouponDiscountCents, normalizeCouponCode } from "../shared/checkoutConfig";

describe("checkout promotions", () => {
  it("applies the active 20% coupon case-insensitively", () => {
    expect(normalizeCouponCode(" shelby20 ")).toBe(ACTIVE_COUPON.code);
    expect(getCouponDiscountCents(320000, "shelby20")).toBe(64000);
  });

  it("does not apply unknown coupons", () => {
    expect(getCouponDiscountCents(320000, "OUTRO10")).toBe(0);
  });
});
