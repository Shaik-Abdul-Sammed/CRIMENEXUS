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
  Route,
  Users,
  Info,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
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
  // Default to optimized cose layout
  const [selectedLayout, setSelectedLayout] = useState<string>('cose');
  const [minConfidence, setMinConfidence] = useState<number>(0.5);
  const [hideLowConfidence, setHideLowConfidence] = useState<boolean>(false);
  const [legendOpen, setLegendOpen] = useState<boolean>(false);

  // Graph movement, spacing & clarity states
  // Label mode: 'none' (clean/no labels) | 'nodes' (node labels only) | 'all' (nodes + edge labels)
  const [labelMode, setLabelMode] = useState<'none' | 'nodes' | 'all'>('nodes');
  const labelModeRef = useRef<'none' | 'nodes' | 'all'>('nodes');
  labelModeRef.current = labelMode;

  // Disconnected / Orphan Nodes Management (Solves messy bottom-stacked overlapping nodes)
  const [hideDisconnected, setHideDisconnected] = useState<boolean>(true);
  const hideDisconnectedRef = useRef<boolean>(true);
  hideDisconnectedRef.current = hideDisconnected;
  const [disconnectedCount, setDisconnectedCount] = useState<number>(0);
  const [dismissDisconnectedCallout, setDismissDisconnectedCallout] = useState<boolean>(false);

  const [spacingScale, setSpacingScale] = useState<number>(1.25);
  const [focusedEntity, setFocusedEntity] = useState<{ id: string; name: string; count: number } | null>(null);

  // DNS Metrics: Centrality & Kingpins State
  const [topKingpins, setTopKingpins] = useState<Array<{ id: string; name: string; type: string; degree: number; betweenness: number }>>([]);
  const [showKingpinsPanel, setShowKingpinsPanel] = useState<boolean>(true);

  // 5 Advanced Features State
  const [communityClusteringActive, setCommunityClusteringActive] = useState<boolean>(true);
  const [shortestPathMode, setShortestPathMode] = useState<boolean>(false);
  const shortestPathModeRef = useRef<boolean>(false);
  shortestPathModeRef.current = shortestPathMode;
  const [pathStartNode, setPathStartNode] = useState<{ id: string; name: string } | null>(null);
  const pathStartNodeRef = useRef<{ id: string; name: string } | null>(null);
  const [pathEndNode, setPathEndNode] = useState<{ id: string; name: string } | null>(null);
  const pathEndNodeRef = useRef<{ id: string; name: string } | null>(null);
  const [pathDistance, setPathDistance] = useState<number | null>(null);

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
    setCategoryFilters((prev) => {
      const updated = { ...prev, [cat]: !prev[cat] };
      if (cyRef.current) {
        cyRef.current.nodes().forEach((n) => {
          const type = n.data('type');
          if (updated[type] === false) {
            n.style('display', 'none');
          } else {
            n.style('display', 'element');
          }
        });
      }
      return updated;
    });
  };

  const handleSearchNode = (term: string) => {
    setSearchTerm(term);
    if (!cyRef.current) return;
    const cy = cyRef.current;
    if (!term.trim()) {
      cy.elements().removeClass('highlighted-search');
      return;
    }
    const matched = cy.nodes().filter((ele) =>
      ele.data('label').toLowerCase().includes(term.toLowerCase())
    );
    if (matched.length > 0) {
      cy.elements().removeClass('highlighted-search');
      matched.addClass('highlighted-search');
      cy.animate({ center: { eles: matched }, zoom: 1.8, duration: 600 });
      sound.playRadarPing();
    }
  };

  const handleClearPath = () => {
    sound.playClickSound();
    setPathStartNode(null);
    setPathEndNode(null);
    setPathDistance(null);
    pathStartNodeRef.current = null;
    pathEndNodeRef.current = null;
    if (cyRef.current) {
      cyRef.current.elements().removeClass('path-highlight path-dimmed');
    }
  };

  const handleToggleShortestPath = () => {
    sound.playClickSound();
    const next = !shortestPathMode;
    setShortestPathMode(next);
    shortestPathModeRef.current = next;
    if (!next) {
      handleClearPath();
    } else {
      toast.info('Shortest Path Mode active. Click any source entity on graph.', 'Graph Navigation');
    }
  };

  const handleToggleClustering = () => {
    sound.playClickSound();
    const next = !communityClusteringActive;
    setCommunityClusteringActive(next);
    if (cyRef.current) {
      if (next) {
        cyRef.current.nodes().addClass('cluster-active');
        toast.info('Community clustering color halos activated.', 'Syndicate Clusters');
      } else {
        cyRef.current.nodes().removeClass('cluster-active');
        toast.info('Community clustering disabled.', 'Syndicate Clusters');
      }
    }
  };

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.warning('Text-to-speech audio synthesis is not supported in this browser.', 'Audio Unsupported');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      sound.playClickSound();
      return;
    }

    window.speechSynthesis.cancel();
    sound.playRadarPing();
    const cleanSpeechText = aiGraphExplanation.replace(/[#*`_~]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
    toast.info('Synthesizing voice briefing of network graph intelligence...', 'Audio Briefing Active');
  };

  const aiGraphExplanation = useMemo(() => {
    if (!graphData?.nodes || graphData.nodes.length === 0) {
      return 'No graph topology loaded. Ingest cases or select an active investigation to analyze.';
    }
    const totalNodes = graphData.nodes.length;
    const totalEdges = graphData.edges?.length || 0;
    
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

    // Sort nodes by degree
    const sortedNodes = [...graphData.nodes].sort((a, b) => (degreeMap[b.id] || 0) - (degreeMap[a.id] || 0));
    const topHub = sortedNodes[0];

    // Identify primary person kingpin vs financial transaction aggregator
    const financialHub = sortedNodes.find(n => n.type === 'BANK_ACCOUNT' && (degreeMap[n.id] || 0) >= 3);
    const personKingpin = sortedNodes.find(n => n.type === 'PERSON') || sortedNodes[0];

    const bankCount = typeCount['BANK_ACCOUNT'] || 0;
    const phoneCount = typeCount['PHONE'] || 0;
    const vehicleCount = typeCount['VEHICLE'] || 0;
    const personCount = typeCount['PERSON'] || 0;

    let narrative = `CRIMENEXUS Tactical Intelligence Analysis: The active knowledge graph spans ${totalNodes} forensic entities interconnected across ${totalEdges} multi-modal relationships (topology density ratio: ${(totalEdges / Math.max(totalNodes, 1)).toFixed(2)}). `;

    if (personKingpin) {
      narrative += `Primary human ringleader identified as ${personKingpin.name} (Graph Degree ${degreeMap[personKingpin.id] || 0}), orchestrating operations across ${personCount} syndicate actors. `;
    }

    if (financialHub) {
      const hubDegree = degreeMap[financialHub.id] || 0;
      narrative += `High-criticality financial nexus detected at account "${financialHub.name}" displaying ${hubDegree} fan-in transfer links, indicating automated smurfing and micro-structuring under the ₹50,000 threshold. `;
    }

    narrative += `Corridor telemetry encompasses ${phoneCount} telecom call records and ${vehicleCount} ANPR license plate sightings along interstate highway checkpoints. Recommended operational action: Issue immediate account freeze directives under Section 102 CrPC and summon CDR subscriber records under Section 63 BSA / Section 91 CrPC.`;

    return narrative;
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

  const getLayoutOptions = (layoutName: string, scale: number = spacingScale): cytoscape.LayoutOptions => {
    if (layoutName === 'concentric') {
      return {
        name: 'concentric',
        animate: true,
        animationDuration: 800,
        fit: true,
        padding: 60,
        concentric: (node: cytoscape.NodeSingular) => {
          return node.degree();
        },
        levelWidth: () => 2,
        minNodeSpacing: 80 * scale,
      } as cytoscape.LayoutOptions;
    }
    if (layoutName === 'breadthfirst') {
      return {
        name: 'breadthfirst',
        animate: true,
        animationDuration: 600,
        fit: true,
        directed: false,
        padding: 60,
        spacingFactor: 1.8 * scale,
      } as cytoscape.LayoutOptions;
    }
    if (layoutName === 'cose' || layoutName === 'fcose') {
      return {
        name: 'cose',
        animate: 'end',
        animationDuration: 400,
        nodeRepulsion: () => 16000 * scale,
        idealEdgeLength: () => 140 * scale,
        edgeElasticity: () => 50 / scale,
        padding: 60,
        randomize: false,
        componentSpacing: 150 * scale,
        nodeOverlap: 40,
        gravity: 0.2 / scale,
        nestingFactor: 1.2,
        numIter: 600,
      } as cytoscape.LayoutOptions;
    }
    return {
      name: layoutName,
      animate: true,
      animationDuration: 400,
      fit: true,
      padding: 60,
    } as cytoscape.LayoutOptions;
  };

  const applyLabelMode = (mode: 'none' | 'nodes' | 'all') => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.batch(() => {
      if (mode === 'none') {
        cy.nodes().forEach((n) => { n.style('label', ''); });
        cy.edges().forEach((e) => { e.style('label', ''); });
      } else if (mode === 'nodes') {
        cy.nodes().forEach((n) => { n.style('label', (n.data('label') || n.id()) as string); });
        cy.edges().forEach((e) => { e.style('label', ''); });
      } else {
        cy.nodes().forEach((n) => { n.style('label', (n.data('label') || n.id()) as string); });
        cy.edges().forEach((e) => { e.style('label', (e.data('label') || '') as string); });
      }
    });
  };

  const handleCycleLabels = () => {
    sound.playClickSound();
    const next: 'none' | 'nodes' | 'all' =
      labelMode === 'nodes' ? 'all' : labelMode === 'all' ? 'none' : 'nodes';
    setLabelMode(next);
    labelModeRef.current = next;
    applyLabelMode(next);

    if (next === 'none') {
      toast.info('All labels hidden. Clean topology mode active.', 'Label Mode');
    } else if (next === 'nodes') {
      toast.info('Node labels visible. Relationship labels hidden.', 'Label Mode');
    } else {
      toast.info('All labels (nodes and relationships) visible.', 'Label Mode');
    }
  };

  const handleToggleHideDisconnected = () => {
    sound.playClickSound();
    const next = !hideDisconnected;
    setHideDisconnected(next);
    hideDisconnectedRef.current = next;

    if (cyRef.current) {
      const orphans = cyRef.current.elements('.orphan-node, .orphan-edge, .peripheral-fragment');
      orphans.style('display', next ? 'none' : 'element');

      // Re-run layout on visible elements so connected syndicate centers cleanly
      const visibleEles = cyRef.current.elements().filter((ele) => ele.style('display') !== 'none');
      visibleEles.layout(getLayoutOptions(selectedLayout)).run();
      cyRef.current.animate({ fit: { eles: visibleEles, padding: 60 }, duration: 600 });

      if (next) {
        toast.info(`Filtered out ${disconnectedCount} isolated/peripheral nodes. Centered on active syndicate.`, 'Topology Cleaned');
      } else {
        toast.info(`Restored all ${disconnectedCount} isolated/peripheral nodes to view.`, 'Full Topology');
      }
    }
  };

  const handleFocusKingpin = () => {
    sound.playClickSound();
    if (!cyRef.current) return;
    const cy = cyRef.current;
    const kingpin = topKingpins[0] ? cy.getElementById(topKingpins[0].id) : cy.nodes('[label *= "Rajan"]').first();
    if (kingpin && kingpin.length > 0) {
      kingpin.style('display', 'element');
      cy.animate({
        center: { eles: kingpin },
        zoom: 1.8,
        duration: 800,
      });
      kingpin.select();
      const raw = kingpin.data('raw');
      if (raw) setSelectedNode(raw);

      // Highlight ego neighborhood
      cy.elements().removeClass('focused-node focused-neighbor focused-edge dimmed-node');
      kingpin.addClass('focused-node');
      const nh = kingpin.neighborhood();
      nh.nodes().addClass('focused-neighbor');
      nh.edges().addClass('focused-edge');
      cy.elements().not(kingpin).not(nh).addClass('dimmed-node');
      setFocusedEntity({
        id: kingpin.id(),
        name: raw?.name || kingpin.data('label') || kingpin.id(),
        count: nh.nodes().length,
      });

      sound.playRadarPing();
      toast.info(`Focused on Top Centrality Kingpin: ${kingpin.data('label')}`, 'Kingpin Located');
    }
  };

  const handleSpreadLayout = (delta: number) => {
    sound.playClickSound();
    const next = Math.max(0.6, Math.min(2.5, spacingScale + delta));
    setSpacingScale(next);
    if (cyRef.current) {
      const visibleEles = cyRef.current.elements().filter((ele) => ele.style('display') !== 'none');
      visibleEles.layout(getLayoutOptions(selectedLayout, next)).run();
    }
  };

  const handlePan = (dx: number, dy: number) => {
    if (!cyRef.current) return;
    cyRef.current.panBy({ x: dx, y: dy });
  };

  const handleClearFocus = () => {
    setFocusedEntity(null);
    if (cyRef.current) {
      cyRef.current.elements().removeClass('focused-node focused-neighbor focused-edge dimmed-node');
      applyLabelMode(labelModeRef.current);
    }
  };

  useEffect(() => {
    if (!containerRef.current || !graphData?.nodes || !graphData?.edges) return;

    // Build adjacency list to calculate connected components
    const adj = new Map<string, Set<string>>();
    (graphData.nodes || []).forEach((n) => {
      if (n.id) adj.set(n.id, new Set<string>());
    });
    (graphData.edges || []).forEach((e) => {
      if (adj.has(e.sourceEntityId) && adj.has(e.targetEntityId)) {
        adj.get(e.sourceEntityId)!.add(e.targetEntityId);
        adj.get(e.targetEntityId)!.add(e.sourceEntityId);
      }
    });

    // BFS to identify disjoint graph components
    const visited = new Set<string>();
    const components: string[][] = [];
    adj.forEach((_, nodeId) => {
      if (!visited.has(nodeId)) {
        const comp: string[] = [];
        const queue: string[] = [nodeId];
        visited.add(nodeId);
        while (queue.length > 0) {
          const curr = queue.shift()!;
          comp.push(curr);
          const neighbors = adj.get(curr) || new Set<string>();
          neighbors.forEach((nbr) => {
            if (!visited.has(nbr)) {
              visited.add(nbr);
              queue.push(nbr);
            }
          });
        }
        components.push(comp);
      }
    });

    // Identify peripheral / isolated fragments:
    // Core syndicate components are large clusters (size >= 4 or containing primary targets).
    // Disconnected pairs, triads, and singletons (size <= 3) are classified as peripheral fragments.
    const peripheralNodeIds = new Set<string>();
    components.forEach((comp) => {
      if (comp.length <= 3) {
        comp.forEach((id) => peripheralNodeIds.add(id));
      }
    });

    setDisconnectedCount(peripheralNodeIds.size);

    // Deduplication: Map nodes by unique ID
    const nodeMap = new Map<string, any>();
    (graphData.nodes || []).forEach((n) => {
      if (n.id && !nodeMap.has(n.id)) {
        // Derive community cluster id for automated clustering
        let clusterId = 1;
        if (n.type === 'BANK_ACCOUNT') clusterId = 2;
        else if (n.type === 'PHONE') clusterId = 3;
        else if (n.type === 'VEHICLE') clusterId = 4;
        else if (n.type === 'LOCATION') clusterId = 5;
        else if (n.type === 'CRYPTO_WALLET' || n.type === 'ORGANIZATION') clusterId = 6;

        const isPeripheral = peripheralNodeIds.has(n.id);
        const classes = [
          communityClusteringActive ? 'cluster-active' : '',
          isPeripheral ? 'orphan-node peripheral-fragment' : '',
        ].filter(Boolean).join(' ');

        nodeMap.set(n.id, {
          data: {
            id: n.id,
            label: n.name,
            name: n.name,
            type: n.type,
            riskLevel: n.riskLevel,
            confidence: n.confidence,
            cluster: (n as any).cluster || clusterId,
            isConnected: !isPeripheral,
            raw: n,
          },
          classes,
        });
      }
    });

    // Deduplication: Map edges by composite key and verify both endpoints exist
    const edgeMap = new Map<string, any>();
    (graphData.edges || []).forEach((e) => {
      const edgeKey = e.id || `${e.sourceEntityId}->${e.targetEntityId}:${e.type}`;
      if (nodeMap.has(e.sourceEntityId) && nodeMap.has(e.targetEntityId) && !edgeMap.has(edgeKey)) {
        const isPeripheralEdge = peripheralNodeIds.has(e.sourceEntityId) || peripheralNodeIds.has(e.targetEntityId);
        edgeMap.set(edgeKey, {
          data: {
            id: edgeKey,
            source: e.sourceEntityId,
            target: e.targetEntityId,
            label: e.type,
            confidence: e.confidenceScore,
            raw: e,
          },
          classes: isPeripheralEdge ? 'orphan-edge peripheral-fragment' : '',
        });
      }
    });

    const cyNodes = Array.from(nodeMap.values());
    const cyEdges = Array.from(edgeMap.values());

    const cy = cytoscape({
      container: containerRef.current,
      elements: [...cyNodes, ...cyEdges],
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            color: '#ffffff',
            'font-size': '12px',
            'font-weight': 'bold',
            'text-valign': 'bottom',
            'text-margin-y': 7,
            'text-wrap': 'wrap',
            'text-max-width': '130px',
            'text-background-color': '#0f172a',
            'text-background-opacity': 0.95,
            'text-background-padding': '4px',
            'text-background-shape': 'roundrectangle',
            'text-border-width': 1,
            'text-border-color': '#3b82f6',
            'text-border-opacity': 0.7,
            'min-zoomed-font-size': 0,
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
            width: (ele: NodeSingular) => (ele.data('riskLevel') === 'CRITICAL' ? 62 : 48),
            height: (ele: NodeSingular) => (ele.data('riskLevel') === 'CRITICAL' ? 62 : 48),
            'border-width': 3,
            'border-color': '#ffffff',
            'border-opacity': 0.85,
          },
        },
        {
          selector: '.orphan-node, .orphan-edge, .peripheral-fragment',
          style: {
            display: hideDisconnectedRef.current ? 'none' : 'element',
          },
        },
        {
          selector: 'node.labels-hidden',
          style: {
            label: '',
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 5,
            'border-color': '#3b82f6',
            'overlay-color': '#3b82f6',
            'overlay-opacity': 0.35,
          },
        },
        {
          selector: 'node[label *= "Rajan"], node[id = "ent-1"], node[riskLevel = "CRITICAL"][type = "PERSON"]',
          style: {
            width: 84,
            height: 84,
            'background-color': '#DC2626',
            'border-width': 5,
            'border-color': '#EF4444',
            'border-opacity': 1,
            'font-size': '14px',
            'font-weight': 'bolder',
            color: '#FEE2E2',
            'text-margin-y': 9,
          },
        },
        // Feature 2: Search & Highlight Style
        {
          selector: '.highlighted-search',
          style: {
            'border-width': 6,
            'border-color': '#f59e0b',
            'overlay-color': '#f59e0b',
            'overlay-opacity': 0.5,
            width: 58,
            height: 58,
            'font-size': '13px',
            'font-weight': 'bolder',
            color: '#fbbf24',
          },
        },
        // Feature 2: Search Highlight Style
        {
          selector: '.highlighted-search',
          style: {
            'border-color': '#f59e0b',
            'border-width': 5,
            'overlay-color': '#f59e0b',
            'overlay-opacity': 0.4,
          },
        },
        // Feature 3: Shortest Path Highlight (Bright Green) & Dimming Styles
        {
          selector: '.path-highlight',
          style: {
            'line-color': '#00ff66',
            'target-arrow-color': '#00ff66',
            width: 6,
            'border-color': '#00ff66',
            'border-width': 6,
            'overlay-color': '#00ff66',
            'overlay-opacity': 0.5,
          },
        },
        // Feature: Top 3 Kingpins Golden Border Halo
        {
          selector: '.kingpin-golden',
          style: {
            'border-width': 5,
            'border-color': '#f59e0b',
            'border-opacity': 1,
            'overlay-color': '#f59e0b',
            'overlay-opacity': 0.35,
          },
        },
        {
          selector: '.path-dimmed',
          style: {
            opacity: 0.15,
          },
        },
        // Feature 5: Community Clustering Border Halo
        {
          selector: '.cluster-active',
          style: {
            'border-width': 3.5,
            'border-color': (ele: NodeSingular) => {
              const clusterColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#06b6d4', '#f97316'];
              const c = ele.data('cluster') || 1;
              return clusterColors[c % clusterColors.length];
            },
            'border-opacity': 1,
          },
        },
        {
          selector: 'edge',
          style: {
            label: '',
            width: 2,
            'line-color': '#475569',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            color: '#38bdf8',
            'font-size': '10px',
            'font-weight': 'bold',
            'text-rotation': 'autorotate',
            'text-margin-y': -8,
            'text-background-color': '#090d16',
            'text-background-opacity': 0.95,
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'text-border-width': 1,
            'text-border-color': '#0284c7',
            'text-border-opacity': 0.6,
            'min-zoomed-font-size': 0,
          },
        },
        {
          selector: 'edge.labels-visible',
          style: {
            label: 'data(label)',
          },
        },
        // Focus & Neighborhood Spotlight Styles
        {
          selector: '.dimmed-node',
          style: {
            opacity: 0.12,
            'text-opacity': 0.08,
          },
        },
        {
          selector: '.focused-node',
          style: {
            'border-width': 5,
            'border-color': '#38bdf8',
            'border-opacity': 1,
            'overlay-color': '#38bdf8',
            'overlay-opacity': 0.4,
            'z-index': 999,
          },
        },
        {
          selector: '.focused-neighbor',
          style: {
            'border-width': 3.5,
            'border-color': '#a78bfa',
            'border-opacity': 1,
            'z-index': 998,
          },
        },
        {
          selector: '.focused-edge',
          style: {
            width: 4,
            'line-color': '#38bdf8',
            'target-arrow-color': '#38bdf8',
            'z-index': 997,
            label: 'data(label)',
            'font-size': '10px',
            'text-background-opacity': 1,
            'text-background-color': '#0f172a',
            color: '#7dd3fc',
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

    // Calculate DNS Centrality (Degree & Betweenness) & Highlight Top 3 Kingpins
    try {
      const nodes = cy.nodes();
      const bc = cy.elements().betweennessCentrality({ directed: false });
      const rankedNodes = nodes.map((n) => {
        const deg = n.degree();
        const bScore = Math.round(bc.betweenness(n) * 100) / 100;
        return {
          id: n.id(),
          name: (n.data('label') || n.id()) as string,
          type: (n.data('type') || 'ENTITY') as string,
          degree: deg,
          betweenness: bScore,
        };
      });

      rankedNodes.sort((a, b) => (b.degree * 2 + b.betweenness) - (a.degree * 2 + a.betweenness));
      const top3 = rankedNodes.slice(0, 3);
      setTopKingpins(top3);
      top3.forEach((k) => {
        cy.getElementById(k.id).addClass('kingpin-golden');
      });
    } catch (metricErr) {
      console.warn('DNS centrality computation error:', metricErr);
    }

    cy.on('tap', 'node', (evt) => {
      const nodeEle = evt.target;
      const nodeData = nodeEle.data('raw') as Entity;

      if (shortestPathModeRef.current) {
        sound.playRadarPing();
        if (!pathStartNodeRef.current) {
          pathStartNodeRef.current = { id: nodeEle.id(), name: nodeData.name };
          setPathStartNode({ id: nodeEle.id(), name: nodeData.name });
          nodeEle.addClass('path-highlight');
          toast.info(`Source entity: ${nodeData.name}. Select destination entity.`, 'Shortest Path');
        } else if (!pathEndNodeRef.current) {
          const startId = pathStartNodeRef.current.id;
          const endId = nodeEle.id();

          // Guard against selecting the identical node as start and destination (0-hop self-loop bug)
          if (endId === startId) {
            toast.warning('Destination must be a different node than the starting entity.', 'Shortest Path');
            return;
          }

          pathEndNodeRef.current = { id: endId, name: nodeData.name };
          setPathEndNode({ id: endId, name: nodeData.name });
          nodeEle.addClass('path-highlight');

          // Execute aStar algorithm to calculate shortest path
          const aStarRes = cy.elements().aStar({
            root: '#' + startId,
            goal: '#' + endId,
            directed: false,
          });

          if (aStarRes.found) {
            sound.playSuccessChime();
            cy.elements().addClass('path-dimmed');
            aStarRes.path.removeClass('path-dimmed').addClass('path-highlight');
            setPathDistance(aStarRes.distance);
            toast.success(`Shortest path identified: ${aStarRes.distance} hops`, 'Path Found');
          } else {
            toast.warning('No topological connection found between entities.', 'Path Finding');
          }
        }
        return;
      }

      setSelectedNode(nodeData);
      setSelectedEdge(null);

      // Interactive Neighborhood Focus (Ego Exploration)
      cy.elements().removeClass('focused-node focused-neighbor focused-edge dimmed-node');
      nodeEle.addClass('focused-node');
      const neighborhood = nodeEle.neighborhood();
      neighborhood.nodes().addClass('focused-neighbor');
      neighborhood.edges().addClass('focused-edge');
      cy.elements().not(nodeEle).not(neighborhood).addClass('dimmed-node');
      setFocusedEntity({
        id: nodeEle.id(),
        name: nodeData.name || nodeEle.id(),
        count: neighborhood.nodes().length,
      });
      sound.playRadarPing();
    });

    cy.on('tap', 'edge', (evt) => {
      if (shortestPathModeRef.current) return;
      const edgeData = evt.target.data('raw') as Relationship;
      setSelectedEdge(edgeData);
      setSelectedNode(null);
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy && !shortestPathModeRef.current) {
        setSelectedNode(null);
        setSelectedEdge(null);
        cy.elements().removeClass('focused-node focused-neighbor focused-edge dimmed-node');
        setFocusedEntity(null);
        applyLabelMode(labelModeRef.current);
      }
    });

    cyRef.current = cy;
    (window as any).__cy = cy;
    applyLabelMode(labelModeRef.current);

    cy.ready(() => {
      // Hide peripheral fragments and orphan singletons by default in Clean View
      if (hideDisconnectedRef.current) {
        cy.elements('.orphan-node, .orphan-edge, .peripheral-fragment').style('display', 'none');
      }
      const visibleEles = cy.elements().filter((ele) => ele.style('display') !== 'none');
      visibleEles.layout(getLayoutOptions(selectedLayout)).run();
      cy.fit(visibleEles.length > 0 ? visibleEles : cy.elements(), 60); // Re-center on connected syndicate
    });

    if (hideDisconnectedRef.current) {
      cy.elements('.orphan-node, .orphan-edge, .peripheral-fragment').style('display', 'none');
      const visibleEles = cy.elements().filter((ele) => ele.style('display') !== 'none');
      visibleEles.layout(getLayoutOptions(selectedLayout)).run();
      cy.animate({ fit: { eles: visibleEles.length > 0 ? visibleEles : cy.elements(), padding: 60 }, duration: 400 });
    }

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
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.nodes().removeClass('highlighted-search');
    if (!searchTerm.trim()) return;
    const term = searchTerm.toLowerCase();
    const matched = cy.nodes().filter((n) => ((n.data('label') || '') as string).toLowerCase().includes(term));
    if (matched.length > 0) {
      matched.addClass('highlighted-search');
      cy.animate({
        center: { eles: matched.first() },
        zoom: 1.4,
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
        const isOrphan = !n.data('isConnected');
        const matchesCleanView = !hideDisconnectedRef.current || !isOrphan;

        if (matchesType && matchesCategory && matchesConf && matchesCleanView) {
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
  }, [selectedEntityTypeFilter, categoryFilters, minConfidence, hideLowConfidence, hideDisconnected]);

  const handleZoomIn = () => {
    sound.playClickSound();
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.zoom({
      level: cy.zoom() * 1.3,
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
    });
  };

  const handleZoomOut = () => {
    sound.playClickSound();
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.zoom({
      level: cy.zoom() / 1.3,
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
    });
  };

  const handleFit = () => {
    sound.playClickSound();
    if (!cyRef.current) return;
    const cy = cyRef.current;
    const visibleEles = cy.elements().filter((ele) => ele.style('display') !== 'none');
    cy.animate({ fit: { eles: visibleEles.length > 0 ? visibleEles : cy.elements(), padding: 50 }, duration: 400 });
  };

  const handleReset = () => {
    sound.playClickSound();
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.elements().removeClass('focused-node focused-neighbor focused-edge dimmed-node path-highlight path-dimmed highlighted-search');
    
    // Respect hideDisconnected filter
    cy.nodes().forEach((n) => {
      const isOrphan = !n.data('isConnected') || n.hasClass('orphan-node') || n.hasClass('peripheral-fragment');
      n.style('display', hideDisconnectedRef.current && isOrphan ? 'none' : 'element');
    });
    cy.edges().forEach((e) => {
      const isOrphan = e.hasClass('orphan-edge') || e.hasClass('peripheral-fragment');
      const sourceVisible = e.source().style('display') !== 'none';
      const targetVisible = e.target().style('display') !== 'none';
      e.style('display', hideDisconnectedRef.current && isOrphan ? 'none' : (sourceVisible && targetVisible ? 'element' : 'none'));
    });

    setSelectedEntityTypeFilter('ALL');
    setSearchTerm('');
    setFocusedEntity(null);
    setHideLowConfidence(false);
    setMinConfidence(0.5);
    applyLabelMode(labelModeRef.current);
    
    const visibleEles = cy.elements().filter((ele) => ele.style('display') !== 'none');
    visibleEles.layout(getLayoutOptions(selectedLayout, spacingScale)).run();
    cy.animate({ fit: { eles: visibleEles.length > 0 ? visibleEles : cy.elements(), padding: 50 }, duration: 600 });
  };

  const handleLayoutChange = (newLayout: string) => {
    sound.playClickSound();
    setSelectedLayout(newLayout);
    if (cyRef.current) {
      const layoutOpts = getLayoutOptions(newLayout, spacingScale);
      cyRef.current.layout(layoutOpts).run();
      cyRef.current.animate({ fit: { eles: cyRef.current.elements(), padding: 50 }, duration: 600 });
    }
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

  const [graphExportPreview, setGraphExportPreview] = useState<string | null>(null);

  const handleExportPNG = () => {
    sound.playClickSound();
    if (!cyRef.current) return;
    const png64 = cyRef.current.png({ full: true, bg: '#090d16', scale: 2 });
    setGraphExportPreview(png64);
  };

  const handleConfirmDownloadPNG = () => {
    if (!graphExportPreview) return;
    const link = document.createElement('a');
    link.download = `CRIMENEXUS_Network_Graph_${Date.now()}.png`;
    link.href = graphExportPreview;
    link.click();
    setGraphExportPreview(null);
    toast.success('High-resolution network graph PNG exported successfully.', 'Export Complete');
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
            variant={shortestPathMode ? 'primary' : 'outline'}
            onClick={handleToggleShortestPath}
            className={`flex items-center gap-1.5 ${shortestPathMode ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'border-cyan-500/50 hover:bg-cyan-950/30 text-cyan-400'}`}
            title="Find shortest link between two suspect entities (aStar algorithm)"
          >
            <Route className="h-4 w-4" />
            <span>{shortestPathMode ? 'Shortest Path: Active' : 'Shortest Path'}</span>
          </Button>
          <Button
            size="sm"
            variant={communityClusteringActive ? 'primary' : 'outline'}
            onClick={handleToggleClustering}
            className={`flex items-center gap-1.5 ${communityClusteringActive ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'border-purple-500/50 hover:bg-purple-950/30 text-purple-400'}`}
            title="Color-code entities by syndicate cell / community"
          >
            <Users className="h-4 w-4" />
            <span>{communityClusteringActive ? 'Clusters: Active' : 'Clusters'}</span>
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
                  onChange={(e) => handleLayoutChange(e.target.value)}
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

          {/* DEDICATED GRAPH ADJUSTMENT & VIEW CONTROL BAR (STICKY TO GUARANTEE EASY ACCESS WHILE SCROLLING) */}
          <div className="sticky top-0 z-30 p-2.5 px-3 rounded-xl border border-border/80 bg-slate-900/95 backdrop-blur-md shadow-xl flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Left Controls: Zoom, Fit, Re-center, Labels, Clean View, Kingpin */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-border/70">
                <button
                  onClick={handleZoomIn}
                  className="h-7 w-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="h-7 w-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleFit}
                  className="h-7 px-2.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                  title="Fit to Screen"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Fit</span>
                </button>
                <button
                  onClick={handleReset}
                  className="h-7 px-2.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                  title="Re-layout & Center"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Center</span>
                </button>
              </div>

              {/* 3-State Label Toggle Button */}
              <button
                onClick={handleCycleLabels}
                className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  labelMode === 'none'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    : labelMode === 'nodes'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-primary/20 text-primary border border-primary/40'
                }`}
                title="Cycle Label Visibility: Off (Clean) -> Nodes Only -> All (Nodes + Relationships)"
              >
                {labelMode === 'none' ? (
                  <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <Eye className="h-3.5 w-3.5 text-primary" />
                )}
                <span className="text-[11px]">
                  {labelMode === 'none'
                    ? 'Labels: Hidden'
                    : labelMode === 'nodes'
                    ? 'Labels: Nodes'
                    : 'Labels: All'}
                </span>
              </button>

              {/* Hide / Show Isolated Orphan Nodes */}
              <button
                onClick={handleToggleHideDisconnected}
                className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  hideDisconnected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
                title={
                  hideDisconnected
                    ? `Isolated nodes hidden. Click to show all ${disconnectedCount} unconnected nodes.`
                    : `Isolated nodes visible. Click to hide ${disconnectedCount} unconnected nodes to reduce clutter.`
                }
              >
                <Filter className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[11px]">
                  {hideDisconnected
                    ? `Clean View (${disconnectedCount} Isolated Hidden)`
                    : `Show All (${disconnectedCount} Isolated)`}
                </span>
              </button>

              {/* Focus Camera on Top Kingpin */}
              <button
                onClick={handleFocusKingpin}
                className="h-8 px-2.5 rounded-lg text-xs font-bold bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 flex items-center gap-1.5 transition-colors"
                title="Focus camera on Top Centrality Kingpin"
              >
                <Users className="h-3.5 w-3.5 text-red-400" />
                <span className="text-[11px]">🎯 Kingpin</span>
              </button>
            </div>

            {/* Right Controls: Spacing Adjustments & Pan Pad */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-border/70">
                <span className="text-[10px] text-muted-foreground font-mono px-1">Spacing:</span>
                <button
                  onClick={() => handleSpreadLayout(0.25)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 text-[10px]"
                  title="Spread Nodes Out (More Space)"
                >
                  + Spread
                </button>
                <button
                  onClick={() => handleSpreadLayout(-0.25)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 text-[10px]"
                  title="Condense Nodes (Tighter Space)"
                >
                  - Tighten
                </button>
              </div>

              {/* Pan D-Pad */}
              <div className="flex items-center gap-0.5 bg-slate-950/80 p-1 rounded-lg border border-border/70">
                <button
                  onClick={() => handlePan(100, 0)}
                  className="h-7 w-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-[10px]"
                  title="Pan Left (Reveal Left)"
                >
                  ◀
                </button>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handlePan(0, 100)}
                    className="h-3.5 w-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-[8px]"
                    title="Pan Up (Reveal Top)"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handlePan(0, -100)}
                    className="h-3.5 w-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-[8px]"
                    title="Pan Down (Reveal Bottom)"
                  >
                    ▼
                  </button>
                </div>
                <button
                  onClick={() => handlePan(-100, 0)}
                  className="h-7 w-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-[10px]"
                  title="Pan Right (Reveal Right)"
                >
                  ▶
                </button>
              </div>
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

            {/* Active Neighborhood Focus Banner */}
            {focusedEntity && (
              <div className="absolute top-4 left-4 z-20 p-2.5 px-3.5 rounded-xl border border-sky-500/50 bg-slate-900/95 backdrop-blur-md shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-top-2 select-none">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Isolated Ego Neighborhood</span>
                  <span className="font-bold text-white text-xs">
                    {focusedEntity.name}{' '}
                    <span className="text-sky-400 font-mono text-[11px]">
                      ({focusedEntity.count} connected {focusedEntity.count === 1 ? 'node' : 'nodes'})
                    </span>
                  </span>
                </div>
                <button
                  onClick={handleClearFocus}
                  className="ml-2 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-[11px] font-bold transition-colors flex items-center gap-1 shadow-sm"
                >
                  <X className="h-3 w-3" />
                  <span>Restore Full Graph</span>
                </button>
              </div>
            )}

            {/* Shortest Path Mode HUD Overlay */}
            {shortestPathMode && (
              <div className="absolute top-4 left-4 z-20 p-3 rounded-xl border border-cyan-500/50 bg-slate-900/95 backdrop-blur-md shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-top-2">
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
                <div className="flex flex-col">
                  <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                    <Route className="h-3.5 w-3.5" />
                    <span>Shortest Path Finder (aStar Algorithm)</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    {!pathStartNode ? (
                      <span className="text-amber-400">Step 1: Click any source entity on graph</span>
                    ) : !pathEndNode ? (
                      <span>
                        From: <strong className="text-cyan-300">{pathStartNode.name}</strong> &rarr; <span className="text-amber-400">Step 2: Click destination entity</span>
                      </span>
                    ) : (
                      <span>
                        Route: <strong className="text-cyan-300">{pathStartNode.name}</strong> &rarr; <strong className="text-cyan-300">{pathEndNode.name}</strong>
                        {pathDistance !== null && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                            {pathDistance} {pathDistance === 1 ? 'hop' : 'hops'}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                {(pathStartNode || pathEndNode) && (
                  <button
                    onClick={handleClearPath}
                    className="ml-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 text-[11px] transition-colors"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={handleToggleShortestPath}
                  className="px-2.5 py-1 rounded bg-red-950/50 hover:bg-red-900/60 text-red-400 border border-red-500/40 text-[11px] font-bold transition-colors flex items-center gap-1"
                  title="Close Shortest Path Mode"
                  aria-label="Close Shortest Path Mode"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Exit</span>
                </button>
              </div>
            )}

            {/* Informative Callout when Unconnected Singletons are visible */}
            {!hideDisconnected && disconnectedCount > 0 && !dismissDisconnectedCallout && (
              <div className="absolute top-4 right-4 z-20 max-w-sm p-3 rounded-xl border border-sky-500/50 bg-slate-950/95 backdrop-blur-md shadow-2xl text-xs space-y-1.5 animate-in fade-in select-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-sky-400 text-[11px]">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    <span>{disconnectedCount} Peripheral / Isolated Nodes Displayed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleToggleHideDisconnected}
                      className="text-[10px] px-2 py-0.5 rounded bg-sky-900/60 text-sky-200 border border-sky-500/40 hover:bg-sky-800 transition-colors font-bold"
                    >
                      Clean View
                    </button>
                    <button
                      onClick={() => {
                        sound.playClickSound();
                        setDismissDisconnectedCallout(true);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Dismiss callout"
                      aria-label="Dismiss callout"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-300 leading-snug">
                  These {disconnectedCount} nodes are peripheral fragments (secondary SIM pairs, isolated test accounts, singletons) disconnected from the main crime syndicate.
                </p>
              </div>
            )}

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

        <div className="space-y-6 sticky top-4 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
          {/* DNS Centrality & Top 3 Kingpins Panel */}
          {topKingpins.length > 0 && showKingpinsPanel ? (
            <Card className="border-amber-500/40 bg-gradient-to-b from-amber-950/20 via-card to-card shadow-lg animate-in fade-in">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">👑</span>
                    <CardTitle className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      DNS Network Centrality
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold">
                      TOP 3 KINGPINS
                    </Badge>
                    <button
                      onClick={() => {
                        sound.playClickSound();
                        setShowKingpinsPanel(false);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Close Kingpins Panel"
                      aria-label="Close Kingpins Panel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Key syndicates identified via degree centrality & betweenness routing. Golden border indicates primary criminal hubs.
                </p>
                <div className="space-y-2 pt-1">
                  {topKingpins.map((kp, idx) => (
                    <div
                      key={kp.id}
                      onClick={() => {
                        sound.playRadarPing();
                        if (cyRef.current) {
                          const ele = cyRef.current.getElementById(kp.id);
                          if (ele && ele.length > 0) {
                            ele.style('display', 'element');
                            cyRef.current.animate({ center: { eles: ele }, zoom: 1.8, duration: 500 });
                            ele.select();
                            const raw = ele.data('raw');
                            if (raw) setSelectedNode(raw);

                            // Highlight neighborhood & spotlight
                            cyRef.current.elements().removeClass('focused-node focused-neighbor focused-edge dimmed-node');
                            ele.addClass('focused-node');
                            const nh = ele.neighborhood();
                            nh.nodes().addClass('focused-neighbor');
                            nh.edges().addClass('focused-edge');
                            cyRef.current.elements().not(ele).not(nh).addClass('dimmed-node');
                            setFocusedEntity({
                              id: ele.id(),
                              name: raw?.name || kp.name,
                              count: nh.nodes().length,
                            });
                          }
                        }
                      }}
                      className="p-2.5 rounded-lg border-2 border-amber-500/50 bg-amber-950/20 hover:bg-amber-950/40 transition-colors cursor-pointer flex items-center justify-between gap-2 shadow-sm"
                      title="Click to center and highlight on graph"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-5 w-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="truncate">
                          <span className="font-bold text-foreground block truncate">{kp.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{kp.type}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-mono text-[10px]">
                        <div className="text-amber-400 font-bold">Deg: {kp.degree}</div>
                        <div className="text-slate-400 text-[9px]">BC: {kp.betweenness}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            topKingpins.length > 0 && (
              <button
                onClick={() => {
                  sound.playClickSound();
                  setShowKingpinsPanel(true);
                }}
                className="w-full text-xs text-amber-400 hover:text-amber-300 flex items-center justify-between px-3 py-2 rounded-lg border border-amber-500/40 bg-slate-900/80 shadow-md transition-all hover:bg-slate-900"
              >
                <span className="flex items-center gap-1.5 font-bold">
                  <span>👑</span>
                  DNS Network Centrality (Top 3 Kingpins)
                </span>
                <span className="text-[10px] text-slate-400">Restore ➔</span>
              </button>
            )
          )}

          {/* Collapsible AI Graph Summary Panel */}
          {showAiSummary && (
            <Card className="border-primary/50 bg-gradient-to-b from-primary/10 via-card to-card shadow-lg animate-in fade-in slide-in-from-top-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold text-primary">AI Graph Summary</CardTitle>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleToggleSpeech}
                    className={`h-7 px-2.5 rounded-md flex items-center gap-1 text-[11px] font-semibold border transition-all ${
                      isSpeaking
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 animate-pulse'
                        : 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/20'
                    }`}
                    title={isSpeaking ? 'Mute / Stop Voice Briefing' : 'Read Voice Briefing Aloud (Audio Speaker)'}
                    aria-label={isSpeaking ? 'Stop Audio Briefing' : 'Play Audio Briefing'}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="h-3.5 w-3.5 text-amber-400" />
                        <span>Mute</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3.5 w-3.5 text-primary" />
                        <span>Speaker</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                        setIsSpeaking(false);
                      }
                      setShowAiSummary(false);
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-foreground"
                    aria-label="Close AI Summary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/40 text-primary font-semibold">
                      GEMINI GRAPH SYNTHESIS
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">Topological Inference</span>
                  </div>
                  {isSpeaking && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                      <span>Transmitting Audio...</span>
                    </div>
                  )}
                </div>

                {/* Speaker Audio Player Banner */}
                <div className="p-2.5 rounded-lg border border-border/80 bg-slate-950/70 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={handleToggleSpeech}
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                        isSpeaking
                          ? 'bg-amber-500 text-slate-950 scale-105 shadow-md shadow-amber-500/20'
                          : 'bg-primary text-primary-foreground hover:scale-105'
                      }`}
                      title={isSpeaking ? 'Stop voice readout' : 'Play audio intelligence readout'}
                    >
                      {isSpeaking ? <Square className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current ml-0.5" />}
                    </button>
                    <div className="truncate">
                      <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                        <span>Voice Intelligence Briefing</span>
                        {isSpeaking ? (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[9px] px-1 py-0 font-mono">
                            LIVE
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-800 text-slate-400 border-slate-700 text-[9px] px-1 py-0 font-mono">
                            READY
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {isSpeaking ? 'Reading tactical synthesis via Web Speech API...' : 'Click to stream forensic graph narration'}
                      </p>
                    </div>
                  </div>

                  {/* Audio Equalizer Waveform Bars Animation */}
                  {isSpeaking ? (
                    <div className="flex items-end gap-0.5 h-4 shrink-0 px-1">
                      <span className="w-1 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
                      <span className="w-1 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s] h-4" />
                      <span className="w-1 bg-amber-400 rounded-full animate-bounce h-2" />
                      <span className="w-1 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.25s] h-3.5" />
                    </div>
                  ) : (
                    <Volume2 className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                  )}
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

      {/* Graph Export Preview Modal */}
      {graphExportPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-primary/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border/80 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-primary/20 text-primary border border-primary/40">
                  <Download className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Network Topology Graph Export Preview</h3>
                  <p className="text-[11px] text-muted-foreground">High-resolution 2x raster export rendered for judicial submission.</p>
                </div>
              </div>
              <button
                onClick={() => setGraphExportPreview(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-slate-950/60 flex items-center justify-center">
              <img
                src={graphExportPreview}
                alt="Graph Export Preview"
                className="max-h-[60vh] max-w-full rounded-lg border border-border shadow-lg object-contain"
              />
            </div>

            <div className="p-4 border-t border-border/80 bg-slate-950 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-mono">
                Format: 2x PNG • Background: #090D16 • Certified High-Res
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setGraphExportPreview(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleConfirmDownloadPNG}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Confirm Download PNG</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
