import app from './app.js';
import { env, googleEnabled, razorpayEnabled } from './config/env.js';
import { connectDB } from './config/db.js';

await connectDB();

app.listen(env.PORT, () => {
  console.log(`[server] QuickNext API listening on :${env.PORT} (${env.NODE_ENV})`);
  console.log(`[server] CORS allows: ${env.CORS_ORIGINS.join(', ')}`);
  console.log(`[server] Google sign-in: ${googleEnabled ? 'enabled' : 'DISABLED (demo login only)'}`);
  console.log(`[server] Payments: ${razorpayEnabled ? 'Razorpay' : 'SIMULATED (no keys set)'}`);
});
