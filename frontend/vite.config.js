import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Deliberately no dev proxy. The frontend talks to the API cross-origin in
    // development exactly as it will in production, so a CORS mistake surfaces
    // on day one instead of during the deploy.
  },
});
