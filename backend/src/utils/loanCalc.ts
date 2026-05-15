export function calculateLoan(principal: number, tenureDays: number, ratePercent = 12) {
  // SI = (P × R × T) / (365 × 100)
  const simpleInterest = (principal * ratePercent * tenureDays) / (365 * 100);
  const totalRepayment = principal + simpleInterest;
  return {
    simpleInterest: Math.round(simpleInterest * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
  };
}
