import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';

const DEMO_PASSWORD = 'demo1234';

const DEMO_USERS = [
  { email: 'customer@quicknext.demo', name: 'Demo Customer', role: 'customer' },
  { email: 'vendor@quicknext.demo', name: 'Anand Provisions', role: 'vendor' },
  // A second vendor so the multi-vendor cart and per-vendor dashboard scoping
  // can actually be demonstrated rather than just claimed.
  { email: 'vendor2@quicknext.demo', name: 'Corner Street Bakery', role: 'vendor' },
];

const CATALOG = {
  'vendor@quicknext.demo': [
    { name: 'Toor Dal (1kg)', category: 'Groceries', price: 180, stock: 40 },
    { name: 'Basmati Rice (5kg)', category: 'Groceries', price: 620, stock: 25 },
    { name: 'Cold Pressed Coconut Oil (1L)', category: 'Groceries', price: 450, stock: 18 },
    { name: 'Farm Eggs (12)', category: 'Dairy', price: 90, stock: 60 },
    { name: 'Full Cream Milk (1L)', category: 'Dairy', price: 68, stock: 50 },
    { name: 'Dishwash Liquid (750ml)', category: 'Household', price: 199, stock: 30 },
    { name: 'Filter Coffee Powder (500g)', category: 'Beverages', price: 340, stock: 22 },
  ],
  'vendor2@quicknext.demo': [
    { name: 'Sourdough Loaf', category: 'Bakery', price: 220, stock: 12 },
    { name: 'Butter Croissant', category: 'Bakery', price: 90, stock: 24 },
    { name: 'Whole Wheat Bread', category: 'Bakery', price: 60, stock: 30 },
    { name: 'Blueberry Muffin', category: 'Bakery', price: 110, stock: 15 },
    // Deliberately stocked at 1: this is the product to use when rehearsing the
    // two-browser race. Re-run the seed to reset it between takes.
    { name: "Baker's Last Chocolate Tart", category: 'Bakery', price: 260, stock: 1 },
  ],
};

async function seed() {
  await connectDB();

  console.log('[seed] clearing previous demo data…');
  const demoEmails = DEMO_USERS.map((u) => u.email);
  const existing = await User.find({ email: { $in: demoEmails } });
  const existingIds = existing.map((u) => u._id);

  await Promise.all([
    Product.deleteMany({ vendorId: { $in: existingIds } }),
    Cart.deleteMany({ userId: { $in: existingIds } }),
    Order.deleteMany({ customerId: { $in: existingIds } }),
  ]);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = {};

  for (const spec of DEMO_USERS) {
    const user = await User.findOneAndUpdate(
      { email: spec.email },
      {
        $set: {
          name: spec.name,
          role: spec.role,
          roleSelected: true, // demo accounts skip the role picker
          passwordHash,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    users[spec.email] = user;
    console.log(`[seed] user ${spec.email} (${spec.role})`);
  }

  let count = 0;
  for (const [email, products] of Object.entries(CATALOG)) {
    const vendor = users[email];
    await Product.insertMany(
      products.map((p) => ({
        ...p,
        vendorId: vendor._id,
        description: `${p.name} — stocked fresh by ${vendor.name}.`,
        images: [],
        isActive: true,
      }))
    );
    count += products.length;
  }
  console.log(`[seed] inserted ${count} products`);

  console.log('\n  Demo accounts (password for all three: %s)', DEMO_PASSWORD);
  for (const u of DEMO_USERS) console.log(`    ${u.role.padEnd(8)} ${u.email}`);
  console.log('\n  Race demo: "Baker\'s Last Chocolate Tart" is seeded with stock = 1.\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
