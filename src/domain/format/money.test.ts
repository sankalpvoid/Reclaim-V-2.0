import { describe, expect, it } from 'vitest';

import { formatMoneyAmount } from './money';

describe('formatMoneyAmount', () => {
  it('groups rupees the Indian way', () => {
    expect(formatMoneyAmount('₹', 0)).toBe('₹0');
    expect(formatMoneyAmount('₹', 999)).toBe('₹999');
    expect(formatMoneyAmount('₹', 1000)).toBe('₹1,000');
    expect(formatMoneyAmount('₹', 12345)).toBe('₹12,345');
    expect(formatMoneyAmount('₹', 123456)).toBe('₹1,23,456');
    expect(formatMoneyAmount('₹', 12345678)).toBe('₹1,23,45,678');
  });

  it('groups other currencies in thousands', () => {
    expect(formatMoneyAmount('$', 1234567)).toBe('$1,234,567');
  });

  it('floors for milestones so a goal is never overstated', () => {
    expect(formatMoneyAmount('₹', 149.9, 'floor')).toBe('₹149');
    expect(formatMoneyAmount('₹', 149.9)).toBe('₹150');
  });

  it('never shows negative or non-finite amounts', () => {
    expect(formatMoneyAmount('₹', -50)).toBe('₹0');
    expect(formatMoneyAmount('₹', Number.NaN)).toBe('₹0');
  });
});
