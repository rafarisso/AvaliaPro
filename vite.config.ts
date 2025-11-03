import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@/services': path.resolve(__dirname, 'src/services'),
          '@/features': path.resolve(__dirname, 'src/features'),
          '@/pages': path.resolve(__dirname, 'src/pages'),
          '@/styles': path.resolve(__dirname, 'src/styles'),
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        charset: 'utf8',
      }
    };
});
