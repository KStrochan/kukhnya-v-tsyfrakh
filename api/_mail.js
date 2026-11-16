// Email through SMTP (Resend): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, OWNER_EMAIL.
import nodemailer from 'nodemailer';
import PRODUCT from './_product.js';

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const FROM = () => process.env.MAIL_FROM || process.env.SMTP_USER;
// MAIL_FROM may already carry a display name: «Кухня в цифрах <hello@…>».
const from = (name) => (/[<>]/.test(FROM()) ? FROM() : `"${name}" <${FROM()}>`);

export function mailer() {
  if (process.env.SMTP_HOST === 'json') return nodemailer.createTransport({ jsonTransport: true }); // local tests
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export function letter(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;background:#f4f3ef;font-family:Arial,Helvetica,sans-serif;color:#15151a">
  <div style="max-width:560px;margin:0 auto;padding:28px 18px">
    <div style="font-weight:700;font-size:15px;color:${PRODUCT.accent};margin-bottom:14px">${esc(PRODUCT.brand)}</div>
    <div style="background:#fff;border-radius:16px;padding:26px 24px;border:1px solid #e4e1da">
      <h1 style="font-size:22px;line-height:1.25;margin:0 0 14px">${esc(title)}</h1>
      ${bodyHtml}
    </div>
    <p style="font-size:12px;color:#7a7a84;margin:16px 4px 0">${esc(PRODUCT.brand)} · ${esc(PRODUCT.site)}</p>
  </div></body></html>`;
}

export const sendToBuyer = (t, to, subject, text, html) => t.sendMail({ from: from(PRODUCT.brand), to, subject, text, html });

export const sendToOwner = (t, subject, lines) =>
  t.sendMail({
    from: from(`${PRODUCT.brand} — сайт`),
    to: process.env.OWNER_EMAIL || FROM(),
    subject,
    text: lines.join('\n'),
    html: letter(subject, `<p style="font-size:15px;line-height:1.6;margin:0">${lines.map(esc).join('<br>')}</p>`),
  });
