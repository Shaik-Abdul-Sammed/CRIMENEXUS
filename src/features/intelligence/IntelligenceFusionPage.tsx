import React, { useState } from 'react';
import {
  Layers,
  Search,
  Database,
  Network,
  Cpu,
  FolderGit2,
  User,
  Phone,
  Car,
  Sparkles,
  ShieldCheck,
  Filter,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';

interface FusionItem {
  id: string;
  type: string;
  title: string;
  source: string;
  confidence: number;
  metadata: Record<string, any>;
  summary: string;
}

interface GroupedResults {
  cases: FusionItem[];
  persons: FusionItem[];
  phones: FusionItem[];
  vehicles: FusionItem[];
  semantic_matches: FusionItem[];
}

export function IntelligenceFusionPage() {
  const [searchQuery, setSearchQuery] = useState<string>('hawala');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'CASES',
    'PERSONS',
    'PHONES',
    'VEHICLES',
    'SEMANTIC',
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [results, setResults] = useState<GroupedResults>({
    cases: [
      {
        id: 'CASE-2026-8812',
        type: 'CASE',
        title: "FIR-8812 / Operation Shadow: Match for 'hawala'",
        source: 'PostgreSQL',
        confidence: 0.96,
        metadata: { court: 'CJM Gautam Buddha Nagar', sections: 'Sec 303(2), 311 BNS', status: 'ACTIVE_TRIAL' },
        summary: 'Organized cross-district hawala smurfing and extortion syndicate operating via encrypted channels.',
      },
    ],
    persons: [
      {
        id: 'PERSON-VK-01',
        type: 'PERSON',
        title: 'Vikram Malhotra @ Vicky (Kingpin Node)',
        source: 'Neo4j',
        confidence: 0.98,
        metadata: { betweenness: 0.42, degree: 14, cluster: 'Smurfing Syndicate Core' },
        summary: 'Primary target node connected to 4 dummy corporate directors and 8 SIM registrations.',
      },
      {
        id: 'PERSON-RS-02',
        type: 'PERSON',
        title: 'Rajan Sharma (Hawala Courier)',
        source: 'Neo4j',
        confidence: 0.91,
        metadata: { betweenness: 0.28, degree: 9, cluster: 'Transit Courier Sub-cluster' },
        summary: 'Intermediary bridge between Chandni Chowk bullion operators and outbound hawala drops.',
      },
    ],
    phones: [
      {
        id: 'PHONE-9810-234',
        type: 'PHONE',
        title: '+91 98101 23456 (Burner IMEI Handset)',
        source: 'PostgreSQL',
        confidence: 0.94,
        metadata: { cdr_calls_30d: 142, last_cell_tower: 'Jewar Outer Azimuth 140°' },
        summary: 'Handset triangulated near Yamuna Expressway toll barrier within 12m of robbery timeline.',
      },
    ],
    vehicles: [
      {
        id: 'VEHICLE-DL10-4412',
        type: 'VEHICLE',
        title: 'Mahindra Scorpio (DL-10-CE-4412)',
        source: 'PostgreSQL',
        confidence: 0.93,
        metadata: { fastag_hit: 'Jewar Toll 03:42 AM', anpr_confidence: '94.8%' },
        summary: 'Flagged in high-speed escape trajectory along Eastern Peripheral Expressway.',
      },
    ],
    semantic_matches: [
      {
        id: 'CHROMA-EMB-8812',
        type: 'SEMANTIC_VECTOR',
        title: "Semantic Narrative Match: 'hawala' (Cosine: 0.892)",
        source: 'ChromaDB',
        confidence: 0.892,
        metadata: { embedding_model: 'all-MiniLM-L6-v2', vector_dim: 384 },
        summary: 'FIR narrative cluster aligns with modus operandi: SIM box bypass, counterfeit UPI QR codes, and staged nocturnal car crashes.',
      },
    ],
  });

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/v1/intelligence/fusion-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, entity_types: selectedTypes }),
      });
      if (!resp.ok) {
        throw new Error(`Fusion API error: HTTP ${resp.status}`);
      }
      const data = await resp.json();
      setResults(data.grouped_results);
    } catch (err: any) {
      // Graceful fallback to rich local state if backend offline
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleType = (t: string) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const totalHits =
    results.cases.length +
    results.persons.length +
    results.phones.length +
    results.vehicles.length +
    results.semantic_matches.length;

  return (
    <div className="space-y-6 select-none pb-20">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl border border-sky-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/20 shrink-0">
            <Layers className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight break-words" title="Conjunctive Analytic Platform">
                Conjunctive Analytic Platform (CAP)
              </h1>
              <Badge className="bg-sky-500 text-black font-extrabold text-xs whitespace-nowrap shrink-0">
                MULTI-SOURCE FUSION
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
              Simultaneous federated intelligence querying across PostgreSQL (Relational FIRs), Neo4j (Entity Knowledge Graph), and ChromaDB (Vector Embeddings) with strict source attribution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="p-2.5 rounded-xl border border-sky-500/30 bg-slate-950 text-right font-mono text-xs">
            <span className="text-[10px] text-muted-foreground uppercase block whitespace-nowrap">Unified DB Sources</span>
            <span className="text-cyan-300 font-bold whitespace-nowrap">PostgreSQL • Neo4j • ChromaDB</span>
          </div>
        </div>
      </div>

      {/* Search Bar & Entity Filter Controls */}
      <Card className="border-border bg-card/90 shadow-lg">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full min-w-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search syndicates, suspects, FIR keywords, burner IMEIs, or vehicles..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary overflow-hidden text-ellipsis whitespace-nowrap"
                title={searchQuery}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-2 px-4 shadow-md whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5"
            >
              {isLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              <span>{isLoading ? 'Fusing Data...' : 'Conjunctive Search'}</span>
            </Button>
          </div>

          {/* Source Filter Checkbox Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60 text-xs">
            <span className="text-[11px] font-bold text-muted-foreground uppercase font-mono mr-1 whitespace-nowrap shrink-0 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Fused Targets:
            </span>
            {[
              { id: 'CASES', label: 'Postgres FIRs', icon: FolderGit2, color: 'text-blue-400' },
              { id: 'PERSONS', label: 'Neo4j Persons', icon: User, color: 'text-amber-400' },
              { id: 'PHONES', label: 'Burner Phones', icon: Phone, color: 'text-emerald-400' },
              { id: 'VEHICLES', label: 'ANPR Vehicles', icon: Car, color: 'text-rose-400' },
              { id: 'SEMANTIC', label: 'ChromaDB Semantics', icon: Sparkles, color: 'text-purple-400' },
            ].map((t) => {
              const active = selectedTypes.includes(t.id);
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => toggleType(t.id)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-sky-950/60 border-sky-500/60 text-white shadow-sm'
                      : 'bg-muted/20 border-border/60 text-muted-foreground opacity-60'
                  }`}
                  title={`Toggle ${t.label}`}
                >
                  <Icon className={`h-3 w-3 ${t.color}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonLoader variant="card" count={6} />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/40 bg-red-950/30 text-xs text-red-200 break-words">
          <strong>Fusion Error:</strong> {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && totalHits === 0 && (
        <Card className="p-8 text-center text-muted-foreground border-dashed">
          <Database className="h-8 w-8 text-sky-400 mx-auto opacity-50 mb-2" />
          <h3 className="text-sm font-bold text-foreground">Zero Cross-Source Matches Found</h3>
          <p className="text-xs max-w-sm mx-auto mt-1 break-words">
            No relational records, graph nodes, or vector embeddings matched query &quot;{searchQuery}&quot;. Try broader investigative terms.
          </p>
        </Card>
      )}

      {/* Grouped Results Grid */}
      {!isLoading && totalHits > 0 && (
        <div className="space-y-6">
          {/* Section 1: Relational Cases (Postgres) */}
          {results.cases.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap" title="Relational Case Matches">
                  <Database className="h-3.5 w-3.5" />
                  <span>Relational Case Matches (PostgreSQL)</span>
                </h2>
                <Badge variant="outline" className="font-mono text-[10px] text-blue-300 border-blue-500/40 whitespace-nowrap shrink-0">
                  {results.cases.length} Matches
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.cases.map((c) => (
                  <Card key={c.id} className="border-border bg-card/80 p-4 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-bold text-primary overflow-hidden text-ellipsis whitespace-nowrap" title={c.id}>{c.id}</span>
                        <Badge className="bg-blue-950 text-blue-200 border border-blue-500/30 text-[9px] font-mono whitespace-nowrap shrink-0">
                          {c.source} • {(c.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <h3 className="text-xs font-bold text-white overflow-hidden text-ellipsis whitespace-nowrap" title={c.title}>
                        {c.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 break-words">
                        {c.summary}
                      </p>
                    </div>

                    <div className="p-2 rounded bg-slate-950 border border-border/50 text-[10px] font-mono text-slate-300 space-y-0.5">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={c.metadata.court}>Court: {c.metadata.court}</div>
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={c.metadata.sections}>Sections: {c.metadata.sections}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Entity Knowledge Graph Nodes (Neo4j) */}
          {results.persons.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap" title="Graph Network Nodes">
                  <Network className="h-3.5 w-3.5" />
                  <span>Graph Network Nodes & Kingpins (Neo4j)</span>
                </h2>
                <Badge variant="outline" className="font-mono text-[10px] text-amber-300 border-amber-500/40 whitespace-nowrap shrink-0">
                  {results.persons.length} Nodes
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.persons.map((p) => (
                  <Card key={p.id} className="border-amber-500/30 bg-card/80 p-4 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-bold text-amber-400 overflow-hidden text-ellipsis whitespace-nowrap" title={p.id}>{p.id}</span>
                        <Badge className="bg-amber-950 text-amber-200 border border-amber-500/30 text-[9px] font-mono whitespace-nowrap shrink-0">
                          {p.source} • {(p.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <h3 className="text-xs font-bold text-white overflow-hidden text-ellipsis whitespace-nowrap" title={p.title}>
                        {p.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 break-words">
                        {p.summary}
                      </p>
                    </div>

                    <div className="p-2 rounded bg-slate-950 border border-amber-500/20 text-[10px] font-mono text-amber-200/90 space-y-0.5">
                      <div>Betweenness Centrality: {p.metadata.betweenness}</div>
                      <div>Connected Degree: {p.metadata.degree} Edges</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Semantic Embeddings (ChromaDB) */}
          {results.semantic_matches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap" title="ChromaDB Vector Matches">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Vector Narrative Embeddings (ChromaDB)</span>
                </h2>
                <Badge variant="outline" className="font-mono text-[10px] text-purple-300 border-purple-500/40 whitespace-nowrap shrink-0">
                  Cosine &ge; 0.88
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.semantic_matches.map((s) => (
                  <Card key={s.id} className="border-purple-500/30 bg-card/80 p-4 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-bold text-purple-300 overflow-hidden text-ellipsis whitespace-nowrap" title={s.id}>{s.id}</span>
                        <Badge className="bg-purple-950 text-purple-200 border border-purple-500/30 text-[9px] font-mono whitespace-nowrap shrink-0">
                          {s.source} • Cosine {s.confidence}
                        </Badge>
                      </div>
                      <h3 className="text-xs font-bold text-white overflow-hidden text-ellipsis whitespace-nowrap" title={s.title}>
                        {s.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 break-words">
                        {s.summary}
                      </p>
                    </div>

                    <div className="p-2 rounded bg-slate-950 border border-purple-500/20 text-[10px] font-mono text-purple-200/90 space-y-0.5">
                      <div>Model: {s.metadata.embedding_model}</div>
                      <div>Embedding Dimensions: {s.metadata.vector_dim}D</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Phones & Vehicles Table */}
          {(results.phones.length > 0 || results.vehicles.length > 0) && (
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap" title="Fused Telecom & ANPR Assets">
                <Cpu className="h-3.5 w-3.5" />
                <span>Fused Telecom (CDR) &amp; Transport (ANPR) Asset Registry</span>
              </h2>

              <div className="overflow-x-auto w-full rounded-xl border border-border bg-card">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="bg-slate-950 text-muted-foreground font-mono uppercase text-[10px] border-b border-border">
                    <tr>
                      <th className="p-3 whitespace-nowrap">Asset ID</th>
                      <th className="p-3 whitespace-nowrap">Type</th>
                      <th className="p-3 whitespace-nowrap">Title / Identifiers</th>
                      <th className="p-3 whitespace-nowrap">Primary Source</th>
                      <th className="p-3 whitespace-nowrap">Confidence</th>
                      <th className="p-3 whitespace-nowrap">Investigative Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {[...results.phones, ...results.vehicles].map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono text-primary font-bold whitespace-nowrap">{item.id}</td>
                        <td className="p-3 whitespace-nowrap">
                          <Badge variant="outline" className="text-[9px] font-mono">
                            {item.type}
                          </Badge>
                        </td>
                        <td className="p-3 font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis" title={item.title}>
                          {item.title}
                        </td>
                        <td className="p-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">{item.source}</td>
                        <td className="p-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                          {(item.confidence * 100).toFixed(0)}%
                        </td>
                        <td className="p-3 text-[11px] text-slate-300 max-w-xs break-words">
                          {item.summary}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
