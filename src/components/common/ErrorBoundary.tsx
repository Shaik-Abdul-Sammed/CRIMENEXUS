import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRIMENEXUS ErrorBoundary caught an unhandled rendering error:', error, errorInfo);

    // Auto-heal dynamic import chunk errors on new production deployments
    const msg = (error?.message || '').toLowerCase();
    const isChunkError =
      msg.includes('failed to fetch dynamically imported module') ||
      msg.includes('importing a module script failed') ||
      msg.includes('error loading dynamically imported module') ||
      msg.includes('failed to load module script') ||
      error?.name === 'ChunkLoadError';

    if (isChunkError) {
      const lastReload = sessionStorage.getItem('crimenexus_eb_chunk_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('crimenexus_eb_chunk_reload', now.toString());
        console.warn('[CRIMENEXUS Self-Heal] Auto-reloading page to sync new deployment chunks...');
        window.location.reload();
      }
    }
  }

  private handleReset = () => {
    try {
      useAppStore.getState().setFeaturesHubModalOpen(false);
      useAppStore.getState().setGlobalSearchOpen(false);
      useAppStore.getState().setPageDirectoryOpen(false);
    } catch {
      // ignore
    }

    const msg = (this.state.error?.message || '').toLowerCase();
    const isChunkError =
      msg.includes('failed to fetch dynamically imported module') ||
      msg.includes('importing a module script failed') ||
      msg.includes('error loading dynamically imported module') ||
      msg.includes('failed to load module script') ||
      this.state.error?.name === 'ChunkLoadError';

    if (isChunkError) {
      window.location.reload();
      return;
    }

    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleSafeDashboard = () => {
    try {
      useAppStore.getState().setFeaturesHubModalOpen(false);
      useAppStore.getState().setGlobalSearchOpen(false);
      useAppStore.getState().setPageDirectoryOpen(false);
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      const msg = (this.state.error?.message || '').toLowerCase();
      const isChunkError =
        msg.includes('failed to fetch dynamically imported module') ||
        msg.includes('importing a module script failed') ||
        msg.includes('error loading dynamically imported module') ||
        msg.includes('failed to load module script') ||
        this.state.error?.name === 'ChunkLoadError';

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col items-center justify-center p-8 bg-card/90 border border-destructive/40 rounded-2xl text-center space-y-4 my-6 shadow-2xl backdrop-blur-md max-w-2xl mx-auto"
        >
          <div className="w-14 h-14 rounded-2xl bg-destructive/15 text-destructive border border-destructive/30 flex items-center justify-center shadow-lg">
            <AlertTriangle className="w-7 h-7" aria-hidden="true" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">
              {isChunkError ? 'System Release Update Required' : this.props.fallbackTitle || 'Component Rendering Error'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isChunkError
                ? 'A new production version of CRIMENEXUS has been deployed. The previous session bundle must be refreshed to sync with updated module binaries.'
                : this.props.fallbackMessage ||
                  'A rendering error occurred in this interactive view (e.g. WebGL or canvas context loss). Station operations remain safe.'}
            </p>
            {this.state.error?.message && (
              <div className="mt-2 p-2 rounded-lg bg-black/40 border border-border text-[11px] font-mono text-destructive/90 break-words text-left">
                <span className="font-bold uppercase tracking-wider block text-[9px] text-muted-foreground mb-0.5">Diagnostics:</span>
                {this.state.error.message}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-md transition-all"
              aria-label="Retry rendering the failed component"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isChunkError ? 'Reload & Update View' : 'Reload View'}</span>
            </button>
            <button
              type="button"
              onClick={this.handleSafeDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-foreground bg-accent hover:bg-accent/80 border border-border rounded-xl focus:outline-none transition-all"
              aria-label="Return safely to dashboard"
            >
              <Home className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span>Safe Dashboard</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
