import { createStory } from './story.js';
import { buildPizza } from './pizza-scene.js';

const story = document.getElementById('story');
const rows = [...story.querySelectorAll('.ledger li')];
const totalEl = document.getElementById('ledgerTotal');
const fcEl = document.getElementById('ledgerFc');
const fmt = (n) => n.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
let lastCount = -1;

createStory({
  section: story,
  build: buildPizza,
  onProgress(p) {
    let sum = 0, count = 0;
    rows.forEach((r) => {
      const on = p >= +r.dataset.at;
      if (on) { sum += +r.dataset.v; count++; }
      r.classList.toggle('on', on);
    });
    if (count !== lastCount) {
      const fresh = rows[count - 1];
      if (fresh && lastCount !== -1 && count > lastCount) { fresh.classList.add('flash'); setTimeout(() => fresh.classList.remove('flash'), 700); }
      lastCount = count;
      totalEl.textContent = fmt(sum);
    }
    fcEl.classList.toggle('on', p >= 0.82);
    story.classList.toggle('scrolled', p > 0.02);
  },
});

// Header turns solid once the story is behind us.
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('solid', story.getBoundingClientRect().bottom < 80);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Pre-order form → /api/order (Vercel function → Telegram).
const form = document.getElementById('orderForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const st = document.getElementById('status');
  const data = Object.fromEntries(new FormData(form));
  if (!data.name.trim() || !data.contact.trim()) { st.className = 'status err'; st.textContent = "Вкажіть ім'я і Telegram або телефон."; return; }
  st.className = 'status'; st.textContent = 'Надсилаємо…';
  try {
    const r = await fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, site: 'Кухня в цифрах' }) });
    if (!r.ok) throw new Error();
    st.className = 'status ok'; st.textContent = 'Дякуємо! Ми напишемо вам найближчим часом.';
    form.reset();
  } catch {
    st.className = 'status err'; st.textContent = 'Не вдалося надіслати заявку. Спробуйте ще раз за хвилину.';
  }
});
