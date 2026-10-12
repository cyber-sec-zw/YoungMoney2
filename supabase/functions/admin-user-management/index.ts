import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Action = 'list' | 'suspend' | 'restore' | 'delete' | 'audit';

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'content-type': 'application/json' } });
}

async function removeOwnerMedia(admin: ReturnType<typeof createClient>, userId: string) {
  const prefix = `${userId}/`;
  const queue = [''];
  const paths: string[] = [];
  while (queue.length) {
    const relative = queue.pop() || '';
    const { data, error } = await admin.storage.from('trading-media').list(`${prefix}${relative}`, { limit: 1000 });
    if (error) throw error;
    for (const item of data || []) {
      const path = `${prefix}${relative}${item.name}`;
      if (item.id) paths.push(path);
      else queue.push(`${relative}${item.name}/`);
    }
  }
  for (let index = 0; index < paths.length; index += 100) {
    const { error } = await admin.storage.from('trading-media').remove(paths.slice(index, index + 100));
    if (error) throw error;
  }
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authHeader = request.headers.get('authorization');
  if (!url || !anonKey || !serviceKey || !authHeader) return json({ error: 'Service configuration is incomplete.' }, 500);

  const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
  const { data: authData, error: authError } = await callerClient.auth.getUser();
  if (authError || !authData.user) return json({ error: 'Authentication required.' }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: caller, error: callerError } = await admin.from('profiles').select('role,account_status').eq('id', authData.user.id).maybeSingle();
  if (callerError || caller?.role !== 'admin' || caller.account_status !== 'active') return json({ error: 'Administrator access required.' }, 403);

  let input: { action?: Action; targetUserId?: string; query?: string };
  try { input = await request.json(); } catch { return json({ error: 'Invalid request body.' }, 400); }
  const action = input.action;
  const targetUserId = input.targetUserId;

  if (action === 'list') {
    const { data: userPage, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) return json({ error: error.message }, 500);
    const ids = userPage.users.map(user => user.id);
    const [profileResult, tradeResult, planResult] = await Promise.all([
      admin.from('profiles').select('id,username,display_name,role,account_status,created_at,suspended_at,suspension_expires_at').in('id', ids),
      admin.from('trades').select('user_id').in('user_id', ids),
      admin.from('trading_plans').select('user_id').in('user_id', ids),
    ]);
    if (profileResult.error || tradeResult.error || planResult.error) return json({ error: profileResult.error?.message || tradeResult.error?.message || planResult.error?.message }, 500);
    const countByUser = (rows: { user_id: string | null }[] | null) => (rows || []).reduce<Record<string, number>>((counts, row) => {
      if (row.user_id) counts[row.user_id] = (counts[row.user_id] || 0) + 1;
      return counts;
    }, {});
    const trades = countByUser(tradeResult.data);
    const plans = countByUser(planResult.data);
    const profiles = new Map((profileResult.data || []).map(profile => [profile.id, profile]));
    const query = input.query?.trim().toLowerCase();
    const members = userPage.users.map(user => ({
      id: user.id,
      email: user.email || '',
      last_sign_in_at: user.last_sign_in_at,
      ...(profiles.get(user.id) || {}),
      trade_count: trades[user.id] || 0,
      plan_count: plans[user.id] || 0,
    })).filter(member => !query || [member.email, member.username, member.display_name].some(value => value?.toLowerCase().includes(query)));
    return json({ members });
  }

  if (action === 'audit') {
    const { data, error } = await admin.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(100);
    return error ? json({ error: error.message }, 500) : json({ entries: data || [] });
  }

  if (!targetUserId || targetUserId === authData.user.id) return json({ error: 'Choose another member.' }, 400);
  const { data: targetProfile } = await admin.from('profiles').select('id,role').eq('id', targetUserId).maybeSingle();
  if (!targetProfile) return json({ error: 'Member not found.' }, 404);
  if (targetProfile.role === 'admin') return json({ error: 'Administrator accounts cannot be managed from this console.' }, 400);

  const writeAudit = async (auditAction: 'suspend' | 'restore' | 'delete' | 'delete_failed', outcome: 'success' | 'failed', metadata: Record<string, unknown> = {}) => {
    await admin.from('admin_audit_log').insert({ actor_user_id: authData.user.id, target_user_id: targetUserId, action: auditAction, outcome, metadata });
  };

  if (action === 'suspend') {
    const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    // The recovery period is metadata for the administrator. The Auth ban itself
    // remains in force until the administrator explicitly restores the account.
    const { error: authUpdateError } = await admin.auth.admin.updateUserById(targetUserId, { ban_duration: '876000h' });
    const { error: profileError } = await admin.from('profiles').update({ account_status: 'suspended', suspended_at: new Date().toISOString(), suspension_expires_at: until }).eq('id', targetUserId);
    if (authUpdateError || profileError) {
      await writeAudit('suspend', 'failed', { error: authUpdateError?.message || profileError?.message });
      return json({ error: authUpdateError?.message || profileError?.message }, 500);
    }
    await writeAudit('suspend', 'success', { recovery_until: until });
    return json({ ok: true, recovery_until: until });
  }

  if (action === 'restore') {
    const { error: authUpdateError } = await admin.auth.admin.updateUserById(targetUserId, { ban_duration: 'none' });
    const { error: profileError } = await admin.from('profiles').update({ account_status: 'active', suspended_at: null, suspension_expires_at: null }).eq('id', targetUserId);
    if (authUpdateError || profileError) {
      await writeAudit('restore', 'failed', { error: authUpdateError?.message || profileError?.message });
      return json({ error: authUpdateError?.message || profileError?.message }, 500);
    }
    await writeAudit('restore', 'success');
    return json({ ok: true });
  }

  if (action === 'delete') {
    try {
      await removeOwnerMedia(admin, targetUserId);
      const { error } = await admin.auth.admin.deleteUser(targetUserId);
      if (error) throw error;
      await writeAudit('delete', 'success', { immediate: true });
      return json({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete member.';
      await writeAudit('delete_failed', 'failed', { error: message });
      return json({ error: message }, 500);
    }
  }
  return json({ error: 'Unknown action.' }, 400);
});
