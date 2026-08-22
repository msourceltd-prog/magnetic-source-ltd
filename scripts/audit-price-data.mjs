const base = 'https://pylhokxuqqbldnfjwjem.supabase.co/rest/v1/products?select=price,tags&limit=1000';
const response = await fetch(base, { headers: { apikey: 'sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq' } });
if (!response.ok) throw new Error(`Supabase request failed: ${response.status}`);
const products = await response.json();
const numeric = products.map((product) => Number(product.price)).filter(Number.isFinite);
const nonZero = numeric.filter((price) => price > 0);
const hidden = products.filter((product) => Array.isArray(product.tags) && product.tags.includes('Price hidden'));
console.log(JSON.stringify({ total: products.length, nonZero: nonZero.length, zero: numeric.filter((price) => price === 0).length, priceRange: nonZero.length ? { min: Math.min(...nonZero), max: Math.max(...nonZero) } : null, hiddenTag: hidden.length }, null, 2));
