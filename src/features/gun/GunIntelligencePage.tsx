import React, { useState, useEffect } from 'react';
import {
  Crosshair,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  Share2,
  Clock,
  Layers,
  FileCheck
} from 'lucide-react';

interface FirearmTrace {
  trace_id: string;
  serial_number: string;
  make: string;
  model: string;
  caliber: string;
  recovery_fir: string;
  recovery_location: string;
  first_purchaser: string;
  first_retail_date: string;
  recovery_date: string;
  time_to_crime_days: number;
  is_straw_purchase: boolean;
  linked_shooting_scenes: string[];
  trafficking_nexus: string;
  status: string;
}

export const GunIntelligencePage: React.FC = () => {
  const [traces, setTraces] = useState<FirearmTrace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTraces = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/gun-intelligence/traces');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTraces(data.traces || []);
    } catch (err: any) {
      setError(err.message || 'Error communicating with Crime Gun Intelligence Center');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraces();
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Crosshair className="w-7 h-7 text-amber-500 shrink-0" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight break-words" title="Crime Gun Intelligence Center (CGIC & eTrace)">
              Crime Gun Intelligence Center (CGIC & eTrace)
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            ATF-style ballistic provenance and serial tracing tracking illegal arms trafficking rings, rapid "time-to-crime" straw purchases, and multi-scene shooting linkages under Arms Act 1959.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchTraces}
            className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-muted text-foreground rounded-lg text-sm font-medium border border-border transition-all whitespace-nowrap shrink-0"
            title="Refresh Firearm Traces"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
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
            <span>Recovered Weapons</span>
            <Crosshair className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{traces.length} Weapons</div>
          <div className="text-xs text-muted-foreground mt-1">Cross-jurisdiction eTrace sync</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-red-500/30 bg-red-500/5 shadow-sm min-w-0">
          <div className="flex items-center justify-between text-red-400 text-xs font-semibold uppercase tracking-wider">
            <span>Straw Purchases</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">
            {traces.filter(t => t.is_straw_purchase).length} High-Risk
          </div>
          <div className="text-xs text-red-300 mt-1">Time-To-Crime &lt; 90 days</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Shooting Scene Links</span>
            <Share2 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">Multiple Hits</div>
          <div className="text-xs text-muted-foreground mt-1">Matched to active unsolved FIRs</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Arms Act Authority</span>
            <FileCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-semibold text-emerald-400 mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
            Sec 25(1AA) Arms Act
          </div>
          <div className="text-xs text-muted-foreground mt-1">Prohibited Bore Arms Prosecution</div>
        </div>
      </div>

      {/* Recovered Weapon Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {traces.map((trace) => (
          <div
            key={trace.trace_id}
            className={`p-5 rounded-xl border flex flex-col justify-between shadow-sm min-w-0 space-y-4 ${
              trace.is_straw_purchase ? 'bg-card border-red-500/40' : 'bg-card border-border'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
                <span className="font-mono font-bold text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                  {trace.serial_number}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                  trace.is_straw_purchase
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  {trace.is_straw_purchase ? 'STRAW PURCHASE FLAG' : 'TRACE COMPLETE'}
                </span>
              </div>

              <div className="mt-3">
                <div className="text-base font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap" title={`${trace.make} ${trace.model}`}>
                  {trace.make} &bull; {trace.model}
                </div>
                <div className="text-xs font-mono text-muted-foreground mt-0.5">
                  Caliber: {trace.caliber} | Recovery FIR: {trace.recovery_fir}
                </div>
              </div>

              <div className="mt-3 p-3 rounded-lg bg-background/50 border border-border/40 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time-to-Crime (TTC):</span>
                  <span className={`font-mono font-bold ${trace.time_to_crime_days < 90 ? 'text-red-400' : 'text-foreground'}`}>
                    {trace.time_to_crime_days} Days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Retail Date:</span>
                  <span className="font-mono">{trace.first_retail_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recovery Date:</span>
                  <span className="font-mono">{trace.recovery_date}</span>
                </div>
                <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={trace.first_purchaser}>
                  <span className="text-muted-foreground">Initial Purchaser:</span> <strong className="text-foreground">{trace.first_purchaser}</strong>
                </div>
              </div>

              <div className="mt-3 text-xs">
                <span className="font-semibold text-foreground">Linked Shooting Incidents:</span>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  {trace.linked_shooting_scenes.map((scene, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">{scene}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-border/40 text-xs flex items-center justify-between">
              <span className="text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[240px]" title={trace.trafficking_nexus}>
                Nexus: {trace.trafficking_nexus}
              </span>
              <button className="text-amber-400 hover:text-amber-300 font-semibold whitespace-nowrap shrink-0">
                Full eTrace Dossier &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GunIntelligencePage;
