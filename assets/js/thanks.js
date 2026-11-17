// Creem returns here with product_id: count the purchase for ads (value by plan).
import { track } from './pixel.js?v=20261117b';
const VALUES = {
  prod_56L4SkH58lmYl88O1XPUHZ: 4.99, prod_6e1PZE8YJTSnqomirkcgQu: 4.99,
  prod_L1z5Xg9LRpnD31UNTlMgc: 35.99, prod_4lXA6Z74fbkfy1S6jqn9pV: 35.99,
};
const q = new URLSearchParams(location.search);
const value = VALUES[q.get('product_id')];
const order = q.get('order_id') || q.get('checkout_id') || '';
let seen = false;
try { seen = !!order && sessionStorage.getItem('paid:' + order); sessionStorage.setItem('paid:' + order, '1'); } catch {}
if (value && !seen) track('Purchase', { value, currency: 'USD' });
