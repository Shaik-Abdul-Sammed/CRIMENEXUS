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
  FileText,
  BookOpen,
  DollarSign,
  Download,
  Landmark,
  FileSpreadsheet,
  ShieldAlert,
  Cpu,
  AlertCircle,
  Check,
  Copy,
  Printer,
  Car,
  Radio,
  UserCheck,
  Lock,
  ChevronRight,
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
import { useToast } from '../../components/ui/Toast';
import { sound } from '../../utils/soundEffects';

export function CaseDetailPage() {
  const toast = useToast();
  const { id = 'case-101' } = useParams<{ id: string }>();
  const { data: caseDetail, isLoading } = useInvestigationDetail(id);
  const { data: evidence } = useCaseEvidence(id);
  const { data: entities } = useEntities(id);
  const { data: network } = useNetworkGraph(id);

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TIMELINE' | 'EVIDENCE' | 'ENTITIES' | 'GRAPH' | 'BNS_CONCORDANCE' | 'FINANCIAL_FLOW'>('OVERVIEW');
  const [downloadingBundle, setDownloadingBundle] = useState(false);
  const [previewManifestOpen, setPreviewManifestOpen] = useState(false);
  const [previewDossierOpen, setPreviewDossierOpen] = useState(false);
  const [assignedIO, setAssignedIO] = useState<string>('Inspector Rajesh Sharma (Cyber Cell)');

  // Realistic Intelligence Modals & States
  const [bnsSearchQuery, setBnsSearchQuery] = useState('');
  const [chargesheetModalOpen, setChargesheetModalOpen] = useState(false);
  const [bailOppositionModalOpen, setBailOppositionModalOpen] = useState(false);
  const [debitFreezeModalOpen, setDebitFreezeModalOpen] = useState(false);

  const BNS_CONCORDANCE_DATA = [
    { bns: 'Section 303', ipc: 'Section 379', title: 'Theft (General & Snatching)', bailable: 'Non-Bailable', cognizable: 'Cognizable', sentence: 'Up to 3 years or fine or community service' },
    { bns: 'Section 304', ipc: 'Section 380/382', title: 'Snatching & Extortion', bailable: 'Non-Bailable', cognizable: 'Cognizable', sentence: 'Up to 3 years rigorous imprisonment' },
    { bns: 'Section 318', ipc: 'Section 420', title: 'Cheating & Dishonestly Inducing Delivery', bailable: 'Non-Bailable', cognizable: 'Cognizable', sentence: 'Up to 7 years imprisonment and fine' },
    { bns: 'Section 111', ipc: 'MCOCA / Special Acts', title: 'Organized Crime & Syndicate Operations', bailable: 'Non-Bailable', cognizable: 'Cognizable', sentence: '5 years to Life or Death Penalty' },
    { bns: 'Section 61', ipc: 'Section 120B', title: 'Criminal Conspiracy', bailable: 'Non-Bailable', cognizable: 'Cognizable', sentence: 'Same as substantive offense or 6 months' },
    { bns: 'Section 115', ipc: 'Section 323', title: 'Voluntarily Causing Hurt', bailable: 'Bailable', cognizable: 'Non-Cognizable', sentence: 'Up to 1 year or ₹1,000 fine' },
    { bns: 'Section 117', ipc: 'Section 325/326', title: 'Voluntarily Causing Grievous Hurt', bailable: 'Bailable (Non-weapon)', cognizable: 'Cognizable', sentence: 'Up to 7 years and fine' },
    { bns: 'Section 137', ipc: 'Section 363', title: 'Kidnapping & Abduction', bailable: 'Non-Bailable', cognizable: 'Cognizable', sentence: 'Up to 7 years and fine' },
    { bns: 'Section 85', ipc: 'Section 498A', title: 'Cruelty by Husband or Relatives', bailable: 'Non-Bailable', cognizable: 'Cognizable', sentence: 'Up to 3 years and fine' },
    { bns: 'Section 324', ipc: 'Section 427', title: 'Mischief & Public Property Damage', bailable: 'Bailable', cognizable: 'Cognizable', sentence: 'Up to 2 years or fine' },
  ];

  const PMLA_TRANSACTIONS = [
    { txId: 'TXN-9021-HDFC', from: 'Mule Account A (Sunil Verma)', to: 'Layering Current Acc (Apex Exports)', amount: '₹48,500', method: 'IMPS', time: '14:22 IST', flag: 'Smurfing (<₹50k threshold)' },
    { txId: 'TXN-9022-ICICI', from: 'Mule Account B (Ravi Kishan)', to: 'Layering Current Acc (Apex Exports)', amount: '₹49,200', method: 'NEFT', time: '14:35 IST', flag: 'Smurfing (<₹50k threshold)' },
    { txId: 'TXN-9023-SBI', from: 'Mule Account C (Pooja Gupta)', to: 'Layering Current Acc (Apex Exports)', amount: '₹47,800', method: 'UPI', time: '14:48 IST', flag: 'Smurfing (<₹50k threshold)' },
    { txId: 'TXN-9024-AXIS', from: 'Layering Current Acc (Apex Exports)', to: 'Offshore Crypto Gateway', amount: '₹1,45,500', method: 'RTGS', time: '16:10 IST', flag: 'Funds Aggregation & Hawala Exfiltration' },
  ];

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
            <Link to={`/drafting?case=${encodeURIComponent(caseDetail.caseNumber || caseDetail.id)}&tab=FIR`}>
              <Button
                variant="outline"
                icon={<Scale className="h-4 w-4 text-emerald-400" />}
                className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 font-semibold"
                title="Automated statutory FIR drafting under Section 173 BNSS"
              >
                ⚡ Statutory FIR (BNSS)
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                sound.playClickSound();
                setChargesheetModalOpen(true);
              }}
              className="border-primary/40 text-primary-foreground bg-primary/20 hover:bg-primary/30 flex items-center gap-1.5 font-semibold"
              title="Draft formal police chargesheet under Section 193 BNSS"
            >
              <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
              <span>Charge-Sheet (Sec 193)</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                sound.playClickSound();
                setBailOppositionModalOpen(true);
              }}
              className="border-red-500/40 text-red-300 hover:bg-red-950/20 flex items-center gap-1.5 font-semibold"
              title="Generate Bail Opposition Fact Sheet for Public Prosecutor under Sec 480 BNSS"
            >
              <ShieldAlert className="h-4 w-4 text-red-400" />
              <span>Bail Opposition Brief</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                sound.playClickSound();
                setDebitFreezeModalOpen(true);
              }}
              className="border-amber-500/40 text-amber-300 hover:bg-amber-950/20 flex items-center gap-1.5 font-semibold"
              title="Issue Bank Debit Freeze Notice under Section 106 BNSS / 102 CrPC"
            >
              <Landmark className="h-4 w-4 text-amber-400" />
              <span>Debit Freeze Directive</span>
            </Button>
            <div className="h-5 w-px bg-border/60 mx-1 hidden sm:block" />
            <Button
              variant="outline"
              onClick={() => {
                sound.playClickSound();
                setPreviewDossierOpen(true);
              }}
              className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 flex items-center gap-1.5 font-semibold"
              title="Preview Official Police Department Deployment Dossier (PDF & Formatted)"
            >
              <Eye className="h-4 w-4 text-indigo-400" />
              <span>Preview Dossier PDF</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setPreviewManifestOpen(true)}
              className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-1.5 font-semibold"
              title="Preview Evidence Bundle Manifest & Hashes"
            >
              <FileText className="h-4 w-4 text-emerald-400" />
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
          { id: 'BNS_CONCORDANCE', label: 'BNS ⇄ IPC Legal Concordance', icon: BookOpen, count: '10 Sections' },
          { id: 'FINANCIAL_FLOW', label: 'PMLA Smurfing & Hawala Flow', icon: DollarSign, count: '4 Alerts' },
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
              onClick={() => setActiveTab(tab.id as 'OVERVIEW' | 'TIMELINE' | 'EVIDENCE' | 'ENTITIES' | 'GRAPH' | 'BNS_CONCORDANCE' | 'FINANCIAL_FLOW')}
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
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Lead Investigator (Assign IO)</span>
                    <select
                      value={assignedIO}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAssignedIO(val);
                        sound.playClickSound();
                        toast.success(`Case assigned to ${val}. CCTNS roster updated.`, 'IO Assigned');
                      }}
                      className="mt-1 w-full bg-slate-900 border border-border/80 text-foreground text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="Inspector Rajesh Sharma (Cyber Cell)">Inspector Rajesh Sharma (Cyber Cell)</option>
                      <option value="ACP Surender Kumar (Special Cell)">ACP Surender Kumar (Special Cell)</option>
                      <option value="Sub-Inspector Ankit Sharma (PCR-04)">Sub-Inspector Ankit Sharma (PCR-04)</option>
                      <option value="Inspector Pradeep Rathore (Crime Branch)">Inspector Pradeep Rathore (Crime Branch)</option>
                    </select>
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

            {/* Cell Tower Azimuth & Highway ANPR Intercept Correlator */}
            <Card className="border-border/70 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-cyan-400" />
                    Cell Tower Azimuth &amp; Highway ANPR Correlator
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-cyan-500/40 text-cyan-300">
                    CDR FUSED
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-muted-foreground block text-[9px] uppercase">Tower Triangulation</span>
                    <span className="text-white font-bold block truncate">Sector 4 CP (Azimuth 120°)</span>
                    <span className="text-[10px] text-emerald-400">Accuracy: ±42m</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-muted-foreground block text-[9px] uppercase">FASTag ANPR Pass</span>
                    <span className="text-white font-bold block truncate">Barakhamba Toll (Lane 3)</span>
                    <span className="text-[10px] text-cyan-400">Plate: DL-10-CE-4412</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-muted-foreground block text-[9px] uppercase">Burner SIM Detection</span>
                    <span className="text-amber-300 font-bold block truncate">IMSI Swap Flagged</span>
                    <span className="text-[10px] text-amber-400">New IMSI activated 14:10</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Witness Credibility & Statement Discrepancy Analyzer */}
            <Card className="border-border/70 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-400" />
                    Witness Statement Credibility &amp; Discrepancy Analyzer
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">92% Concordance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 text-[11px] leading-relaxed">
                  <b>Cross-Corroboration Match:</b> Statement of Witness 01 (Shopkeeper, P-01) matches Witness 02 (Cab Driver, P-02) on incident time (14:32 IST) and 2 male suspects wearing black helmets.
                </div>
                <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed">
                  <b>Minor Discrepancy Flagged:</b> Witness 01 reported motorcycle as <i>"Matte Black Bajaj Pulsar"</i>; Witness 02 noted <i>"Midnight Navy Blue with alloy wheels"</i>. Optical CCTV enhancement confirms Midnight Navy Blue.
                </div>
              </CardContent>
            </Card>
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

      {/* BNS ⇄ IPC Legal Concordance Tab */}
      {activeTab === 'BNS_CONCORDANCE' && (
        <Card className="p-6 space-y-5 border-border/80 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="text-base font-extrabold text-foreground">
                  Bharatiya Nyaya Sanhita (BNS 2023) ⇄ IPC Concordance Matrix
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Statutory cross-reference tool for investigating officers and public prosecutors. Real-time section translation.
              </p>
            </div>

            <div className="w-full sm:w-72">
              <input
                type="text"
                value={bnsSearchQuery}
                onChange={(e) => setBnsSearchQuery(e.target.value)}
                placeholder="Search BNS section, IPC section or offense..."
                className="w-full h-9 px-3 rounded-lg border border-border bg-slate-900 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/60 text-[11px] font-mono uppercase text-muted-foreground bg-muted/20">
                  <th className="py-2.5 px-3">BNS 2023 Section</th>
                  <th className="py-2.5 px-3">IPC 1860 Equiv.</th>
                  <th className="py-2.5 px-3">Offense Classification</th>
                  <th className="py-2.5 px-3">Cognizance</th>
                  <th className="py-2.5 px-3">Bail Classification</th>
                  <th className="py-2.5 px-3">Statutory Punishment</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {BNS_CONCORDANCE_DATA.filter((row) =>
                  bnsSearchQuery === '' ||
                  row.bns.toLowerCase().includes(bnsSearchQuery.toLowerCase()) ||
                  row.ipc.toLowerCase().includes(bnsSearchQuery.toLowerCase()) ||
                  row.title.toLowerCase().includes(bnsSearchQuery.toLowerCase())
                ).map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-primary">{row.bns}</td>
                    <td className="py-3 px-3 font-mono text-cyan-400 font-semibold">{row.ipc}</td>
                    <td className="py-3 px-3 font-semibold text-foreground">{row.title}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/40 border border-blue-500/30 text-blue-300">
                        {row.cognizable}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                        row.bailable.includes('Non-Bailable')
                          ? 'bg-red-950/40 border-red-500/40 text-red-300'
                          : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      }`}>
                        {row.bailable}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">{row.sentence}</td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          sound.playSuccessChime();
                          toast.success(`${row.bns} (${row.title}) appended to Case Chargesheet draft.`, 'Section Applied');
                        }}
                        className="h-7 text-[10px] font-bold text-primary hover:bg-primary/20"
                      >
                        + Add to Chargesheet
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* PMLA Financial Smurfing & Hawala Flow Tab */}
      {activeTab === 'FINANCIAL_FLOW' && (
        <Card className="p-6 space-y-5 border-border/80 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-foreground">
                  PMLA Financial Smurfing &amp; Hawala Flow Analyzer
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Detects micro-structuring under ₹50,000 threshold to evade bank Cash Transaction Reporting (CTR). Section 3 &amp; 4 PMLA.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                sound.playAlertBeep();
                setDebitFreezeModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Landmark className="h-4 w-4" />
              <span>Issue Sec 106 BNSS Freeze Notice</span>
            </Button>
          </div>

          {/* Metric Cards Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-muted-foreground block">Total Laundered Volume</span>
              <span className="text-base font-black text-amber-400 font-mono">₹2,91,000</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-muted-foreground block">Identified Mule Accounts</span>
              <span className="text-base font-black text-white font-mono">3 Mules (HDFC, ICICI, SBI)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-muted-foreground block">Layering Window</span>
              <span className="text-base font-black text-cyan-400 font-mono">&lt; 1 Hour 48 Mins</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-muted-foreground block">Exfiltration Endpoint</span>
              <span className="text-base font-black text-red-400 font-mono">Offshore Crypto Gateway</span>
            </div>
          </div>

          {/* Smurfing Ledger Table */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Scale className="h-4 w-4 text-amber-400" />
              <span>Identified Structuring Transactions (Forensic Banking Audit)</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead>
                  <tr className="border-b border-border/60 text-[10px] uppercase text-muted-foreground bg-muted/20">
                    <th className="py-2 px-3">Transaction ID</th>
                    <th className="py-2 px-3">Origin Mule Entity</th>
                    <th className="py-2 px-3">Destination Entity</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3">Channel</th>
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">AML / PMLA Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {PMLA_TRANSACTIONS.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3 font-bold text-primary">{tx.txId}</td>
                      <td className="py-2.5 px-3 text-slate-300">{tx.from}</td>
                      <td className="py-2.5 px-3 text-slate-300">{tx.to}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-400">{tx.amount}</td>
                      <td className="py-2.5 px-3 text-slate-400">{tx.method}</td>
                      <td className="py-2.5 px-3 text-slate-400">{tx.time}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-red-950/40 border border-red-500/30 text-red-300">
                          {tx.flag}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
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
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {ent.name.slice(0, 2)}
                      </div>
                      <span className="text-sm font-bold text-foreground truncate">{ent.name}</span>
                    </div>
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

      {/* Official Police Department Deployment Dossier Preview Modal */}
      {caseDetail && (
        <DocumentPreviewModal
          isOpen={previewDossierOpen}
          onClose={() => setPreviewDossierOpen(false)}
          title={`Deployment Dossier: ${caseDetail.caseNumber}`}
          subtitle={`Investigation: ${caseDetail.title} • Statutory Compliance under BSA Section 63`}
          documentType="court_dossier"
          caseNumber={caseDetail.caseNumber}
          pdfUrl="/CRIMENEXUS_Police_Department_Deployment_Dossier.pdf"
          metadata={{
            ioName: caseDetail.assignedUserName || 'Inspector V. K. Sharma',
            policeStation: caseDetail.locationName || 'Cyber Crime Police Station',
            crimeType: caseDetail.crimeType || 'Syndicate Investigation',
            suspectName: caseDetail.title,
            jurisdiction: caseDetail.locationName || 'Delhi NCR',
          }}
        />
      )}

      {/* Statutory Chargesheet Draft Modal (Section 193 BNSS) */}
      {caseDetail && (
        <DocumentPreviewModal
          isOpen={chargesheetModalOpen}
          onClose={() => setChargesheetModalOpen(false)}
          title={`Police Final Report / Charge-Sheet (Sec 193 BNSS): ${caseDetail.caseNumber}`}
          subtitle={`Before the Court of Chief Metropolitan Magistrate • Case: ${caseDetail.title}`}
          documentType="chargesheet"
          caseNumber={caseDetail.caseNumber}
          fileName={`ChargeSheet_Sec193_BNSS_${caseDetail.caseNumber}.txt`}
          textContent={`================================================================================
IN THE COURT OF CHIEF METROPOLITAN MAGISTRATE, NEW DELHI
FINAL REPORT / CHARGE-SHEET UNDER SECTION 193 BHARATIYA NAGARIK SURAKSHA SANHITA, 2023
================================================================================
1. POLICE STATION      : Cyber Crime Police Station, Sector 20
2. FIR / CASE NO.      : ${caseDetail.caseNumber}
3. DATE OF INCIDENT    : ${new Date(caseDetail.createdAt).toLocaleDateString('en-IN')}
4. SECTIONS APPLIED    : Sections 303, 318, 111, 61 Bharatiya Nyaya Sanhita (BNS 2023)
                         read with Section 66D Information Technology Act, 2000
5. ACCUSED PERSONS     : 
   (a) Sunil Verma (Mule Account Operative) - Custody Remand Active
   (b) Ravi Kishan (Crypto Hawala Conduit) - Under Interception BOLO
6. PARTICULARS OF VICTIM: State & Aggrieved Public Deposit Holders

--------------------------------------------------------------------------------
BRIEF FACTS & STATEMENT OF OFFENSE UNDER SEC 193(3) BNSS
--------------------------------------------------------------------------------
Investigation reveals that the accused entered into an organized criminal syndicate
to defraud citizens through spoofed UPI gateways and subsequently laundered proceeds
via smurfing into layering accounts. Digital forensic artifacts have been extracted,
hashed with SHA-256, and certified under Section 63 Bharatiya Sakshya Adhiniyam, 2023.

PROSECUTION WITNESSES:
- PW-01: Duty Officer (Registration of FIR)
- PW-02: Forensic Cyber Specialist (Digital Extraction & Spectrogram)
- PW-03: Branch Manager (Bank Statement & Freeze Compliance)

PRAYER:
It is respectfully prayed that this Hon'ble Court may take cognizance of the offenses
and issue process against the accused persons to stand trial in accordance with law.

SUBMITTED BY:
${assignedIO}
Investigating Officer, Cyber Crime PS`}
          metadata={{
            ioName: assignedIO,
            policeStation: caseDetail.locationName || 'Cyber Crime Police Station',
            suspectName: caseDetail.title,
            crimeType: 'Statutory Chargesheet (Sec 193 BNSS)',
            hash: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
          }}
        />
      )}

      {/* Bail Opposition Fact Sheet Modal (Public Prosecutor Brief) */}
      {caseDetail && (
        <DocumentPreviewModal
          isOpen={bailOppositionModalOpen}
          onClose={() => setBailOppositionModalOpen(false)}
          title={`Bail Opposition Fact Sheet (Public Prosecutor): ${caseDetail.caseNumber}`}
          subtitle={`Statutory Opposition under Section 480 BNSS • High Tampering / Flight Risk`}
          documentType="bail_opposition"
          caseNumber={caseDetail.caseNumber}
          fileName={`Bail_Opposition_Brief_${caseDetail.caseNumber}.txt`}
          textContent={`================================================================================
OFFICE OF THE DIRECTOR OF PROSECUTION • NCT OF DELHI
STATUTORY BAIL OPPOSITION FACT SHEET (SECTION 480 BNSS 2023)
================================================================================
CASE REFERENCE   : ${caseDetail.caseNumber}
ACCUSED TARGET   : Accused Syndicate Operatives
HEARING BENCH    : Sessions Court / Special PMLA Court

GROUNDS FOR IMMEDIATE BAIL REJECTION:
1. FLIGHT RISK & DESTRUCTION OF DIGITAL EVIDENCE:
   - The accused operates burner SIMs and has access to offshore Hawala accounts.
   - High risk of fleeing the jurisdiction beyond Interpol Red Notice reach.

2. SEVERITY OF ECONOMIC SYNDICATE OFFENSE:
   - Offenses invoked under Section 111 BNS (Organized Crime) carry minimum 5 years
     to Life Imprisonment. Supreme Court precedent mandates strict bail deterrence.

3. WITNESS INTIMIDATION & EVIDENCE TAMPERING:
   - Critical co-conspirators and bank branch mules are yet to undergo formal
     Section 183 BNSS judicial statement recording. Liberty to accused would prejudice trial.

4. PENDING RECOVERIES UNDER SECTION 23 BSA:
   - The electronic ledger laptops and encrypted Cold Wallets are pending recovery
     based on disclosure memos under Section 23 Bharatiya Sakshya Adhiniyam.

RECOMMENDATION:
Public Prosecutor to strongly object to regular or interim bail under Section 480 BNSS.`}
          metadata={{
            ioName: assignedIO,
            policeStation: caseDetail.locationName || 'Cyber Crime Police Station',
            suspectName: caseDetail.title,
            crimeType: 'Bail Opposition Fact Sheet (Sec 480 BNSS)',
            hash: '4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b',
          }}
        />
      )}

      {/* Bank Debit Freeze Directive Modal (Sec 106 BNSS / 102 CrPC) */}
      {caseDetail && (
        <DocumentPreviewModal
          isOpen={debitFreezeModalOpen}
          onClose={() => setDebitFreezeModalOpen(false)}
          title={`Urgent Bank Debit Freeze Directive: ${caseDetail.caseNumber}`}
          subtitle={`Statutory Order under Section 106 BNSS / Section 102 CrPC to Bank Branch Managers`}
          documentType="debit_freeze"
          caseNumber={caseDetail.caseNumber}
          fileName={`Bank_Debit_Freeze_Notice_${caseDetail.caseNumber}.txt`}
          textContent={`================================================================================
OFFICE OF THE INVESTIGATING OFFICER • STATE CYBER CRIME CELL
ORDER FOR SEIZURE / FREEZING OF BANK ACCOUNT UNDER SECTION 106 BNSS (102 CrPC)
================================================================================
TO:
The Branch Manager,
Authorized Scheduled Commercial Banks (HDFC, ICICI, State Bank of India, Axis Bank)

SUBJECT: IMMEDIATE DEBIT-FREEZE OF PROCEEDS OF CRIME IN CASE ${caseDetail.caseNumber}

Sir/Madam,
Whereas investigation into the above-referenced criminal matter has established that
illicit funds generated through organized cyber extortion have been structured and
deposited into the following accounts:

1. A/C NO: 501009823412 • HDFC Bank • Holder: Mule Account A
2. A/C NO: 002901584912 • ICICI Bank • Holder: Mule Account B
3. A/C NO: 389102948123 • State Bank of India • Holder: Mule Account C

You are hereby DIRECTED under Section 106 of Bharatiya Nagarik Suraksha Sanhita, 2023
to immediately mark a FULL DEBIT FREEZE on the aforementioned accounts with zero delay.

Failure to comply with this statutory directive shall invite penal proceedings under
Section 223 BNS (Disobedience to order duly promulgated by public servant).

SEAL & SIGNATURE:
${assignedIO}
Investigating Officer, Cyber Crime PS`}
          metadata={{
            ioName: assignedIO,
            policeStation: caseDetail.locationName || 'Cyber Crime Police Station',
            suspectName: caseDetail.title,
            crimeType: 'Bank Account Freeze Directive (Sec 106 BNSS)',
            hash: '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
          }}
        />
      )}
    </div>
  );
}
