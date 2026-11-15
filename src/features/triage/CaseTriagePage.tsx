import React, { useState, useEffect } from 'react';
import {
  ListFilter,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  UserCheck,
  Send,
  Zap
} from 'lucide-react';

interface QueueItem {
  case_id: string;
  offense_category: string;
  solvability_score: number;
  priority_tier: string;
  assigned_io: string;
  golden_hour_countdown: string;
  status: string;
}

interface TriageResult {
  case_id: string;
  offense_category: string;
  solvability_score: number;
  priority_tier: string;
  hours_since_incident: number;
  factors_present_count: number;
  recommended_dispatch_action: string;
  perishable_leads_alert: string[];
  statutory_mandate: string;
}

export const CaseTriagePage: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Diagnostic interactive factors
  const [selectedFactors, setSelectedFactors] = useState<string[]>([
    'vehicle_license_plate',
    'cctv_footage_available',
    'cooperative_eyewitness'
  ]);
  const [hoursElapsed, setHoursElapsed] = useState<number>(3.5);
  const [activeResult, setActiveResult] = useState<TriageResult | null>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);

  const availableFactors = [
    { id: 'named_suspect', label: 'Named Suspect / Identified by Name', weight: 30 },
    { id: 'vehicle_license_plate', label: 'Vehicle License Plate Number (ANPR Sighting)', weight: 20 },
    { id: 'cctv_footage_available', label: 'CCTV / Optical Video Footage Recovered', weight: 18 },
    { id: 'identifiable_physical_evidence', label: 'Physical Forensics (DNA / Latent Fingerprints)', weight: 15 },
    { id: 'cooperative_eyewitness', label: 'Cooperative Eyewitness Available', weight: 12 },
    { id: 'unique_modus_operandi', label: 'Unique Modus Operandi (Signature MO)', weight: 10 },
    { id: 'traceable_stolen_property', label: 'Traceable Stolen Property (IMEI / Serial)', weight: 8 }
  ];

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/triage/queue');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setQueue(data || []);
      runEvaluation(selectedFactors, hoursElapsed);
    } catch (err: any) {
      setError(err.message || 'Error communicating with Case Triage service');
    } finally {
      setLoading(false);
    }
  };

  const runEvaluation = async (factors: string[], hours: number) => {
    setEvaluating(true);
    try {
      const res = await fetch('/api/v1/triage/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: 'FIR-2026-DIAGNOSTIC',
          offense_category: 'Armed Commercial Robbery',
          present_factors: factors,
          hours_since_occurrence: hours
        })
      });
      if (res.ok) {
        const json = await res.json();
        setActiveResult(json);
      }
    } catch (e: any) {
      setError(e.message || 'Evaluation error');
    } finally {
      setEvaluating(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const toggleFactor = (id: string) => {
    const updated = selectedFactors.includes(id)
      ? selectedFactors.filter(f => f !== id)
      : [...selectedFactors, id];
    setSelectedFactors(updated);
    runEvaluation(updated, hoursElapsed);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ListFilter className="w-7 h-7 text-indigo-400 shrink-0" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground overflow-hidden text-ellipsis whitespace-nowrap" title="AI-Powered Case Solvability & Priority Triage Engine">
              AI-Powered Case Solvability & Priority Triage
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            RAND Corporation Solvability Factors and UK National Decision Model triage scoring cases (0-100%) and prioritizing perishable golden-hour investigative actions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchQueue}
            className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-muted text-foreground rounded-lg text-sm font-medium border border-border transition-all whitespace-nowrap shrink-0"
            title="Refresh Triage Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
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
            <span>Solvability Score</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 mt-2 font-mono">
            {activeResult?.solvability_score || 0}%
          </div>
          <div className="text-xs text-muted-foreground mt-1 font-semibold text-emerald-300">
            {activeResult?.priority_tier}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Golden Hour Window</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2 font-mono">
            {hoursElapsed}h Elapsed
          </div>
          <div className="text-xs text-amber-300 mt-1">Perishable Leads Active</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Factors Present</span>
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {selectedFactors.length} of {availableFactors.length} Leads
          </div>
          <div className="text-xs text-muted-foreground mt-1">High solvability density</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Statutory Mandate</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-semibold text-emerald-400 mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
            Sec 173 BNSS 2023
          </div>
          <div className="text-xs text-muted-foreground mt-1">Cognizable FIR Priority Triage</div>
        </div>
      </div>

      {/* Interactive Solvability Calculator & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 bg-card border border-border rounded-xl min-w-0 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h3 className="font-semibold text-foreground text-base">
              RAND Corporation Solvability Factors Checklist
            </h3>
            <span className="text-xs font-mono text-muted-foreground">
              Dynamic Weighting
            </span>
          </div>

          <div className="space-y-2.5">
            {availableFactors.map((fac) => {
              const active = selectedFactors.includes(fac.id);
              return (
                <div
                  key={fac.id}
                  onClick={() => toggleFactor(fac.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors flex items-center justify-between min-w-0 ${
                    active
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-border bg-background/50 hover:bg-muted/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => {}}
                      className="rounded text-emerald-500 focus:ring-emerald-500 shrink-0"
                    />
                    <span className="font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap" title={fac.label}>
                      {fac.label}
                    </span>
                  </div>
                  <span className="text-muted-foreground font-mono shrink-0 ml-2">+{fac.weight} pts</span>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-background/50 rounded-lg border border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Incident Golden-Hour Decay Horizon:</span>
            <div className="flex items-center gap-3">
              {[2, 8, 24, 72].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  onClick={() => {
                    setHoursElapsed(hrs);
                    runEvaluation(selectedFactors, hrs);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    hoursElapsed === hrs
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-secondary text-secondary-foreground hover:bg-muted'
                  }`}
                >
                  {hrs}h
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Triage Decision Advisory Box */}
        <div className="p-5 bg-card border border-border rounded-xl min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-base mb-3 pb-3 border-b border-border/40">
              Investigative Directive
            </h3>

            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs space-y-2 mb-4">
              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">
                Recommended Action:
              </span>
              <p className="text-foreground leading-relaxed break-words">
                {activeResult?.recommended_dispatch_action}
              </p>
            </div>

            {activeResult && activeResult.perishable_leads_alert.length > 0 && (
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs space-y-1.5 mb-3">
                <span className="font-bold text-amber-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Perishable Leads Expiring:
                </span>
                <ul className="space-y-1 text-muted-foreground">
                  {activeResult.perishable_leads_alert.map((alert, i) => (
                    <li key={i} className="break-words">&bull; {alert}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border/40 text-xs text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Aligned with UK NDM Solvability Matrix.</span>
          </div>
        </div>
      </div>

      {/* Active Triage Queue Table */}
      <div className="p-5 bg-card border border-border rounded-xl min-w-0">
        <h3 className="font-semibold text-foreground text-base mb-3">
          District Live Case Triage & IO Dispatch Queue
        </h3>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="py-2.5 px-3">FIR ID</th>
                <th className="py-2.5 px-3">Offense Category</th>
                <th className="py-2.5 px-3 text-right">Solvability</th>
                <th className="py-2.5 px-3">Priority Tier</th>
                <th className="py-2.5 px-3">Assigned IO</th>
                <th className="py-2.5 px-3">Golden Hour Timer</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {queue.map((item) => (
                <tr key={item.case_id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-foreground">{item.case_id}</td>
                  <td className="py-2.5 px-3 font-medium text-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px]" title={item.offense_category}>
                    {item.offense_category}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                    {item.solvability_score}%
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                      item.priority_tier.includes('TIER 1')
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : item.priority_tier.includes('TIER 2')
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {item.priority_tier}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]" title={item.assigned_io}>
                    {item.assigned_io}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-amber-400 font-semibold">{item.golden_hour_countdown}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                      {item.status.replace(/_/g, ' ')}
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

export default CaseTriagePage;
