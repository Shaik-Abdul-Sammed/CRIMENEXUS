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
} from 'lucide-react';
import { useInvestigationDetail, useCaseEvidence, useEntities, useNetworkGraph } from '../../hooks/useIntelligenceApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { getStatusBadgeClass, getRiskColorClass } from '../../utils/formatters';
import { VisualCaseTimeline } from '../../components/cases/VisualCaseTimeline';
import { WitnessSummarizerModal } from '../../components/cases/WitnessSummarizerModal';

export function CaseDetailPage() {
  const { id = 'case-101' } = useParams<{ id: string }>();
  const { data: caseDetail, isLoading } = useInvestigationDetail(id);
  const { data: evidence } = useCaseEvidence(id);
  const { data: entities } = useEntities(id);
  const { data: network } = useNetworkGraph(id);

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TIMELINE' | 'EVIDENCE' | 'ENTITIES' | 'GRAPH'>('OVERVIEW');
  const [downloadingBundle, setDownloadingBundle] = useState(false);

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
        <Card className="p-8 text-center space-y-4">
          <Network className="h-12 w-12 text-primary mx-auto" />
          <h3 className="font-bold text-base text-foreground">Interactive Cytoscape Topology</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            View full graph visualization with node positioning, relationship edge inspection, and neighbor expansion in the main Hero workspace.
          </p>
          <Link to="/network-graph">
            <Button icon={<Network className="h-4 w-4" />}>Open Full Network Canvas</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
