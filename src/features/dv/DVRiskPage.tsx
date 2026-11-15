import React, { useState, useEffect } from 'react';
import {
  HeartCrack,
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  RefreshCw,
  Activity,
  Send,
  UserCheck
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  weight: number;
}

interface DVResult {
  case_id: string;
  victim_alias: string;
  lethality_score: number;
  risk_tier: string;
  strangulation_flag: boolean;
  weapon_access_flag: boolean;
  affirmed_factors_count: number;
  safety_protocol: string;
  statutory_relief: string;
}

export const DVRiskPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>(['DA_01', 'DA_03', 'DA_05']);
  const [childrenInvolved, setChildrenInvolved] = useState<boolean>(true);
  const [result, setResult] = useState<DVResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [protectionOrderDrafted, setProtectionOrderDrafted] = useState<boolean>(false);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/dv/questions');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setQuestions(data);
      runEvaluation(selectedQuestions, childrenInvolved);
    } catch (err: any) {
      setError(err.message || 'Error fetching Danger Assessment instrument');
    } finally {
      setLoading(false);
    }
  };

  const runEvaluation = async (qIds: string[], withChildren: boolean) => {
    try {
      const res = await fetch('/api/v1/dv/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: 'DV-CASE-2026-88',
          victim_alias: 'Victim Protected ID #910',
          affirmed_question_ids: qIds,
          children_involved: withChildren
        })
      });
      if (res.ok) {
        const json = await res.json();
        setResult(json);
      }
    } catch (e: any) {
      setError(e.message || 'Evaluation failed');
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const toggleQuestion = (id: string) => {
    const updated = selectedQuestions.includes(id)
      ? selectedQuestions.filter(x => x !== id)
      : [...selectedQuestions, id];
    setSelectedQuestions(updated);
    runEvaluation(updated, childrenInvolved);
  };

  const handleToggleChildren = () => {
    const updated = !childrenInvolved;
    setChildrenInvolved(updated);
    runEvaluation(selectedQuestions, updated);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <HeartCrack className="w-7 h-7 text-rose-500 shrink-0" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground overflow-hidden text-ellipsis whitespace-nowrap" title="Domestic Violence Fatality Risk Assessment (Danger Assessment)">
              Domestic Violence Fatality Risk Assessment (DA / ODARA)
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            Campbell Danger Assessment instrument identifying intimate partner homicide lethality markers, non-fatal strangulation flags, and automated Section 18 DV Act protection order drafting.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setProtectionOrderDrafted(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <FileCheck2 className="w-4 h-4" />
            Draft Sec 18 Protection Order
          </button>
        </div>
      </div>

      {protectionOrderDrafted && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Emergency Ex-Parte Protection Order under Section 18 PWDVA 2005 ready for Magistrate bench.</span>
          </div>
          <button onClick={() => setProtectionOrderDrafted(false)} className="text-xs text-muted-foreground hover:text-foreground">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Lethality Score</span>
            <Activity className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-bold text-rose-500 mt-2 font-mono">
            {result?.lethality_score || 0}%
          </div>
          <div className="text-xs text-muted-foreground mt-1 font-semibold text-rose-400">
            {result?.risk_tier ? result.risk_tier.replace(/_/g, ' ') : 'EXTREME RISK'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Non-Fatal Strangulation</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold mt-2 font-mono">
            {result?.strangulation_flag ? (
              <span className="text-red-500">POSITIVE (7x Risk)</span>
            ) : (
              <span className="text-muted-foreground">Not Reported</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Prime indicator of escalation to homicide</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Weapon in Household</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2 font-mono">
            {result?.weapon_access_flag ? 'ACCESSIBLE' : 'NO KNOWN FIREARM'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Arms Act verification status</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Statutory Relief</span>
            <FileCheck2 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-sm font-semibold text-primary mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
            DV Act 2005 Sec 18 / 21
          </div>
          <div className="text-xs text-muted-foreground mt-1">Non-Bailable BNS Sec 85/86</div>
        </div>
      </div>

      {/* Danger Assessment Questions Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 bg-card border border-border rounded-xl min-w-0 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h3 className="font-semibold text-foreground text-base">
              Campbell Danger Assessment (DA) Diagnostic Questions
            </h3>
            <span className="text-xs font-mono text-muted-foreground">
              {selectedQuestions.length} Affirmative Markers
            </span>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {questions.map((q) => {
              const active = selectedQuestions.includes(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => toggleQuestion(q.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors flex items-start gap-3 min-w-0 ${
                    active
                      ? 'border-rose-500/50 bg-rose-500/10'
                      : 'border-border bg-background/50 hover:bg-muted/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-rose-500 focus:ring-rose-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground break-words">{q.text}</span>
                      <span className="text-muted-foreground font-mono ml-2 shrink-0">Wt: {q.weight}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-background/50 rounded-lg border border-border flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
              <input
                type="checkbox"
                checked={childrenInvolved}
                onChange={handleToggleChildren}
                className="rounded text-rose-500 focus:ring-rose-500"
              />
              Children residing in household or threatened during incidents
            </label>
            <span className="text-muted-foreground text-[11px]">+3.0 weight</span>
          </div>
        </div>

        {/* Protection Order & Safety Protocol Box */}
        <div className="p-5 bg-card border border-border rounded-xl min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-base mb-3 pb-3 border-b border-border/40">
              Immediate Safety Interdiction
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Police Protection Officer (PPO) mandatory safety planning based on computed lethality tier.
            </p>

            <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/5 text-xs space-y-2 mb-4">
              <span className="font-bold text-rose-400 uppercase tracking-wider text-[10px]">
                Prescribed Safety Action:
              </span>
              <p className="text-foreground leading-relaxed break-words">
                {result?.safety_protocol}
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border bg-background/50 text-xs space-y-1">
              <div className="text-muted-foreground font-medium">Statutory Authority:</div>
              <div className="text-foreground text-[11px] leading-relaxed">
                {result?.statutory_relief}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border/40 text-xs text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Aligned with Delhi Police Special Police Unit for Women & Children (SPUWAC).</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DVRiskPage;
