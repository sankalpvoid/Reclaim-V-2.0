export type SmokingEvent = {
  id?: string;
  smokedAt: Date | string;
  cigarettes: number;
};

export type DaySmokingSummary = {
  day: string;
  cigarettes: number;
  known: boolean;
};

export function dayKey(value: Date | string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeCigaretteCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export function countCigarettes(events: readonly SmokingEvent[]): number {
  return events.reduce((sum, event) => sum + normalizeCigaretteCount(event.cigarettes), 0);
}

export function countCigarettesOnDay(
  events: readonly SmokingEvent[],
  day: string,
): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return 0;
  return countCigarettes(events.filter((event) => dayKey(event.smokedAt) === day));
}

export function buildRecentDailySeries(
  events: readonly SmokingEvent[],
  length = 7,
  now: Date = new Date(),
): DaySmokingSummary[] {
  const safeLength = Math.max(1, Math.min(90, Math.round(length)));
  const result: DaySmokingSummary[] = [];

  for (let offset = safeLength - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = dayKey(date);
    const matching = events.filter((event) => dayKey(event.smokedAt) === key);
    result.push({
      day: key,
      cigarettes: countCigarettes(matching),
      known: matching.length > 0,
    });
  }

  return result;
}

export function calculateSmokingSpend(
  cigarettes: number,
  pricePerPack: number,
  cigarettesPerPack: number,
): number {
  const count = normalizeCigaretteCount(cigarettes);
  if (!Number.isFinite(pricePerPack) || pricePerPack < 0) return 0;
  if (!Number.isFinite(cigarettesPerPack) || cigarettesPerPack <= 0) return 0;
  return count * (pricePerPack / cigarettesPerPack);
}
