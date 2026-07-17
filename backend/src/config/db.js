import mongoose from 'mongoose';
import { env } from './env.js';

// No in-memory fallback here on purpose. A silent swap to a throwaway database
// would hide a broken connection string behind an app that looks fine while
// writing to storage that evaporates on restart. When you want an ephemeral
// local DB, ask for it explicitly: `npm run dev:local`.
export async function connectDB() {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10_000,
    });
    console.log('[db] connected to MongoDB');
  } catch (err) {
    console.error('[db] connection failed:', err.message);

    // querySrv failures are a broken DNS resolver, not a bad password — and the
    // generic advice below sends people hunting in the wrong place for an hour.
    if (/querySrv|ENOTFOUND|ECONNREFUSED|ETIMEOUT/i.test(err.message)) {
      console.error(
        '[db] this looks like a DNS/SRV failure. Node cannot resolve mongodb+srv:// records\n' +
          '     on some machines. Use the standard (non-SRV) connection string instead:\n' +
          '     Atlas → Connect → Drivers → "Node.js 2.2.12 or later" gives a mongodb:// URI\n' +
          '     with explicit shard hosts, which resolves via the OS and sidesteps SRV.'
      );
    } else {
      console.error('[db] check MONGO_URI, the Atlas IP allowlist, and the db user password');
    }

    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => console.warn('[db] disconnected'));
  mongoose.connection.on('reconnected', () => console.log('[db] reconnected'));
}
