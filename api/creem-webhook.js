// Creem → this webhook after each subscription payment: extends app access for the buyer's email.
// Register https://<site>/api/creem-webhook in Creem → Developers → Webhooks.
import PRODUCT from './_product.js';
import { PLANS, grantAccess, isTest, planByProduct, validSignature } from './_creem.js';
import { esc, letter, mailer, sendToBuyer, sendToOwner } from './_mail.js';

// One extra day so a renewal that is charged a few hours late doesn't lock the account.
const GRACE_MS = 24 * 60 * 60 * 1000;
const idOf = (x) => (x && typeof x === 'object' ? x.id : x) || null;

async function rawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c);
  return Buffer.concat(chunks);
}

/** Pulls what we need out of checkout.completed / subscription.paid. */
export function paymentOf(event) {
  const o = event.object || {};
  const sub = event.eventType === 'checkout.completed' ? o.subscription : o;
  const email = String(o.customer?.email || sub?.customer?.email || o.metadata?.email || '').trim().toLowerCase();
  const plan = planByProduct(idOf(o.product)) || planByProduct(idOf(sub?.product)) || o.metadata?.plan || sub?.metadata?.plan || null;
  const periodEnd = sub && typeof sub === 'object' && sub.current_period_end_date ? new Date(sub.current_period_end_date) : null;
  return { email, plan: Object.hasOwn(PLANS, plan || '') ? plan : null, periodEnd };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const raw = await rawBody(req);
  if (!validSignature(raw, req.headers['creem-signature'])) return res.status(401).json({ ok: false });

  let event;
  try { event = JSON.parse(raw.toString('utf8')); } catch { return res.status(400).json({ ok: false }); }
  const type = event.eventType;
  if (type !== 'checkout.completed' && type !== 'subscription.paid') return res.status(200).json({ ok: true, ignored: type });

  const { email, plan, periodEnd } = paymentOf(event);
  if (!email || !plan) {
    console.error('creem webhook: no email or plan', type, event.id);
    return res.status(200).json({ ok: true, ignored: 'unknown product' });
  }
  const until = new Date((periodEnd && periodEnd > new Date() ? periodEnd.getTime() : Date.now() + PLANS[plan].days * 86400000) + GRACE_MS);

  let paidUntil;
  try {
    paidUntil = await grantAccess(email, until);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false }); // Creem retries: 30 s, 1 min, 5 min, 1 h
  }

  // Letters only after the first payment; renewals just extend access quietly.
  if (type === 'checkout.completed') {
    const t = mailer();
    const date = paidUntil.toLocaleDateString('uk-UA', { timeZone: 'Europe/Kyiv', day: 'numeric', month: 'long', year: 'numeric' });
    const title = 'Доступ активовано';
    try {
      await sendToBuyer(t, email, `Доступ активовано — ${PRODUCT.brand}`,
        `Дякуємо за оплату! ${PLANS[plan].title} активовано до ${date}.\n\nУвійдіть у застосунок з цим email: ${PRODUCT.app}/login\nКод для входу прийде листом.\n\nКерувати підпискою чи скасувати її можна за посиланням у листі від Creem про оплату.\nПитання — hello@kuhnyavcifrah.shop.`,
        letter(title,
          `<p style="margin:0 0 12px;font-size:15px;line-height:1.55">Дякуємо за оплату! <b>${esc(PLANS[plan].title)}</b> діє до <b>${esc(date)}</b>.</p>
           <p style="margin:0 0 18px;font-size:15px;line-height:1.55">Увійдіть у застосунок з цим email (<b>${esc(email)}</b>) — код для входу прийде листом.</p>
           <p style="margin:0 0 18px"><a href="${PRODUCT.app}/login" style="display:inline-block;background:${PRODUCT.accent};color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">Відкрити застосунок</a></p>
           <p style="margin:0;font-size:14px;color:#5c5c66">Керувати підпискою чи скасувати її можна за посиланням у листі від Creem про оплату. Питання — hello@kuhnyavcifrah.shop.</p>`));
      await sendToOwner(t, `💳 Нова підписка — ${email}`, [`Тариф: ${PLANS[plan].title}`, `Email: ${email}`, `Доступ до: ${date}`, isTest() ? 'ТЕСТОВИЙ РЕЖИМ' : '']);
    } catch (e) {
      console.error('creem webhook mail', e); // access is already granted; a lost letter must not trigger a retry
    }
  }
  return res.status(200).json({ ok: true });
}
