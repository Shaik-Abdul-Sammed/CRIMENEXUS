import React from 'react';

/**
 * Resilient lazy loading wrapper that auto-heals chunk load failures.
 *
 * When a new production release is deployed, previous chunk hashes on the server
 * are replaced. If a user is actively navigating an already-loaded single page app,
 * their browser may request a stale chunk name (resulting in a 404 / Failed to fetch
 * dynamically imported module error).
 *
 * This utility catches such module import failures and forces a fresh browser reload
 * once to fetch the latest index.html and modern chunks, preventing the "Workspace Module
 * Rendering Error" from locking the user out.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  chunkName?: string
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    const retryKey = `crimenexus_chunk_retry_${chunkName || 'common'}`;
    const alreadyRetried = sessionStorage.getItem(retryKey) === 'true';

    try {
      const module = await factory();
      // On successful load, clear any existing retry flag
      sessionStorage.removeItem(retryKey);
      return module;
    } catch (error: any) {
      const errorMsg = (error?.message || '').toLowerCase();
      const errorName = (error?.name || '').toLowerCase();

      const isChunkLoadFailure =
        errorMsg.includes('failed to fetch dynamically imported module') ||
        errorMsg.includes('importing a module script failed') ||
        errorMsg.includes('error loading dynamically imported module') ||
        errorMsg.includes('failed to load module script') ||
        errorName.includes('chunkloaderror');

      if (isChunkLoadFailure && !alreadyRetried) {
        console.warn(
          `[CRIMENEXUS Self-Heal] Stale or missing chunk detected for module "${chunkName || 'route'}". Auto-reloading to synchronize latest release...`
        );
        sessionStorage.setItem(retryKey, 'true');
        // Force reload without cache
        window.location.reload();
        // Return an unresolved promise to prevent ErrorBoundary from flashing while the browser reloads
        return new Promise<{ default: T }>(() => {});
      }

      // If already retried or not a chunk failure, let the ErrorBoundary display diagnostics
      throw error;
    }
  });
}
