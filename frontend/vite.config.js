import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
  // Load environment variables from .env files
  const env = loadEnv(mode, process.cwd(), '');

  return defineConfig({
    plugins: [react()],

    // Dynamically set the base path depending on environment
    base: env.VITE_ENV === 'production' ? '/reconciliator/' : '/',

    // Define global constants if needed
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_ENV),
      __API_BASE__: JSON.stringify(env.VITE_API_BASE_URL)
    },

    server: {
      port: 3000,
      open: true
    }
  });
};
