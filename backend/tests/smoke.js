/**
 * End-to-end smoke test.
 *
 * Boots the real server against a throwaway in-memory MongoDB and drives the
 * whole flow over HTTP: login → catalog → cart → checkout → confirm → vendor
 * dashboard → fulfilment. No Atlas, no keys, no browser needed.
 *
 *   npm run smoke
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BACKEND = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = 5099;
const BASE = `http://127.0.0.1:${PORT}`;

let passed = 0;
let failed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  \x1b[32m✔\x1b[0m ${label}`);
  } else {
    failed += 1;
    console.log(`  \x1b[31m✖ ${label}\x1b[0m ${detail}`);
  }
}

const call = async (method, url, { token, body, origin } = {}) => {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (origin) headers.Origin = origin;

  const res = await fetch(`${BASE}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  return { status: res.status, data, headers: res.headers };
};

async function waitForHealth(attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

const mongod = await MongoMemoryServer.create();
const env = {
  ...process.env,
  MONGO_URI: mongod.getUri('quicknext_smoke'),
  JWT_SECRET: 'smoke-test-secret',
  PORT: String(PORT),
  CORS_ORIGINS: 'http://localhost:5173',
  NODE_ENV: 'test',
};

console.log('\n[smoke] seeding…');
execFileSync('node', ['src/scripts/seed.js'], { cwd: BACKEND, env, stdio: 'ignore' });

console.log('[smoke] booting server…');
const server = spawn('node', ['src/server.js'], { cwd: BACKEND, env, stdio: 'ignore' });

const cleanup = async () => {
  server.kill();
  await mongod.stop();
};

try {
  if (!(await waitForHealth())) throw new Error('server never became healthy');

  console.log('\nInfrastructure');
  const health = await call('GET', '/api/health');
  check('health reports ok + db connected', health.data?.status === 'ok' && health.data?.db === 'connected');
  check('payments default to simulated with no keys', health.data?.razorpayEnabled === false);

  const badOrigin = await call('GET', '/api/health', { origin: 'https://evil.example.com' });
  check(
    'CORS omits allow-origin for a non-allowlisted origin',
    !badOrigin.headers.get('access-control-allow-origin')
  );
  const goodOrigin = await call('GET', '/api/health', { origin: 'http://localhost:5173' });
  check(
    'CORS allows the configured origin',
    goodOrigin.headers.get('access-control-allow-origin') === 'http://localhost:5173'
  );

  console.log('\nAuth');
  const anon = await call('GET', '/api/cart');
  check('cart rejects anonymous access', anon.status === 401);

  const login = await call('POST', '/api/auth/login', {
    body: { email: 'customer@quicknext.demo', password: 'demo1234' },
  });
  check('demo customer can log in', login.status === 200 && !!login.data?.token, JSON.stringify(login.data));
  const customer = login.data.token;

  const badPass = await call('POST', '/api/auth/login', {
    body: { email: 'customer@quicknext.demo', password: 'wrong' },
  });
  check('wrong password is rejected', badPass.status === 401);

  const vendorLogin = await call('POST', '/api/auth/login', {
    body: { email: 'vendor@quicknext.demo', password: 'demo1234' },
  });
  const vendor = vendorLogin.data.token;
  check('demo vendor can log in', vendorLogin.status === 200 && vendorLogin.data.user.role === 'vendor');

  const guard = await call('GET', '/api/vendor/products', { token: customer });
  check('customer is blocked from vendor routes', guard.status === 403);

  console.log('\nCatalog');
  const catalog = await call('GET', '/api/products');
  check('catalog lists seeded products', catalog.data?.items?.length > 0);

  const cats = await call('GET', '/api/products/categories');
  check(
    "'/categories' is not swallowed by '/:id'",
    Array.isArray(cats.data?.categories) && cats.data.categories.length > 0
  );

  const search = await call('GET', '/api/products?search=dal');
  check('partial search matches ("dal" → Toor Dal)', search.data?.items?.length > 0);

  const filtered = await call('GET', '/api/products?category=Bakery');
  check(
    'category filter returns only that category',
    filtered.data?.items?.length > 0 && filtered.data.items.every((p) => p.category === 'Bakery')
  );

  console.log('\nCart');
  // Buy from the vendor whose dashboard we assert on later — the catalog is
  // multi-vendor, so picking "any product" would land on the other store.
  const vendorOwn = await call('GET', '/api/vendor/products', { token: vendor });
  const product = vendorOwn.data.products.find((p) => p.stock > 3);
  const stockBefore = product.stock;

  await call('PUT', '/api/cart', { token: customer, body: { items: [{ productId: product._id, quantity: 2 }] } });
  const cart = await call('GET', '/api/cart', { token: customer });
  check('cart persists to the database', cart.data?.items?.length === 1);
  check('cart subtotal is computed from live price', cart.data.subtotal === product.price * 2);
  check('cart carries live stock for the badge', cart.data.items[0].stock === stockBefore);

  const dupes = await call('PUT', '/api/cart', {
    token: customer,
    body: {
      items: [
        { productId: product._id, quantity: 1 },
        { productId: product._id, quantity: 2 },
      ],
    },
  });
  check('duplicate lines merge into one', dupes.data.items.length === 1 && dupes.data.items[0].quantity === 3);

  const badQty = await call('PUT', '/api/cart', {
    token: customer,
    body: { items: [{ productId: product._id, quantity: 0 }] },
  });
  check('zero quantity is rejected', badQty.status === 400);

  await call('PUT', '/api/cart', { token: customer, body: { items: [{ productId: product._id, quantity: 2 }] } });

  console.log('\nCheckout');
  const created = await call('POST', '/api/orders', { token: customer });
  check('order is created', created.status === 201, JSON.stringify(created.data));
  check('order starts unpaid', created.data.order.status === 'pending_payment');
  check('simulated payment intent is returned', created.data.payment.provider === 'simulated');

  const afterReserve = await call('GET', `/api/products/${product._id}`);
  check(
    'stock is reserved at checkout, before payment',
    afterReserve.data.product.stock === stockBefore - 2
  );

  const confirmed = await call('POST', '/api/orders/confirm', {
    token: customer,
    body: { orderId: created.data.order._id },
  });
  check('payment confirms and order is paid', confirmed.data.order.status === 'paid');

  const again = await call('POST', '/api/orders/confirm', {
    token: customer,
    body: { orderId: created.data.order._id },
  });
  check('confirm is idempotent', again.status === 200 && again.data.alreadyProcessed === true);

  const emptied = await call('GET', '/api/cart', { token: customer });
  check('cart is emptied only after payment', emptied.data.items.length === 0);

  const mine = await call('GET', '/api/orders/mine', { token: customer });
  check('order appears in history', mine.data.orders.length === 1);

  console.log('\nCancellation restores stock');
  await call('PUT', '/api/cart', { token: customer, body: { items: [{ productId: product._id, quantity: 1 }] } });
  const toCancel = await call('POST', '/api/orders', { token: customer });
  const heldStock = (await call('GET', `/api/products/${product._id}`)).data.product.stock;

  const cancelled = await call('POST', `/api/orders/${toCancel.data.order._id}/cancel`, { token: customer });
  check('order cancels', cancelled.data.order.status === 'cancelled');

  const restored = (await call('GET', `/api/products/${product._id}`)).data.product.stock;
  check('cancelling puts the unit back on the shelf', restored === heldStock + 1);

  const doubleCancel = await call('POST', `/api/orders/${toCancel.data.order._id}/cancel`, { token: customer });
  check('a second cancel is refused (no double credit)', doubleCancel.status === 409);
  const afterDouble = (await call('GET', `/api/products/${product._id}`)).data.product.stock;
  check('stock unchanged by the refused cancel', afterDouble === restored);

  console.log('\nOut of stock');
  const tart = (await call('GET', '/api/products?search=Tart')).data.items[0];
  check('the race-demo product is seeded with stock = 1', tart?.stock === 1);

  await call('PUT', '/api/cart', { token: customer, body: { items: [{ productId: tart._id, quantity: 2 }] } });
  const oversell = await call('POST', '/api/orders', { token: customer });
  check('buying more than exists is refused with 409', oversell.status === 409);
  check('the 409 names the product and what is left', oversell.data?.available === 1, JSON.stringify(oversell.data));
  await call('DELETE', '/api/cart', { token: customer });

  console.log('\nVendor');
  const dash = await call('GET', '/api/vendor/dashboard', { token: vendor });
  check('dashboard reports gross revenue', dash.data.summary.grossRevenue > 0);
  check('dashboard reports an active pipeline', dash.data.summary.activeOrders === 1);
  check('nothing completed yet', dash.data.summary.completedOrders === 0);
  check('chart series covers 7 days', dash.data.series.length === 7);

  const vendorOrders = await call('GET', '/api/vendor/orders', { token: vendor });
  // The paid order plus the one cancelled above — vendors see cancellations too.
  check('vendor sees paid and cancelled orders', vendorOrders.data.orders.length === 2);
  check('vendor never sees unpaid carts', vendorOrders.data.orders.every((o) => o.status !== 'pending_payment'));
  check(
    'vendor only sees their own lines',
    vendorOrders.data.orders.every((o) => o.items.every((i) => i.name === product.name))
  );

  const paidOrder = vendorOrders.data.orders.find((o) => o.status === 'paid');
  check('the paid order is in the feed', !!paidOrder);
  const orderId = paidOrder._id;
  const skip = await call('PATCH', `/api/vendor/orders/${orderId}/status`, {
    token: vendor,
    body: { status: 'completed' },
  });
  check('cannot skip paid → completed', skip.status === 400);

  await call('PATCH', `/api/vendor/orders/${orderId}/status`, { token: vendor, body: { status: 'processing' } });
  await call('PATCH', `/api/vendor/orders/${orderId}/status`, { token: vendor, body: { status: 'completed' } });

  const dash2 = await call('GET', '/api/vendor/dashboard', { token: vendor });
  check('completed count moves after fulfilment', dash2.data.summary.completedOrders === 1);
  check('active pipeline empties', dash2.data.summary.activeOrders === 0);

  console.log('\nVendor CRUD');
  const made = await call('POST', '/api/vendor/products', {
    token: vendor,
    body: { name: 'Smoke Test Jar', category: 'Groceries', price: 99, stock: 7 },
  });
  check('vendor can create a listing', made.status === 201);

  const other = await call('POST', '/api/auth/login', {
    body: { email: 'vendor2@quicknext.demo', password: 'demo1234' },
  });
  const hijack = await call('PUT', `/api/vendor/products/${made.data.product._id}`, {
    token: other.data.token,
    body: { price: 1 },
  });
  check("a vendor cannot edit another vendor's product", hijack.status === 404);

  await call('DELETE', `/api/vendor/products/${made.data.product._id}`, { token: vendor });
  const gone = await call('GET', `/api/products/${made.data.product._id}`);
  check('deleted listing leaves the public catalog', gone.status === 404);

  console.log('\nRole switching');
  const roleRes = await call('POST', '/api/auth/role', { token: customer, body: { role: 'vendor' } });
  check('a customer can become a vendor', roleRes.data.user.role === 'vendor');
  const nowAllowed = await call('GET', '/api/vendor/products', { token: customer });
  check('the same token immediately gets vendor access', nowAllowed.status === 200);
} catch (err) {
  failed += 1;
  console.error('\n[smoke] threw:', err);
} finally {
  console.log(`\n\x1b[1m${passed} passed, ${failed} failed\x1b[0m\n`);
  await cleanup();
  process.exit(failed > 0 ? 1 : 0);
}
