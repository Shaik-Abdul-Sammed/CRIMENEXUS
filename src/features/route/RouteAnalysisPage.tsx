import React, { useState, useEffect } from 'react';
import {
  Compass,
  MapPin,
  Route,
  Activity,
  AlertCircle,
  RefreshCw,
  Layers,
  CheckCircle2,
  Sliders,
  Shield
} from 'lucide-react';

interface AnchorNode {
  id: string;
  label: string;
  lat: number;
  lon: number;
}

interface Corridor {
  from_node: string;
  to_node: string;
  distance_km: number;
}

interface CrimeAnalyzed {
  crime_id: string;
  offense: string;
  lat: number;
  lon: number;
  min_corridor_dist_km: number;
  inside_awareness_buffer: boolean;
  theoretical_fit: string;
}

interface RouteAnalysisResult {
  offender_id: string;
  anchor_nodes: AnchorNode[];
  corridors: Corridor[];
  buffer_radius_km: number;
  total_crimes: number;
  crimes_inside_buffer: number;
  crime_overlap_percentage: number;
  directional_bias: string;
  theory_validation: string;
  crimes_analyzed: CrimeAnalyzed[];
}

export const RouteAnalysisPage: React.FC = () => {
  const [offenderId, setOffenderId] = useState<string>('SUSP-DEL-8921');
  const [bufferKm, setBufferKm] = useState<number>(2.5);
  const [data, setData] = useState<RouteAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/route-analysis/${offenderId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error running Crime Pattern Theory route analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [offenderId]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Route className="w-7 h-7 text-indigo-400 shrink-0" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground overflow-hidden text-ellipsis whitespace-nowrap" title="Crime Pattern Theory Route Analysis">
              Crime Pattern Theory Route Analysis
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            Brantingham Awareness Space modeling — projects offender activity nodes (Home, Work, Recreation), travel corridors, and directional bias to predict next target zones.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchAnalysis}
            className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-muted text-foreground rounded-lg text-sm font-medium border border-border transition-all whitespace-nowrap shrink-0"
            title="Recalculate Corridors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Recalculate
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{error}</span>
        </div>
      )}

      {/* Control & Theory Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Target Offender</span>
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-foreground mt-2 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
            {offenderId}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Serial Burglary & Snatching</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Awareness Congruence</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {data?.crime_overlap_percentage || 0}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {data?.crimes_inside_buffer} of {data?.total_crimes} crimes inside corridor
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Directional Bias</span>
            <Compass className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-bold text-amber-400 mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
            {data?.directional_bias.replace(/_/g, ' ') || 'CALCULATING...'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">West &rarr; Central Delhi Axis</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Buffer Horizon</span>
            <Sliders className="w-4 h-4 text-primary" />
          </div>
          <div className="text-lg font-bold text-foreground mt-2 font-mono">
            {bufferKm} km Radius
          </div>
          <div className="text-xs text-muted-foreground mt-1">Activity space corridor boundary</div>
        </div>
      </div>

      {/* Main Analysis Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spatial Awareness & Corridors View */}
        <div className="lg:col-span-2 p-5 bg-card border border-border rounded-xl min-w-0 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-foreground text-base">
                Anchor Nodes & Travel Corridor Network
              </h3>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {data?.corridors.length || 0} Primary Corridors
            </span>
          </div>

          <div className="min-h-[300px] bg-background/50 rounded-lg border border-border/40 p-4 relative flex flex-col justify-between">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {data?.anchor_nodes.map((node) => (
                <div key={node.id} className="p-3 bg-card border border-indigo-500/30 rounded-lg text-xs min-w-0">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold mb-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">{node.id}</span>
                  </div>
                  <div className="text-foreground font-medium overflow-hidden text-ellipsis whitespace-nowrap" title={node.label}>
                    {node.label}
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground mt-1">
                    {node.lat}, {node.lon}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 p-3 bg-card/60 rounded border border-border">
              <div className="text-xs font-semibold text-foreground mb-1">Inter-Anchor Travel Corridors:</div>
              {data?.corridors.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono text-foreground">{c.from_node} &harr; {c.to_node}</span>
                  <span className="font-mono">{c.distance_km} km highway segment</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-border/30 text-xs text-muted-foreground flex items-center justify-between">
              <span>Brantingham Theoretical Fit: <strong className="text-emerald-400">{data?.theory_validation}</strong></span>
              <span>Awareness Buffer: &plusmn;{bufferKm} km</span>
            </div>
          </div>
        </div>

        {/* Predictive Patrol Advisory */}
        <div className="p-5 bg-card border border-border rounded-xl min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-base mb-3 pb-3 border-b border-border/40">
              Patrol Interception Strategy
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Offenders overwhelmingly strike along familiar travel paths between anchor nodes rather than venturing into unfamiliar territory.
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/5 text-xs">
                <div className="font-semibold text-indigo-300">High-Probability Strike Corridor</div>
                <div className="text-muted-foreground mt-1">
                  Kirti Nagar &rarr; Karol Bagh route (Metro Blue Line / Patel Rd Corridor).
                </div>
              </div>
              <div className="p-3 rounded-lg border border-border bg-background/50 text-xs">
                <div className="font-semibold text-foreground">Target Hardening Window</div>
                <div className="text-muted-foreground mt-1">
                  18:00 - 22:00 IST peak transit during return commute from repair workshop.
                </div>
              </div>
              <div className="p-3 rounded-lg border border-border bg-background/50 text-xs">
                <div className="font-semibold text-foreground">ANPR Camera Checkpoints</div>
                <div className="text-muted-foreground mt-1">
                  Shadipur Flyover ANPR-04 & Pusa Road Camera 12 alerted.
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border/40 text-xs text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Aligned with Delhi Police Strategic Crime Analysis Unit SOPs.</span>
          </div>
        </div>
      </div>

      {/* Analyzed Crimes Table */}
      <div className="p-5 bg-card border border-border rounded-xl min-w-0">
        <h3 className="font-semibold text-foreground text-base mb-3">
          Linked Crime FIRs & Awareness Space Proximity
        </h3>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="py-2.5 px-3">FIR ID</th>
                <th className="py-2.5 px-3">Offense Category</th>
                <th className="py-2.5 px-3">Coordinates</th>
                <th className="py-2.5 px-3 text-right">Distance to Corridor</th>
                <th className="py-2.5 px-3 text-center">Inside Awareness Buffer</th>
                <th className="py-2.5 px-3 text-center">Pattern Fit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data?.crimes_analyzed.map((c) => (
                <tr key={c.crime_id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-foreground">{c.crime_id}</td>
                  <td className="py-2.5 px-3 text-foreground">{c.offense}</td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">{c.lat}, {c.lon}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium">{c.min_corridor_dist_km} km</td>
                  <td className="py-2.5 px-3 text-center">
                    {c.inside_awareness_buffer ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                        INSIDE BUFFER
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                        OUTSIDE (&gt;{bufferKm}km)
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                      c.theoretical_fit === 'HIGH' ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {c.theoretical_fit}
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

export default RouteAnalysisPage;
