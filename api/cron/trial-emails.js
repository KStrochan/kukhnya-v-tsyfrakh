// Daily (Vercel Cron, see vercel.json): onboarding letters during the 7-day trial.
//   welcome — right after sign-up: how to start;
//   day5    — 2 days left: what's already counted, how to keep going;
//   ending  — last day: what happens next and how to subscribe.
// The database decides who is due (public.trial_email_batch) and remembers what was sent, so running
// this twice never sends a letter twice. Payers never get these letters.
import PRODUCT from '../_product.js';
import { supabase } from '../_creem.js';
import { esc, letter, mailer } from '../_mail.js';

const SUPPORT = 'hello@kuhnyavcifrah.shop';
const PRICE = 'https://kuhnyavcifrah.shop/#price';

const dateUk = (d) => new Date(d).toLocaleDateString('uk-UA', { timeZone: 'Europe/Kyiv', day: 'numeric', month: 'long' });
const p = (html) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55">${html}</p>`;
const button = (href, text) =>
  `<p style="margin:6px 0 18px"><a href="${href}" style="display:inline-block;background:${PRODUCT.accent};color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">${esc(text)}</a></p>`;
const footer = `<p style="margin:0;font-size:13px;color:#5c5c66">Є питання чи потрібна допомога з першими стравами — просто відповідайте на цей лист.</p>`;

function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  return `${n} ${m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many}`;
}

/** Text and HTML of one letter. Exported for tests. */
export function compose(row) {
  const app = PRODUCT.app;
  if (row.kind === 'welcome') {
    const subject = 'З чого почати в «Кухні в цифрах»';
    const steps = [
      ['Продукти', 'додайте 10–15 основних продуктів з цінами закупівлі — сир, борошно, м\'ясо, упаковку.'],
      ['Страви', 'створіть техкарту найпопулярнішої страви: що і скільки йде в одну порцію.'],
      ['Огляд', 'побачите собівартість, фуд-кост і ціну, яку варто ставити в меню.'],
    ];
    const html = letter(subject,
      p('Дякуємо, що спробували! Перші цифри по вашому меню можна отримати за 15 хвилин:') +
      `<ol style="margin:0 0 14px;padding-left:20px;font-size:15px;line-height:1.55">${steps.map(([b, t]) => `<li style="margin-bottom:6px"><b>${b}</b> — ${esc(t)}</li>`).join('')}</ol>` +
      p('Хочете спершу подивитись, як це виглядає? На головній є кнопка «Показати на прикладі піцерії».') +
      button(app, 'Відкрити застосунок') + footer);
    const text = `Дякуємо, що спробували! Перші цифри по вашому меню можна отримати за 15 хвилин:\n\n${steps.map(([b, t], i) => `${i + 1}. ${b} — ${t}`).join('\n')}\n\nХочете спершу подивитись? На головній є кнопка «Показати на прикладі піцерії».\n\n${app}\n\nЄ питання — просто відповідайте на цей лист.`;
    return { subject, text, html };
  }

  if (row.kind === 'day5') {
    const subject = 'Залишилось 2 дні безкоштовного доступу';
    const did = row.dishes > 0
      ? `Ви вже внесли ${plural(row.products, 'продукт', 'продукти', 'продуктів')} і ${plural(row.dishes, 'страву', 'страви', 'страв')}. Додайте решту меню — тоді на огляді буде видно, які страви тягнуть фуд-кост угору.`
      : row.products > 0
        ? `Ви вже внесли ${plural(row.products, 'продукт', 'продукти', 'продуктів')}. Наступний крок — техкарта однієї страви, і ви побачите її реальну собівартість.`
        : 'Ви ще не внесли жодної страви. Почніть з однієї, найпопулярнішої: 10 хвилин — і буде видно, скільки вона коштує насправді.';
    const html = letter(subject,
      p(esc(did)) +
      p(`Пробний доступ діє до <b>${esc(dateUk(row.trial_ends_at))}</b>. Потім підписка: $4.99 на місяць або $35.99 на рік.`) +
      button(app, 'Продовжити в застосунку') + footer);
    const text = `${did}\n\nПробний доступ діє до ${dateUk(row.trial_ends_at)}. Потім підписка: $4.99 на місяць або $35.99 на рік.\n\n${app}\n\nЄ питання — просто відповідайте на цей лист.`;
    return { subject, text, html };
  }

  const subject = `Пробний доступ закінчується ${dateUk(row.trial_ends_at)}`;
  const html = letter(subject,
    p('Після цього змінювати дані вже не вийде, але все збережене залишиться: продукти, техкарти, ціни. Оформите підписку — продовжите з того ж місця.') +
    p('Підписка — <b>$4.99 на місяць</b> або <b>$35.99 на рік</b> (виходить $3 на місяць). Оплата карткою, Apple Pay чи Google Pay. При оплаті вкажіть той самий email, з яким входите.') +
    button(PRICE, 'Оформити підписку') + footer);
  const text = `Після цього змінювати дані вже не вийде, але все збережене залишиться. Оформите підписку — продовжите з того ж місця.\n\nПідписка — $4.99 на місяць або $35.99 на рік. При оплаті вкажіть той самий email, з яким входите.\n\n${PRICE}\n\nЄ питання — просто відповідайте на цей лист.`;
  return { subject, text, html };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false });
  // Only Vercel Cron calls this (it sends this user agent). Sending is idempotent anyway, so this just keeps
  // strangers from poking the database.
  if (!/vercel-cron/i.test(String(req.headers['user-agent'] || ''))) return res.status(404).json({ ok: false });
  const batch = await supabase('/rest/v1/rpc/trial_email_batch', { p_limit: 90 }); // Resend free plan: 100 letters a day
  if (!batch.ok || !Array.isArray(batch.json)) {
    console.error('trial_email_batch', batch.status, batch.text.slice(0, 200));
    return res.status(502).json({ ok: false });
  }
  const t = mailer();
  const sent = [];
  for (const row of batch.json) {
    try {
      const { subject, text, html } = compose(row);
      await t.sendMail({ from: process.env.MAIL_FROM, replyTo: SUPPORT, to: row.email, subject, text, html });
      const marked = await supabase('/rest/v1/rpc/mark_trial_email', { p_user_id: row.user_id, p_kind: row.kind });
      if (!marked.ok) throw new Error(`mark_trial_email ${marked.status}: ${marked.text.slice(0, 200)}`);
      sent.push(row.kind);
    } catch (e) {
      console.error('trial email', row.kind, e); // the next run retries whatever wasn't marked
    }
  }
  return res.status(200).json({ ok: true, due: batch.json.length, sent: sent.length });
}
