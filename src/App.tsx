import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './app/AppLayout';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { SkeletonLoader } from './components/common/SkeletonLoader';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { lazyWithRetry } from './utils/lazyWithRetry';

// Resilient lazy-loaded routes with auto-healing for deployment chunk mismatches
const DashboardPage = lazyWithRetry(() => import('./features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })), 'DashboardPage');
const CasesPage = lazyWithRetry(() => import('./features/cases/CasesPage').then((m) => ({ default: m.CasesPage })), 'CasesPage');
const CaseDetailPage = lazyWithRetry(() => import('./features/cases/CaseDetailPage').then((m) => ({ default: m.CaseDetailPage })), 'CaseDetailPage');
const EvidencePage = lazyWithRetry(() => import('./features/evidence/EvidencePage').then((m) => ({ default: m.EvidencePage })), 'EvidencePage');
const EvidenceDetailPage = lazyWithRetry(() => import('./features/evidence/EvidenceDetailPage').then((m) => ({ default: m.EvidenceDetailPage })), 'EvidenceDetailPage');
const EntitiesPage = lazyWithRetry(() => import('./features/entities/EntitiesPage').then((m) => ({ default: m.EntitiesPage })), 'EntitiesPage');
const EntityDetailPage = lazyWithRetry(() => import('./features/entities/EntityDetailPage').then((m) => ({ default: m.EntityDetailPage })), 'EntityDetailPage');
const EntityResolutionPage = lazyWithRetry(() => import('./features/resolution/EntityResolutionPage').then((m) => ({ default: m.EntityResolutionPage })), 'EntityResolutionPage');
const NetworkGraphPage = lazyWithRetry(() => import('./features/graph/NetworkGraphPage').then((m) => ({ default: m.NetworkGraphPage })), 'NetworkGraphPage');
const TimelinePage = lazyWithRetry(() => import('./features/timeline/TimelinePage').then((m) => ({ default: m.TimelinePage })), 'TimelinePage');
const MapIntelligencePage = lazyWithRetry(() => import('./features/map/MapIntelligencePage').then((m) => ({ default: m.MapIntelligencePage })), 'MapIntelligencePage');
const AIAssistantPage = lazyWithRetry(() => import('./features/assistant/AIAssistantPage').then((m) => ({ default: m.AIAssistantPage })), 'AIAssistantPage');
const MostWantedPage = lazyWithRetry(() => import('./features/watchlist/MostWantedPage').then((m) => ({ default: m.MostWantedPage })), 'MostWantedPage');
const DraftingPage = lazyWithRetry(() => import('./features/drafting/DraftingPage').then((m) => ({ default: m.DraftingPage })), 'DraftingPage');
const ReportsPage = lazyWithRetry(() => import('./features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })), 'ReportsPage');
const AuditLogsPage = lazyWithRetry(() => import('./features/audit/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })), 'AuditLogsPage');
const SettingsPage = lazyWithRetry(() => import('./features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })), 'SettingsPage');
const DesignSystemPage = lazyWithRetry(() => import('./features/design-system/DesignSystemPage').then((m) => ({ default: m.DesignSystemPage })), 'DesignSystemPage');
const AboutPlatformPage = lazyWithRetry(() => import('./features/about/AboutPlatformPage').then((m) => ({ default: m.AboutPlatformPage })), 'AboutPlatformPage');
const LightweightDashboard = lazyWithRetry(() => import('./features/lightweight/LightweightDashboard').then((m) => ({ default: m.LightweightDashboard })), 'LightweightDashboard');
const LiveTrackingPage = lazyWithRetry(() => import('./features/demo/LiveTrackingPage').then((m) => ({ default: m.LiveTrackingPage })), 'LiveTrackingPage');
const EscapeSimulationPage = lazyWithRetry(() => import('./features/demo/EscapeSimulationPage').then((m) => ({ default: m.EscapeSimulationPage })), 'EscapeSimulationPage');
const DigitalFootprintPage = lazyWithRetry(() => import('./features/demo/DigitalFootprintPage').then((m) => ({ default: m.DigitalFootprintPage })), 'DigitalFootprintPage');
const TechnicalRoadmapPage = lazyWithRetry(() => import('./features/roadmap/TechnicalRoadmapPage').then((m) => ({ default: m.TechnicalRoadmapPage })), 'TechnicalRoadmapPage');
const RailwayVerificationPage = lazyWithRetry(() => import('./features/railway/RailwayVerificationPage').then((m) => ({ default: m.RailwayVerificationPage })), 'RailwayVerificationPage');
const GuardianTracePage = lazyWithRetry(() => import('./features/guardian-trace/GuardianTracePage').then((m) => ({ default: m.GuardianTracePage })), 'GuardianTracePage');
const CitizenReportingPage = lazyWithRetry(() => import('./features/citizen/CitizenReportingPage').then((m) => ({ default: m.CitizenReportingPage })), 'CitizenReportingPage');
const TrackReportPage = lazyWithRetry(() => import('./features/citizen/TrackReportPage').then((m) => ({ default: m.TrackReportPage })), 'TrackReportPage');
const PublicReportsQueue = lazyWithRetry(() => import('./features/police/PublicReportsQueue').then((m) => ({ default: m.PublicReportsQueue })), 'PublicReportsQueue');
const FIRArchivePage = lazyWithRetry(() => import('./features/fir-archive/FIRArchivePage').then((m) => ({ default: m.FIRArchivePage })), 'FIRArchivePage');
const NotFoundPage = lazyWithRetry(() => import('./features/error/NotFoundPage').then((m) => ({ default: m.NotFoundPage })), 'NotFoundPage');

// 20 International Police Intelligence & Analytics Pages (Features 1-20)
const IntelligenceFusionPage = lazyWithRetry(() => import('./features/intelligence/IntelligenceFusionPage').then((m) => ({ default: m.IntelligenceFusionPage })), 'IntelligenceFusionPage');
const PersonRiskPage = lazyWithRetry(() => import('./features/risk/PersonRiskPage').then((m) => ({ default: m.PersonRiskPage })), 'PersonRiskPage');
const HotspotForecastPage = lazyWithRetry(() => import('./features/forecast/HotspotForecastPage').then((m) => ({ default: m.HotspotForecastPage })), 'HotspotForecastPage');
const SNAGangsPage = lazyWithRetry(() => import('./features/sna/SNAGangsPage').then((m) => ({ default: m.SNAGangsPage })), 'SNAGangsPage');
const RTCCDashboard = lazyWithRetry(() => import('./features/rtcc/RTCCDashboard').then((m) => ({ default: m.RTCCDashboard })), 'RTCCDashboard');
const RouteAnalysisPage = lazyWithRetry(() => import('./features/route/RouteAnalysisPage').then((m) => ({ default: m.RouteAnalysisPage })), 'RouteAnalysisPage');
const NearRepeatAlertsPage = lazyWithRetry(() => import('./features/alerts/NearRepeatAlertsPage').then((m) => ({ default: m.NearRepeatAlertsPage })), 'NearRepeatAlertsPage');
const ForensicDBPage = lazyWithRetry(() => import('./features/forensics/ForensicDBPage').then((m) => ({ default: m.ForensicDBPage })), 'ForensicDBPage');
const InterpolSyncPage = lazyWithRetry(() => import('./features/interpol/InterpolSyncPage').then((m) => ({ default: m.InterpolSyncPage })), 'InterpolSyncPage');
const SARAnalyticsPage = lazyWithRetry(() => import('./features/sar/SARAnalyticsPage').then((m) => ({ default: m.SARAnalyticsPage })), 'SARAnalyticsPage');
const ThreatAssessmentPage = lazyWithRetry(() => import('./features/threat/ThreatAssessmentPage').then((m) => ({ default: m.ThreatAssessmentPage })), 'ThreatAssessmentPage');
const OSINTMonitorPage = lazyWithRetry(() => import('./features/osint/OSINTMonitorPage').then((m) => ({ default: m.OSINTMonitorPage })), 'OSINTMonitorPage');
const IMSICatcherPage = lazyWithRetry(() => import('./features/imsi/IMSICatcherPage').then((m) => ({ default: m.IMSICatcherPage })), 'IMSICatcherPage');
const GunIntelligencePage = lazyWithRetry(() => import('./features/gun/GunIntelligencePage').then((m) => ({ default: m.GunIntelligencePage })), 'GunIntelligencePage');
const IBISPage = lazyWithRetry(() => import('./features/ballistics/IBISPage').then((m) => ({ default: m.IBISPage })), 'IBISPage');
const DVRiskPage = lazyWithRetry(() => import('./features/dv/DVRiskPage').then((m) => ({ default: m.DVRiskPage })), 'DVRiskPage');
const InterceptTranslatePage = lazyWithRetry(() => import('./features/intercept/InterceptTranslatePage').then((m) => ({ default: m.InterceptTranslatePage })), 'InterceptTranslatePage');
const GeofencePage = lazyWithRetry(() => import('./features/geofence/GeofencePage').then((m) => ({ default: m.GeofencePage })), 'GeofencePage');
const BlockchainEvidencePage = lazyWithRetry(() => import('./features/blockchain/BlockchainEvidencePage').then((m) => ({ default: m.BlockchainEvidencePage })), 'BlockchainEvidencePage');
const CaseTriagePage = lazyWithRetry(() => import('./features/triage/CaseTriagePage').then((m) => ({ default: m.CaseTriagePage })), 'CaseTriagePage');

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
          <ErrorBoundary>
            <React.Suspense fallback={LazyRouteFallback}>
              <Routes>
              {/* Public Auth & Ultra-Low Bandwidth Thana Lite Mode */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/lite" element={<LightweightDashboard />} />

              {/* Citizen Sentinel - Public Crime Reporting (No Auth Required) */}
              <Route path="/citizen" element={<CitizenReportingPage />} />
              <Route path="/citizen/track" element={<TrackReportPage />} />
              <Route path="/report" element={<Navigate to="/citizen" replace />} />
              <Route path="/track" element={<Navigate to="/citizen/track" replace />} />

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
                <Route path="/map-intelligence" element={<Navigate to="/map" replace />} />
                <Route path="/live-tracking" element={<LiveTrackingPage />} />
                <Route path="/tracking" element={<Navigate to="/live-tracking" replace />} />
                {/* Core Tactical & Intelligence Modules */}
                <Route path="/live-tracking" element={<LiveTrackingPage />} />
                <Route path="/tracking" element={<Navigate to="/live-tracking" replace />} />
                <Route path="/gps" element={<Navigate to="/live-tracking" replace />} />
                <Route path="/escape-demo" element={<EscapeSimulationPage />} />
                <Route path="/escape" element={<Navigate to="/escape-demo" replace />} />
                <Route path="/pursuit" element={<Navigate to="/escape-demo" replace />} />
                <Route path="/simulation" element={<Navigate to="/escape-demo" replace />} />
                <Route path="/drone" element={<Navigate to="/escape-demo" replace />} />
                <Route path="/digital-footprint" element={<DigitalFootprintPage />} />
                <Route path="/footprint" element={<Navigate to="/digital-footprint" replace />} />
                <Route path="/data-lake" element={<Navigate to="/digital-footprint" replace />} />
                <Route path="/datalake" element={<Navigate to="/digital-footprint" replace />} />
                <Route path="/iot" element={<Navigate to="/digital-footprint" replace />} />
                <Route path="/forensics" element={<Navigate to="/live-tracking?tab=forensics" replace />} />
                <Route path="/dossier" element={<Navigate to="/reports" replace />} />
                <Route path="/dossiers" element={<Navigate to="/reports" replace />} />
                <Route path="/court" element={<Navigate to="/reports" replace />} />
                <Route path="/evidence-vault" element={<Navigate to="/evidence" replace />} />
                <Route path="/intel" element={<Navigate to="/dashboard" replace />} />
                <Route path="/status" element={<Navigate to="/dashboard" replace />} />
                <Route path="/health" element={<Navigate to="/dashboard" replace />} />
                <Route path="/most-wanted" element={<MostWantedPage />} />
                <Route path="/wanted" element={<Navigate to="/most-wanted" replace />} />
                <Route path="/fugitives" element={<Navigate to="/most-wanted" replace />} />
                <Route path="/watchlist" element={<Navigate to="/most-wanted" replace />} />
                <Route path="/drafting" element={<DraftingPage />} />
                <Route path="/remand" element={<Navigate to="/drafting" replace />} />
                <Route path="/chargesheet" element={<Navigate to="/drafting" replace />} />
                <Route path="/legal" element={<Navigate to="/drafting" replace />} />
                <Route path="/ai-assistant" element={<AIAssistantPage />} />
                <Route path="/assistant" element={<Navigate to="/ai-assistant" replace />} />
                <Route path="/copilot" element={<Navigate to="/ai-assistant" replace />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
                <Route path="/audit-trail" element={<Navigate to="/audit-logs" replace />} />
                <Route path="/design-system" element={<DesignSystemPage />} />
                <Route path="/tokens" element={<Navigate to="/design-system" replace />} />
                <Route path="/palette" element={<Navigate to="/design-system" replace />} />
                <Route path="/roadmap" element={<TechnicalRoadmapPage />} />
                <Route path="/technical-specs" element={<Navigate to="/roadmap" replace />} />
                <Route path="/improvements" element={<Navigate to="/roadmap" replace />} />
                <Route path="/audit" element={<Navigate to="/roadmap" replace />} />
                <Route path="/specs" element={<Navigate to="/roadmap" replace />} />
                <Route path="/100-specs" element={<Navigate to="/roadmap" replace />} />
                <Route path="/railway-verification" element={<RailwayVerificationPage />} />
                <Route path="/railway" element={<Navigate to="/railway-verification" replace />} />
                <Route path="/tc-verification" element={<Navigate to="/railway-verification" replace />} />
                <Route path="/aadhaar" element={<Navigate to="/railway-verification" replace />} />
                <Route path="/cctns" element={<Navigate to="/railway-verification" replace />} />
                <Route path="/guardian-trace" element={<GuardianTracePage />} />
                <Route path="/guardian" element={<Navigate to="/guardian-trace" replace />} />
                <Route path="/missing-persons" element={<Navigate to="/guardian-trace" replace />} />
                <Route path="/missing" element={<Navigate to="/guardian-trace" replace />} />
                <Route path="/rescue" element={<Navigate to="/guardian-trace" replace />} />
                <Route path="/sar" element={<Navigate to="/guardian-trace" replace />} />
                <Route path="/amber-alert" element={<Navigate to="/guardian-trace" replace />} />
                <Route path="/omnitrace" element={<Navigate to="/guardian-trace" replace />} />
                <Route path="/satellite" element={<Navigate to="/guardian-trace" replace />} />
                <Route path="/police-reports" element={<PublicReportsQueue />} />
                <Route path="/citizen-reports" element={<Navigate to="/police-reports" replace />} />
                <Route path="/public-reports" element={<Navigate to="/police-reports" replace />} />
                <Route path="/citizen-queue" element={<Navigate to="/police-reports" replace />} />
                <Route path="/fir-archive" element={<FIRArchivePage />} />
                <Route path="/archive" element={<Navigate to="/fir-archive" replace />} />
                <Route path="/firarchive" element={<Navigate to="/fir-archive" replace />} />

                {/* 20 International Police Intelligence & Analytics Features */}
                <Route path="/intelligence-fusion" element={<IntelligenceFusionPage />} />
                <Route path="/risk-scoring" element={<PersonRiskPage />} />
                <Route path="/hotspot-forecast" element={<HotspotForecastPage />} />
                <Route path="/sna-gangs" element={<SNAGangsPage />} />
                <Route path="/rtcc" element={<RTCCDashboard />} />
                <Route path="/route-analysis" element={<RouteAnalysisPage />} />
                <Route path="/near-repeat" element={<NearRepeatAlertsPage />} />
                <Route path="/forensics-db" element={<ForensicDBPage />} />
                <Route path="/interpol-sync" element={<InterpolSyncPage />} />
                <Route path="/sar-analytics" element={<SARAnalyticsPage />} />
                <Route path="/threat-assessment" element={<ThreatAssessmentPage />} />
                <Route path="/osint-monitor" element={<OSINTMonitorPage />} />
                <Route path="/imsi-catcher" element={<IMSICatcherPage />} />
                <Route path="/gun-intelligence" element={<GunIntelligencePage />} />
                <Route path="/ibis" element={<IBISPage />} />
                <Route path="/ibis-ballistics" element={<Navigate to="/ibis" replace />} />
                <Route path="/ballistics" element={<Navigate to="/ibis" replace />} />
                <Route path="/dv-risk" element={<DVRiskPage />} />
                <Route path="/intercept-translate" element={<InterceptTranslatePage />} />
                <Route path="/geofence" element={<GeofencePage />} />
                <Route path="/blockchain-evidence" element={<BlockchainEvidencePage />} />
                <Route path="/case-triage" element={<CaseTriagePage />} />
                <Route path="/about" element={<AboutPlatformPage />} />
                <Route path="/benchmarks" element={<Navigate to="/about" replace />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/preferences" element={<Navigate to="/settings" replace />} />
                <Route path="/profile" element={<Navigate to="/settings" replace />} />
                <Route path="/investigations" element={<Navigate to="/cases" replace />} />
                <Route path="/firs" element={<Navigate to="/cases" replace />} />
                <Route path="/fir" element={<Navigate to="/cases" replace />} />

                {/* Tactical Crime, Cyber, Surveillance & Intelligence Route Aliases */}
                <Route path="/surveillance" element={<Navigate to="/live-tracking" replace />} />
                <Route path="/cctv" element={<Navigate to="/live-tracking" replace />} />
                <Route path="/anpr" element={<Navigate to="/live-tracking" replace />} />
                <Route path="/fastag" element={<Navigate to="/live-tracking" replace />} />
                <Route path="/radar" element={<Navigate to="/live-tracking" replace />} />
                <Route path="/telecom" element={<Navigate to="/live-tracking" replace />} />
                <Route path="/cdr" element={<Navigate to="/live-tracking" replace />} />
                <Route path="/tower-dump" element={<Navigate to="/live-tracking" replace />} />
                <Route path="/alerts" element={<Navigate to="/dashboard" replace />} />
                <Route path="/tripwires" element={<Navigate to="/dashboard" replace />} />
                <Route path="/notifications" element={<Navigate to="/dashboard" replace />} />
                <Route path="/command-center" element={<Navigate to="/dashboard" replace />} />
                <Route path="/command" element={<Navigate to="/dashboard" replace />} />
                <Route path="/hq" element={<Navigate to="/dashboard" replace />} />
                <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
                <Route path="/cyber" element={<Navigate to="/dashboard" replace />} />
                <Route path="/cybercrime" element={<Navigate to="/dashboard" replace />} />
                <Route path="/financial" element={<Navigate to="/dashboard" replace />} />
                <Route path="/smurfing" element={<Navigate to="/dashboard" replace />} />
                <Route path="/mules" element={<Navigate to="/dashboard" replace />} />
                <Route path="/crypto" element={<Navigate to="/dashboard" replace />} />
                <Route path="/quantum" element={<Navigate to="/escape-demo" replace />} />
                <Route path="/qaoa" element={<Navigate to="/escape-demo" replace />} />
                <Route path="/interception" element={<Navigate to="/escape-demo" replace />} />
                <Route path="/pursuit-demo" element={<Navigate to="/escape-demo" replace />} />
                <Route path="/warrants" element={<Navigate to="/drafting" replace />} />
                <Route path="/custody" element={<Navigate to="/drafting" replace />} />
                <Route path="/remand-calendar" element={<Navigate to="/drafting" replace />} />
                <Route path="/bail" element={<Navigate to="/drafting" replace />} />
                <Route path="/court-submission" element={<Navigate to="/drafting" replace />} />
                <Route path="/statutory-rules" element={<Navigate to="/drafting" replace />} />
                <Route path="/rules" element={<Navigate to="/drafting" replace />} />
                <Route path="/bsa" element={<Navigate to="/drafting" replace />} />
                <Route path="/bns" element={<Navigate to="/drafting" replace />} />
                <Route path="/bnss" element={<Navigate to="/drafting" replace />} />
                <Route path="/pmla" element={<Navigate to="/drafting" replace />} />
                <Route path="/uapa" element={<Navigate to="/drafting" replace />} />
                <Route path="/topology" element={<Navigate to="/network-graph" replace />} />
                <Route path="/graph-analysis" element={<Navigate to="/network-graph" replace />} />
                <Route path="/link-prediction" element={<Navigate to="/network-graph" replace />} />
                <Route path="/syndicate-tree" element={<Navigate to="/network-graph" replace />} />
                <Route path="/spatial" element={<Navigate to="/map" replace />} />
                <Route path="/gis" element={<Navigate to="/map" replace />} />
                <Route path="/satellite-trace" element={<Navigate to="/map" replace />} />
                <Route path="/hotspots" element={<Navigate to="/map" replace />} />
                <Route path="/missing-child" element={<Navigate to="/guardian-trace" replace />} />
                <Route path="/amber" element={<Navigate to="/guardian-trace" replace />} />
                <Route path="/search-rescue" element={<Navigate to="/guardian-trace" replace />} />
                <Route path="/cctv-stream" element={<Navigate to="/guardian-trace" replace />} />
                <Route path="/face-recognition" element={<Navigate to="/guardian-trace" replace />} />
                <Route path="/biometrics" element={<Navigate to="/guardian-trace" replace />} />
                <Route path="/citizen-portal" element={<Navigate to="/citizen" replace />} />
                <Route path="/file-report" element={<Navigate to="/citizen" replace />} />
                <Route path="/public-portal" element={<Navigate to="/citizen" replace />} />
                <Route path="/lodge-fir" element={<Navigate to="/citizen" replace />} />
                <Route path="/check-status" element={<Navigate to="/citizen/track" replace />} />
                <Route path="/report-status" element={<Navigate to="/citizen/track" replace />} />
                <Route path="/track-fir" element={<Navigate to="/citizen/track" replace />} />
                <Route path="/review-queue" element={<Navigate to="/police-reports" replace />} />
                <Route path="/intake-queue" element={<Navigate to="/police-reports" replace />} />
                <Route path="/triage" element={<Navigate to="/police-reports" replace />} />
                <Route path="/fir-records" element={<Navigate to="/fir-archive" replace />} />
                <Route path="/crime-records" element={<Navigate to="/fir-archive" replace />} />
                <Route path="/historical-firs" element={<Navigate to="/fir-archive" replace />} />
                <Route path="/export" element={<Navigate to="/reports" replace />} />
                <Route path="/dossier-download" element={<Navigate to="/reports" replace />} />
                <Route path="/pdf" element={<Navigate to="/reports" replace />} />
                <Route path="/system-status" element={<Navigate to="/about" replace />} />
                <Route path="/metrics" element={<Navigate to="/about" replace />} />
                <Route path="/observability" element={<Navigate to="/about" replace />} />
                <Route path="/uptime" element={<Navigate to="/about" replace />} />
                <Route path="/user-guide" element={<Navigate to="/about" replace />} />
                <Route path="/documentation" element={<Navigate to="/about" replace />} />
                <Route path="/help" element={<Navigate to="/about" replace />} />
                <Route path="/faq" element={<Navigate to="/about" replace />} />
                <Route path="/lightweight" element={<Navigate to="/lite" replace />} />
                <Route path="/lite-mode" element={<Navigate to="/lite" replace />} />
                <Route path="/2g" element={<Navigate to="/lite" replace />} />
                <Route path="/account" element={<Navigate to="/settings" replace />} />
                <Route path="/passwords" element={<Navigate to="/settings" replace />} />
                <Route path="/api-keys" element={<Navigate to="/settings" replace />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </React.Suspense>
        </ErrorBoundary>
      </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
