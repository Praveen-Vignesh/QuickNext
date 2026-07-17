import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import { env, googleEnabled, razorpayEnabled } from './config/env.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';
import { getConfig } from './controllers/auth.controller.js';

import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import vendorRoutes from './routes/vendor.routes.js';

const app = express();

app.set('trust proxy', 1); // Render/Railway sit behind a proxy

// Explicit origin allowlist, never '*'. When this blocks something on deploy
// day, the warning below names the exact origin and what was allowed — that's
// usually the whole debugging session.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // curl, health checks, server-to-server
      if (env.CORS_ORIGINS.includes(origin)) return callback(null, true);
      console.warn(`[cors] blocked origin: ${origin} — allowed: ${env.CORS_ORIGINS.join(', ')}`);
      return callback(null, false);
    },
  })
);

app.use(express.json({ limit: '1mb' }));

// Also the endpoint the uptime pinger should hit to keep Render's free
// instance from spinning down.
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    googleEnabled,
    razorpayEnabled,
    uptimeSeconds: Math.round(process.uptime()),
  });
});

// Lets the frontend discover which integrations this deployment has configured.
app.get('/api/config', getConfig);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/vendor', vendorRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
