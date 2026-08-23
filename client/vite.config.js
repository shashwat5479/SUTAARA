import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The client calls "/api/..." and Vite proxies it to the Express server,
// so there are no CORS headaches in development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
