import { describe, expect, it } from 'vitest';

import { parseAuthDeepLink } from './authDeepLink';

describe('auth deep links', () => {
  it('reads implicit-flow tokens from the URL fragment', () => {
    expect(
      parseAuthDeepLink(
        'reclaim://reset-password#access_token=access-value&refresh_token=refresh-value&type=recovery',
      ),
    ).toEqual({
      code: null,
      accessToken: 'access-value',
      refreshToken: 'refresh-value',
      errorDescription: null,
    });
  });

  it('reads PKCE codes from the query string', () => {
    expect(parseAuthDeepLink('reclaim://reset-password?code=pkce-code')).toEqual({
      code: 'pkce-code',
      accessToken: null,
      refreshToken: null,
      errorDescription: null,
    });
  });

  it('preserves provider error descriptions without exposing unrelated params', () => {
    expect(
      parseAuthDeepLink(
        'reclaim://auth-callback?error=access_denied&error_description=Link%20expired&email=private%40example.com',
      ),
    ).toEqual({
      code: null,
      accessToken: null,
      refreshToken: null,
      errorDescription: 'Link expired',
    });
  });
});
