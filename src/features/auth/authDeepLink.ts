import { supabase } from '@/core/supabase/client';

type AuthDeepLinkResult = {
  kind: 'session' | 'invalid';
};

function extractParams(url: string): URLSearchParams {
  const parsed = new URL(url);
  const combined = new URLSearchParams(parsed.search);
  const hash = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash;
  if (hash) {
    const hashParams = new URLSearchParams(hash);
    hashParams.forEach((value, key) => combined.set(key, value));
  }
  return combined;
}

export async function createSessionFromAuthUrl(url: string): Promise<AuthDeepLinkResult> {
  const params = extractParams(url);

  const errorDescription = params.get('error_description');
  if (errorDescription) {
    throw new Error(errorDescription);
  }

  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return { kind: 'session' };
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    return { kind: 'session' };
  }

  return { kind: 'invalid' };
}
