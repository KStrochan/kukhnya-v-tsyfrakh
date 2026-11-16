import { checkout } from './pay.js?v=20261116a';

// Header turns solid as soon as the page moves, so it never sits on top of the content.
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('solid', scrollY > 24);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Paying for access: email + plan → /api/order (Vercel function → email), then the card-transfer step.
// After the owner sees the money, he issues an access code (see README) and emails it to the buyer.
const PLANS = { month: { title: 'Доступ на місяць', amount: 199 }, year: { title: 'Доступ на рік', amount: 1490 } };
const form = document.getElementById('orderForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const st = document.getElementById('status');
  const data = Object.fromEntries(new FormData(form));
  const plan = PLANS[data.plan] ? data.plan : 'month';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(data.contact).trim())) { st.className = 'status err'; st.textContent = 'Вкажіть правильний email.'; return; }
  st.className = 'status'; st.textContent = 'Надсилаємо…';
  try {
    const p = PLANS[plan];
    const mode = await checkout(form, { site: 'Кухня в цифрах', plan, product: `${p.title} — ${p.amount} грн`, price: `${p.amount.toLocaleString('uk-UA')} грн`, amount: p.amount, name: '', contact: String(data.contact).trim() });
    if (mode === 'lead') { st.className = 'status ok'; st.textContent = 'Дякуємо! Ми напишемо вам на цей email, як оплатити, і надішлемо код доступу.'; form.reset(); }
  } catch {
    st.className = 'status err'; st.textContent = 'Не вдалося надіслати заявку. Спробуйте ще раз за хвилину.';
  }
});
