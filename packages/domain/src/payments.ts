export function calculateApplicationFee(amountCents: number, feePercent = 0.08) {
  return Math.round(amountCents * feePercent);
}

