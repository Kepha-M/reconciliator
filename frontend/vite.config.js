import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '/auth': path.resolve(__dirname, 'src/auth'),
      '/pages': path.resolve(__dirname, 'src/pages'),
      '/context': path.resolve(__dirname, 'src/context')
    }
  },
  base: '/reconciliator/' // Must match your repo name
});
