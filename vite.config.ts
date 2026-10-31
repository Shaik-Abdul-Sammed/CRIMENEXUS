import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isLite = mode === 'lite';
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: isLite ? 'dist-lite' : 'dist',
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('maplibre-gl')) {
                return 'vendor-maplibre';
              }
              if (id.includes('cytoscape')) {
                return 'vendor-cytoscape';
              }
              if (id.includes('recharts')) {
                return 'vendor-charts';
              }
              if (id.includes('@tanstack')) {
                return 'vendor-tanstack';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-lucide';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-react-core';
              }
            }
          },
        },
      },
    },
    server: {
      port: 3000,
      host: true,
    },
  };
});

