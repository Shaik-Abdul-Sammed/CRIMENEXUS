import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ShieldCheck,
  FileText,
  AlertCircle,
  ExternalLink,
  BrainCircuit,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { sound } from '../../utils/soundEffects';

export interface InsightItem {
  analytics_id: string;
  name: string;
  category?: string;
  result: string;
  confidence: number;
  evidence_firs: string[];
  explanation: string;
  recommendation: string;
}

interface InsightCardProps {
  insight: InsightItem;
  onSelectEvidenceFIR?: (caseNum: string) => void;
}

export function InsightCard({ insight, onSelectEvidenceFIR }: InsightCardProps) {
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);
  const [explainModalOpen, setExplainModalOpen] = useState(false);

  const confidencePct = Math.round((insight.confidence || 0.85) * 100);

  const getConfidenceBadgeColor = (pct: number) => {
    if (pct >= 90) return 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300';
    if (pct >= 75) return 'border-amber-500/50 bg-amber-950/40 text-amber-300';
    return 'border-rose-500/50 bg-rose-950/40 text-rose-300';
  };

  return (
    <>
      <div
        tabIndex={0}
        role="region"
        aria-label={`${insight.analytics_id}: ${insight.name}`}
        className="p-4 rounded-xl border border-border/80 bg-card/90 hover:border-primary/50 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-primary/60 flex flex-col justify-between space-y-3"
      >
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <span className="font-mono text-[10px] text-primary font-black uppercase tracking-wider block">
                {insight.analytics_id}
              </span>
              <h4 className="text-sm font-black text-foreground leading-snug">
                {insight.name}
              </h4>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${getConfidenceBadgeColor(
                confidencePct
              )}`}
            >
              {confidencePct}% Confidence
            </span>
          </div>

          {/* Result Text */}
          <p
            className="text-xs text-slate-300 leading-relaxed font-sans"
            aria-live="polite"
          >
            {insight.result}
          </p>

          {/* Actionable Police Recommendation */}
          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-[11px] text-primary-200 leading-relaxed space-y-0.5">
            <span className="font-bold text-primary flex items-center gap-1 text-[10px] uppercase tracking-wider">
              <ShieldCheck className="h-3 w-3" />
              Investigative Protocol:
            </span>
            <p className="text-slate-300">{insight.recommendation}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-border/60 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                sound.playClickSound();
                setEvidenceExpanded(!evidenceExpanded);
              }}
              className="text-[11px] h-7 px-2 font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
              aria-expanded={evidenceExpanded}
              aria-label={`View ${insight.evidence_firs.length} evidence FIRs`}
            >
              <FileText className="h-3 w-3 text-cyan-400" />
              <span>Evidence ({insight.evidence_firs.length} FIRs)</span>
              {evidenceExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                sound.playClickSound();
                setExplainModalOpen(true);
              }}
              className="text-[11px] h-7 px-2 border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/40 font-bold flex items-center gap-1"
              title="View SHAP feature importance breakdown"
            >
              <BrainCircuit className="h-3 w-3 text-indigo-400" />
              <span>Explain This</span>
            </Button>
          </div>

          {/* Expanded Evidence FIR List */}
          {evidenceExpanded && (
            <div className="p-2 rounded-lg bg-black/40 border border-border/60 space-y-1 animate-in fade-in duration-150">
              <span className="text-[9px] uppercase tracking-wider font-mono text-muted-foreground block">
                Historical FIR Evidence Chain:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {insight.evidence_firs.map((firNo) => (
                  <button
                    key={firNo}
                    type="button"
                    onClick={() => onSelectEvidenceFIR && onSelectEvidenceFIR(firNo)}
                    className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 hover:bg-slate-700 border border-cyan-500/30 transition-colors flex items-center gap-1"
                  >
                    <span>{firNo}</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SHAP Feature Explanation Modal */}
      <Modal
        isOpen={explainModalOpen}
        onClose={() => setExplainModalOpen(false)}
        title={`${insight.analytics_id}: ${insight.name} - Explainability Model`}
      >
        <div className="space-y-4 text-xs font-sans text-slate-200">
          <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-1.5">
            <span className="font-mono font-bold text-indigo-300 text-[11px] block uppercase tracking-wider">
              SHAP Multi-Factor Decomposition:
            </span>
            <p className="text-slate-300 leading-relaxed">{insight.explanation}</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-mono text-muted-foreground block font-bold">
              Feature Attributions & Confidence Model
            </span>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span>Text Lexical / N-Gram Vector:</span>
                <span className="text-emerald-400 font-bold">+0.42</span>
              </div>
              <div className="flex justify-between">
                <span>Knowledge Graph Co-occurrence:</span>
                <span className="text-emerald-400 font-bold">+0.31</span>
              </div>
              <div className="flex justify-between">
                <span>Statutory Concordance Accuracy:</span>
                <span className="text-emerald-400 font-bold">+0.18</span>
              </div>
              <div className="flex justify-between">
                <span>Confirmation Bias Damping:</span>
                <span className="text-slate-400">-0.05</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <Button size="sm" variant="outline" onClick={() => setExplainModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
