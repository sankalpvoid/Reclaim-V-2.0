import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
};

function readNamedKey(name: 'SUPABASE_PUBLISHABLE_KEYS' | 'SUPABASE_SECRET_KEYS'): string | null {
  const raw = Deno.env.get(name);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed.default ?? Object.values(parsed)[0] ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed.' },
      { status: 405, headers: corsHeaders },
    );
  }

  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return Response.json(
      { error: 'Authentication required.' },
      { status: 401, headers: corsHeaders },
    );
  }

  const body = await req.json().catch(() => null) as { confirmation?: unknown } | null;
  if (body?.confirmation !== 'DELETE') {
    return Response.json(
      { error: 'Deletion confirmation is required.' },
      { status: 400, headers: corsHeaders },
    );
  }

  const url = Deno.env.get('SUPABASE_URL');
  const publishableKey =
    readNamedKey('SUPABASE_PUBLISHABLE_KEYS') ??
    Deno.env.get('SUPABASE_ANON_KEY') ??
    null;
  const secretKey =
    readNamedKey('SUPABASE_SECRET_KEYS') ??
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    null;

  if (!url || !publishableKey || !secretKey) {
    return Response.json(
      { error: 'Account deletion is temporarily unavailable.' },
      { status: 503, headers: corsHeaders },
    );
  }

  const userClient = createClient(url, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const token = authorization.slice('Bearer '.length);
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(token);

  if (userError || !user) {
    return Response.json(
      { error: 'Authentication required.' },
      { status: 401, headers: corsHeaders },
    );
  }

  const admin = createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Product analytics is not retained after account deletion. Capture the
  // installation IDs that have been associated with this account so earlier
  // anonymous events from the same installation can be removed too. Other
  // user-owned Reclaim rows are removed by ON DELETE CASCADE constraints.
  const { data: linkedAnalytics, error: analyticsLookupError } = await admin
    .from('analytics_events')
    .select('anonymous_id')
    .eq('user_id', user.id)
    .not('anonymous_id', 'is', null);

  if (analyticsLookupError) {
    return Response.json(
      { error: 'Account deletion could not be completed.' },
      { status: 500, headers: corsHeaders },
    );
  }

  const anonymousIds = [
    ...new Set(
      (linkedAnalytics ?? [])
        .map((row) => row.anonymous_id)
        .filter((value): value is string => typeof value === 'string' && value.length > 0),
    ),
  ];

  if (anonymousIds.length > 0) {
    const { error: anonymousAnalyticsError } = await admin
      .from('analytics_events')
      .delete()
      .in('anonymous_id', anonymousIds);

    if (anonymousAnalyticsError) {
      return Response.json(
        { error: 'Account deletion could not be completed.' },
        { status: 500, headers: corsHeaders },
      );
    }
  }

  // Delete any remaining user-linked rows (for example rows without an
  // anonymous installation ID) after anonymous cleanup has succeeded.
  const { error: accountAnalyticsError } = await admin
    .from('analytics_events')
    .delete()
    .eq('user_id', user.id);

  if (accountAnalyticsError) {
    return Response.json(
      { error: 'Account deletion could not be completed.' },
      { status: 500, headers: corsHeaders },
    );
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return Response.json(
      { error: 'Account deletion could not be completed.' },
      { status: 500, headers: corsHeaders },
    );
  }

  return Response.json(
    { deleted: true },
    { status: 200, headers: corsHeaders },
  );
});
