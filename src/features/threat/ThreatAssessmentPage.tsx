import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  CheckCircle2,
  RefreshCw,
  Activity,
  Layers,
  Shield,
  UserX,
  FileText
} from 'lucide-react';

interface BehavioralItem {
  id: string;
  name: string;
  weight: number;
  desc?: string;
}

interface ThreatResult {
  subject_id: string;
  subject_name: string;
  threat_index: number;
  priority_tier: string;
  proximal_behaviors_count: number;
  distal_characteristics_count: number;
  proximal_matches: BehavioralItem[];
  distal_matches: BehavioralItem[];
  recommended_action: string;
  statutory_compliance: string;
}

export const ThreatAssessmentPage: React.FC = () => {
  const [subjectId, setSubjectId] = useState<string>('SUBJ-DEL-2026-99');
  const [subjectName, setSubjectName] = useState<string>('Ramesh alias Lone-Operative');
  const [proximalList, setProximalList] = useState<BehavioralItem[]>([]);
  const [distalList, setDistalList] = useState<BehavioralItem[]>([]);
  const [selectedProximal, setSelectedProximal] = useState<string[]>(['PROX_01', 'PROX_02', 'PROX_06']);
  const [selectedDistal, setSelectedDistal] = useState<string[]>(['DIST_01', 'DIST_02', 'DIST_09']);
  const [result, setResult] = useState<ThreatResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/threat/framework-metadata');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProximalList(data.proximal_warning_behaviors || []);
      setDistalList(data.distal_characteristics || []);
      // Calculate initial assessment
      runAssessment(selectedProximal, selectedDistal);
    } catch (err: any) {
      setError(err.message || 'Error fetching TRAP-18 behavioral framework');
    } finally {
      setLoading(false);
    }
  };

  const runAssessment = async (prox: string[], dist: string[]) => {
    try {
      const res = await fetch('/api/v1/threat/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: subjectId,
          subject_name: subjectName,
          active_proximal_ids: prox,
          active_distal_ids: dist
        })
      });
      if (res.ok) {
        const json = await res.json();
        setResult(json);
      }
    } catch (e: any) {
      setError(e.message || 'Assessment evaluation error');
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  const toggleProximal = (id: string) => {
    const updated = selectedProximal.includes(id)
      ? selectedProximal.filter(x => x !== id)
      : [...selectedProximal, id];
    setSelectedProximal(updated);
    runAssessment(updated, selectedDistal);
  };

  const toggleDistal = (id: string) => {
    const updated = selectedDistal.includes(id)
      ? selectedDistal.filter(x => x !== id)
      : [...selectedDistal, id];
    setSelectedDistal(updated);
    runAssessment(selectedProximal, updated);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Flame className="w-7 h-7 text-red-500 shrink-0" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground overflow-hidden text-ellipsis whitespace-nowrap" title="Threat Assessment & Targeted Violence Protocol (TRAP-18)">
              Threat Assessment & Targeted Violence Protocol (TRAP-18)
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            Terrorist Radicalization Assessment Protocol (TRAP-18) & WAVR-21 violence prediction evaluating 8 Proximal Warning Behaviors and 10 Distal Characteristics for preventive interdiction.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => runAssessment(selectedProximal, selectedDistal)}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium border border-red-500/30 transition-all whitespace-nowrap shrink-0"
            title="Recalculate Threat Index"
          >
            <RefreshCw className="w-4 h-4" />
            Recalculate
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{error}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Threat Index</span>
            <Activity className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-red-400 mt-2 font-mono">
            {result?.threat_index || 0}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Priority: <strong className="text-red-300">{result?.priority_tier ? result.priority_tier.replace(/_/g, ' ') : 'CRITICAL PRIORITY'}</strong>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Proximal Behaviors</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {result?.proximal_behaviors_count || 0} of 8 Triggered
          </div>
          <div className="text-xs text-muted-foreground mt-1">High-urgency attack pathway markers</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Distal Characteristics</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {result?.distal_characteristics_count || 0} of 10 Present
          </div>
          <div className="text-xs text-muted-foreground mt-1">Background vulnerability factors</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Preventive Legal Power</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-semibold text-emerald-400 mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
            Sec 170 BNSS / Sec 111
          </div>
          <div className="text-xs text-muted-foreground mt-1">Preventive Custody Authorization</div>
        </div>
      </div>

      {/* Assessment Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 8 Proximal Warning Behaviors Checkbox Panel */}
        <div className="p-5 bg-card border border-border rounded-xl min-w-0 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-foreground text-base">
                8 Proximal Warning Behaviors (TRAP-18)
              </h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground">High Urgency</span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {proximalList.map((p) => {
              const active = selectedProximal.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => toggleProximal(p.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors flex items-start gap-3 min-w-0 ${
                    active
                      ? 'border-red-500/50 bg-red-500/10'
                      : 'border-border bg-background/50 hover:bg-muted/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-red-500 focus:ring-red-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-foreground overflow-hidden text-ellipsis whitespace-nowrap" title={p.name}>
                        {p.name}
                      </span>
                      <span className="text-muted-foreground font-mono">Weight: {p.weight}</span>
                    </div>
                    {p.desc && <p className="text-muted-foreground mt-0.5 line-clamp-2">{p.desc}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 10 Distal Characteristics Checkbox Panel */}
        <div className="p-5 bg-card border border-border rounded-xl min-w-0 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-foreground text-base">
                10 Distal Characteristics (Historical & Psychological)
              </h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground">Background Profile</span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {distalList.map((d) => {
              const active = selectedDistal.includes(d.id);
              return (
                <div
                  key={d.id}
                  onClick={() => toggleDistal(d.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors flex items-start gap-3 min-w-0 ${
                    active
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : 'border-border bg-background/50 hover:bg-muted/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-foreground overflow-hidden text-ellipsis whitespace-nowrap" title={d.name}>
                        {d.name}
                      </span>
                      <span className="text-muted-foreground font-mono">Weight: {d.weight}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recommended Tactical Intervention Action */}
      {result && (
        <div className="p-5 bg-card border border-red-500/30 rounded-xl min-w-0 space-y-3">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-base">
            <ShieldAlert className="w-5 h-5" />
            Tactical Intervention Protocol & Legal Action Plan
          </div>
          <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 text-xs space-y-2 min-w-0">
            <div className="text-foreground font-bold text-sm">
              Operational Recommendation:
            </div>
            <p className="text-red-200 leading-relaxed break-words">
              {result.recommended_action}
            </p>
            <div className="pt-2 text-muted-foreground border-t border-red-500/20 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Statutory Alignment: {result.statutory_compliance}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreatAssessmentPage;
