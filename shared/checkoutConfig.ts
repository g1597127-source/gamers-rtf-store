export const ACTIVE_COUPON = {
  code: "SHELBY20",
  discountPercent: 20,
  label: "20% OFF",
};

export function normalizeCouponCode(code?: string) {
  return code?.trim().toUpperCase() || "";
}

export function getCouponDiscountCents(subtotalCents: number, code?: string) {
  return normalizeCouponCode(code) === ACTIVE_COUPON.code
    ? Math.round(subtotalCents * ACTIVE_COUPON.discountPercent / 100)
    : 0;
}
