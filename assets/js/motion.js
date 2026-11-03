// Motion layer: hero intro, the pizza that assembles on scroll, the food-cost calculator,
// word-by-word headings, stacked sheets and the phone buy bar.
// Only opacity/transform are animated. Without this file, or with prefers-reduced-motion,
// the page shows the finished pizza and every step as plain content.
import { price } from './promo.js?v=20261103a';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const money = (v, d = 2) => v.toLocaleString('uk-UA', { minimumFractionDigits: d, maximumFractionDigits: d });

function splitWords(el, base = 0, step = 70) {
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/([ \t\r\n]+)/).forEach((part) => {
          if (!part) return;
          if (/^[ \t\r\n]+$/.test(part)) { frag.append(part); return; }
          const w = document.createElement('span'); w.className = 'w';
          const i = document.createElement('span'); i.className = 'wi'; i.textContent = part;
          w.append(i); frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(el);
  el.querySelectorAll('.wi').forEach((w, k) => w.style.setProperty('--d', `${base + k * step}ms`));
}

// ---------- hero ----------
function heroVideo() {
  const v = document.querySelector('.hero-media video');
  if (!v) return;
  if (reduced) { v.remove(); return; } // the poster frame stays
  v.addEventListener('playing', () => v.classList.add('on'), { once: true });
  v.play().catch(() => {});
}

async function ledgerDemo() { // rows fill in, the total counts up, the food-cost verdict lands
  const ledger = document.querySelector('.hero .ledger');
  if (!ledger) return;
  const rows = [...ledger.querySelectorAll('li')], total = document.getElementById('ledgerTotal'), fc = document.getElementById('ledgerFc');
  const vals = rows.map((r) => parseFloat(r.lastElementChild.textContent.replace(',', '.')) || 0);
  rows.forEach((r) => r.classList.remove('on')); fc.classList.remove('on'); total.textContent = '0,00';
  await sleep(1300);
  let sum = 0;
  for (let i = 0; i < rows.length; i++) {
    rows[i].classList.add('on', 'flash'); setTimeout(() => rows[i].classList.remove('flash'), 500);
    const from = sum; sum += vals[i];
    const t0 = performance.now();
    await new Promise((done) => {
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 380);
        total.textContent = money(from + (sum - from) * p);
        if (p < 1) requestAnimationFrame(tick); else done();
      };
      requestAnimationFrame(tick);
    });
    await sleep(140);
  }
  await sleep(220); fc.classList.add('on');
}

function ledgerTilt() {
  const ledger = document.querySelector('.hero .ledger'), hero = document.getElementById('hero');
  if (!ledger || !matchMedia('(hover:hover) and (min-width:1024px)').matches) return;
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    ledger.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - .5) * 7}deg`);
    ledger.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - .5) * -7}deg`);
  });
  hero.addEventListener('pointerleave', () => { ledger.style.setProperty('--rx', '0deg'); ledger.style.setProperty('--ry', '0deg'); });
}

