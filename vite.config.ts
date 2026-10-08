import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@radix-ui')) return 'radix';
          if (id.includes('motion')) return 'motion';
          if (id.includes('embla-carousel')) return 'embla';
          if (id.includes('@tanstack')) return 'query';
          // Let Rollup keep React and the remaining shared dependencies together.
          // This avoids circular vendor <-> react-vendor chunks on Hostinger.
          return;
        },
      },
    },
  },
  server: { proxy: { '/api': 'http://localhost:4000', '/uploads': 'http://localhost:4000' } },
});
