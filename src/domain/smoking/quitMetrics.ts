export type QuitMetricInput = {
  quitDate: Date | string;
  cigarettesPerDay: number;
  pricePerPack: number;
  cigarettesPerPack: number;
  minutesPerCigarette: number;
};

export type QuitMetrics = {
  elapsedMilliseconds: number;
  elapsedDays: number;
  cigarettesAvoided: number;
  moneyReclaimed: number;
  minutesReclaimed: number;
};

const DAY_MS = 86_400_000;

function nonNegativeFinite(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function calculateQuitMetrics(
  input: QuitMetricInput,
  now: Date = new Date(),
): QuitMetrics {
  const quitAt = new Date(input.quitDate).getTime();
  const nowAt = now.getTime();
  const elapsedMilliseconds =
    Number.isFinite(quitAt) && Number.isFinite(nowAt) ? Math.max(0, nowAt - quitAt) : 0;
  const elapsedDays = elapsedMilliseconds / DAY_MS;
  const cigarettesPerDay = nonNegativeFinite(input.cigarettesPerDay);
  const cigarettesAvoided = elapsedDays * cigarettesPerDay;
  const cigarettesPerPack = nonNegativeFinite(input.cigarettesPerPack);
  const pricePerPack = nonNegativeFinite(input.pricePerPack);
  const pricePerCigarette = cigarettesPerPack > 0 ? pricePerPack / cigarettesPerPack : 0;
  const minutesPerCigarette = nonNegativeFinite(input.minutesPerCigarette);

  return {
    elapsedMilliseconds,
    elapsedDays,
    cigarettesAvoided,
    moneyReclaimed: cigarettesAvoided * pricePerCigarette,
    minutesReclaimed: cigarettesAvoided * minutesPerCigarette,
  };
}
