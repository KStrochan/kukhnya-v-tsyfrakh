// Shared settings for paying with Creem (card, Apple Pay, Google Pay).
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   CREEM_API_KEY         — Creem → Настройки → API ключи (Secret). A creem_test_… key switches
//                           the whole flow to test mode (test-api.creem.io + test products).
//   CREEM_WEBHOOK_SECRET  — Creem → Настройки → Вебхуки → signing secret of the same mode (Secret)
//   SUPABASE_URL          — https://<project>.supabase.co of the app
//   SUPABASE_SECRET_KEY   — Supabase → Project Settings → API keys → secret key (Secret)
import crypto from 'node:crypto';

export const isTest = () => String(process.env.CREEM_API_KEY || '').startsWith('creem_test_');

export const creemBase = () => (isTest() ? 'https://test-api.creem.io/v1' : 'https://api.creem.io/v1');

// Product ids are not secret; test and live mode have separate products in Creem.
const PRODUCTS = {
  live: { month: 'prod_56L4SkH58lmYl88O1XPUHZ', year: 'prod_L1z5Xg9LRpnD31UNTlMgc' },
  test: { month: 'prod_6e1PZE8YJTSnqomirkcgQu', year: 'prod_4lXA6Z74fbkfy1S6jqn9pV' },
};

export const PLANS = {
  month: { title: 'Доступ на місяць', days: 31, product: () => PRODUCTS[isTest() ? 'test' : 'live'].month },
  year: { title: 'Доступ на рік', days: 366, product: () => PRODUCTS[isTest() ? 'test' : 'live'].year },
};

export const planByProduct = (id) =>
  (id && Object.values(PRODUCTS).flatMap((m) => Object.entries(m)).find(([, pid]) => pid === id)?.[0]) || null;

export const isEmail = (s) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(s);

/** Creem signs the raw body: hex HMAC-SHA256 with the webhook secret, in the creem-signature header. */
export function validSignature(raw, signature, secret = process.env.CREEM_WEBHOOK_SECRET) {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const got = String(signature).trim();
  return got.length === expected.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

function supabaseHeaders() {
  const key = String(process.env.SUPABASE_SECRET_KEY || '');
  const h = { apikey: key, 'Content-Type': 'application/json' };
  if (key.startsWith('eyJ')) h.Authorization = `Bearer ${key}`; // legacy service_role JWT
  return h;
}

export async function supabase(path, body) {
  const r = await fetch(`${process.env.SUPABASE_URL}${path}`, { method: 'POST', headers: supabaseHeaders(), body: JSON.stringify(body) });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { ok: r.ok, status: r.status, json, text };
}

/**
 * Extends the app access of the account with this email until `until`.
 * A buyer who has never signed in gets an account created, so they can sign in with the same email right away.
 */
export async function grantAccess(email, until) {
  const rpc = () => supabase('/rest/v1/rpc/grant_paid_access', { p_email: email, p_paid_until: until.toISOString() });
  let r = await rpc();
  if (!r.ok) throw new Error(`grant_paid_access ${r.status}: ${r.text.slice(0, 200)}`);
  if (r.json && r.json.status === 'no_user') {
    const created = await supabase('/auth/v1/admin/users', { email, email_confirm: true });
    // 422 = the account appeared in the meantime; the second call below still finds it.
    if (!created.ok && created.status !== 422) throw new Error(`create user ${created.status}: ${created.text.slice(0, 200)}`);
    r = await rpc();
    if (!r.ok) throw new Error(`grant_paid_access ${r.status}: ${r.text.slice(0, 200)}`);
  }
  if (!r.json || r.json.status !== 'ok') throw new Error(`grant_paid_access: ${r.text.slice(0, 200)}`);
  return new Date(r.json.paid_until);
}
