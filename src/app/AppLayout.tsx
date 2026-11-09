import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from '../components/layout/Sidebar';
import { TopNav } from '../components/layout/TopNav';
import { GlobalSearchModal } from '../components/layout/GlobalSearchModal';
import { PageDirectoryModal } from '../components/common/PageDirectoryModal';
import { ProFeaturesHubModal } from '../components/common/ProFeaturesHubModal';
import { PageTransition } from '../components/common/PageTransition';
import { BackToTopButton } from '../components/common/BackToTopButton';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { useAppStore } from '../stores/appStore';

export function AppLayout() {
  const location = useLocation();
  const { featuresHubModalOpen, setFeaturesHubModalOpen } = useAppStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Skip to Main Content Link for Keyboard Accessibility (a11y) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[99999] focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:text-xs focus:font-bold focus:rounded-md focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <TopNav />

        {/* Dynamic Page Workspace View with Contained Error Boundary */}
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto p-6 focus:outline-none">
          <ErrorBoundary
            fallbackTitle="Workspace Module Rendering Error"
            fallbackMessage="An error occurred in this interactive view. Sidebar navigation, emergency dispatch, and command functions remain active."
          >
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>

      {/* Universal Modal Overlays */}
      <GlobalSearchModal />
      <PageDirectoryModal />
      <ProFeaturesHubModal
        isOpen={featuresHubModalOpen}
        onClose={() => setFeaturesHubModalOpen(false)}
      />

      {/* Floating Back to Top Button */}
      <BackToTopButton />
    </div>
  );
}

