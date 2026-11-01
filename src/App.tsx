import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './app/AppLayout';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { CasesPage } from './features/cases/CasesPage';
import { CaseDetailPage } from './features/cases/CaseDetailPage';
import { EvidencePage } from './features/evidence/EvidencePage';
import { EvidenceDetailPage } from './features/evidence/EvidenceDetailPage';
import { EntitiesPage } from './features/entities/EntitiesPage';
import { EntityDetailPage } from './features/entities/EntityDetailPage';
import { EntityResolutionPage } from './features/resolution/EntityResolutionPage';
import { NetworkGraphPage } from './features/graph/NetworkGraphPage';
import { TimelinePage } from './features/timeline/TimelinePage';
import { MapIntelligencePage } from './features/map/MapIntelligencePage';
import { AIAssistantPage } from './features/assistant/AIAssistantPage';
import { MostWantedPage } from './features/watchlist/MostWantedPage';
import { DraftingPage } from './features/drafting/DraftingPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { AuditLogsPage } from './features/audit/AuditLogsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { LightweightDashboard } from './features/lightweight/LightweightDashboard';

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
      <BrowserRouter>
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
            <Route path="/most-wanted" element={<MostWantedPage />} />
            <Route path="/drafting" element={<DraftingPage />} />
            <Route path="/ai-assistant" element={<AIAssistantPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
