// What the order function sells and emails. Files are encrypted copies in api/_files (see order.js).
// price is the launch price until `until`, then priceAfter — keep in sync with data-* on <body> in index.html.
export default {
  "brand": "Кухня в цифрах",
  "site": "kukhnya-v-tsyfrakh.vercel.app",
  "title": "Набір «Кухня під контролем»",
  "price": 599,
  "accent": "#e0492e",
  "files": [
    {
      "name": "1_Техкарти_і_собівартість.xlsx",
      "enc": "1.enc"
    },
    {
      "name": "2_Закупівлі_та_інвентаризація.xlsx",
      "enc": "2.enc"
    },
    {
      "name": "3_Санітарні_журнали.xlsx",
      "enc": "3.enc"
    }
  ],
  "howTo": [
    "Відкрийте файли в Excel або завантажте в Google Таблиці (Файл → Імпорт).",
    "Почніть з «Техкарти і собівартість»: на першому аркуші — коротка інструкція.",
    "Жовті клітинки заповнюєте ви, решта рахується сама."
  ],
  "priceAfter": 699,
  "until": "2026-11-02T23:59:59+02:00"
};