// ---------- scene: the pizza assembles while the cost adds up ----------
function pizzaScene() {
  const scene = document.getElementById('example');
  if (!scene) return;
  root.classList.add('js-scene');
  const costs = [9.45, 8.8, 42.9, 31.2, 3];
  const COST = 95.35, FC = 38.3, N = 6;
  const q = (s) => scene.querySelector(s);
  const dough = q('.l-dough'), sauce = q('.l-sauce'), cheese = q('.l-cheese'), spin = q('.spin'), pie = q('.pie');
  const peps = [...scene.querySelectorAll('.pep')], leaves = [...scene.querySelectorAll('.leaf')];
  const big = q('.big'), label = q('.big-label'), steps = [...scene.querySelectorAll('.steps-stack li')], cells = [...scene.querySelectorAll('.cells i')];
  const labelCost = label.textContent, labelFc = label.dataset.fc;
  let current = -1, fcMode = false;

  const layer = (el, t, from) => {
    const e = ease(clamp(t));
    el.style.opacity = clamp(t * 2.2);
    el.style.transform = `scale(${from + (1 - from) * e})`;
  };

  function render() {
    const r = scene.getBoundingClientRect();
    const span = r.height - innerHeight;
    const p = clamp(-r.top / span);
    const seg = p * N;
    const s = Math.min(N - 1, Math.floor(seg)), t = s === N - 1 ? clamp((seg - s) * 1.2) : seg - s;
    const local = (i) => (i < s ? 1 : i > s ? 0 : clamp(t / .72));

    layer(dough, local(0), .72);
    layer(sauce, local(1), .12);
    layer(cheese, local(2), .35);
    const pepT = local(3);
    peps.forEach((el, i) => {
      const k = clamp((pepT - (i / peps.length) * .72) / .28), e = ease(k);
      el.style.opacity = clamp(k * 2.5);
      el.style.transform = `translateY(${(1 - e) * -90}px) scale(${1 + (1 - e) * .9})`;
    });
    const leafT = local(4);
    leaves.forEach((el, i) => {
      const k = clamp((leafT - (i / leaves.length) * .6) / .4), e = ease(k);
      el.style.opacity = clamp(k * 2.5);
    });
    spin.style.transform = `rotate(${p * 62}deg)`;

    const show = s === N - 1 ? t : 0;
    pie.style.strokeDasharray = `${(100 - FC) * ease(show)} 100`;
    pie.style.opacity = show ? .82 : 0;

    const isFc = s === N - 1;
    if (isFc) {
      big.textContent = `${money(COST / 249 * 100 * ease(clamp(t * 1.6)), 1)}%`;
    } else {
      let sum = 0;
      for (let i = 0; i < costs.length; i++) sum += costs[i] * local(i);
      big.textContent = money(sum);
    }
    if (isFc !== fcMode) { fcMode = isFc; big.classList.toggle('hot', isFc); label.textContent = isFc ? labelFc : labelCost; }
    if (s !== current) {
      current = s;
      steps.forEach((el, i) => el.classList.toggle('on', i === s));
      cells.forEach((el, i) => el.classList.toggle('on', i <= s));
    }
  }
  return render;
}

// ---------- sheets stacking on scroll (desktop) ----------
function sheetStack() {
  const sheets = [...document.querySelectorAll('.sheet')];
  if (!sheets.length || !matchMedia('(min-width:1024px)').matches) return null;
  sheets.forEach((s, i) => { s.style.position = 'sticky'; s.style.top = `${84 + i * 22}px`; });
  return () => {
    sheets.forEach((s, i) => {
      const next = sheets[i + 1];
      if (!next) return;
      const d = clamp(1 - (next.getBoundingClientRect().top - 110) / s.offsetHeight);
      s.style.transform = `scale(${1 - d * .05})`;
    });
  };
}

