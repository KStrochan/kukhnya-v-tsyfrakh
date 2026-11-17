# Кухня в цифрах

Лендинг застосунку «Кухня в цифрах» (kuhnyavcifrah.shop): калькулятор собівартості й фуд-косту для кафе і піцерій. Сам застосунок — окремий приватний репозиторій `kukhnya-v-tsyfrakh-app` (app.kuhnyavcifrah.shop).

Статичний сайт без збірки: HTML + CSS + JS-модулі, шрифти — у `fonts/`. Оплату доступу обробляють серверні функції Vercel `api/checkout.js` і `api/creem-webhook.js`, листи йдуть через Resend.

**Дизайн.** Таблиця як матеріал: жовта клітинка — це акцент, кнопка і живий елемент. Перший екран — відео піци й техкарта, що заповнюється. Далі піца збирається під час скролу (5 шарів, собівартість рахується разом із нею, фінал — 38,3% фуд-кост) і калькулятор: дві жовті клітинки перераховують фуд-кост, рекомендовану ціну і гроші за місяць. У блоці «Що вміє застосунок» — справжні скріни застосунку з прикладом піцерії (`img/app-*.webp`). Анімації — `assets/js/motion.js`; без JS і з «зменшити рух» сторінка показує все статично.

## Оплата

7 днів після першого входу застосунок безкоштовний. Далі — підписка через [Creem](https://www.creem.io) (продавець і платіжний сервіс; картка, Apple Pay, Google Pay): $4.99 на місяць або $35.99 на рік, податки включено. Виплати — на банківський рахунок власника.

1. Покупець у блоці «Тарифи» обирає місяць чи рік і вводить email, з яким входить у застосунок.
2. `api/checkout.js` створює сесію оплати в Creem з цим email і перекидає на сторінку оплати. Після оплати — `dyakuyu.html`.
3. Creem викликає `api/creem-webhook.js` (подія `checkout.completed`, далі щомісяця/щороку `subscription.paid`). Webhook перевіряє підпис і викликає в базі застосунку `grant_paid_access(email, до_дати)`: доступ подовжується до кінця оплаченого періоду + 1 день. Якщо покупець ще не входив, акаунт створюється, і він просто входить з цим email.
4. Після першої оплати покупцю йде лист «Доступ активовано», власнику — «Нова підписка». Продовження проходять тихо.

Тарифи (product id обох режимів) — у `api/_creem.js`, зі сторінки приходить тільки назва тарифу (`month` / `year`). Код — `assets/js/main.js`, `api/checkout.js`, `api/creem-webhook.js`, `api/_creem.js`, `api/_mail.js`.

## Листи пробного періоду

`api/cron/trial-emails.js` щодня о 09:00 за Києвом (Vercel Cron, `vercel.json`) бере з бази тих, кому належить лист (`trial_email_batch`), і надсилає один із трьох: привітання з першими кроками, «залишилось 2 дні» (з кількістю внесених продуктів і страв), «пробний закінчується». База пам'ятає відправлене (`trial_emails`), тож повторний запуск нічого не дублює; тим, хто оплатив, листи не йдуть. Відповіді приходять на hello@kuhnyavcifrah.shop.

## Meta Pixel

Id — у `assets/js/pixel.js` (і в застосунку — `src/lib/analytics.ts`). Порожній id = піксель вимкнено. Події: `PageView`, `Lead` (клік «Спробувати»), `InitiateCheckout` (перехід до оплати), `Purchase` (сторінка «Дякуємо»), у застосунку — `CompleteRegistration` і `StartTrial` при першому вході.

## Деплой на Vercel

1. New Project → імпортуйте цей репозиторій. Framework Preset: **Other**, Build Command порожній, Output Directory — корінь.
2. Settings → Environment Variables:
   - пошта (Resend): `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=465`, `SMTP_USER=resend`, `SMTP_PASS` — API-ключ Resend (Secret), `MAIL_FROM` — `Кухня в цифрах <hello@kuhnyavcifrah.shop>`, `OWNER_EMAIL` — куди сповіщення;
   - Creem: `CREEM_API_KEY` і `CREEM_WEBHOOK_SECRET` (Secret). Тестовий ключ (`creem_test_…`) сам вмикає тестовий режим і тестові товари; бойовий — бойові. Id товарів обох режимів — у `api/_creem.js`;
   - Supabase застосунку: `SUPABASE_URL`, `SUPABASE_SECRET_KEY` — секретний ключ (Secret);
3. У Creem → Developers → Webhooks додати `https://kuhnyavcifrah.shop/api/creem-webhook`.
4. Redeploy.

## SEO

- `title`, `description`, canonical, Open Graph і Twitter-картка (`img/og.png`, 1200×630).
- JSON-LD: Organization, WebSite, SoftwareApplication з тарифами, FAQPage.
- `robots.txt`, `sitemap.xml`, `site.webmanifest`, favicon SVG.
- Шрифти віддаються з власного домену з довгим кешем, а CSS і JS — з перевіркою свіжості при кожному заході (`vercel.json`), щоб після оновлення ніхто не отримав стару версію скриптів.

**Пошта для звернень** — hello@kuhnyavcifrah.shop: скринька в Resend → Inboxes (MX `@` → receive-euw1.forge.rmta.net у GoDaddy).

**Домен** — kuhnyavcifrah.shop (DNS у GoDaddy: A `@` → Vercel, CNAME `www` і `app` → Vercel). Адреса прописана в `index.html`, `privacy.html`, `oferta.html`, `robots.txt` і `sitemap.xml`.

## Що доробити перед запуском реклами

- Вставити код Meta Pixel у `<head>` (місце позначене коментарем).

## Відео на першому екрані

Праворуч на першому екрані грає коротке відео по колу без звуку.

Файли — `assets/hero/`: `hero.mp4` (комп'ютер, 1280 px), `hero-m.mp4` (телефон, 720×1280), `poster.webp` і `poster-m.webp` (перший кадр; його видно до завантаження відео і тим, у кого ввімкнено «зменшити рух»). Відео — стоковий кліп Mixkit «Готова піца пепероні в коробці» (Mixkit Free License, комерційне використання дозволено), склеєний «вперед-назад», щоб коло йшло без ривка.

## Фото і відео

`assets/media/`: кліпи і кадри Mixkit під ліцензією Stock Video Free License (комерційне використання дозволено, авторство не обов'язкове): [тісто](https://mixkit.co/free-stock-video/chef-shaping-a-pizza-42469/), [соус](https://mixkit.co/free-stock-video/putting-sauce-on-pizza-dough-42473/), [сир](https://mixkit.co/free-stock-video/spreading-cheese-on-a-pizza-42475/), [піч](https://mixkit.co/free-stock-video/hot-oven-baking-pizzas-42481/), [кухар із тістом](https://mixkit.co/free-stock-video/chef-doing-acrobatics-with-the-dough-of-a-pizza-42472/), [нарізана піца](https://mixkit.co/free-stock-video/pizza-while-someone-takes-a-slice-42487/), [кухня](https://mixkit.co/free-stock-video/chef-working-in-a-large-kitchen-43048/), [калькулятор](https://mixkit.co/free-stock-video/woman-doing-accounts-on-a-calculator-4533/). У Mixkit є і кліпи «лише для особистого використання», тож перед заміною перевіряйте ліцензію на сторінці кліпу. Відео завантажуються тільки коли з'являються на екрані (`assets/js/live.js`).
