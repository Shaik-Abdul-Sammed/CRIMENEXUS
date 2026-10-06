import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { NodeSingular } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import fcose from 'cytoscape-fcose';
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Search,
  Filter,
  X,
  FileCheck2,
  Download,
  Sliders,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useNetworkGraph } from '../../hooks/useIntelligenceApi';
import { Entity, Relationship } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

try {
  cytoscape.use(dagre);
  cytoscape.use(fcose);
} catch {
  // Already registered
}

export function NetworkGraphPage() {
  const { data: graphData, isLoading } = useNetworkGraph('ALL');
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const [selectedNode, setSelectedNode] = useState<Entity | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Relationship | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityTypeFilter, setSelectedEntityTypeFilter] = useState<string>('ALL');
  const [selectedLayout, setSelectedLayout] = useState<string>('cose');
  const [minConfidence, setMinConfidence] = useState<number>(0.5);
  const [hideLowConfidence, setHideLowConfidence] = useState<boolean>(false);

  useEffect(() => {
    if (!containerRef.current || !graphData?.nodes || !graphData?.edges) return;

    const cyNodes = graphData.nodes.map((n) => ({
      data: {
        id: n.id,
        label: n.name,
        type: n.type,
        riskLevel: n.riskLevel,
        confidence: n.confidence,
        raw: n,
      },
    }));

    const cyEdges = graphData.edges.map((e) => ({
      data: {
        id: e.id,
        source: e.sourceEntityId,
        target: e.targetEntityId,
        label: e.type,
        confidence: e.confidenceScore,
        raw: e,
      },
    }));

    const cy = cytoscape({
      container: containerRef.current,
      elements: [...cyNodes, ...cyEdges],
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            color: '#f8fafc',
            'font-size': '11px',
            'font-weight': 'bold',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'background-color': (ele: NodeSingular) => {
              const type = ele.data('type');
              if (type === 'PERSON') return '#3b82f6';
              if (type === 'PHONE') return '#f59e0b';
              if (type === 'VEHICLE') return '#a855f7';
              if (type === 'BANK_ACCOUNT') return '#10b981';
              if (type === 'ORGANIZATION') return '#f97316';
              if (type === 'CRYPTO_WALLET') return '#eab308';
              if (type === 'LOCATION') return '#06b6d4';
              return '#64748b';
            },
            width: (ele: NodeSingular) => (ele.data('riskLevel') === 'CRITICAL' ? 38 : 28),
            height: (ele: NodeSingular) => (ele.data('riskLevel') === 'CRITICAL' ? 38 : 28),
            'border-width': 2,
            'border-color': '#ffffff',
            'border-opacity': 0.8,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#3b82f6',
            'overlay-color': '#3b82f6',
            'overlay-opacity': 0.3,
          },
        },
        {
          selector: 'edge',
          style: {
            label: 'data(label)',
            width: 2,
            'line-color': '#475569',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            color: '#94a3b8',
            'font-size': '9px',
            'text-rotation': 'autorotate',
            'text-margin-y': -8,
          },
        },
        {
          selector: 'edge:selected',
          style: {
            width: 4,
            'line-color': '#3b82f6',
            'target-arrow-color': '#3b82f6',
          },
        },
      ],
      layout: {
        name: selectedLayout,
        animate: false,
        padding: 40,
      } as cytoscape.LayoutOptions,
    });

    cy.on('tap', 'node', (evt) => {
      const nodeData = evt.target.data('raw') as Entity;
      setSelectedNode(nodeData);
      setSelectedEdge(null);
    });

    cy.on('tap', 'edge', (evt) => {
      const edgeData = evt.target.data('raw') as Relationship;
      setSelectedEdge(edgeData);
      setSelectedNode(null);
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [graphData, selectedLayout]);

  useEffect(() => {
    if (!cyRef.current || !searchTerm.trim()) return;
    const cy = cyRef.current;
    const term = searchTerm.toLowerCase();
    const matched = cy.nodes().filter((n) => n.data('label').toLowerCase().includes(term));
    if (matched.length > 0) {
      cy.animate({
        center: { eles: matched.first() },
        zoom: 1.5,
        duration: 400,
      });
      matched.first().select();
    }
  }, [searchTerm]);

  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    cy.batch(() => {
      cy.nodes().forEach((n) => {
        const type = n.data('type');
        const conf = n.data('confidence') || 1;
        const matchesType = selectedEntityTypeFilter === 'ALL' || type === selectedEntityTypeFilter;
        const matchesConf = !hideLowConfidence || conf >= minConfidence;

        if (matchesType && matchesConf) {
          n.style('display', 'element');
        } else {
          n.style('display', 'none');
        }
      });

      cy.edges().forEach((e) => {
        const sourceVisible = e.source().style('display') !== 'none';
        const targetVisible = e.target().style('display') !== 'none';
        const conf = e.data('confidence') || 1;
        const matchesConf = !hideLowConfidence || conf >= minConfidence;

        if (sourceVisible && targetVisible && matchesConf) {
          e.style('display', 'element');
        } else {
          e.style('display', 'none');
        }
      });
    });
  }, [selectedEntityTypeFilter, minConfidence, hideLowConfidence]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() / 1.2);
  const handleFit = () => cyRef.current?.fit();
  const handleReset = () => {
    cyRef.current?.elements().style('display', 'element');
    cyRef.current?.layout({ name: selectedLayout, animate: true } as cytoscape.LayoutOptions).run();
    setSelectedEntityTypeFilter('ALL');
    setSearchTerm('');
    setHideLowConfidence(false);
    setMinConfidence(0.5);
  };

  const handleExpandNeighbors = () => {
    if (!cyRef.current || !selectedNode) return;
    const cy = cyRef.current;
    const nodeEl = cy.getElementById(selectedNode.id);
    const neighbors = nodeEl.neighborhood();
    neighbors.style('display', 'element');
    cy.fit(neighbors, 50);
  };

  const handleExportPNG = () => {
    if (!cyRef.current) return;
    const png64 = cyRef.current.png({ full: true, bg: '#090d16' });
    const link = document.createElement('a');
    link.download = `CRIMENEXUS_Network_Graph_${Date.now()}.png`;
    link.href = png64;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" />
            HERO: Interactive Criminal Network Topology (Cytoscape.js Engine)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Multi-entity network relationship discovery, edge inspection, and neighbor traversal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleZoomIn} icon={<ZoomIn className="h-4 w-4" />}>
            Zoom In
          </Button>
          <Button size="sm" variant="outline" onClick={handleZoomOut} icon={<ZoomOut className="h-4 w-4" />}>
            Zoom Out
          </Button>
          <Button size="sm" variant="outline" onClick={handleFit} icon={<Maximize2 className="h-4 w-4" />}>
            Fit View
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset} icon={<RefreshCw className="h-4 w-4" />}>
            Reset Layout
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportPNG} icon={<Download className="h-4 w-4" />}>
            Export PNG
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card">
            <div className="w-full md:w-64">
              <Input
                placeholder="Search node label..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold text-muted-foreground">Type:</span>
                <select
                  value={selectedEntityTypeFilter}
                  onChange={(e) => setSelectedEntityTypeFilter(e.target.value)}
                  className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                >
                  <option value="ALL">ALL ENTITIES</option>
                  <option value="PERSON">PERSON</option>
                  <option value="PHONE">PHONE</option>
                  <option value="VEHICLE">VEHICLE</option>
                  <option value="BANK_ACCOUNT">BANK ACCOUNT</option>
                  <option value="ORGANIZATION">ORGANIZATION</option>
                  <option value="CRYPTO_WALLET">CRYPTO WALLET</option>
                  <option value="LOCATION">LOCATION</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 border-l border-border pl-2">
                <Sliders className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold text-muted-foreground">Layout:</span>
                <select
                  value={selectedLayout}
                  onChange={(e) => setSelectedLayout(e.target.value)}
                  className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                >
                  <option value="cose">Force CoSE</option>
                  <option value="dagre">Dagre Hierarchical</option>
                  <option value="circle">Circular</option>
                  <option value="concentric">Concentric</option>
                  <option value="grid">Grid Layout</option>
                </select>
              </div>

              <div className="flex items-center gap-2 border-l border-border pl-2">
                <button
                  onClick={() => setHideLowConfidence(!hideLowConfidence)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors ${
                    hideLowConfidence
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-semibold'
                      : 'bg-background border-border text-muted-foreground'
                  }`}
                >
                  {hideLowConfidence ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>Min Conf: {(minConfidence * 100).toFixed(0)}%</span>
                </button>
                {hideLowConfidence && (
                  <input
                    type="range"
                    min="0.5"
                    max="0.99"
                    step="0.05"
                    value={minConfidence}
                    onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                    className="w-20 accent-primary cursor-pointer"
                  />
                )}
              </div>
            </div>
          </div>

          <Card className="relative h-[650px] overflow-hidden border-primary/30 bg-slate-950">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 text-xs text-slate-400">
                Initializing Cytoscape graph topology engine...
              </div>
            )}
            <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            <div className="absolute bottom-4 left-4 p-3 rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-md text-[10px] space-y-1.5 select-none shadow-xl">
              <span className="font-bold text-slate-300 block mb-1">Topology Legend</span>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-400">PERSON (Suspect / Mule)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-400">PHONE (Target SIM / CDR)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-400">BANK ACCOUNT (HDFC / Mule)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                <span className="text-slate-400">VEHICLE (ANPR Toll Match)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                <span className="text-slate-400">ORGANIZATION (Shell Firm)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                <span className="text-slate-400">CRYPTO WALLET (USDT Off-Ramp)</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {selectedNode ? (
            <Card className="border-primary/40">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">Entity Inspector</CardTitle>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <Badge variant="outline">{selectedNode.type}</Badge>
                  <h3 className="text-base font-extrabold text-foreground mt-1">{selectedNode.name}</h3>
                </div>

                <div className="p-3 rounded-lg bg-background/60 border border-border space-y-1 text-[11px]">
                  {Object.entries(selectedNode.attributes).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-border/40 pb-1">
                      <span className="text-muted-foreground capitalize">{k}:</span>
                      <span className="font-semibold text-foreground truncate max-w-[120px]">{String(v)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Confidence Score:</span>
                  <span className="font-bold text-foreground">{(selectedNode.confidence * 100).toFixed(0)}%</span>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <Button className="w-full" size="sm" onClick={handleExpandNeighbors}>
                    Expand Immediate Neighbors
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedEdge ? (
            <Card className="border-amber-500/40">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">Relationship Inspector</CardTitle>
                <button
                  onClick={() => setSelectedEdge(null)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <span className="font-mono text-xs text-amber-400 font-bold block">{selectedEdge.type}</span>
                  <h4 className="text-sm font-semibold text-foreground mt-1">
                    {selectedEdge.sourceEntityName || 'Source'} &rarr; {selectedEdge.targetEntityName || 'Target'}
                  </h4>
                </div>

                <div className="p-3 rounded-lg bg-background/60 border border-border space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confidence Score:</span>
                    <span className="font-bold text-foreground">
                      {(selectedEdge.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verification:</span>
                    <span className="font-semibold text-emerald-400">{selectedEdge.reviewStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Logged Date:</span>
                    <span className="text-foreground">{new Date(selectedEdge.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-foreground block">Linked Evidence Artifacts:</span>
                  <div className="flex items-center gap-1 text-[11px] text-primary">
                    <FileCheck2 className="h-3.5 w-3.5" />
                    <span>{selectedEdge.evidenceIds.join(', ')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-6 text-center space-y-3 text-muted-foreground">
              <Network className="h-8 w-8 text-primary mx-auto opacity-50" />
              <p className="text-xs">
                Click any node or relationship edge in the Cytoscape canvas to inspect properties, confidence scores, and grounded evidence.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
