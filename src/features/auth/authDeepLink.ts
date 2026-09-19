import { supabase } from '@/core/supabase/client';
import { parseAuthDeepLink } from '@/features/auth/authDeepLinkModel';

type AuthDeepLinkResult = {
  kind: 'session' | 'invalid';
};

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
