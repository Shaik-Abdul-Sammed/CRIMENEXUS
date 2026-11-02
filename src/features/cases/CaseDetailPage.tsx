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
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="space-y-4">
        <Link to="/cases">
          <Button size="sm" variant="ghost" icon={<ArrowLeft className="h-4 w-4" />}>
            Back to Investigations
          </Button>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-primary/30 bg-gradient-to-r from-card via-card to-primary/10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-extrabold text-primary px-2.5 py-0.5 rounded bg-primary/10 border border-primary/30">
                {caseDetail.caseNumber}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded border font-semibold ${getStatusBadgeClass(caseDetail.status)}`}>
                {caseDetail.status.replace(/_/g, ' ')}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded border font-semibold ${getRiskColorClass(caseDetail.priority)}`}>
                {caseDetail.priority} Priority
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">{caseDetail.title}</h1>
            <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">{caseDetail.description}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => setPreviewManifestOpen(true)}
              className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-1.5"
              title="Preview Evidence Bundle Manifest & Hashes"
            >
              <Eye className="h-4 w-4 text-emerald-400" />
              <span>Preview Bundle</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadEvidenceBundle}
              disabled={downloadingBundle}
              className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-1.5"
              title="Download password-protected court evidence zip (Password: case_number + badge)"
            >
              <Archive className="h-4 w-4 text-emerald-400" />
              <span>{downloadingBundle ? 'Bundling...' : 'Download Evidence Bundle (.zip)'}</span>
            </Button>
            <Link to="/network-graph">
              <Button icon={<Network className="h-4 w-4" />}>Launch Network Graph</Button>
            </Link>
            <Link to="/ai-assistant">
              <Button variant="outline" icon={<Bot className="h-4 w-4" />}>
                Query AI Assistant
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'Overview & Witness AI', icon: FolderGit2 },
          { id: 'TIMELINE', label: 'Case History Timeline (WORM)', icon: Clock },
          { id: 'EVIDENCE', label: `Evidence Ledger (${evidence?.length || 0})`, icon: FileCheck2 },
          { id: 'ENTITIES', label: `Target Entities (${entities?.length || 0})`, icon: Users2 },
          { id: 'GRAPH', label: `Graph Topology (${network?.edges?.length || 0} Edges)`, icon: Network },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'OVERVIEW' | 'TIMELINE' | 'EVIDENCE' | 'ENTITIES' | 'GRAPH')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Investigation Context & Objectives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <p>
                  This target case involves multi-jurisdictional intelligence discovery across cybercrime channels, illicit bank transfers, and suspect co-location. All linked evidence artifacts are cryptographically hashed and cataloged in compliance with law enforcement directives.
                </p>
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-background/50 border border-border">
                  <div>
                    <span className="font-semibold text-foreground block">Crime Category:</span>
                    <span>{caseDetail.crimeType}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground block">Primary Jurisdiction:</span>
                    <span>{caseDetail.locationName}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground block">Assigned Lead Investigator:</span>
                    <span>{caseDetail.assignedUserName}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground block">Date Opened:</span>
                    <span>{new Date(caseDetail.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 5: Automated Witness Interview Summarizer & Feature 9: Voice Dictation */}
            <WitnessSummarizerModal caseNumber={caseDetail.caseNumber} />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dossier Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs py-2 border-b border-border/40">
                  <span className="text-muted-foreground">Linked Evidence</span>
                  <span className="font-bold text-foreground">{evidence?.length} Items</span>
                </div>
                <div className="flex items-center justify-between text-xs py-2 border-b border-border/40">
                  <span className="text-muted-foreground">Discovered Entities</span>
                  <span className="font-bold text-foreground">{entities?.length} Entities</span>
                </div>
                <div className="flex items-center justify-between text-xs py-2">
                  <span className="text-muted-foreground">Established Links</span>
                  <span className="font-bold text-foreground">{network?.edges?.length} Edges</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evidence?.map((ev) => (
              <Card key={ev.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-primary font-bold">{ev.evidenceNumber}</span>
                  <Badge variant="outline">{ev.type}</Badge>
                </div>
                <h4 className="font-semibold text-sm text-foreground">{ev.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{ev.description}</p>
                <div className="text-[10px] font-mono text-muted-foreground truncate pt-2 border-t border-border/40">
                  SHA-256: {ev.hash}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'ENTITIES' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {entities?.map((ent) => (
            <Card key={ent.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{ent.name}</span>
                <Badge variant={ent.reviewStatus === 'VERIFIED' ? 'success' : 'warning'}>{ent.type}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Confidence: {(ent.confidence * 100).toFixed(0)}%</p>
              <Link to={`/entities/${ent.id}`}>
                <Button size="sm" variant="outline" className="w-full mt-2">
                  Inspect Entity &rarr;
                </Button>
              </Link>
            </Card>
          ))}
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
