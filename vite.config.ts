import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@/services': path.resolve(__dirname, 'src/services'),
        '@/features': path.resolve(__dirname, 'src/features'),
        '@/pages': path.resolve(__dirname, 'src/pages'),
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      charset: 'utf8',
    }
  };
});
