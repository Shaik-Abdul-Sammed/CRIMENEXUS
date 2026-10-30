declare module 'cytoscape-fcose';
declare module 'cytoscape-dagre';

declare module '*?raw' {
  const content: string;
  export default content;
}

declare module '*.txt' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string;
  readonly VITE_API_MOCK_MODE?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_LATENCY_MS?: string;
  readonly VITE_MAP_TILE_STYLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
