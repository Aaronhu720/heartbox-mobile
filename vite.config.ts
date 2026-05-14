import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'sql.js': path.resolve(__dirname, './node_modules/sql.js/dist/sql-asm.js'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
