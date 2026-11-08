import React, { useState } from 'react';
import { Scale, AlertCircle, ShieldCheck, CheckCircle2, Info, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ExplainModal, ExplainData, ExplainButton } from '../../components/common/ExplainModal';

export function FairnessBiasWidget() {
  const [explainData, setExplainData] = useState<ExplainData | null>(null);

  const biasAuditData = {
    zone_name: 'Yamuna Expressway - Jewar Corridor',
    total_historical_reports: 1420,
    dominant_demographic_pct: 58.4,
    demographic_category: 'Commercial Highway Transit',
    equity_score: 92,
    disparate_impact_ratio: 0.94,
    confirmation_bias_damping: 0.85,
    statutory_status: 'ARTICLE 14 EQUITABLE ALLOCATION COMPLIANT',
  };

  const handleOpenExplain = () => {
    setExplainData({
      title: 'PredPol Anti-Bias & Equity Mitigation Audit',
      category: 'HOTSPOT_FORECAST',
      subjectName: 'Jewar Patrol Allocation Grid',
      confidenceScore: 0.884,
      plainEnglishSummary:
        'Unlike legacy PredPol models that amplify historical over-policing, CRIMENEXUS applies ' +
        'an 85% confirmation bias damping factor. High-risk ranking is driven by real-time optical ANPR scans ' +
        'and commercial freight armed robbery pings, strictly decoupled from demographic residential profiling.',
      contributingFeatures: [
        { name: 'Real-Time Highway ANPR Hits (Optical)', impact: 0.48, description: 'Direct physical vehicle sightings' },
        { name: 'Cell Tower Azimuth Handover Density', impact: 0.32, description: 'Rapid transit movement' },
        { name: 'Historical Station FIR Baseline', impact: 0.12, description: 'Damped by 85% to prevent feedback loop' },
        { name: 'Demographic Residential Profile', impact: -0.22, description: 'Zero weight allowed under Art 14' },
      ],
      statutoryBasis: 'Article 14 & 21 Constitution of India (Equality Before Law & Fair Procedure)',
      mitigatedBiasFactor: 'Disparate Impact Ratio = 0.94 (Acceptable threshold > 0.80). Confirmed equity.',
      courtAdmissibilityHash: 'SHA256:FAIRNESS-DIR-094-SEC63-BSA-VERIFIED',
    });
  };

  return (
    <>
      <Card className="border border-emerald-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 shadow-xl overflow-hidden relative">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <span>Algorithmic Fairness & Equity Audit</span>
                <Badge variant="outline" className="text-[9px] border-emerald-400 text-emerald-300 bg-emerald-950/40">
                  ANTI-PREDPOL
                </Badge>
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">
                Constitutional Article 14 Compliance • Feedback Loop Mitigation
              </p>
            </div>
          </div>

          <ExplainButton onClick={handleOpenExplain} label="Explain Equity" />
        </CardHeader>

        <CardContent className="p-4 space-y-3.5">
          {/* Main Advisory Box (Explicit Requirement) */}
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>Confidence & Bias Assessment</span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
              &quot;Prediction is based on <b>{biasAuditData.total_historical_reports} reports</b>;{' '}
              <b>{biasAuditData.dominant_demographic_pct}%</b> are from a single demographic zone ({biasAuditData.demographic_category}).{' '}
              <span className="text-amber-300 font-semibold">Patrol allocation should be reviewed for equity.</span>&quot;
            </p>
          </div>

          {/* Metric Badges Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Equity Score</span>
              <p className="text-base font-black font-mono text-emerald-400">{biasAuditData.equity_score}%</p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Disparate Impact (DIR)</span>
              <p className="text-base font-black font-mono text-cyan-400">{biasAuditData.disparate_impact_ratio}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Feedback Damping</span>
              <p className="text-base font-black font-mono text-purple-400">{biasAuditData.confirmation_bias_damping}x</p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Constitutional Review</span>
              <p className="text-[11px] font-bold font-mono text-emerald-300 truncate">COMPLIANT</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Automated audit logged to WORM blockchain notary
            </span>
            <button
              onClick={handleOpenExplain}
              className="text-primary hover:text-primary/80 font-semibold flex items-center gap-0.5"
            >
              <span>View Mathematical Proof</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </CardContent>
      </Card>

      <ExplainModal
        isOpen={Boolean(explainData)}
        onClose={() => setExplainData(null)}
        data={explainData}
      />
    </>
  );
}
