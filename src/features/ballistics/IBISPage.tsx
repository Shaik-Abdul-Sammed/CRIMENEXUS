import React, { useState, useEffect } from 'react';
import {
  Focus,
  SplitSquareVertical,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Sliders,
  Shield,
  Layers,
  FileCheck
} from 'lucide-react';

interface CandidateHit {
  candidate_id: string;
  scene_fir: string;
  firearm_type: string;
  caliber: string;
  correlation_score: number;
  breech_face_match: boolean;
  firing_pin_impression_match: boolean;
  confidence_tier: string;
  status: string;
}

export const IBISPage: React.FC = () => {
  const [specimenId, setSpecimenId] = useState<string>('EXP-CAS-2026-09');
  const [caliber, setCaliber] = useState<string>('9mm Parabellum');
  const [striationPitch, setStriationPitch] = useState<number>(0.125);
  const [hits, setHits] = useState<CandidateHit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [opticalSplitSlider, setOpticalSplitSlider] = useState<number>(50);

  const runBallisticsMatch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/ibis/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specimen_id: specimenId,
          caliber: caliber,
          rifling_lands: 6,
          twist_direction: 'RIGHT',
          striation_pitch_mm: striationPitch
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHits(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Ballistic cross-correlation error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runBallisticsMatch();
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Focus className="w-7 h-7 text-sky-400 shrink-0" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground overflow-hidden text-ellipsis whitespace-nowrap" title="Integrated Ballistics Identification System (IBIS / BrassTrax)">
              Integrated Ballistics Identification System (IBIS)
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            Automated 2D/3D microscopic striation and breech face impression comparison matching recovered cartridge casings against unsolved crime scenes nationwide.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={runBallisticsMatch}
            className="flex items-center gap-2 px-3 py-2 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 rounded-lg text-sm font-medium border border-sky-500/30 transition-all whitespace-nowrap shrink-0"
            title="Recalculate Cross-Correlation"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Run MatchPoint Engine
          </button>
        </div>
      </div>

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
            <span>Query Specimen</span>
            <Focus className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-lg font-bold text-foreground mt-2 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
            {specimenId}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{caliber}</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Highest Correlation</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 mt-2 font-mono">
            {hits.length > 0 ? `${hits[0].correlation_score}%` : '—'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Conclusive Striation Overlap</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Microscopic Pitch</span>
            <Sliders className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2 font-mono">
            {striationPitch} mm
          </div>
          <div className="text-xs text-muted-foreground mt-1">Breech Face Toolmark Width</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Evidence Standard</span>
            <FileCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="text-sm font-semibold text-primary mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
            BSA 2023 Sec 39 / FSL
          </div>
          <div className="text-xs text-muted-foreground mt-1">Court Admissible Forensic Proof</div>
        </div>
      </div>

      {/* Comparison Microscope Split Screen Visualizer */}
      <div className="p-5 bg-card border border-border rounded-xl min-w-0 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <SplitSquareVertical className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-foreground text-base">
              Dual-Field Comparison Microscope (Optical Hairline Alignment)
            </h3>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Magnification: 40&times; Confocal Optical
          </span>
        </div>

        <div className="min-h-[320px] bg-background/80 rounded-lg border border-border/50 p-4 relative flex flex-col justify-between overflow-hidden">
          {/* Microscopic Split View Representation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 items-center">
            {/* Left Casing (Evidence from Crime Scene) */}
            <div className="p-4 rounded-lg bg-card border border-sky-500/30 flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Field A: Evidence Specimen ({specimenId})
              </span>
              <div className="w-32 h-32 rounded-full border-4 border-dashed border-sky-400/50 flex items-center justify-center bg-sky-950/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#38bdf8_0,#38bdf8_1px,transparent_0,transparent_8px)] opacity-30" />
                <span className="text-xs font-mono font-bold text-foreground relative z-10">
                  Breech Face
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                Firing Pin Impression: Centerfire Circular
              </span>
            </div>

            {/* Right Casing (Candidate Match from Cold Case FIR) */}
            <div className="p-4 rounded-lg bg-card border border-emerald-500/30 flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Field B: Database Candidate ({hits[0]?.candidate_id || 'IBIS-REF'})
              </span>
              <div className="w-32 h-32 rounded-full border-4 border-dashed border-emerald-400/50 flex items-center justify-center bg-emerald-950/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#34d399_0,#34d399_1px,transparent_0,transparent_8px)] opacity-30" />
                <span className="text-xs font-mono font-bold text-foreground relative z-10">
                  Striation Match
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                FIR: {hits[0]?.scene_fir || 'Benchmark'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <span>Cross-Correlation Match Score: <strong className="text-emerald-400">{hits[0]?.correlation_score || 0}%</strong></span>
            <span>Hairline Lock: Verified</span>
          </div>
        </div>
      </div>

      {/* Candidate Matches Table */}
      <div className="p-5 bg-card border border-border rounded-xl min-w-0">
        <h3 className="font-semibold text-foreground text-base mb-3">
          Automated MatchPoint Ranking Roster
        </h3>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="py-2.5 px-3">Candidate ID</th>
                <th className="py-2.5 px-3">Linked Shooting FIR</th>
                <th className="py-2.5 px-3">Suspected Firearm</th>
                <th className="py-2.5 px-3">Caliber</th>
                <th className="py-2.5 px-3 text-right">Correlation Score</th>
                <th className="py-2.5 px-3 text-center">Breech Face</th>
                <th className="py-2.5 px-3 text-center">Firing Pin</th>
                <th className="py-2.5 px-3">Confidence Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {hits.map((hit) => (
                <tr key={hit.candidate_id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-foreground">{hit.candidate_id}</td>
                  <td className="py-2.5 px-3 font-medium text-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]" title={hit.scene_fir}>
                    {hit.scene_fir}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">{hit.firearm_type}</td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">{hit.caliber}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                    {hit.correlation_score}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {hit.breech_face_match ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 whitespace-nowrap">
                        MATCHED
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {hit.firing_pin_impression_match ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 whitespace-nowrap">
                        MATCHED
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                      {hit.confidence_tier.replace(/_/g, ' ')}
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

export default IBISPage;
