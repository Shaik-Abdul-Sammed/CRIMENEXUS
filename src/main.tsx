import React from 'react';
import ReactDOM from 'react-dom/client';
import * as maplibregl from 'maplibre-gl';
import App from './App';
import './index.css';

// Explicitly register MapLibre Web Worker to guarantee GeoJSON line parsing and rendering
maplibregl.setWorkerUrl('/assets/maplibre-gl-worker.mjs');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
