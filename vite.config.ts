import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-graph': ['cytoscape', 'cytoscape-dagre', 'cytoscape-fcose'],
          'vendor-map': ['maplibre-gl'],
          'vendor-charts': ['recharts'],
          'vendor-query': ['@tanstack/react-query', '@tanstack/react-table'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});

