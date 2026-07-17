import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import Product from '../src/models/Product.js';
import Order, { ORDER_STATUS } from '../src/models/Order.js';
import {
  reserveStock,
  cancelOrderAndRestoreStock,
  OutOfStockError,
} from '../src/services/stock.service.js';

let mongod;
const vendorId = new mongoose.Types.ObjectId();

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([Product.deleteMany({}), Order.deleteMany({})]);
});

function makeProduct(overrides = {}) {
  return Product.create({
    vendorId,
    name: 'Test Item',
    price: 100,
    category: 'Test',
    stock: 1,
    ...overrides,
  });
}

test('two customers racing for the last unit: exactly one wins', async () => {
  const product = await makeProduct({ stock: 1 });

  // Fire both reservations at once — this is the scenario the brief names.
  const results = await Promise.allSettled([
    reserveStock([{ productId: product._id, quantity: 1 }]),
    reserveStock([{ productId: product._id, quantity: 1 }]),
  ]);

  const won = results.filter((r) => r.status === 'fulfilled');
  const lost = results.filter((r) => r.status === 'rejected');

  assert.equal(won.length, 1, 'exactly one reservation should succeed');
  assert.equal(lost.length, 1, 'exactly one reservation should fail');
  assert.ok(lost[0].reason instanceof OutOfStockError);

  const after = await Product.findById(product._id);
  assert.equal(after.stock, 0, 'stock must land on 0, never negative');
});

test('twenty customers racing for five units: exactly five win', async () => {
  const product = await makeProduct({ stock: 5 });

  const results = await Promise.allSettled(
    Array.from({ length: 20 }, () => reserveStock([{ productId: product._id, quantity: 1 }]))
  );

  const won = results.filter((r) => r.status === 'fulfilled').length;
  assert.equal(won, 5, 'exactly five of twenty should succeed');

  const after = await Product.findById(product._id);
  assert.equal(after.stock, 0);
});

test('partial failure compensates: earlier lines are given back', async () => {
  const plenty = await makeProduct({ name: 'In Stock', stock: 5 });
  const empty = await makeProduct({ name: 'Sold Out', stock: 0 });

  await assert.rejects(
    () =>
      reserveStock([
        { productId: plenty._id, quantity: 2 },
        { productId: empty._id, quantity: 1 },
      ]),
    OutOfStockError
  );

  // Without compensation this would read 3 — two units destroyed by a
  // checkout that never completed.
  const after = await Product.findById(plenty._id);
  assert.equal(after.stock, 5, 'the successful line must be rolled back');
});

test('inactive products cannot be reserved', async () => {
  const product = await makeProduct({ stock: 10, isActive: false });

  await assert.rejects(
    () => reserveStock([{ productId: product._id, quantity: 1 }]),
    OutOfStockError
  );

  const after = await Product.findById(product._id);
  assert.equal(after.stock, 10);
});

test('cancelling restores stock exactly once, even when called twice at once', async () => {
  const product = await makeProduct({ stock: 5 });
  await reserveStock([{ productId: product._id, quantity: 2 }]);

  const order = await Order.create({
    customerId: new mongoose.Types.ObjectId(),
    items: [{ productId: product._id, vendorId, name: 'Test Item', price: 100, quantity: 2 }],
    totalAmount: 200,
    status: ORDER_STATUS.PENDING_PAYMENT,
  });

  // Double-clicked cancel button / retried request.
  const [a, b] = await Promise.all([
    cancelOrderAndRestoreStock(order._id),
    cancelOrderAndRestoreStock(order._id),
  ]);

  const claimed = [a, b].filter(Boolean);
  assert.equal(claimed.length, 1, 'only one call should claim the cancellation');

  const after = await Product.findById(product._id);
  assert.equal(after.stock, 5, 'stock must be credited once, not twice');

  const reloaded = await Order.findById(order._id);
  assert.equal(reloaded.status, ORDER_STATUS.CANCELLED);
  assert.equal(reloaded.stockRestored, true);
});

test('a paid order cannot be cancelled back into stock', async () => {
  const product = await makeProduct({ stock: 5 });
  await reserveStock([{ productId: product._id, quantity: 1 }]);

  const order = await Order.create({
    customerId: new mongoose.Types.ObjectId(),
    items: [{ productId: product._id, vendorId, name: 'Test Item', price: 100, quantity: 1 }],
    totalAmount: 100,
    status: ORDER_STATUS.COMPLETED,
  });

  const result = await cancelOrderAndRestoreStock(order._id);
  assert.equal(result, null, 'a completed order is not holding reservable stock');

  const after = await Product.findById(product._id);
  assert.equal(after.stock, 4, 'stock must not be credited back');
});
