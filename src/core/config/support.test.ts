import { describe, expect, it } from 'vitest';

import { parseSupportEmail } from './support';

describe('parseSupportEmail', () => {
  it('accepts a valid address', () => {
    expect(parseSupportEmail(' help@example.org ')).toBe('help@example.org');
  });

  it('treats unset, empty and malformed values as not configured', () => {
    expect(parseSupportEmail(undefined)).toBeNull();
    expect(parseSupportEmail('')).toBeNull();
    expect(parseSupportEmail('TODO')).toBeNull();
  });
});
