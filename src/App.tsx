import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './app/AppLayout';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { SkeletonLoader } from './components/common/SkeletonLoader';
import { ToastProvider } from './components/ui/Toast';

// Lazy-loaded routes for optimal bundle code-splitting and rapid FCP
const DashboardPage = React.lazy(() => import('./features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const CasesPage = React.lazy(() => import('./features/cases/CasesPage').then((m) => ({ default: m.CasesPage })));
const CaseDetailPage = React.lazy(() => import('./features/cases/CaseDetailPage').then((m) => ({ default: m.CaseDetailPage })));
const EvidencePage = React.lazy(() => import('./features/evidence/EvidencePage').then((m) => ({ default: m.EvidencePage })));
const EvidenceDetailPage = React.lazy(() => import('./features/evidence/EvidenceDetailPage').then((m) => ({ default: m.EvidenceDetailPage })));
const EntitiesPage = React.lazy(() => import('./features/entities/EntitiesPage').then((m) => ({ default: m.EntitiesPage })));
const EntityDetailPage = React.lazy(() => import('./features/entities/EntityDetailPage').then((m) => ({ default: m.EntityDetailPage })));
const EntityResolutionPage = React.lazy(() => import('./features/resolution/EntityResolutionPage').then((m) => ({ default: m.EntityResolutionPage })));
const NetworkGraphPage = React.lazy(() => import('./features/graph/NetworkGraphPage').then((m) => ({ default: m.NetworkGraphPage })));
const TimelinePage = React.lazy(() => import('./features/timeline/TimelinePage').then((m) => ({ default: m.TimelinePage })));
const MapIntelligencePage = React.lazy(() => import('./features/map/MapIntelligencePage').then((m) => ({ default: m.MapIntelligencePage })));
const AIAssistantPage = React.lazy(() => import('./features/assistant/AIAssistantPage').then((m) => ({ default: m.AIAssistantPage })));
const MostWantedPage = React.lazy(() => import('./features/watchlist/MostWantedPage').then((m) => ({ default: m.MostWantedPage })));
const DraftingPage = React.lazy(() => import('./features/drafting/DraftingPage').then((m) => ({ default: m.DraftingPage })));
const ReportsPage = React.lazy(() => import('./features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const AuditLogsPage = React.lazy(() => import('./features/audit/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })));
const SettingsPage = React.lazy(() => import('./features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const DesignSystemPage = React.lazy(() => import('./features/design-system/DesignSystemPage').then((m) => ({ default: m.DesignSystemPage })));
const AboutPlatformPage = React.lazy(() => import('./features/about/AboutPlatformPage').then((m) => ({ default: m.AboutPlatformPage })));
const LightweightDashboard = React.lazy(() => import('./features/lightweight/LightweightDashboard').then((m) => ({ default: m.LightweightDashboard })));
const LiveTrackingPage = React.lazy(() => import('./features/demo/LiveTrackingPage').then((m) => ({ default: m.LiveTrackingPage })));

const LazyRouteFallback = (
  <div className="p-6 space-y-4">
    <SkeletonLoader variant="card" count={3} />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <React.Suspense fallback={LazyRouteFallback}>
            <Routes>
              {/* Public Auth & Ultra-Low Bandwidth Thana Lite Mode */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/lite" element={<LightweightDashboard />} />

              {/* Protected Application Workspace */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/cases" element={<CasesPage />} />
                <Route path="/cases/:id" element={<CaseDetailPage />} />
                <Route path="/evidence" element={<EvidencePage />} />
                <Route path="/evidence/:id" element={<EvidenceDetailPage />} />
                <Route path="/entities" element={<EntitiesPage />} />
                <Route path="/entities/:id" element={<EntityDetailPage />} />
                <Route path="/entity-resolution" element={<EntityResolutionPage />} />
                <Route path="/network-graph" element={<NetworkGraphPage />} />
                <Route path="/graph" element={<Navigate to="/network-graph" replace />} />
                <Route path="/timeline" element={<TimelinePage />} />
                <Route path="/map" element={<MapIntelligencePage />} />
                <Route path="/live-tracking" element={<LiveTrackingPage />} />
                <Route path="/forensics" element={<Navigate to="/live-tracking?tab=forensics" replace />} />
                <Route path="/most-wanted" element={<MostWantedPage />} />
                <Route path="/drafting" element={<DraftingPage />} />
                <Route path="/ai-assistant" element={<AIAssistantPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
                <Route path="/design-system" element={<DesignSystemPage />} />
                <Route path="/about" element={<AboutPlatformPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </React.Suspense>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
