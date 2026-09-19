export type ParsedAuthDeepLink = {
  code: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  errorDescription: string | null;
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
