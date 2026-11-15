import React, { useState, useEffect } from 'react';
import {
  Banknote,
  AlertTriangle,
  TrendingUp,
  FileCheck2,
  ShieldAlert,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface Anomaly {
  tx_id: string;
  type: string;
  amount: number;
  description: string;
}

interface SARAnalysisResult {
  suspect_id: string;
  entity_name: string;
  sar_score: number;
  risk_tier: string;
  total_volume_inr: number;
  structuring_detected: boolean;
  structuring_events_count: number;
  mule_layering_detected: boolean;
  anomalies: Anomaly[];
  pmla_statutory_basis: string;
}

interface BenchmarkCase {
  case_id: string;
  suspect_name: string;
  primary_bank: string;
  flagged_volume_inr: number;
  structuring_count: number;
  mule_hops: number;
  risk_tier: string;
  status: string;
}

export const SARAnalyticsPage: React.FC = () => {
  const [benchmarks, setBenchmarks] = useState<BenchmarkCase[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<SARAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBenchmarks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/sar/benchmark-cases');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBenchmarks(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching SAR benchmarks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchmarks();
    // Run initial benchmark simulation
    runSimulationAnalysis();
  }, []);

  const runSimulationAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/v1/sar/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suspect_id: 'SUSP-HAWALA-2026',
          entity_name: 'Sharma Shell Impex Private Limited',
          transactions: [
            { id: 'TX-901', amount: 48900.0, sender_account: 'SBI-00912', receiver_account: 'HDFC-8821', velocity_minutes: 6 },
            { id: 'TX-902', amount: 49200.0, sender_account: 'SBI-00912', receiver_account: 'ICICI-1102', velocity_minutes: 8 },
            { id: 'TX-903', amount: 49500.0, sender_account: 'PNB-7712', receiver_account: 'AXIS-4019', velocity_minutes: 11 },
            { id: 'TX-904', amount: 960000.0, sender_account: 'SBI-00912', receiver_account: 'CRYPTO-GATEWAY', velocity_minutes: 4 }
          ]
        })
      });
      if (res.ok) {
        const json = await res.json();
        setActiveAnalysis(json);
      }
    } catch (err: any) {
      setError(err.message || 'Simulation analysis error');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Banknote className="w-7 h-7 text-emerald-400 shrink-0" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground overflow-hidden text-ellipsis whitespace-nowrap" title="Automated Suspicious Activity Reporting (FIU-IND PMLA)">
              Automated Suspicious Activity Reporting (FIU-IND SAR)
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            Financial Intelligence Unit (FIU-IND) ML analytics detecting smurfing / structuring under ₹50,000 PAN limit, high-speed mule layering, and automated PMLA 2002 reporting dossiers.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={runSimulationAnalysis}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-sm font-medium border border-emerald-500/30 transition-all whitespace-nowrap shrink-0"
            title="Run SAR Anomaly Pipeline"
          >
            <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            Scan Transactions
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{error}</span>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>SAR Suspicion Score</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 mt-2 font-mono">
            {activeAnalysis?.sar_score || 0} / 100
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Risk Tier: <strong className="text-red-400">{activeAnalysis?.risk_tier}</strong>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Structuring Events</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {activeAnalysis?.structuring_events_count || 0} Detected
          </div>
          <div className="text-xs text-muted-foreground mt-1">Smurfed below ₹50k PAN quota</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Flagged Volume</span>
            <Banknote className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold text-foreground mt-2 font-mono">
            ₹{(activeAnalysis?.total_volume_inr || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Multi-Bank Pass-Through</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Statutory Threshold</span>
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-semibold text-emerald-400 mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
            PMLA 2002 Sec 12 / STR
          </div>
          <div className="text-xs text-muted-foreground mt-1">FIU-IND Enforcement Directive</div>
        </div>
      </div>

      {/* Main Analysis Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Layering & Structuring Anomalies Feed */}
        <div className="lg:col-span-2 p-5 bg-card border border-border rounded-xl min-w-0 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-foreground text-base">
                Identified Financial Laundering Anomalies & Smurfing Patterns
              </h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {activeAnalysis?.anomalies.length || 0} Triggers
            </span>
          </div>

          <div className="space-y-3 min-w-0">
            {activeAnalysis?.anomalies.map((anom, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs min-w-0 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground">{anom.tx_id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                      {anom.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-foreground">
                    ₹{anom.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-muted-foreground break-words">{anom.description}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 p-4 rounded-lg bg-background/60 border border-border text-xs min-w-0">
            <div className="font-semibold text-foreground mb-1">PMLA Legal Grounds Formulation:</div>
            <p className="text-muted-foreground leading-relaxed break-words">
              {activeAnalysis?.pmla_statutory_basis}
            </p>
          </div>
        </div>

        {/* FIU-IND Submission Box */}
        <div className="p-5 bg-card border border-border rounded-xl min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-base mb-3 pb-3 border-b border-border/40">
              Enforcement Referral Action
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Direct generation of certified Suspicious Transaction Report (STR) Form-A for submission to the Director, Financial Intelligence Unit-India (FIU-IND) and Enforcement Directorate (ED).
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border border-border bg-background/50">
                <span className="text-muted-foreground">Target Subject:</span>
                <div className="font-semibold text-foreground mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap" title={activeAnalysis?.entity_name}>
                  {activeAnalysis?.entity_name}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-border bg-background/50">
                <span className="text-muted-foreground">Agency Recipient:</span>
                <div className="font-semibold text-foreground mt-0.5">
                  FIU-IND / Directorate of Enforcement (PMLA)
                </div>
              </div>
            </div>
          </div>

          <button
            className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            Generate PMLA Form-A STR Packet
          </button>
        </div>
      </div>

      {/* Flagged Cases Roster */}
      <div className="p-5 bg-card border border-border rounded-xl min-w-0">
        <h3 className="font-semibold text-foreground text-base mb-3">
          Historical FIU-IND Monitored Case Roster
        </h3>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="py-2.5 px-3">Case ID</th>
                <th className="py-2.5 px-3">Suspect / Shell Entity</th>
                <th className="py-2.5 px-3">Primary Bank & Branch</th>
                <th className="py-2.5 px-3 text-right">Flagged Volume</th>
                <th className="py-2.5 px-3 text-center">Smurf Count</th>
                <th className="py-2.5 px-3 text-center">Mule Hops</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {benchmarks.map((b) => (
                <tr key={b.case_id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-foreground">{b.case_id}</td>
                  <td className="py-2.5 px-3 font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px]" title={b.suspect_name}>
                    {b.suspect_name}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px]" title={b.primary_bank}>
                    {b.primary_bank}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                    ₹{b.flagged_volume_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">{b.structuring_count}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{b.mule_hops}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                      {b.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SARAnalyticsPage;
