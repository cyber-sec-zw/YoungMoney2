#!/usr/bin/env node
/**
 * One-time server-side administrator provisioner.
 *
 * Required environment variables:
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_EMAIL
 *   ADMIN_PASSWORD
 * Optional: SUPABASE_URL (falls back to VITE_SUPABASE_URL from .env)
 *
 * Do not put any of these values in source control, browser configuration, or
 * deployment logs. This command confirms the email and creates the private
 * Young_Money 1.0 playbook for the account.
 */
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';

async function envFromDotFile() {
  try {
    const source = await readFile(resolve('.env'), 'utf8');
    return Object.fromEntries(source.split(/\r?\n/).flatMap(line => {
      const match = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
      return match ? [[match[1], match[2].trim().replace(/^['"]|['"]$/g, '')]] : [];
    }));
  } catch { return {}; }
}

async function loadPhotonSeed() {
  const path = resolve('src/data/photonPlanTemplate.ts');
  let source = await readFile(path, 'utf8');
  source = source
    .replace(/^import[^;]+;\s*/m, '')
    .replace(/export interface[\s\S]*?}\s*/m, '')
    .replace(/export const /g, 'const ')
    .replace(/: TradingPlanInput/g, '')
    .replace(/: PhotonEntryModelTemplate\[\]/g, '')
    .replace(/ as const/g, '');
  source += '\nmodule.exports = { PHOTON_PLAN, PHOTON_PLAN_RULES, PHOTON_PLAN_CHECKS, PHOTON_ENTRY_MODELS };';
  const context = { module: { exports: {} } };
  vm.runInNewContext(source, context, { filename: path });
  return context.module.exports;
}

const dotEnv = await envFromDotFile();
const url = process.env.SUPABASE_URL || dotEnv.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!url || !serviceKey || !email || !password) {
  throw new Error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, or ADMIN_PASSWORD.');
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
let userId;
const { data: existing, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) throw listError;
const existingUser = existing.users.find(user => user.email?.toLowerCase() === email.toLowerCase());
if (existingUser) {
  userId = existingUser.id;
  const { error } = await supabase.auth.admin.updateUserById(userId, { password, email_confirm: true, user_metadata: { display_name: 'young_money' } });
  if (error) throw error;
} else {
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: 'young_money' } });
  if (error || !data.user) throw error || new Error('Admin account could not be created.');
  userId = data.user.id;
}

const { error: profileError } = await supabase.from('profiles').upsert({
  id: userId, username: 'young_money', display_name: 'young_money', role: 'admin', account_status: 'active', suspended_at: null, suspension_expires_at: null,
}, { onConflict: 'id' });
if (profileError) throw profileError;

const { data: existingPlan, error: planReadError } = await supabase.from('trading_plans').select('id').eq('user_id', userId).eq('title', 'Young_Money 1.0').maybeSingle();
if (planReadError) throw planReadError;
if (!existingPlan) {
  const { PHOTON_PLAN, PHOTON_PLAN_RULES, PHOTON_PLAN_CHECKS, PHOTON_ENTRY_MODELS } = await loadPhotonSeed();
  const { data: plan, error: planError } = await supabase.from('trading_plans').insert({ ...PHOTON_PLAN, title: 'Young_Money 1.0', user_id: userId }).select('id').single();
  if (planError) throw planError;
  const { data: strategy, error: strategyError } = await supabase.from('trader_strategies').insert({ user_id: userId, plan_id: plan.id, name: 'Young_Money 1.0', description: 'Private editable Photon-derived strategy playbook.', is_active: true }).select('id').single();
  if (strategyError) throw strategyError;
  for (const [modelIndex, modelTemplate] of PHOTON_ENTRY_MODELS.entries()) {
    const { data: model, error: modelError } = await supabase.from('strategy_entry_models').insert({ user_id: userId, strategy_id: strategy.id, name: modelTemplate.name, description: modelTemplate.description, is_active: true }).select('id').single();
    if (modelError) throw modelError;
    const { error: checksError } = await supabase.from('strategy_checklist_items').insert(modelTemplate.checklist.map((item, index) => ({ strategy_id: strategy.id, entry_model_id: model.id, label: item.label, is_required: item.is_required, sort_order: index, is_active: true })));
    if (checksError) throw checksError;
    console.log(`Seeded model ${modelIndex + 1}/${PHOTON_ENTRY_MODELS.length}`);
  }
  const { error: rulesError } = await supabase.from('trading_rules').insert(PHOTON_PLAN_RULES.map((rule, index) => ({ user_id: userId, plan_id: plan.id, rule_text: rule.rule_text, category: rule.category, priority: index + 1, is_active: true, times_broken: 0 })));
  if (rulesError) throw rulesError;
  const { error: planChecksError } = await supabase.from('pre_trade_checklist').insert(PHOTON_PLAN_CHECKS.map((label, index) => ({ user_id: userId, plan_id: plan.id, label, is_required: true, sort_order: index, is_active: true })));
  if (planChecksError) throw planChecksError;
}

const { error: auditError } = await supabase.from('admin_audit_log').insert({ actor_user_id: userId, target_user_id: userId, action: 'provision', outcome: 'success', metadata: { username: 'young_money', playbook: 'Young_Money 1.0' } });
if (auditError) throw auditError;
console.log('Administrator provisioned and private playbook is ready.');
