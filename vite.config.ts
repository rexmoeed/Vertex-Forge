import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    define: {
      'process.env': {},
      'process.platform': JSON.stringify(process.platform || 'win32'),
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            const normalized = id.replace(/\\/g, '/');
            if (normalized.includes('node_modules')) {
              if (normalized.includes('react-dom') || normalized.includes('/react/')) {
                return 'vendor-react';
              }
              if (normalized.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (normalized.includes('motion')) {
                return 'vendor-motion';
              }
              if (normalized.includes('@google/genai') || normalized.includes('zod')) {
                return 'vendor-ai-core';
              }
              return 'vendor-utils';
            }
            if (normalized.includes('/src/components/views/')) {
              return 'app-views';
            }
            if (normalized.includes('/src/services/')) {
              return 'app-services';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
