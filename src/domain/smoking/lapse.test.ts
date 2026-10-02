import { describe, expect, it } from 'vitest';

import { applyLapse, validateSmokedAt } from './lapse';

const now = new Date('2026-10-02T12:00:00.000Z');

describe('validateSmokedAt', () => {
  it('accepts now and the past', () => {
    expect(validateSmokedAt(now, now).ok).toBe(true);
    expect(validateSmokedAt(new Date('2026-09-01T00:00:00Z'), now).ok).toBe(true);
  });

  it('rejects a future time', () => {
    expect(validateSmokedAt(new Date('2026-10-02T12:30:00Z'), now)).toEqual({
      ok: false,
      reason: 'future',
    });
  });

  it('tolerates a few seconds of clock skew but never stores a future time', () => {
    const result = validateSmokedAt(new Date(now.getTime() + 20_000), now);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.getTime()).toBe(now.getTime());
  });

  it('rejects an invalid date', () => {
    expect(validateSmokedAt(new Date('nope'), now)).toEqual({ ok: false, reason: 'invalid-date' });
  });
});

describe('applyLapse', () => {
  const base = { quitDate: '2026-09-22T12:00:00.000Z', attemptNumber: 1, bestStreakSeconds: 0 };

  it('banks the finished streak, restarts the clock and counts an attempt', () => {
    const result = applyLapse(base, now, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.update.bestStreakSeconds).toBe(10 * 86_400);
    expect(result.update.attemptNumber).toBe(2);
    expect(result.update.quitDate.getTime()).toBe(now.getTime());
  });

  it('never lowers an existing best streak', () => {
    const result = applyLapse({ ...base, bestStreakSeconds: 30 * 86_400 }, now, now);
    expect(result.ok && result.update.bestStreakSeconds).toBe(30 * 86_400);
  });

  it('restarts at the real time of a backdated lapse', () => {
    const earlier = new Date('2026-10-01T12:00:00.000Z');
    const result = applyLapse(base, earlier, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.update.quitDate.getTime()).toBe(earlier.getTime());
    expect(result.update.bestStreakSeconds).toBe(9 * 86_400);
  });

  it('rejects a lapse dated before the quit date', () => {
    expect(applyLapse(base, new Date('2026-09-01T00:00:00Z'), now)).toEqual({
      ok: false,
      reason: 'before-quit',
    });
  });

  it('rejects a future lapse', () => {
    expect(applyLapse(base, new Date('2026-10-03T00:00:00Z'), now)).toEqual({
      ok: false,
      reason: 'future',
    });
  });

  it('handles a missing quit date without inventing a streak', () => {
    const result = applyLapse({ ...base, quitDate: null }, now, now);
    expect(result.ok && result.update.bestStreakSeconds).toBe(0);
  });
});
