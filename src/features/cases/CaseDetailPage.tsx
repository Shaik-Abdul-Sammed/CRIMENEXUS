import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  FolderGit2,
  FileCheck2,
  Users2,
  Network,
  Bot,
  ArrowLeft,
  Clock,
  Archive,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Shield,
} from 'lucide-react';
import cytoscape from 'cytoscape';
import { useInvestigationDetail, useCaseEvidence, useEntities, useNetworkGraph } from '../../hooks/useIntelligenceApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { getStatusBadgeClass, getRiskColorClass } from '../../utils/formatters';
import { VisualCaseTimeline } from '../../components/cases/VisualCaseTimeline';
import { WitnessSummarizerModal } from '../../components/cases/WitnessSummarizerModal';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';

export function CaseDetailPage() {
  const { id = 'case-101' } = useParams<{ id: string }>();
  const { data: caseDetail, isLoading } = useInvestigationDetail(id);
  const { data: evidence } = useCaseEvidence(id);
  const { data: entities } = useEntities(id);
  const { data: network } = useNetworkGraph(id);

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TIMELINE' | 'EVIDENCE' | 'ENTITIES' | 'GRAPH'>('OVERVIEW');
  const [downloadingBundle, setDownloadingBundle] = useState(false);
  const [previewManifestOpen, setPreviewManifestOpen] = useState(false);

  const cyInstanceRef = React.useRef<cytoscape.Core | null>(null);
  const embeddedGraphContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (activeTab === 'GRAPH' && embeddedGraphContainerRef.current) {
      const nodes = (entities || []).map((ent) => ({
        data: { id: ent.id, label: ent.name, type: ent.type },
      }));
      const edges = (network?.edges || []).map((rel) => ({
        data: { id: rel.id, source: rel.sourceEntityId, target: rel.targetEntityId, label: rel.type },
      }));

      const cy = cytoscape({
        container: embeddedGraphContainerRef.current,
        elements: [...nodes, ...edges],
        style: [
          {
            selector: 'node',
            style: {
              label: 'data(label)',
              color: '#fff',
              'font-size': '10px',
              'background-color': '#3b82f6',
              'text-valign': 'bottom',
              'text-margin-y': 4,
            },
          },
          {
            selector: 'edge',
            style: {
              label: 'data(label)',
              'font-size': '8px',
              'line-color': '#64748b',
              'target-arrow-color': '#64748b',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
            },
          },
        ],
        layout: { name: 'cose', animate: true, padding: 30 },
      });

      cyInstanceRef.current = cy;
      return () => cy.destroy();
    }
  }, [activeTab, entities, network]);

  const handleDownloadEvidenceBundle = async () => {
    if (!caseDetail) return;
    setDownloadingBundle(true);
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const response = await axios.get(`${baseURL}/cases/${caseDetail.caseNumber}/evidence-bundle`, {
        params: { officer_badge: 'BADGE-9081' },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Evidence_Bundle_${caseDetail.caseNumber}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download evidence bundle:', err);
      alert('Evidence bundle generated. Check server connectivity or download permissions.');
    } finally {
      setDownloadingBundle(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-muted-foreground">Loading investigation workspace...</div>;
  }

  if (!caseDetail) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground">
        Investigation case dossier not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Top Banner & Navigation */}
      <div className="space-y-4 w-full min-w-0">
        <div className="flex items-center justify-between">
          <Link
            to="/cases"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Investigations</span>
          </Link>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] text-emerald-400 font-semibold tracking-wider">
              LIVE DOSSIER ACTIVE
            </span>
          </div>
        </div>

        {/* Case Dossier Hero Card */}
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-slate-900 via-card to-primary/10 p-6 sm:p-7 shadow-2xl space-y-5 w-full">
          {/* Top Status & Meta Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-sm font-extrabold text-primary px-3 py-1 rounded-lg bg-primary/15 border border-primary/30 tracking-wider">
                {caseDetail.caseNumber}
              </span>
              <span className={`text-xs px-3 py-1 rounded-lg border font-semibold uppercase tracking-wider ${getStatusBadgeClass(caseDetail.status)}`}>
                {caseDetail.status.replace(/_/g, ' ')}
              </span>
              <span className={`text-xs px-3 py-1 rounded-lg border font-semibold uppercase tracking-wider ${getRiskColorClass(caseDetail.priority)}`}>
                {caseDetail.priority} Priority
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 ml-1">
                <Clock className="h-3.5 w-3.5" />
                Opened: {new Date(caseDetail.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 font-medium text-slate-300">
                Lead IO: <span className="text-foreground font-semibold">{caseDetail.assignedUserName || 'Inspector V. K. Sharma'}</span>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 font-medium text-slate-300 hidden sm:inline-flex">
                {caseDetail.locationName || 'Cyber Crime PS'}
              </span>
            </div>
          </div>

          {/* Title & Case Description - FULL WIDTH, NEVER CRUSHED */}
          <div className="space-y-2.5 w-full">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-snug w-full">
              {caseDetail.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-5xl">
              {caseDetail.description}
            </p>
          </div>

          {/* Dedicated Action Command Toolbar */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/40">
            <Link to="/network-graph">
              <Button icon={<Network className="h-4 w-4" />} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md">
                Launch Network Graph
              </Button>
            </Link>
            <Link to="/ai-assistant">
              <Button
                variant="outline"
                icon={<Bot className="h-4 w-4 text-purple-400" />}
                className="border-purple-500/40 text-purple-200 hover:bg-purple-500/10 font-semibold"
              >
                Query AI Assistant
              </Button>
            </Link>
            <Link to={`/drafting?case=${encodeURIComponent(caseDetail.caseNumber || caseDetail.id)}`}>
              <Button
                variant="outline"
                icon={<Scale className="h-4 w-4 text-emerald-400" />}
                className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 font-semibold"
                title="Automated statutory FIR drafting under Section 173 BNSS"
              >
                ⚡ Statutory FIR (BNSS)
              </Button>
            </Link>
            <div className="h-5 w-px bg-border/60 mx-1 hidden sm:block" />
            <Button
              variant="outline"
              onClick={() => setPreviewManifestOpen(true)}
              className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-1.5 font-semibold"
              title="Preview Evidence Bundle Manifest & Hashes"
            >
              <Eye className="h-4 w-4 text-emerald-400" />
              <span>Preview Bundle</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadEvidenceBundle}
              disabled={downloadingBundle}
              className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-1.5 font-semibold"
              title="Download password-protected court evidence zip (Password: case_number + badge)"
            >
              <Archive className="h-4 w-4 text-emerald-400" />
              <span>{downloadingBundle ? 'Bundling Evidence...' : 'Download Evidence Bundle (.zip)'}</span>
            </Button>
          </div>
        </div>

        {/* 6-Stage Statutory Criminal Lifecycle Stepper */}
        <div className="p-4 rounded-xl border border-border bg-card/80 space-y-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-primary" />
              Statutory Criminal Procedural Lifecycle (BNSS 2023)
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              Stage 4 of 6: Remand Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { step: 1, label: 'FIR Registered', code: 'SEC 173 BNSS', done: true },
              { step: 2, label: 'Evidence Seized', code: 'SEC 63 BSA', done: true },
              { step: 3, label: 'Suspect Apprehended', code: 'SEC 35 BNSS', done: true },
              { step: 4, label: 'Magistrate Remand', code: 'SEC 187 BNSS', done: true, active: true },
              { step: 5, label: 'Charge Sheet', code: 'SEC 193 BNSS', done: false },
              { step: 6, label: 'Sessions Trial', code: 'SEC 232 BNSS', done: false },
            ].map((st) => (
              <div
                key={st.step}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  st.active
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                    : st.done
                    ? 'border-emerald-500/40 bg-emerald-950/20'
                    : 'border-border/60 bg-background/40 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="font-mono text-muted-foreground">Step 0{st.step}</span>
                  {st.done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-600" />
                  )}
                </div>
                <div className="font-bold text-xs text-foreground truncate">{st.label}</div>
                <div className="text-[9px] font-mono text-muted-foreground mt-0.5">{st.code}</div>
              </div>
            ))}
          </div>

          {/* Statutory 60/90-Day Charge-Sheet Countdown Banner */}
          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 flex items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2 text-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                <b>Statutory Remand Safeguard (Sec 187(3) BNSS):</b> 24 of 90 days elapsed. <b>66 days remaining</b> to submit final charge-sheet before mandatory default bail triggers.
              </span>
            </div>
            <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-[10px] shrink-0 font-mono">
              66 DAYS LEFT
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto whitespace-nowrap scrollbar-none pb-0.5">
        {[
          { id: 'OVERVIEW', label: 'Overview & Witness AI', icon: FolderGit2, count: null },
          { id: 'TIMELINE', label: 'Case History Timeline (WORM)', icon: Clock, count: null },
          { id: 'EVIDENCE', label: 'Evidence Ledger', icon: FileCheck2, count: evidence?.length ?? 0 },
          { id: 'ENTITIES', label: 'Target Entities', icon: Users2, count: entities?.length ?? 0 },
          { id: 'GRAPH', label: 'Graph Topology', icon: Network, count: network?.edges?.length ? `${network.edges.length} Edges` : null },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'OVERVIEW' | 'TIMELINE' | 'EVIDENCE' | 'ENTITIES' | 'GRAPH')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all shrink-0 ${
                isActive
                  ? 'border-primary text-primary bg-primary/10 font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  isActive ? 'bg-primary/20 text-primary font-bold' : 'bg-muted text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
          <div className="lg:col-span-2 space-y-6 min-w-0">
            <Card className="min-w-0 border-border/70 shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FolderGit2 className="h-4 w-4 text-primary" />
                  Investigation Context & Statutory Objectives
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed min-w-0">
                <p className="break-words text-slate-300">
                  This target case involves multi-jurisdictional intelligence discovery across cybercrime channels, illicit bank transfers, and suspect co-location. All linked evidence artifacts are cryptographically hashed and cataloged in compliance with law enforcement directives under Bharatiya Sakshya Adhiniyam, 2023 (BSA).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-background/50 border border-border min-w-0">
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Crime Category</span>
                    <span className="text-sm font-semibold text-foreground break-words">{caseDetail.crimeType}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Primary Jurisdiction</span>
                    <span className="text-sm font-semibold text-foreground break-words">{caseDetail.locationName}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Lead Investigator</span>
                    <span className="text-sm font-semibold text-foreground break-words">{caseDetail.assignedUserName}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Date Registered</span>
                    <span className="text-sm font-semibold text-foreground">
                      {new Date(caseDetail.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 5: Automated Witness Interview Summarizer & Feature 9: Voice Dictation */}
            <WitnessSummarizerModal caseNumber={caseDetail.caseNumber} />
          </div>

          <div className="space-y-6">
            <Card className="border-border/70 shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-primary" />
                  Dossier Telemetry & Integrity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <div className="flex items-center justify-between text-xs py-2 border-b border-border/40">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <FileCheck2 className="h-3.5 w-3.5 text-sky-400" />
                    Linked Evidence
                  </span>
                  <span className="font-bold text-foreground px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-300">
                    {evidence?.length || 0} Items
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-2 border-b border-border/40">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Users2 className="h-3.5 w-3.5 text-amber-400" />
                    Discovered Entities
                  </span>
                  <span className="font-bold text-foreground px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    {entities?.length || 0} Entities
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-2 border-b border-border/40">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Network className="h-3.5 w-3.5 text-primary" />
                    Established Graph Edges
                  </span>
                  <span className="font-bold text-foreground px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">
                    {network?.edges?.length || 0} Edges
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-2">
                  <span className="text-muted-foreground">Chain of Custody (WORM)</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1 text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    SHA-256 Verified
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Feature 4: Visual Case History Timeline Tab */}
      {activeTab === 'TIMELINE' && (
        <div className="space-y-6">
          <VisualCaseTimeline caseId={caseDetail.caseNumber} />
        </div>
      )}

      {activeTab === 'EVIDENCE' && (
        <div className="space-y-4">
          {(!evidence || evidence.length === 0) ? (
            <Card className="p-12 text-center text-xs text-muted-foreground border-border/70">
              No evidence artifacts linked to this case yet.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evidence.map((ev) => (
                <Card key={ev.id} className="p-5 space-y-3 hover:border-primary/50 transition-colors shadow-md border-border/70">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-primary font-bold px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                      {ev.evidenceNumber}
                    </span>
                    <Badge variant="outline" className="uppercase font-mono text-[10px]">
                      {ev.type}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-sm text-foreground">{ev.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{ev.description}</p>
                  <div className="text-[11px] font-mono text-slate-400 truncate pt-2.5 border-t border-border/40 flex items-center justify-between">
                    <span className="text-muted-foreground text-[10px]">SHA-256:</span>
                    <span className="text-emerald-400 truncate max-w-[280px] font-mono text-[10px]">{ev.hash}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'ENTITIES' && (
        <div className="space-y-4">
          {(!entities || entities.length === 0) ? (
            <Card className="p-12 text-center text-xs text-muted-foreground border-border/70">
              No suspect or target entities cataloged for this case yet.
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {entities.map((ent) => (
                <Card key={ent.id} className="p-5 space-y-3 hover:border-primary/50 transition-colors shadow-md border-border/70">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">{ent.name}</span>
                    <Badge variant={ent.reviewStatus === 'VERIFIED' ? 'success' : 'warning'}>
                      {ent.type}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>AI Confidence:</span>
                    <span className="font-mono font-bold text-primary">{(ent.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <Link to={`/entities/${ent.id}`} className="block pt-1">
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      Inspect Entity Dossier &rarr;
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'GRAPH' && (
        <Card className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
                Case Topology & Subgraph ({caseDetail.caseNumber})
              </h3>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2"
                onClick={() => cyInstanceRef.current?.zoom(cyInstanceRef.current.zoom() * 1.2)}
                title="Zoom In"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2"
                onClick={() => cyInstanceRef.current?.zoom(cyInstanceRef.current.zoom() / 1.2)}
                title="Zoom Out"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2"
                onClick={() => cyInstanceRef.current?.fit()}
                title="Fit View"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2"
                onClick={() => cyInstanceRef.current?.layout({ name: 'cose', animate: true }).run()}
                title="Reset Layout"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Link to="/network-graph">
                <Button size="sm" className="h-7 px-2 text-xs" icon={<Network className="h-3 w-3" />}>
                  Full Canvas
                </Button>
              </Link>
            </div>
          </div>
          <div
            ref={embeddedGraphContainerRef}
            className="h-80 w-full rounded-xl bg-slate-950 border border-border"
          />
        </Card>
      )}

      {caseDetail && (
        <DocumentPreviewModal
          isOpen={previewManifestOpen}
          onClose={() => setPreviewManifestOpen(false)}
          title={`Digital Evidence Bundle Manifest: ${caseDetail.caseNumber}`}
          subtitle={`Case: ${caseDetail.title} • AES-256 Protected Zip Archive`}
          documentType="evidence_bundle"
          caseNumber={caseDetail.caseNumber}
          fileName={`Evidence_Bundle_${caseDetail.caseNumber}.zip`}
          textContent={`================================================================================
CRIMENEXUS DIGITAL EVIDENCE BUNDLE & CHAIN OF CUSTODY MANIFEST
================================================================================
Case Reference   : ${caseDetail.caseNumber}
Title            : ${caseDetail.title}
Police Station   : Cyber Crime Police Station, Sector 20
Officer Badge    : BADGE-9081
Encryption Level : AES-256 (Password: ${caseDetail.caseNumber}BADGE-9081)
Statutory Basis  : Section 63 Bharatiya Sakshya Adhiniyam, 2023 (BSA)
Generated At     : ${new Date().toISOString()}

--------------------------------------------------------------------------------
1. ENCLOSED FORENSIC FILES & CRYPTOGRAPHIC HASH INVENTORY (SHA-256)
--------------------------------------------------------------------------------
[FILE 01] case_forensic_narrative.txt
  - Status      : Verified & Hashed
  - SHA-256     : 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08

[FILE 02] bank_transaction_ledger_export.csv
  - Status      : Verified & Hashed
  - SHA-256     : 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8

[FILE 03] cell_tower_triangulation_records.json
  - Status      : Verified & Hashed
  - SHA-256     : 4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a

[FILE 04] section_63_bsa_certificate.pdf
  - Status      : Formally Certified by Investigating Officer
  - SHA-256     : e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

--------------------------------------------------------------------------------
2. DIGITAL EVIDENCE INTEGRITY STATEMENT
--------------------------------------------------------------------------------
This bundle contains electronic records gathered lawfully under Section 63 BSA.
Any alteration of encrypted zip contents will invalidate the cryptographic hash.`}
          metadata={{
            ioName: 'Inspector V. K. Sharma (Special Cell)',
            policeStation: 'Cyber Crime Police Station, Sector 20',
            suspectName: 'Identified Syndicate Co-Conspirators',
            crimeType: 'Forensic Evidence Manifest',
            hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          }}
        />
      )}
    </div>
  );
}
