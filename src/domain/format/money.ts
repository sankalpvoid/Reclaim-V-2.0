// Indian grouping: last three digits, then pairs (12,34,567). Written out so it does not
// depend on the JS engine's Intl locale data.
function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const head = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${head},${digits.slice(-3)}`;
}

function groupWestern(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatMoneyAmount(
  currencySymbol: string,
  value: number,
  rounding: 'round' | 'floor' = 'round',
): string {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const whole = rounding === 'floor' ? Math.floor(safeValue) : Math.round(safeValue);
  const digits = String(whole);
  return `${currencySymbol}${currencySymbol === '₹' ? groupIndian(digits) : groupWestern(digits)}`;
}
