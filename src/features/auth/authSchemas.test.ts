import { describe, expect, it } from 'vitest';

import { signInSchema, signUpSchema } from './authSchemas';

describe('auth schemas', () => {
  it('normalizes email addresses before sign in', () => {
    const result = signInSchema.parse({
      email: '  USER@Example.COM ',
      password: 'secret',
    });

    expect(result.email).toBe('user@example.com');
  });

  it('requires a valid email address', () => {
    expect(
      signInSchema.safeParse({ email: 'not-an-email', password: 'secret' }).success,
    ).toBe(false);
  });

  it('requires a stronger password for new accounts', () => {
    expect(
      signUpSchema.safeParse({ email: 'user@example.com', password: 'short' }).success,
    ).toBe(false);
  });
});
