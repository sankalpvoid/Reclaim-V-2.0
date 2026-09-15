import { describe, expect, it } from 'vitest';

import { formatTimer, recommendCravingTool } from './cravingModel';

describe('craving support model', () => {
  it('does not recommend a tool before enough feedback exists', () => {
    expect(
      recommendCravingTool([
        { toolkit: 'breathe', tool_feedback: 'yes' },
        { toolkit: 'breathe', tool_feedback: 'a_little' },
      ]),
    ).toBeNull();
  });

  it('recommends a repeatedly helpful tool after enough rated cravings', () => {
    expect(
      recommendCravingTool([
        { toolkit: 'breathe', tool_feedback: 'yes' },
        { toolkit: 'breathe', tool_feedback: 'a_little' },
        { toolkit: 'timer', tool_feedback: 'not_really' },
        { toolkit: 'timer', tool_feedback: 'not_really' },
      ]),
    ).toBe('breathe');
  });

  it('formats countdown values without going below zero', () => {
    expect(formatTimer(300)).toBe('05:00');
    expect(formatTimer(9)).toBe('00:09');
    expect(formatTimer(-1)).toBe('00:00');
  });
});
