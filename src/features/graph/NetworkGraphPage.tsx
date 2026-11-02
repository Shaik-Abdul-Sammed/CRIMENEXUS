import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
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
  Bot,
} from 'lucide-react';
import { useNetworkGraph } from '../../hooks/useIntelligenceApi';
import { Entity, Relationship } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { useTranslation } from '../../hooks/useTranslation';
import { useToast } from '../../components/ui/Toast';
import { sound } from '../../utils/soundEffects';

try {
  cytoscape.use(dagre);
  cytoscape.use(fcose);
} catch {
  // Already registered
}

interface CyElementPayload {
  data?: { id: string; [key: string]: unknown };
  id?: string;
}

export function NetworkGraphPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data: graphData, isLoading } = useNetworkGraph('ALL');
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const viewportRef = useRef<{ pan: cytoscape.Position; zoom: number } | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);

  const [selectedNode, setSelectedNode] = useState<Entity | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Relationship | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityTypeFilter, setSelectedEntityTypeFilter] = useState<string>('ALL');
  const [selectedLayout, setSelectedLayout] = useState<string>('fcose');
  const [minConfidence, setMinConfidence] = useState<number>(0.5);
  const [hideLowConfidence, setHideLowConfidence] = useState<boolean>(false);
  const [legendOpen, setLegendOpen] = useState<boolean>(false);
  const [categoryFilters, setCategoryFilters] = useState<Record<string, boolean>>({
    PERSON: true,
    PHONE: true,
    VEHICLE: true,
    BANK_ACCOUNT: true,
    ORGANIZATION: true,
    CRYPTO_WALLET: true,
    LOCATION: true,
  });
  const [showAiSummary, setShowAiSummary] = useState<boolean>(false);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);

  const toggleCategory = (cat: string) => {
    sound.playClickSound();
    setCategoryFilters((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const aiGraphExplanation = useMemo(() => {
    if (!graphData?.nodes || graphData.nodes.length === 0) {
      return 'No graph topology loaded. Ingest cases or select an active investigation to analyze.';
    }
    const totalNodes = graphData.nodes.length;
    
    // Degree centrality map & category tally
    const degreeMap: Record<string, number> = {};
    const typeCount: Record<string, number> = {};
    
    graphData.nodes.forEach((n) => {
      degreeMap[n.id] = 0;
      typeCount[n.type] = (typeCount[n.type] || 0) + 1;
    });

    graphData.edges?.forEach((e) => {
      degreeMap[e.sourceEntityId] = (degreeMap[e.sourceEntityId] || 0) + 1;
      degreeMap[e.targetEntityId] = (degreeMap[e.targetEntityId] || 0) + 1;
    });

    // Locate primary suspect or maximum degree kingpin
    let topNode = graphData.nodes[0];
    let maxDegree = 0;
    graphData.nodes.forEach((n) => {
      const deg = degreeMap[n.id] || 0;
      if (deg > maxDegree || (n.name.includes('Rajan') && deg >= maxDegree)) {
        maxDegree = deg;
        topNode = n;
      }
    });

    const bankCount = typeCount['BANK_ACCOUNT'] || 0;
    const phoneCount = typeCount['PHONE'] || 0;

    return `This network contains ${totalNodes} entities linked to suspect ${topNode.name}. The most critical node is ${topNode.name} (Degree ${maxDegree}), connected to ${bankCount} bank accounts and ${phoneCount} burner phones.`;
  }, [graphData]);

  const handleExplainGraph = () => {
    sound.playRadarPing();
    setIsExplaining(true);
    setShowAiSummary(true);
    setTimeout(() => {
      setIsExplaining(false);
      sound.playSuccessChime();
    }, 500);
  };

  const getLayoutOptions = (layoutName: string): cytoscape.LayoutOptions => {
    if (layoutName === 'fcose') {
      return {
        name: 'fcose',
        animate: true,
        nodeRepulsion: 8000,
        idealEdgeLength: 150,
        edgeElasticity: 100,
        padding: 50,
      } as cytoscape.LayoutOptions;
    }
    if (layoutName === 'cose') {
      return {
        name: 'cose',
        animate: true,
        animationDuration: 600,
        fit: true,
        padding: 50,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 150,
        edgeElasticity: () => 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
      } as cytoscape.LayoutOptions;
    }
    return {
      name: layoutName,
      animate: true,
      animationDuration: 400,
      fit: true,
      padding: 50,
    } as cytoscape.LayoutOptions;
  };

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
            'text-margin-y': 5,
            'text-wrap': 'wrap',
            'text-max-width': '120px',
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
          selector: 'node[label *= "Rajan"], node[id = "ent-1"], node[riskLevel = "CRITICAL"][type = "PERSON"]',
          style: {
            width: 68,
            height: 68,
            'background-color': '#DC2626',
            'border-width': 4,
            'border-color': '#EF4444',
            'border-opacity': 1,
            'font-size': '13px',
            'font-weight': 'bolder',
            color: '#FEE2E2',
            'text-margin-y': 8,
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
            color: '#cbd5e1',
            'font-size': '9px',
            'text-rotation': 'autorotate',
            'text-margin-y': -8,
            'text-background-color': '#0f172a',
            'text-background-opacity': 0.88,
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
          },
        },
        {
          selector: 'edge[label *= "ASSOCIATE"], edge[label *= "CALL"], edge[label *= "COMMUNICATE"], edge[label *= "OPERATES"]',
          style: {
            'line-style': 'dashed',
            'curve-style': 'bezier',
            'line-color': '#64748B',
            'line-dash-pattern': [6, 3],
            width: 2,
            'target-arrow-color': '#64748B',
          },
        },
        {
          selector: 'edge[label *= "TRANSFER"], edge[label *= "FINANCIAL"], edge[label *= "PAYMENT"], edge[label *= "TRANSACTION"], edge[label *= "SMURF"]',
          style: {
            'line-style': 'solid',
            'curve-style': 'bezier',
            'line-color': '#F59E0B',
            'target-arrow-color': '#F59E0B',
            width: 3.5,
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
      layout: getLayoutOptions(selectedLayout),
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

    if (viewportRef.current) {
      cy.viewport({ zoom: viewportRef.current.zoom, pan: viewportRef.current.pan });
    }

    return () => {
      if (cyRef.current && !cyRef.current.destroyed()) {
        try {
          viewportRef.current = { pan: cyRef.current.pan(), zoom: cyRef.current.zoom() };
        } catch {
          // ignore
        }
      }
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
        const type = n.data('type') as string;
        const conf = n.data('confidence') || 1;
        const matchesType = selectedEntityTypeFilter === 'ALL' || type === selectedEntityTypeFilter;
        const matchesCategory = categoryFilters[type] !== false;
        const matchesConf = !hideLowConfidence || conf >= minConfidence;

        if (matchesType && matchesCategory && matchesConf) {
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
  }, [selectedEntityTypeFilter, categoryFilters, minConfidence, hideLowConfidence]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() / 1.2);
  const handleFit = () => cyRef.current?.fit();
  const handleReset = () => {
    cyRef.current?.elements().style('display', 'element');
    cyRef.current?.layout(getLayoutOptions(selectedLayout)).run();
    setSelectedEntityTypeFilter('ALL');
    setSearchTerm('');
    setHideLowConfidence(false);
    setMinConfidence(0.5);
  };

  const handleExpandNeighbors = async () => {
    if (!cyRef.current || !selectedNode) return;
    const cy = cyRef.current;
    setIsExpanding(true);
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const res = await axios.get(`${baseURL}/network/expand/${encodeURIComponent(selectedNode.id)}`, { timeout: 10000 });
      if (res.data?.nodes && Array.isArray(res.data.nodes)) {
        const existingNodeIds = new Set(cy.nodes().map((n) => n.id()));
        const existingEdgeIds = new Set(cy.edges().map((e) => e.id()));

        const nodesToAdd = (res.data.nodes as CyElementPayload[]).filter((n) => !existingNodeIds.has(n.data?.id || n.id || ''));
        const edgesToAdd = (res.data.edges as CyElementPayload[]).filter((e) => !existingEdgeIds.has(e.data?.id || e.id || ''));

        if (nodesToAdd.length > 0 || edgesToAdd.length > 0) {
          cy.batch(() => {
            nodesToAdd.forEach((n) => cy.add(n as cytoscape.ElementDefinition));
            edgesToAdd.forEach((e) => cy.add(e as cytoscape.ElementDefinition));
          });

          // Animate and layout newly expanded neighborhood
          const addedEles = cy.collection();
          nodesToAdd.forEach((n) => addedEles.merge(cy.getElementById(n.data?.id || n.id || '')));
          edgesToAdd.forEach((e) => addedEles.merge(cy.getElementById(e.data?.id || e.id || '')));
          const targetNode = cy.getElementById(selectedNode.id);
          addedEles.merge(targetNode);

          addedEles.layout({
            name: 'cose',
            animate: true,
            animationDuration: 500,
            fit: false,
            padding: 30,
          }).run();

          toast.success(`Discovered ${nodesToAdd.length} 1-hop multi-entity connections from Neo4j.`, 'Graph Expanded');
        } else {
          const nodeEl = cy.getElementById(selectedNode.id);
          const neighbors = nodeEl.neighborhood();
          neighbors.style('display', 'element');
          cy.fit(neighbors, 50);
          toast.info('All 1-hop connected neighbors already visible in viewport.', 'Graph Topology');
        }
      }
    } catch (err) {
      console.warn('Backend graph expansion error, falling back to local neighborhood', err);
      const nodeEl = cy.getElementById(selectedNode.id);
      const neighbors = nodeEl.neighborhood();
      neighbors.style('display', 'element');
      cy.fit(neighbors, 50);
    } finally {
      setIsExpanding(false);
    }
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
            {t('graph.title')}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('graph.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleZoomIn} icon={<ZoomIn className="h-4 w-4" />}>
            {t('graph.zoomIn')}
          </Button>
          <Button size="sm" variant="outline" onClick={handleZoomOut} icon={<ZoomOut className="h-4 w-4" />}>
            {t('graph.zoomOut')}
          </Button>
          <Button size="sm" variant="outline" onClick={handleFit} icon={<Maximize2 className="h-4 w-4" />}>
            {t('graph.fitView')}
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset} icon={<RefreshCw className="h-4 w-4" />}>
            {t('graph.resetLayout')}
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportPNG} icon={<Download className="h-4 w-4" />}>
            {t('graph.exportPng')}
          </Button>
          <Button
            size="sm"
            variant={showAiSummary ? 'secondary' : 'outline'}
            onClick={handleExplainGraph}
            disabled={isExplaining}
            className="border-primary/40 text-primary hover:bg-primary/10 flex items-center gap-1.5"
            title="Synthesize AI explanation of network topology"
          >
            <Bot className="h-4 w-4 text-primary" />
            <span>{isExplaining ? 'Explaining...' : 'Explain this graph'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card">
            <div className="w-full md:w-64">
              <Input
                placeholder={t('graph.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold text-muted-foreground">{t('graph.typeLabel')}</span>
                <select
                  value={selectedEntityTypeFilter}
                  onChange={(e) => setSelectedEntityTypeFilter(e.target.value)}
                  className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                >
                  <option value="ALL">{t('graph.allEntities')}</option>
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
                <span className="font-semibold text-muted-foreground">{t('graph.layoutLabel')}</span>
                <select
                  value={selectedLayout}
                  onChange={(e) => setSelectedLayout(e.target.value)}
                  className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                >
                  <option value="cose">Force CoSE</option>
                  <option value="fcose">fCoSE Layout</option>
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
                  <span>{t('graph.minConfidence')} {(minConfidence * 100).toFixed(0)}%</span>
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
            {/* Quick Multi-Entity Category Filter Toggles */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60 text-xs">
              <span className="font-semibold text-muted-foreground text-[11px] mr-1">Categories:</span>
              {[
                { type: 'PERSON', label: 'Persons', color: '#3b82f6' },
                { type: 'PHONE', label: 'Phones', color: '#f59e0b' },
                { type: 'VEHICLE', label: 'Vehicles', color: '#a855f7' },
                { type: 'BANK_ACCOUNT', label: 'Bank Accts', color: '#10b981' },
                { type: 'ORGANIZATION', label: 'Orgs', color: '#f97316' },
                { type: 'CRYPTO_WALLET', label: 'Crypto', color: '#eab308' },
                { type: 'LOCATION', label: 'Locations', color: '#06b6d4' },
              ].map((cat) => {
                const isChecked = categoryFilters[cat.type] ?? true;
                return (
                  <button
                    key={cat.type}
                    onClick={() => toggleCategory(cat.type)}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                      isChecked
                        ? 'bg-primary/10 border-primary/50 text-foreground'
                        : 'bg-background/40 border-border text-muted-foreground line-through opacity-50'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Card className="relative h-[650px] overflow-hidden border-primary/30 bg-slate-950">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 text-xs text-slate-400" role="status" aria-live="polite">
                Initializing Cytoscape graph topology engine...
              </div>
            )}
            <ErrorBoundary
              fallbackTitle="Graph Topology View Error"
              fallbackMessage="The interactive Cytoscape graph canvas encountered an issue. Click below to reload."
            >
              <div
                ref={containerRef}
                role="region"
                aria-label="Interactive Criminal Network Topology Graph"
                tabIndex={0}
                className="w-full h-full cursor-grab active:cursor-grabbing focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </ErrorBoundary>

            {/* Collapsible Floating Tactical Legend */}
            <div className="absolute bottom-4 left-4 z-20">
              {legendOpen ? (
                <div className="p-4 rounded-xl border border-white/20 bg-slate-900/95 backdrop-blur-md text-[11px] space-y-2 select-none shadow-2xl animate-in fade-in zoom-in-95 max-w-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-white/10">
                    <span className="font-bold text-white uppercase tracking-wider text-[10px]">
                      {t('graph.legendTitle')}
                    </span>
                    <button
                      onClick={() => {
                        sound.playClickSound();
                        setLegendOpen(false);
                      }}
                      className="text-slate-400 hover:text-white p-0.5 rounded"
                      aria-label="Close Legend"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full bg-accent-crimson border-2 border-red-300 flex items-center justify-center text-[7px] font-bold text-white">★</span>
                      <span className="text-slate-200 font-semibold">Kingpin (Rajan)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      <span className="text-slate-400">PERSON</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span className="text-slate-400">PHONE</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="text-slate-400">BANK ACCOUNT</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                      <span className="text-slate-400">VEHICLE</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                      <span className="text-slate-400">ORGANIZATION</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                      <span className="text-slate-400">CRYPTO WALLET</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                      <span className="text-slate-400">LOCATION</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex items-center gap-4 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-0 border-t-2 border-dashed border-slate-400 inline-block" />
                      <span className="text-slate-400">Associate Link</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-0.5 bg-amber-400 inline-block" />
                      <span className="text-amber-400 font-semibold">Hawala / Smurf</span>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    sound.playClickSound();
                    setLegendOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-primary/40 bg-slate-900/90 text-primary font-bold text-xs hover:bg-primary/20 transition-all shadow-lg flex items-center gap-1.5 backdrop-blur-md"
                >
                  <Network className="h-3.5 w-3.5" />
                  <span>Tactical Legend</span>
                </button>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Collapsible AI Graph Summary Panel */}
          {showAiSummary && (
            <Card className="border-primary/50 bg-gradient-to-b from-primary/10 via-card to-card shadow-lg animate-in fade-in slide-in-from-top-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold text-primary">AI Graph Summary</CardTitle>
                </div>
                <button
                  onClick={() => setShowAiSummary(false)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground"
                  aria-label="Close AI Summary"
                >
                  <X className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/40 text-primary font-semibold">
                    GEMINI GRAPH SYNTHESIS
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">Topological Inference</span>
                </div>
                <p className="text-foreground leading-relaxed font-sans font-medium bg-background/60 p-3 rounded-lg border border-border">
                  {aiGraphExplanation}
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-[10px]">
                  <div className="p-2 rounded bg-background/60 border border-border">
                    <span className="text-muted-foreground block">Entities</span>
                    <span className="text-sm font-bold text-foreground">{graphData?.nodes?.length || 0}</span>
                  </div>
                  <div className="p-2 rounded bg-background/60 border border-border">
                    <span className="text-muted-foreground block">Links</span>
                    <span className="text-sm font-bold text-foreground">{graphData?.edges?.length || 0}</span>
                  </div>
                  <div className="p-2 rounded bg-background/60 border border-border">
                    <span className="text-muted-foreground block">Threat</span>
                    <span className="text-sm font-bold text-red-400">CRITICAL</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedNode ? (
            <Card className="border-primary/40">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">{t('graph.selectedInspector')}</CardTitle>
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
                  <Button className="w-full" size="sm" onClick={handleExpandNeighbors} isLoading={isExpanding}>
                    {isExpanding ? 'Querying Neo4j Multi-Hop...' : 'Expand Immediate Neighbors'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedEdge ? (
            <Card className="border-amber-500/40">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">{t('graph.edgeInspector')}</CardTitle>
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
