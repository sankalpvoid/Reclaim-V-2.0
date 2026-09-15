import { calculateQuitMetrics } from '../../domain/smoking/quitMetrics';
import {
  buildRecentDailySeries,
  calculateSmokingSpend,
  countCigarettesOnDay,
  dayKey,
  type SmokingEvent,
} from '../../domain/smoking/smokingEvents';
import { summarizeToday } from '../../domain/smoking/reduction';
import type { Profile } from '../profile/profile';

export function formatSmokeFreeDuration(milliseconds: number): string {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / 60_000));
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatReclaimedMinutes(minutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;
  if (hours > 0) return `${hours}h ${remainingMinutes}m`;
  return `${remainingMinutes}m`;
}

export function formatMoney(currencySymbol: string, value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  return `${currencySymbol}${Math.round(safeValue).toLocaleString()}`;
}

export function formatAvoidedCigarettes(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  if (safeValue > 0 && safeValue < 1) return safeValue.toFixed(1);
  return Math.floor(safeValue).toLocaleString();
}

export function buildQuitTodaySummary(profile: Profile, now: Date = new Date()) {
  if (!profile.quit_date) return null;

  const metrics = calculateQuitMetrics(
    {
      quitDate: profile.quit_date,
      cigarettesPerDay: profile.cigarettes_per_day ?? 0,
      pricePerPack: profile.price_per_pack ?? 0,
      cigarettesPerPack: profile.cigarettes_per_pack ?? 0,
      minutesPerCigarette: profile.minutes_per_cigarette,
    },
    now,
  );

  return {
    ...metrics,
    durationLabel: formatSmokeFreeDuration(metrics.elapsedMilliseconds),
    avoidedLabel: formatAvoidedCigarettes(metrics.cigarettesAvoided),
    moneyLabel: formatMoney(profile.currency_symbol, metrics.moneyReclaimed),
    timeLabel: formatReclaimedMinutes(metrics.minutesReclaimed),
  };
}

export function buildSmokingTodaySummary(
  profile: Profile,
  events: readonly SmokingEvent[],
  target: number | null,
  now: Date = new Date(),
) {
  const today = dayKey(now);
  const todayCount = countCigarettesOnDay(events, today);
  const recentDays = buildRecentDailySeries(events, 7, now);
  const sevenDayCount = recentDays.reduce((sum, day) => sum + day.cigarettes, 0);
  const knownDays = recentDays.filter((day) => day.known).length;
  const todaySpend = calculateSmokingSpend(
    todayCount,
    profile.price_per_pack ?? 0,
    profile.cigarettes_per_pack ?? 0,
  );
  const sevenDaySpend = calculateSmokingSpend(
    sevenDayCount,
    profile.price_per_pack ?? 0,
    profile.cigarettes_per_pack ?? 0,
  );

  return {
    today,
    todayCount,
    sevenDayCount,
    knownDays,
    todaySpend,
    sevenDaySpend,
    recentDays,
    targetProgress: target === null ? null : summarizeToday({ smoked: todayCount, target }),
  };
}
