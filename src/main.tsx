import React from 'react';
import ReactDOM from 'react-dom/client';
import * as maplibregl from 'maplibre-gl';
import App from './App';
import './index.css';

// Explicitly register MapLibre Web Worker to guarantee GeoJSON line parsing and rendering
maplibregl.setWorkerUrl('/assets/maplibre-gl-worker.mjs');

// Global Vite Dynamic Import Preload Error Recovery
// Triggers on new container deployments where previous JS chunk hashes are replaced on server
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[CRIMENEXUS] Vite preload error: Dynamic chunk updated. Auto-reloading application...', event);
  const now = Date.now();
  const lastReload = sessionStorage.getItem('crimenexus_preload_error_ts');
  if (!lastReload || now - parseInt(lastReload, 10) > 8000) {
    sessionStorage.setItem('crimenexus_preload_error_ts', now.toString());
    window.location.reload();
  }
});


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
