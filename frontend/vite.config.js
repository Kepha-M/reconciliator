import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Node path module for resolving paths

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  resolve: {
    alias: {
      '/auth': path.resolve(__dirname, 'src/auth'),
      '/pages': path.resolve(__dirname, 'src/pages'),
      '/context': path.resolve(__dirname, 'src/context')
      // Add more aliases here as needed
    },
  },
});
