import React, { useState, useEffect } from 'react';
import {
  Share2,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Users,
  Target,
  RefreshCw,
  Info,
  CheckCircle2,
  Layers,
  Zap
} from 'lucide-react';

interface GangNode {
  id: string;
  name: string;
  role: string;
  type: string;
}

interface RemovalImpact {
  node_id: string;
  name: string;
  role: string;
  is_cut_point: boolean;
  betweenness: number;
  degree_centrality: number;
  clustering_coef: number;
  components_after_removal: number;
  removal_impact_score: number;
  recommendation: string;
}

interface GangIntelligence {
  gang_id: string;
  name: string;
  operating_area: string;
  threat_level: string;
  raw_graph: {
    nodes: GangNode[];
    edges: Array<{ source: string; target: string; weight: number; relation: string }>;
  };
  network_metrics: {
    total_nodes: number;
    total_edges: number;
    density: number;
    initial_components: number;
  };
  cut_points: string[];
  removal_impact: RemovalImpact[];
}

export const SNAGangsPage: React.FC = () => {
  const [selectedGang, setSelectedGang] = useState<string>('GANG-NCR-01');
  const [data, setData] = useState<GangIntelligence | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [simulatedRemovedNode, setSimulatedRemovedNode] = useState<string | null>(null);

  const fetchGangData = async (gangId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/sna/gangs/${gangId}`);
      if (!res.ok) {
        throw new Error(`Failed to load syndicate intelligence: HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error communicating with SNA graph service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGangData(selectedGang);
    setSimulatedRemovedNode(null);
  }, [selectedGang]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Share2 className="w-7 h-7 text-amber-400 shrink-0" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight break-words" title="Social Network Analysis for Gang Intervention">
              Social Network Analysis (SNA) for Gang Intervention
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            Mathematical topology and cut-point (articulation) identification for targeted leadership disruption and network fragmentation.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <select
            value={selectedGang}
            onChange={(e) => setSelectedGang(e.target.value)}
            className="bg-card border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 whitespace-nowrap"
          >
            <option value="GANG-NCR-01">Lawrence-Bishnoi Trans-State Syndicate (NCR-01)</option>
            <option value="GANG-BOMBAY-02">D-Company Extortion & Hawala Remnants (BOM-02)</option>
          </select>
          <button
            onClick={() => fetchGangData(selectedGang)}
            className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg text-sm font-medium border border-amber-500/30 transition-all whitespace-nowrap shrink-0"
            title="Refresh Network Graph"
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

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-card/50 rounded-xl border border-border/50">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <span className="text-sm text-muted-foreground">Synthesizing network topology and calculating articulation points...</span>
        </div>
      ) : data ? (
        <>
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                <span>Active Syndicate</span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="text-lg font-bold text-foreground mt-2 overflow-hidden text-ellipsis whitespace-nowrap" title={data.name}>
                {data.name}
              </div>
              <div className="text-xs text-muted-foreground mt-1 overflow-hidden text-ellipsis whitespace-nowrap" title={data.operating_area}>
                {data.operating_area}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                <span>Network Size</span>
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-foreground mt-2">
                {data.network_metrics.total_nodes} Nodes / {data.network_metrics.total_edges} Edges
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Density: {data.network_metrics.density} (Initial: {data.network_metrics.initial_components} component)
              </div>
            </div>

            <div className="p-4 rounded-xl bg-card border border-red-500/30 bg-red-500/5 shadow-sm min-w-0">
              <div className="flex items-center justify-between text-red-400 text-xs font-semibold uppercase tracking-wider">
                <span>Cut-Points (Bridges)</span>
                <ShieldAlert className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-400 mt-2">
                {data.cut_points.length} Critical Targets
              </div>
              <div className="text-xs text-red-300 mt-1 overflow-hidden text-ellipsis whitespace-nowrap" title={data.cut_points.join(', ')}>
                IDs: {data.cut_points.join(', ')}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                <span>Statutory Mandate</span>
                <Target className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-sm font-semibold text-emerald-400 mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
                MCOCA / UAPA Sec 18 / BNSS Sec 111
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Organized Crime Disruption Authority
              </div>
            </div>
          </div>

          {/* Interactive Topology & Simulation Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Node Graph Simulation Canvas */}
            <div className="lg:col-span-2 p-5 bg-card border border-border rounded-xl min-w-0 flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <h3 className="font-semibold text-foreground text-base">
                    Network Topology Visualizer & Disruption Simulator
                  </h3>
                </div>
                {simulatedRemovedNode && (
                  <button
                    onClick={() => setSimulatedRemovedNode(null)}
                    className="text-xs px-2.5 py-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded border border-border whitespace-nowrap shrink-0"
                  >
                    Reset Simulation
                  </button>
                )}
              </div>

              {/* Node layout canvas */}
              <div className="min-h-[340px] bg-background/50 rounded-lg border border-border/40 p-4 relative flex flex-wrap items-center justify-around gap-6">
                {data.raw_graph.nodes.map((node) => {
                  const isCutPoint = data.cut_points.includes(node.id);
                  const isRemoved = simulatedRemovedNode === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSimulatedRemovedNode(isRemoved ? null : node.id)}
                      className={`cursor-pointer transition-all p-3 rounded-lg border flex flex-col items-center justify-center min-w-[130px] max-w-[160px] text-center shadow-md select-none ${
                        isRemoved
                          ? 'opacity-30 border-dashed border-red-500 line-through bg-red-950/20'
                          : isCutPoint
                          ? 'border-red-500 bg-red-500/10 hover:bg-red-500/20 shadow-red-500/20'
                          : 'border-border bg-card/80 hover:bg-card'
                      }`}
                      title={`Click to simulate arrest/removal of ${node.name} (${node.role})`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {isCutPoint && (
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        )}
                        <span className="text-xs font-mono font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[100px]" title={node.id}>
                          {node.id}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap w-full" title={node.name}>
                        {node.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2" title={node.role}>
                        {node.role}
                      </span>
                      {isCutPoint && (
                        <span className="mt-2 text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded font-semibold whitespace-nowrap">
                          CUT-POINT
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground px-1">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/40 border border-red-500" />
                    Cut-Point (Bridge)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-card border border-border" />
                    Standard Operative
                  </span>
                </div>
                <span className="italic">Click any node to simulate neutralized status</span>
              </div>
            </div>

            {/* Tactical Action Recommendation Panel */}
            <div className="p-5 bg-card border border-border rounded-xl min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/40">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="font-semibold text-foreground text-base">Tactical Interdiction Strategy</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Prioritizing custody or neutralization of articulation nodes isolates operatives into disconnected cells, denying cross-jurisdictional weapon supply lines and hawala routes.
                </p>

                <div className="space-y-3">
                  {data.removal_impact.slice(0, 3).map((item, idx) => (
                    <div
                      key={item.node_id}
                      className={`p-3 rounded-lg border text-xs min-w-0 ${
                        item.is_cut_point
                          ? 'border-red-500/40 bg-red-500/10'
                          : 'border-border bg-background/50'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[140px]" title={item.name}>
                          #{idx + 1} {item.name}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.is_cut_point ? 'bg-red-500/30 text-red-300' : 'bg-secondary text-secondary-foreground'
                        }`}>
                          Score: {item.removal_impact_score}
                        </span>
                      </div>
                      <div className="text-muted-foreground mt-1 flex justify-between">
                        <span>Role: {item.role}</span>
                        <span>Betweenness: {item.betweenness}</span>
                      </div>
                      <div className="mt-2 text-[11px] font-medium text-amber-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Action: {item.recommendation.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 text-xs text-muted-foreground flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span>Statutory clearance under BNSS Section 111 & UAPA Sec 18 ready for magistrate submission.</span>
              </div>
            </div>
          </div>

          {/* Node Centrality & Removal Impact Table */}
          <div className="p-5 bg-card border border-border rounded-xl min-w-0">
            <h3 className="font-semibold text-foreground text-base mb-3">
              Full Network Roster & Neutralization Impact Metrics
            </h3>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Node ID</th>
                    <th className="py-2.5 px-3">Operative Name</th>
                    <th className="py-2.5 px-3">Syndicate Role</th>
                    <th className="py-2.5 px-3 text-center">Articulation Cut-Point</th>
                    <th className="py-2.5 px-3 text-right">Betweenness</th>
                    <th className="py-2.5 px-3 text-right">Degree</th>
                    <th className="py-2.5 px-3 text-right">Impact Score</th>
                    <th className="py-2.5 px-3">Tactical Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {data.removal_impact.map((item) => (
                    <tr key={item.node_id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-foreground">{item.node_id}</td>
                      <td className="py-2.5 px-3 font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[160px]" title={item.name}>
                        {item.name}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">{item.role}</td>
                      <td className="py-2.5 px-3 text-center">
                        {item.is_cut_point ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 whitespace-nowrap">
                            CRITICAL CUT-POINT
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{item.betweenness}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{item.degree_centrality}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                        {item.removal_impact_score}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                          item.is_cut_point ? 'bg-red-500/20 text-red-300' : 'bg-secondary text-secondary-foreground'
                        }`}>
                          {item.recommendation.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default SNAGangsPage;
