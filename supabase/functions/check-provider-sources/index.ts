import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const maxBodyBytes = 750_000;

Deno.serve(async request => {
  const secret = Deno.env.get('SOURCE_CHECKER_TOKEN');
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 });

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return Response.json({ error: 'Missing Supabase service configuration.' }, { status: 500 });

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: watches, error } = await supabase.from('provider_source_watches').select('*')
    .or(`last_checked_at.is.null,last_checked_at.lt.${weekAgo}`).limit(100);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  let checked = 0;
  let changed = 0;
  let failed = 0;
  for (const watch of watches || []) {
    try {
      const response = await fetch(watch.source_url, {
        headers: { 'User-Agent': 'TradingJournalPro-SourceMonitor/1.0 (+official-source change detection)' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.text();
      const normalized = body.slice(0, maxBodyBytes)
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;|&#160;/gi, ' ')
        .replace(/\s+/g, ' ').trim();
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
      const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
      const now = new Date().toISOString();
      const headers = response.headers;
      if (watch.content_hash && watch.content_hash !== hash) {
        const { error: reviewError } = await supabase.from('provider_change_reviews').insert({
          source_watch_id: watch.id, provider_id: watch.provider_id, offering_id: watch.offering_id,
          previous_hash: watch.content_hash, current_hash: hash, detected_at: now, status: 'pending',
        });
        if (reviewError) throw reviewError;
        changed += 1;
      }
      const { error: updateError } = await supabase.from('provider_source_watches').update({
        content_hash: hash, etag: headers.get('etag'), last_modified: headers.get('last-modified'),
        last_checked_at: now, last_change_detected_at: watch.content_hash && watch.content_hash !== hash ? now : watch.last_change_detected_at,
        check_status: watch.content_hash && watch.content_hash !== hash ? 'changed' : 'ok', last_error: null,
      }).eq('id', watch.id);
      if (updateError) throw updateError;
      checked += 1;
    } catch (caught) {
      failed += 1;
      await supabase.from('provider_source_watches').update({
        last_checked_at: new Date().toISOString(), check_status: 'error',
        last_error: caught instanceof Error ? caught.message.slice(0, 500) : 'Unknown source check failure',
      }).eq('id', watch.id);
    }
  }
  return Response.json({ checked, changed, failed });
});
