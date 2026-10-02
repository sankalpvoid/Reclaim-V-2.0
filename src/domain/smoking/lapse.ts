export type LapseInput = {
  quitDate: Date | string | null;
  attemptNumber: number;
  bestStreakSeconds: number;
};

export type LapseUpdate = {
  quitDate: Date;
  attemptNumber: number;
  bestStreakSeconds: number;
};

export type LapseResult =
  | { ok: true; update: LapseUpdate }
  | { ok: false; reason: 'invalid-date' | 'future' | 'before-quit' };

const FUTURE_SKEW_MS = 60_000;

export type SmokedAtResult =
  | { ok: true; value: Date }
  | { ok: false; reason: 'invalid-date' | 'future' };

export function validateSmokedAt(value: Date, now: Date = new Date()): SmokedAtResult {
  const time = value.getTime();
  if (!Number.isFinite(time)) return { ok: false, reason: 'invalid-date' };
  if (time > now.getTime() + FUTURE_SKEW_MS) return { ok: false, reason: 'future' };
  return { ok: true, value: new Date(Math.min(time, now.getTime())) };
}

// A lapse restarts the smoke-free clock at the cigarette's time, counts a new attempt, and
// keeps the longest streak ever reached. Nothing is erased: the old streak is banked first.
export function applyLapse(
  input: LapseInput,
  smokedAt: Date,
  now: Date = new Date(),
): LapseResult {
  const checked = validateSmokedAt(smokedAt, now);
  if (!checked.ok) return checked;

  const quitAt = input.quitDate ? new Date(input.quitDate).getTime() : Number.NaN;
  if (Number.isFinite(quitAt) && checked.value.getTime() < quitAt) {
    return { ok: false, reason: 'before-quit' };
  }

  const streakSeconds = Number.isFinite(quitAt)
    ? Math.max(0, Math.floor((checked.value.getTime() - quitAt) / 1000))
    : 0;

  return {
    ok: true,
    update: {
      quitDate: checked.value,
      attemptNumber: Math.max(1, Math.floor(input.attemptNumber)) + 1,
      bestStreakSeconds: Math.max(Math.max(0, input.bestStreakSeconds), streakSeconds),
    },
  };
}
