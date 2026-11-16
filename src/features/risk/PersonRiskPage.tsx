import React, { useState } from 'react';
import {
  ShieldAlert,
  User,
  Search,
  Activity,
  BarChart2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Scale,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';

interface RiskData {
  person_id: string;
  name: string;
  risk_score: number;
  risk_tier: string;
  features: {
    prior_fir_count: number;
    network_centrality: number;
    transaction_anomaly_count: number;
  };
  shap_breakdown: {
    baseline_intercept: number;
    prior_fir_impact: number;
    network_centrality_impact: number;
    transaction_anomaly_impact: number;
    sum_of_shap_values: number;
  };
  statutory_compliance: string;
}

export function PersonRiskPage() {
  const [personIdInput, setPersonIdInput] = useState<string>('PERSON-VK-01');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [riskData, setRiskData] = useState<RiskData>({
    person_id: 'PERSON-VK-01',
    name: 'Vikram Malhotra @ Vicky',
    risk_score: 92.8,
    risk_tier: 'CRITICAL',
    features: {
      prior_fir_count: 8,
      network_centrality: 0.88,
      transaction_anomaly_count: 14,
    },
    shap_breakdown: {
      baseline_intercept: 5.0,
      prior_fir_impact: 36.0,
      network_centrality_impact: 30.8,
      transaction_anomaly_impact: 21.0,
      sum_of_shap_values: 92.8,
    },
    statutory_compliance: 'Sec 63 BSA Algorithmic Transparency & Model Explainability',
  });

  const handleFetchRisk = async (idToQuery: string) => {
    if (!idToQuery || !idToQuery.trim()) {
      setError('Please enter a valid Person ID or Name to score.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/v1/risk-scoring/person/${encodeURIComponent(idToQuery.trim())}`);
      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.detail || `Subject '${idToQuery}' not found in active police nominal roll.`);
      }
      const data = await resp.json();
      setRiskData(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || `Failed to score subject '${idToQuery}'. Please verify person identifier.`);
    } finally {
      setIsLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'CRITICAL':
        return 'border-red-500 bg-red-950/40 text-red-400';
      case 'HIGH':
        return 'border-amber-500 bg-amber-950/40 text-amber-400';
      case 'MEDIUM':
        return 'border-sky-500 bg-sky-950/40 text-sky-400';
      default:
        return 'border-emerald-500 bg-emerald-950/40 text-emerald-400';
    }
  };

  return (
    <div className="space-y-6 select-none pb-20">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl border border-red-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-red-950/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-lg shadow-red-600/30 shrink-0">
            <Activity className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight break-words" title="Person-Based Predictive Risk Scoring">
                Person-Based Predictive Risk Scoring &amp; SHAP Explainer
              </h1>
              <Badge className="bg-red-600 text-white font-extrabold text-xs whitespace-nowrap shrink-0">
                XGBOOST ML • SHAP VECTORS
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
              Quantifies recidivism, syndicate flight velocity, and witness intimidation risk with statutory explainable SHAP feature decompositions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="p-2.5 rounded-xl border border-red-500/30 bg-slate-950 text-right font-mono text-xs">
            <span className="text-[10px] text-muted-foreground uppercase block whitespace-nowrap">Statutory Basis</span>
            <span className="text-red-300 font-bold whitespace-nowrap">Sec 480 BNSS Bail Opposition</span>
          </div>
        </div>
      </div>

      {/* Target Lookup Bar */}
      <Card className="border-border bg-card/90 shadow-lg">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full min-w-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={personIdInput}
                onChange={(e) => setPersonIdInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchRisk(personIdInput)}
                placeholder="Enter Person ID (e.g., PERSON-VK-01, PERSON-RS-02, PERSON-PS-03)..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary overflow-hidden text-ellipsis whitespace-nowrap"
                title={personIdInput}
              />
            </div>
            <Button
              onClick={() => handleFetchRisk(personIdInput)}
              disabled={isLoading}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-4 shadow-md whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5"
            >
              {isLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
              <span>{isLoading ? 'Computing SHAP...' : 'Score Target'}</span>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground font-mono">
            <span className="text-[11px] font-bold uppercase whitespace-nowrap shrink-0">Sample Subjects:</span>
            {[
              { id: 'PERSON-VK-01', label: 'Vikram Malhotra (Kingpin)', tier: 'CRITICAL' },
              { id: 'PERSON-RS-02', label: 'Rajan Sharma (Courier)', tier: 'HIGH' },
              { id: 'PERSON-PS-03', label: 'Priya Sharma (Civilian)', tier: 'LOW' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setPersonIdInput(s.id);
                  handleFetchRisk(s.id);
                }}
                className="px-2 py-0.5 rounded border border-border/70 hover:border-primary/50 text-[10px] text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                {s.label} ({s.tier})
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonLoader variant="card" count={3} />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/40 bg-red-950/30 text-xs text-red-200 break-words">
          <strong>Risk Assessment Error:</strong> {error}
        </div>
      )}

      {/* Results View */}
      {!isLoading && riskData && (
        <div className="space-y-6">
          {/* Main Risk Overview: 3-Col Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Aggregate Recidivism & Flight Risk Score */}
            <Card className="border-border bg-card/90 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-muted-foreground uppercase overflow-hidden text-ellipsis whitespace-nowrap">
                    Aggregated Risk Score
                  </span>
                  <Badge className={`font-mono text-[10px] uppercase font-bold whitespace-nowrap shrink-0 ${getTierColor(riskData.risk_tier)}`}>
                    {riskData.risk_tier} RISK
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-4xl font-black text-white">{riskData.risk_score}</span>
                  <span className="text-xs text-muted-foreground font-mono">/ 100</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      riskData.risk_score >= 80 ? 'bg-red-500' : riskData.risk_score >= 60 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${riskData.risk_score}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 text-[11px] text-slate-300 font-mono mt-4 line-clamp-2 break-words">
                Subject: <strong className="text-white">{riskData.name}</strong> ({riskData.person_id})
              </div>
            </Card>

            {/* Card 2: 3-Factor Input Features */}
            <Card className="border-border bg-card/90 p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-muted-foreground uppercase block mb-3 overflow-hidden text-ellipsis whitespace-nowrap">
                  Investigative ML Input Features
                </span>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-border/50">
                    <span className="text-slate-300 whitespace-nowrap">Prior FIRs / Arrests:</span>
                    <strong className="text-white whitespace-nowrap">{riskData.features.prior_fir_count} Cases</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-border/50">
                    <span className="text-slate-300 whitespace-nowrap">Network Centrality:</span>
                    <strong className="text-amber-400 whitespace-nowrap">{riskData.features.network_centrality} (Betweenness)</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-border/50">
                    <span className="text-slate-300 whitespace-nowrap">Transaction Smurfs:</span>
                    <strong className="text-rose-400 whitespace-nowrap">{riskData.features.transaction_anomaly_count} Anomalies</strong>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground pt-2 line-clamp-2 break-words">
                Model: Gradient-Boosted Decision Trees trained on NCRB Crime in India historical cohorts.
              </div>
            </Card>

            {/* Card 3: Statutory Legal Action Mandate */}
            <Card className="border-border bg-card/90 p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-muted-foreground uppercase block mb-3 overflow-hidden text-ellipsis whitespace-nowrap">
                  Statutory Bail &amp; Remand Guard
                </span>
                <div className="p-3 rounded-xl border border-red-500/30 bg-red-950/20 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-red-300 font-bold">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">Section 480 BNSS Mandate</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2 break-words">
                    {riskData.risk_score >= 70
                      ? 'Score satisfies statutory flight threshold. Oppose bail; mandate 14-day police custody remand with passport impoundment.'
                      : 'Low recidivism score. Standard surety bond and regular appearance conditions advised.'}
                  </p>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-400 font-mono line-clamp-2 break-words">
                Audit Digest: SHA-256 sealed under Section 63 BSA electronic admissibility.
              </div>
            </Card>
          </div>

          {/* SHAP Feature Contribution Waterfall / Breakdown Chart */}
          <Card className="border-border bg-card/90">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap" title="SHAP Explainability Waterfall">
                  <BarChart2 className="h-4 w-4 text-primary" />
                  <span>SHAP (Shapley Additive Explanations) Feature Contributions</span>
                </CardTitle>
                <Badge variant="outline" className="font-mono text-[9px] text-primary whitespace-nowrap shrink-0">
                  SUM = {riskData.shap_breakdown.sum_of_shap_values} PTS
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="min-h-[300px] flex flex-col justify-around space-y-3">
                {[
                  {
                    label: 'Prior FIRs Recidivism Impact',
                    val: riskData.shap_breakdown.prior_fir_impact,
                    desc: `${riskData.features.prior_fir_count} previous cognizable FIR filings`,
                    color: 'bg-red-500',
                  },
                  {
                    label: 'Network Centrality / Gang Influence Impact',
                    val: riskData.shap_breakdown.network_centrality_impact,
                    desc: `Betweenness centrality ${riskData.features.network_centrality} in crime graph`,
                    color: 'bg-amber-400',
                  },
                  {
                    label: 'Financial Smurfing Anomaly Impact',
                    val: riskData.shap_breakdown.transaction_anomaly_impact,
                    desc: `${riskData.features.transaction_anomaly_count} rapid sub-threshold mule account credits`,
                    color: 'bg-purple-400',
                  },
                  {
                    label: 'Population Baseline Intercept (Bias)',
                    val: riskData.shap_breakdown.baseline_intercept,
                    desc: 'Base expected recidivism rate for cohort',
                    color: 'bg-slate-500',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white overflow-hidden text-ellipsis whitespace-nowrap" title={item.label}>
                        {item.label}
                      </span>
                      <span className="font-bold text-emerald-400 whitespace-nowrap shrink-0">
                        +{item.val} pts
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-border/40">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${Math.min(100, Math.max(5, (item.val / riskData.risk_score) * 100))}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground block line-clamp-2 break-words">
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto w-full pt-2">
                <table className="w-full min-w-[600px] text-xs text-left">
                  <thead className="bg-slate-950 font-mono text-[10px] text-muted-foreground uppercase border-b border-border">
                    <tr>
                      <th className="p-2.5 whitespace-nowrap">SHAP Component</th>
                      <th className="p-2.5 whitespace-nowrap">Raw Feature Value</th>
                      <th className="p-2.5 whitespace-nowrap">Contribution</th>
                      <th className="p-2.5 whitespace-nowrap">% of Total Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 font-mono">
                    <tr>
                      <td className="p-2.5 text-white whitespace-nowrap">prior_fir_impact</td>
                      <td className="p-2.5 text-slate-300 whitespace-nowrap">{riskData.features.prior_fir_count} FIRs</td>
                      <td className="p-2.5 text-red-400 font-bold whitespace-nowrap">+{riskData.shap_breakdown.prior_fir_impact}</td>
                      <td className="p-2.5 text-slate-400 whitespace-nowrap">{((riskData.shap_breakdown.prior_fir_impact / riskData.risk_score) * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-white whitespace-nowrap">network_centrality_impact</td>
                      <td className="p-2.5 text-slate-300 whitespace-nowrap">{riskData.features.network_centrality}</td>
                      <td className="p-2.5 text-amber-400 font-bold whitespace-nowrap">+{riskData.shap_breakdown.network_centrality_impact}</td>
                      <td className="p-2.5 text-slate-400 whitespace-nowrap">{((riskData.shap_breakdown.network_centrality_impact / riskData.risk_score) * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-white whitespace-nowrap">transaction_anomaly_impact</td>
                      <td className="p-2.5 text-slate-300 whitespace-nowrap">{riskData.features.transaction_anomaly_count} anomalies</td>
                      <td className="p-2.5 text-purple-400 font-bold whitespace-nowrap">+{riskData.shap_breakdown.transaction_anomaly_impact}</td>
                      <td className="p-2.5 text-slate-400 whitespace-nowrap">{((riskData.shap_breakdown.transaction_anomaly_impact / riskData.risk_score) * 100).toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
