
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // هذا السطر يحل مشكلة "process is not defined" في المتصفح
    'process.env': process.env
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: 3000,
  },
});
