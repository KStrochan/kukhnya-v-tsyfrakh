import { track } from './pixel.js?v=20261117b';

// Header turns solid as soon as the page moves, so it never sits on top of the content.
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('solid', scrollY > 24);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Paying for access: email + plan → /api/checkout (Vercel function) → Creem checkout (card, Apple Pay, Google Pay).
// After payment Creem calls /api/creem-webhook, which extends access for this email.
const form = document.getElementById('orderForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const st = document.getElementById('status');
  const btn = form.querySelector('button[type=submit]');
  const data = Object.fromEntries(new FormData(form));
  const email = String(data.contact || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { st.className = 'status err'; st.textContent = 'Вкажіть правильний email.'; return; }
  st.className = 'status'; st.textContent = 'Відкриваємо оплату…';
  btn.disabled = true;
  try {
    const r = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: data.plan === 'year' ? 'year' : 'month', email }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) throw new Error('checkout');
    const plan = data.plan === 'year' ? { value: 35.99 } : { value: 4.99 };
    track('InitiateCheckout', { ...plan, currency: 'USD' });
    location.href = j.url;
  } catch {
    btn.disabled = false;
    st.className = 'status err'; st.textContent = 'Не вдалося відкрити оплату. Спробуйте ще раз за хвилину.';
  }
});
