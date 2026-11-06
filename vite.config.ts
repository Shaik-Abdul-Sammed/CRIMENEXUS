import { createLogger, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const rootDir = process.cwd().endsWith('frontend')
  ? path.resolve(process.cwd(), '..')
  : path.resolve(__dirname, __dirname.endsWith('frontend') ? '..' : '.');

const customLogger = createLogger();
const originalLoggerError = customLogger.error;
customLogger.error = (msg, options) => {
  // Gracefully filter repetitive proxy connection refused logs when backend is initializing
  if (typeof msg === 'string' && msg.includes('http proxy error') && msg.includes('ECONNREFUSED')) {
    customLogger.warnOnce('Backend API service offline on port 8000. CrimeNexus client running in resilient offline mock mode.');
    return;
  }
  originalLoggerError(msg, options);
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isLite = mode === 'lite';
  return {
    customLogger,
    root: rootDir,
    plugins: [react()],
    optimizeDeps: {
      exclude: ['maplibre-gl'],
    },
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
    },
    build: {
      outDir: path.resolve(rootDir, isLite ? 'dist-lite' : 'dist'),
      emptyOutDir: true,
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        onwarn(warning, defaultHandler) {
          if (
            warning.code === 'INVALID_ANNOTATION' ||
            (typeof warning.message === 'string' &&
              warning.message.includes('contains an annotation that Rollup cannot interpret'))
          ) {
            return;
          }
          defaultHandler(warning);
        },
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
              if (id.includes('framer-motion') || id.includes('motion-dom')) {
                return 'vendor-motion';
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
              if (id.includes('zod')) {
                return 'vendor-zod';
              }
            }
          },
        },
      },
    },
    server: {
      port: 5173,
      host: true,
      fs: {
        allow: [rootDir, '..'],
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (err, _req, res) => {
              if (res && !res.headersSent && typeof (res as any).writeHead === 'function') {
                (res as any).writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Backend is initializing, please retry...', code: err.message }));
              }
            });
          },
        },
      },
      watch: {
        ignored: ['**/frontend/**', '**/backend/**', '**/.git/**', '**/dist/**', '**/demo_data/**'],
      },
    },
  };
});
