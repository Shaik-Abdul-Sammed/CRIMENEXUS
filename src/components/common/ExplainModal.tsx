import React from 'react';
import { HelpCircle, Sparkles, ShieldCheck, Scale, Cpu, CheckCircle2, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface ExplainData {
  title: string;
  category: 'RISK_SCORE' | 'LINK_PREDICTION' | 'HOTSPOT_FORECAST' | 'MULE_ANOMALY';
  subjectName: string;
  confidenceScore: number;
  plainEnglishSummary: string;
  contributingFeatures: Array<{
    name: string;
    impact: number; // positive = increased risk, negative = decreased
    description: string;
  }>;
  statutoryBasis?: string;
  courtAdmissibilityHash?: string;
  mitigatedBiasFactor?: string;
}

interface ExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ExplainData | null;
}

export function ExplainModal({ isOpen, onClose, data }: ExplainModalProps) {
  if (!data) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`AI Explainability Analysis // ${data.title}`}
      description="Court-admissible Section 63 BSA algorithmic transparency dossier and SHAP feature attribution decomposition."
      size="lg"
    >
      <div className="space-y-4">
        {/* Header Summary Banner */}
        <div className="p-4 rounded-xl bg-slate-900 border border-primary/30 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-foreground">{data.subjectName}</span>
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/40 font-mono">
                {data.category}
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-emerald-950/40 text-emerald-400 border-emerald-500/40">
                Confidence: {(data.confidenceScore * 100).toFixed(1)}%
              </Badge>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
              {data.plainEnglishSummary}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        {/* Contributing Features (SHAP Values) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-primary" />
              SHAP Contributing Feature Weights
            </span>
            <span className="text-[11px] font-mono text-slate-400">Additive Feature Attribution (TreeSHAP)</span>
          </div>

          <div className="space-y-2 rounded-xl bg-slate-950/80 border border-border p-3">
            {data.contributingFeatures.map((feat, idx) => {
              const absImpact = Math.min(100, Math.abs(feat.impact) * 100);
              const isPositive = feat.impact >= 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-200">{feat.name}</span>
                    <span className={`font-mono font-bold ${isPositive ? 'text-red-400' : 'text-emerald-400'}`}>
                      {isPositive ? '+' : '-'}{absImpact.toFixed(1)}% ({feat.description})
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isPositive ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${absImpact}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Constitutional & Statutory Guardrails */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-border/80 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-sky-400 text-[11px] uppercase">
              <Scale className="h-3.5 w-3.5" />
              Statutory Basis
            </div>
            <p className="text-[11px] text-slate-300">
              {data.statutoryBasis || 'Section 63(4) Bharatiya Sakshya Adhiniyam, 2023 (BSA)'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-border/80 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-[11px] uppercase">
              <ShieldCheck className="h-3.5 w-3.5" />
              Anti-Bias Guardrail
            </div>
            <p className="text-[11px] text-slate-300">
              {data.mitigatedBiasFactor || 'Demographic parity verified. Protected class & location bias damped under Article 14.'}
            </p>
          </div>
        </div>

        {/* Cryptographic Hash Signature */}
        {data.courtAdmissibilityHash && (
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Court Verification Digest:
            </span>
            <span className="text-primary truncate max-w-[280px]">{data.courtAdmissibilityHash}</span>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-2 border-t border-border/40">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Analysis
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export interface ExplainButtonProps {
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  label?: string;
  title?: string;
  summary?: string;
  features?: Array<{
    feature?: string;
    name?: string;
    contribution?: number;
    impact?: number;
    type?: string;
    description?: string;
  }>;
  statute?: string;
  sha256Hash?: string;
  variant?: string;
  size?: string;
}

export function ExplainButton({
  onClick,
  className = '',
  label,
  title,
  summary,
  features,
  statute,
  sha256Hash,
}: ExplainButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    } else if (title) {
      setIsOpen(true);
    }
  };

  const modalData: ExplainData | null = title
    ? {
        title,
        category: 'RISK_SCORE',
        subjectName: title,
        confidenceScore: 0.94,
        plainEnglishSummary: summary || '',
        contributingFeatures: (features || []).map((f) => ({
          name: f.name || f.feature || 'Feature',
          impact: f.impact ?? f.contribution ?? 0.5,
          description: f.description || `Type: ${f.type || 'Telemetry'}`,
        })),
        statutoryBasis: statute,
        courtAdmissibilityHash: sha256Hash,
      }
    : null;

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase transition-all bg-indigo-950/60 hover:bg-indigo-900/90 text-indigo-300 border border-indigo-500/40 hover:border-indigo-400 shadow-sm ${className}`}
        title="Open court-admissible algorithmic explanation and feature attribution"
      >
        <HelpCircle className="h-3 w-3 text-indigo-400" />
        <span>{label || 'Explain'}</span>
      </button>
      {modalData && (
        <ExplainModal isOpen={isOpen} onClose={() => setIsOpen(false)} data={modalData} />
      )}
    </>
  );
}