// ---------- calculator: the yellow cells ----------
function calculator() {
  const box = document.getElementById('calc');
  if (!box) return;
  const REST = 9.45 + 8.8 + 31.2 + 3, CHEESE_KG = .13, PER_DAY = 30, DAYS = 30;
  const priceIn = box.querySelector('#menuPrice'), cheeseIn = box.querySelector('#cheesePrice');
  const out = (id) => box.querySelector(`[data-out="${id}"]`);
  const fcEl = out('fc'), verdict = out('verdict'), norm = box.querySelector('.norm');
  const shown = { fc: 38.3, cost: 95.35, rec: 318, margin: 153.65, month: 138285 };
  let raf = 0;

  const paint = () => {
    fcEl.textContent = `${money(shown.fc, 1)}%`;
    out('cost').textContent = `${money(shown.cost)} грн`;
    out('rec').textContent = `${Math.ceil(shown.rec)} грн`;
    out('margin').textContent = `${money(shown.margin)} грн`;
    out('month').textContent = `${Math.round(shown.month).toLocaleString('uk-UA')} грн`;
  };
  const fill = (el) => el.style.setProperty('--p', `${(el.value - el.min) / (el.max - el.min) * 100}%`);

  function update(animate = true) {
    const menu = +priceIn.value, cheese = +cheeseIn.value;
    const cost = REST + cheese * CHEESE_KG, fc = cost / menu * 100;
    const target = { fc, cost, rec: cost / .3, margin: menu - cost, month: (menu - cost) * PER_DAY * DAYS };
    out('menu').textContent = menu; out('cheese').textContent = cheese;
    fill(priceIn); fill(cheeseIn);
    const good = fc <= 35 && fc >= 25;
    verdict.textContent = fc > 35 ? 'Підняти ціну' : fc < 25 ? 'Нижче норми' : 'У нормі';
    verdict.classList.toggle('good', good); fcEl.classList.toggle('good', good);
    norm.style.setProperty('--fc', `${clamp(fc / 60) * 100}%`);
    cancelAnimationFrame(raf);
    if (!animate || reduced) { Object.assign(shown, target); paint(); return; }
    const from = { ...shown }, t0 = performance.now();
    const tick = (t) => {
      const k = ease(clamp((t - t0) / 320));
      Object.keys(target).forEach((key) => { shown[key] = from[key] + (target[key] - from[key]) * k; });
      paint();
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  priceIn.addEventListener('input', () => update());
  cheeseIn.addEventListener('input', () => update());
  box.querySelector('[data-apply]').addEventListener('click', () => {
    const cost = REST + +cheeseIn.value * CHEESE_KG;
    priceIn.value = Math.min(+priceIn.max, Math.ceil(cost / .3));
    update();
  });
  update(false);
}

// ---------- reveals ----------
const REVEAL = '.lead,.calc-in>*,.calc-out,.leak-list li,.value .wrap>*,.fit>*,.steps li,.recap-list li,.price-now,.price-sub,#orderForm,.faq details,.final p,.final .btn';
function reveals() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  document.querySelectorAll(REVEAL).forEach((el) => {
    const sibs = [...el.parentElement.children];
    el.style.setProperty('--rd', `${Math.min(sibs.indexOf(el), 5) * 70}ms`);
    el.classList.add('rv'); io.observe(el);
  });
  document.querySelectorAll('.title,.final h2').forEach((el) => {
    if (el.closest('.hero')) return;
    splitWords(el, 0, 55); el.classList.add('split'); io.observe(el);
  });
  const v = document.querySelector('[data-count]');
  if (v) {
    const to = +v.dataset.count;
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return; o.disconnect();
      const t0 = performance.now();
      const tick = (t) => {
        const k = clamp((t - t0) / 1500);
        v.textContent = Math.round(to * ease(k)).toLocaleString('uk-UA');
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: .4 }).observe(v);
  }
}

// ---------- sticky buy bar on phones ----------
function buyBar() {
  const hero = document.getElementById('hero'), order = document.getElementById('order');
  if (!hero || !order) return;
  const bar = document.createElement('div');
  bar.className = 'm-buy'; bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = `<div><b>${price()} грн</b><small>усі три таблиці</small></div><a class="btn" href="#order" tabindex="-1">Купити</a>`;
  document.body.append(bar);
  let heroGone = false, orderSeen = false;
  const update = () => bar.classList.toggle('show', heroGone && !orderSeen);
  new IntersectionObserver(([e]) => { heroGone = !e.isIntersecting; update(); }).observe(hero);
  new IntersectionObserver(([e]) => { orderSeen = e.isIntersecting; update(); }, { threshold: .05 }).observe(order);
}

// ---------- boot ----------
heroVideo();
calculator();
buyBar();
if (!reduced) {
  root.classList.add('motion');
  splitWords(document.querySelector('.hero h1'), 250, 75);
  root.classList.add('intro');
  ledgerDemo(); ledgerTilt(); reveals();
  const renders = [pizzaScene(), sheetStack()].filter(Boolean);
  let queued = false;
  const frame = () => { queued = false; renders.forEach((r) => r()); };
  const ask = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', ask);
  frame();
}
