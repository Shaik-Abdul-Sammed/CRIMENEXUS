import { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Plus,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { useReports, useGenerateReportMutation } from '../../hooks/useIntelligenceApi';
import { ReportType } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { formatDate } from '../../utils/formatters';

export function ReportsPage() {
  const { data: reports, isLoading } = useReports('ALL');
  const generateMutation = useGenerateReportMutation();

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ReportType>('CASE_SUMMARY');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const filteredReports = reports?.filter((r) => filterType === 'ALL' || r.type === filterType);
  const selectedReport = filteredReports?.find((r) => r.id === selectedReportId) || filteredReports?.[0];

  const handleGenerate = () => {
    generateMutation.mutate(
      { caseId: 'case-101', type: selectedType },
      {
        onSuccess: (newRep) => {
          setIsGenerateModalOpen(false);
          setSelectedReportId(newRep.id);
        },
      }
    );
  };

  const reportTypes: { type: ReportType; label: string; desc: string }[] = [
    { type: 'CASE_SUMMARY', label: 'Case Master Summary', desc: 'Comprehensive investigation overview, crime scope, and key suspect targets.' },
    { type: 'EVIDENCE_SUMMARY', label: 'Evidence Ledger & Hash Report', desc: 'Complete catalog of forensic extracts, SHA-256 hashes, and chain of custody.' },
    { type: 'RELATIONSHIP_REPORT', label: 'Entity Relationship Matrix', desc: 'Direct and indirect relationships, confidence scores, and review status.' },
    { type: 'NETWORK_ANALYSIS', label: 'Cytoscape Network Topology Report', desc: 'Graph cluster metrics, high-degree nodes, and centrality analysis.' },
    { type: 'TIMELINE_REPORT', label: 'Chronological Timeline Stream', desc: 'Temporal event stream across calls, wire transfers, and ANPR sightings.' },
    { type: 'AI_INTELLIGENCE', label: 'AI Intelligence Discovery Summary', desc: 'Evidence-grounded AI findings, anomaly flags, and pattern synthesis.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2 flex-wrap">
            <FileText className="h-6 w-6 text-primary shrink-0" />
            <span>Intelligence Reports &amp; Executive Dossiers</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Synthesize formal law-enforcement intelligence dossiers, network reports, and timeline summaries.
          </p>
        </div>
        <Button onClick={() => setIsGenerateModalOpen(true)} icon={<Plus className="h-4 w-4" />} className="shrink-0 font-bold text-xs">
          Generate New Report
        </Button>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-xl border border-border bg-card">
        {['ALL', 'CASE_SUMMARY', 'EVIDENCE_SUMMARY', 'NETWORK_ANALYSIS', 'TIMELINE_REPORT', 'AI_INTELLIGENCE'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-2.5 py-1 text-[11px] rounded-md font-semibold transition-colors ${
              filterType === t
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground">Cataloged Reports ({filteredReports?.length || 0})</h3>
          {isLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Loading reports...</div>
          ) : !filteredReports || filteredReports.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
              No reports in this category. Click &quot;Generate New Report&quot; to synthesize one.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedReportId(r.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedReport?.id === r.id
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline">{r.type.replace(/_/g, ' ')}</Badge>
                    <span className="text-[10px] text-muted-foreground">{formatDate(r.generatedAt)}</span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground line-clamp-1">{r.title}</h4>
                  <p className="text-[11px] text-muted-foreground mt-1">{r.generatedBy}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedReport ? (
            <Card className="border-primary/30">
              <CardHeader className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-border pb-4 gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{selectedReport.type.replace(/_/g, ' ')}</Badge>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      SEC 63 BSA COMPLIANT
                    </span>
                  </div>
                  <CardTitle className="text-lg mt-1 truncate">{selectedReport.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Generated by {selectedReport.generatedBy} on {formatDate(selectedReport.generatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" icon={<Eye className="h-4 w-4" />} onClick={() => setPreviewModalOpen(true)}>
                    Preview Dossier
                  </Button>
                  <Button size="sm" variant="outline" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
                    Print
                  </Button>
                  <Button size="sm" icon={<Download className="h-4 w-4" />} onClick={() => setPreviewModalOpen(true)}>
                    Export Dossier
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6 text-xs leading-relaxed">
                <div className="grid grid-cols-4 gap-4 p-4 rounded-xl bg-background/50 border border-border text-center">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Total Entities</span>
                    <span className="text-lg font-extrabold text-foreground">{selectedReport.summaryStats.totalEntities}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Evidence Items</span>
                    <span className="text-lg font-extrabold text-foreground">{selectedReport.summaryStats.totalEvidence}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Relationships</span>
                    <span className="text-lg font-extrabold text-foreground">{selectedReport.summaryStats.totalRelationships}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">AI Findings</span>
                    <span className="text-lg font-extrabold text-foreground">{selectedReport.summaryStats.aiFindingsCount}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-foreground uppercase tracking-wider border-b border-border/40 pb-1">
                    1. Executive Summary
                  </h4>
                  <p className="text-muted-foreground">{selectedReport.content.executiveSummary}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-foreground uppercase tracking-wider border-b border-border/40 pb-1">
                    2. Verified Key Findings
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    {selectedReport.content.keyFindings.map((kf, i) => (
                      <li key={i}>{kf}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-foreground uppercase tracking-wider border-b border-border/40 pb-1">
                    3. Risk & Threat Assessment
                  </h4>
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive font-medium">
                    {selectedReport.content.riskAssessment}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-foreground uppercase tracking-wider border-b border-border/40 pb-1">
                    4. Recommended Investigative Actions
                  </h4>
                  <ul className="list-decimal pl-5 space-y-1 text-muted-foreground">
                    {selectedReport.content.recommendedActions.map((ra, i) => (
                      <li key={i}>{ra}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Official Law Enforcement Intelligence Document
                  </span>
                  <span>Target Case ID: CASE-2026-8812</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-8 text-center text-xs text-muted-foreground">
              Select a report from the catalog or generate a new intelligence dossier.
            </Card>
          )}
        </div>
      </div>

      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Synthesize Intelligence Report"
        description="Select report type to synthesize verified case data, Cytoscape graph topology, and AI discoveries."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            {reportTypes.map((rt) => (
              <div
                key={rt.type}
                onClick={() => setSelectedType(rt.type)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedType === rt.type
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-background/50 hover:border-primary/40'
                }`}
              >
                <h4 className="font-bold text-xs text-foreground">{rt.label}</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">{rt.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} isLoading={generateMutation.isPending}>
              Generate Report Dossier
            </Button>
          </div>
        </div>
      </Modal>

      {/* Official Court Dossier Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        caseNumber="CASE-2026-8812"
        documentType="court_dossier"
        metadata={{
          courtName: 'Special Sessions Court (Cyber & Financial Crimes)',
          investigatingOfficer: selectedReport?.generatedBy || 'Inspector Rajesh Varma',
          firNumber: 'FIR-2026-CRIME-890',
        }}
      />
    </div>
  );
}
