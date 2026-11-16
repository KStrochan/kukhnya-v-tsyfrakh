// Starts a Creem checkout for the chosen plan and returns its URL.
// The email is prefilled, so the payment lands on the same account the buyer signs in with.
import crypto from 'node:crypto';
import { PLANS, creemBase, isEmail } from './_creem.js';

const clean = (s, n = 200) => String(s ?? '').slice(0, n).trim();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const b = req.body || {};
  const email = clean(b.email, 120).toLowerCase();
  const planKey = clean(b.plan, 10);
  const plan = Object.hasOwn(PLANS, planKey) ? PLANS[planKey] : null;
  if (!isEmail(email)) return res.status(400).json({ ok: false, error: 'valid email required' });
  if (!plan) return res.status(400).json({ ok: false, error: 'unknown plan' });
  if (!process.env.CREEM_API_KEY || !plan.product()) return res.status(503).json({ ok: false, error: 'payments are not configured' });

  const site = `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
  try {
    const r = await fetch(`${creemBase()}/checkouts`, {
      method: 'POST',
      headers: { 'x-api-key': process.env.CREEM_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: plan.product(),
        request_id: crypto.randomUUID(),
        customer: { email },
        success_url: `${site}/dyakuyu`,
        metadata: { plan: planKey, email },
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.checkout_url) {
      console.error('creem checkout', r.status, JSON.stringify(data).slice(0, 300));
      return res.status(502).json({ ok: false });
    }
    return res.status(200).json({ ok: true, url: data.checkout_url });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ ok: false });
  }
}
