import { describe, expect, it } from 'vitest';

import { buildProgressMoment } from './achievementModel';

describe('buildProgressMoment', () => {
  it('surfaces smoke-free day milestones first', () => {
    const moment = buildProgressMoment({
      elapsedDays: 7.8,
      cigarettesAvoided: 20,
      moneyReclaimed: 300,
      minutesReclaimed: 120,
      currencySymbol: '₹',
    });

    expect(moment).toMatchObject({
      id: 'days-7',
      title: '7 smoke-free days',
    });
  });

  it('falls back to avoided cigarettes when no day milestone is reached', () => {
    const moment = buildProgressMoment({
      elapsedDays: 0.5,
      cigarettesAvoided: 51,
      moneyReclaimed: 825,
      minutesReclaimed: 605,
      currencySymbol: '₹',
    });

    expect(moment).toMatchObject({
      id: 'cigarettes-50',
      title: '50 cigarettes avoided',
    });
  });

  it('surfaces reclaimed money when stronger milestones are not reached', () => {
    const moment = buildProgressMoment({
      elapsedDays: 0.2,
      cigarettesAvoided: 5,
      moneyReclaimed: 1_020,
      minutesReclaimed: 55,
      currencySymbol: '₹',
    });

    expect(moment).toMatchObject({
      id: 'money-1000',
      title: '₹1,000 reclaimed',
    });
  });

  it('stops surfacing a milestone after its short celebration window', () => {
    expect(
      buildProgressMoment({
        elapsedDays: 10,
        cigarettesAvoided: 80,
        moneyReclaimed: 1_400,
        minutesReclaimed: 800,
        currencySymbol: '₹',
      }),
    ).toBeNull();
  });

  it('returns null when there is not enough progress for a moment yet', () => {
    expect(
      buildProgressMoment({
        elapsedDays: 0.1,
        cigarettesAvoided: 1,
        moneyReclaimed: 50,
        minutesReclaimed: 10,
        currencySymbol: '₹',
      }),
    ).toBeNull();
  });
});
