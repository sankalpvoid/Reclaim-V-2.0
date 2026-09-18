import { supabase } from '@/core/supabase/client';

export type ParsedAuthDeepLink = {
  code: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  errorDescription: string | null;
};

type AuthDeepLinkResult = {
  kind: 'session' | 'invalid';
};

export function parseAuthDeepLink(url: string): ParsedAuthDeepLink {
  const parsed = new URL(url);
  const combined = new URLSearchParams(parsed.search);
  const hash = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash;

  if (hash) {
    const hashParams = new URLSearchParams(hash);
    hashParams.forEach((value, key) => combined.set(key, value));
  }

  return {
    code: combined.get('code'),
    accessToken: combined.get('access_token'),
    refreshToken: combined.get('refresh_token'),
    errorDescription: combined.get('error_description'),
  };
}

export async function createSessionFromAuthUrl(url: string): Promise<AuthDeepLinkResult> {
  const parsed = parseAuthDeepLink(url);

  if (parsed.errorDescription) {
    throw new Error(parsed.errorDescription);
  }

  if (parsed.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(parsed.code);
    if (error) throw error;
    return { kind: 'session' };
  }

  if (parsed.accessToken && parsed.refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: parsed.accessToken,
      refresh_token: parsed.refreshToken,
    });
    if (error) throw error;
    return { kind: 'session' };
  }

  return { kind: 'invalid' };
}
