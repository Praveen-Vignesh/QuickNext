import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';

// Ensure the database is connected when running as a Vercel Serverless Function
let isConnected = false;

export default async function handler(req, res) {
  if (!isConnected && mongoose.connection.readyState !== 1) {
    await connectDB();
    isConnected = true;
  }
  return app(req, res);
}
