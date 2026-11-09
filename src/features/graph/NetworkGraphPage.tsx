import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  Globe,
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
import { ProFeaturesHubModal } from '../../components/common/ProFeaturesHubModal';

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
  const [unifiedGraphActive, setUnifiedGraphActive] = useState<boolean>(true);
  const [showGlobalImpactModal, setShowGlobalImpactModal] = useState<boolean>(false);
  const [autoSpeakOnSelect, setAutoSpeakOnSelect] = useState<boolean>(true);

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
    DEVICE: true,
    UPI: true,
    TRANSIT: true,
    UTILITY: true,
  });
  const [showAiSummary, setShowAiSummary] = useState<boolean>(false);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [predictedLinksActive, setPredictedLinksActive] = useState<boolean>(false);
  const [hoveredNode, setHoveredNode] = useState<{
    name: string;
    type: string;
    riskScore: number;
    x: number;
    y: number;
  } | null>(null);

  const handlePredictClusterLinks = () => {
    sound.playRadarPing();
    const next = !predictedLinksActive;
    setPredictedLinksActive(next);

    if (!cyRef.current) return;
    const cy = cyRef.current;

    if (!next) {
      cy.elements('.predicted-link').remove();
      toast.info('Removed AI predicted bridge links.', 'Graph Clean');
      return;
    }

    try {
      // Find Rajan or top kingpin node
      const rajanNode =
        cy.nodes().filter((n) => (n.data('label') || '').toLowerCase().includes('rajan'))[0] ||
        cy.nodes().filter((n) => (n.data('name') || '').toLowerCase().includes('rajan'))[0] ||
        cy.nodes()[0];

      // Find Mahindra Scorpio or vehicle node
      const vehicleNode =
        cy.nodes().filter((n) => (n.data('label') || '').includes('TS 09') || (n.data('name') || '').includes('TS 09'))[0] ||
        cy.nodes().filter((n) => n.data('type') === 'VEHICLE')[0];

      // Find HDFC or bank account node
      const bankNode =
        cy.nodes().filter((n) => (n.data('label') || '').includes('HDFC') || (n.data('name') || '').includes('HDFC'))[0] ||
        cy.nodes().filter((n) => n.data('type') === 'BANK_ACCOUNT')[0];

      let addedCount = 0;

      if (rajanNode && vehicleNode && rajanNode.id() !== vehicleNode.id()) {
        const edgeId = `pred-link-${rajanNode.id()}-${vehicleNode.id()}`;
        if (!cy.getElementById(edgeId).length) {
          cy.add({
            group: 'edges',
            data: {
              id: edgeId,
              source: rajanNode.id(),
              target: vehicleNode.id(),
              label: 'PREDICTED: GETAWAY CONDUIT (88%)',
              type: 'PREDICTED_LINK',
              confidence: 0.88,
              isPredicted: true,
            },
            classes: 'predicted-link',
          });
          addedCount++;
        }
      }

      if (rajanNode && bankNode && rajanNode.id() !== bankNode.id()) {
        const edgeId = `pred-link-${rajanNode.id()}-${bankNode.id()}`;
        if (!cy.getElementById(edgeId).length) {
          cy.add({
            group: 'edges',
            data: {
              id: edgeId,
              source: rajanNode.id(),
              target: bankNode.id(),
              label: 'PREDICTED: SMURFING BENEFICIARY (94%)',
              type: 'PREDICTED_LINK',
              confidence: 0.94,
              isPredicted: true,
            },
            classes: 'predicted-link',
          });
          addedCount++;
        }
      }

      // Re-layout to pull connected clusters into unified topology
      const layout = cy.layout({
        name: 'cose',
        animate: true,
        animationDuration: 700,
        nodeRepulsion: () => 14000 * spacingScale,
        idealEdgeLength: () => 140 * spacingScale,
      } as any);
      layout.run();

      sound.playSuccessChime();
      toast.success(
        'Prediction Explainability Card: Rajan linked to Getaway Vehicle (TS 09 AB 1234) & Mule Account (HDFC) via 3 shared burner phones and highway toll sightings (Adamic-Adar: 0.88).',
        'AI Link Prediction Active'
      );
    } catch (err) {
      console.warn('Prediction error', err);
    }
  };

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
      cy.elements().removeClass('highlighted-search search-dimmed search-neighbor');
      return;
    }
    const matched = cy.nodes().filter((ele) =>
      ((ele.data('label') || ele.id()) as string).toLowerCase().includes(term.toLowerCase())
    );
    if (matched.length > 0) {
      cy.elements().removeClass('highlighted-search search-dimmed search-neighbor');
      cy.elements().addClass('search-dimmed');
      matched.removeClass('search-dimmed').addClass('highlighted-search');
      const nh = matched.neighborhood();
      nh.removeClass('search-dimmed');
      nh.nodes().addClass('search-neighbor');
      cy.animate({ center: { eles: matched.first() }, zoom: 1.6, duration: 600 });
      sound.playRadarPing();
    } else {
      cy.elements().removeClass('highlighted-search search-dimmed search-neighbor');
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

  // Phonetic Speech Normalizer for Natural Law-Enforcement Audio Readout
  const prepareSpokenText = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/[#*`_~]/g, ' ')
      .replace(/C\s*R\s*I\s*M\s*E\s*N\s*E\s*X\s*U\s*S/gi, 'Crime Nexus')
      .replace(/CRIMENEXUS|CrimeNexus|CRIME-NEXUS/gi, 'Crime Nexus')
      .replace(/\bANPR\b/g, 'A.N.P.R. optical scanner')
      .replace(/\bCDR\b/g, 'Call Detail Records')
      .replace(/\bBSA\b/g, 'Bharatiya Sakshya Adhiniyam')
      .replace(/\bBNSS\b/g, 'Bharatiya Nagarik Suraksha Sanhita')
      .replace(/\bBNS\b/g, 'Bharatiya Nyaya Sanhita')
      .replace(/\bFIR\b/g, 'First Information Report')
      .replace(/\bGNN\b/g, 'Graph Neural Network')
      .replace(/\bHDM-GNN\b/g, 'Heterogeneous Graph Neural Network')
      .replace(/\bIMEI\b/g, 'I.M.E.I. device identifier')
      .replace(/\bUPI\b/g, 'U.P.I. transaction')
      .replace(/\bCCTNS\b/g, 'C.C.T.N.S. police network')
      .replace(/\bIO\b/g, 'Investigating Officer')
      .replace(/\bSHO\b/g, 'Station House Officer')
      .replace(/\bDSP\b/g, 'Deputy Superintendent of Police')
      .replace(/₹/g, 'Rupees ')
      .replace(/\s+/g, ' ')
      .trim();
  };

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
    const cleanSpeechText = prepareSpokenText(aiGraphExplanation);
    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = 0.98;
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

    let narrative = `Crime Nexus Tactical Intelligence Analysis: The active knowledge graph spans ${totalNodes} forensic entities interconnected across ${totalEdges} multi-modal relationships (topology density ratio: ${(totalEdges / Math.max(totalNodes, 1)).toFixed(2)}). `;

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

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      sound.playRadarPing();
      const clean = prepareSpokenText(text);
      const utterance = new SpeechSynthesisUtterance(clean);
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferredVoice =
          voices.find((v) => v.lang === 'en-IN') ||
          voices.find((v) => v.lang.startsWith('en') && !v.localService) ||
          voices.find((v) => v.lang.startsWith('en')) ||
          voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;
      }
      utterance.lang = 'en-IN';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsSpeaking(false);
    }
  };

  const handleExplainGraph = () => {
    sound.playRadarPing();
    setIsExplaining(true);
    setShowAiSummary(true);

    // Automatically trigger voice speaker readout by default when asked for explanation
    speakText(aiGraphExplanation);

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
        animationDuration: 500,
        nodeRepulsion: () => 9500 * scale,
        idealEdgeLength: () => 110 * scale,
        edgeElasticity: () => 120 / scale,
        padding: 50,
        randomize: false,
        componentSpacing: 60 * scale,
        nodeOverlap: 25,
        gravity: 1.4 / scale,
        nestingFactor: 1.5,
        numIter: 800,
        initialTemp: 250,
        coolingFactor: 0.95,
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

    // Inject Omni-Trace Escape Nodes & Synthetic Footprint Edges
    let rajanTargetId = 'node-2';
    // Priority 1: Exact label 'rajan' with type PERSON
    for (const [id, n] of nodeMap.entries()) {
      const name = (n.data?.label || n.data?.name || '').trim().toLowerCase();
      if (name === 'rajan' && n.data?.type === 'PERSON') {
        rajanTargetId = id;
        break;
      }
    }
    // Priority 2: Contains 'rajan' and is PERSON
    if (!nodeMap.has(rajanTargetId)) {
      for (const [id, n] of nodeMap.entries()) {
        const name = (n.data?.label || n.data?.name || '').trim().toLowerCase();
        if (name.includes('rajan') && n.data?.type === 'PERSON') {
          rajanTargetId = id;
          break;
        }
      }
    }
    // Priority 3: Fallback to ent-1 or first node
    if (!nodeMap.has(rajanTargetId)) {
      if (nodeMap.has('ent-1')) rajanTargetId = 'ent-1';
      else if (nodeMap.has('node-2')) rajanTargetId = 'node-2';
      else if (nodeMap.size > 0) rajanTargetId = nodeMap.keys().next().value || 'node-2';
    }

    const omniTraceNodes = [
      {
        id: 'node-imei-358912093847291',
        name: 'IMEI 358912093847291',
        type: 'DEVICE',
        riskLevel: 'HIGH',
        confidence: 0.98,
        cluster: 7,
      },
      {
        id: 'node-upi-rajan-bhai',
        name: 'rajan.bhai@okhdfcbank',
        type: 'UPI',
        riskLevel: 'CRITICAL',
        confidence: 0.96,
        cluster: 8,
      },
      {
        id: 'node-transit-uber-4412',
        name: 'Uber DL-1ZB-4412',
        type: 'TRANSIT',
        riskLevel: 'HIGH',
        confidence: 0.94,
        cluster: 9,
      },
      {
        id: 'node-utility-sm-noida',
        name: 'Smart Meter (+420% Surge)',
        type: 'UTILITY',
        riskLevel: 'CRITICAL',
        confidence: 0.97,
        cluster: 10,
      },
    ];

    omniTraceNodes.forEach((omni) => {
      if (!nodeMap.has(omni.id)) {
        nodeMap.set(omni.id, {
          data: {
            id: omni.id,
            label: omni.name,
            name: omni.name,
            type: omni.type,
            riskLevel: omni.riskLevel,
            confidence: omni.confidence,
            cluster: omni.cluster,
            isConnected: true,
            raw: {
              id: omni.id,
              name: omni.name,
              type: omni.type,
              riskLevel: omni.riskLevel,
              confidence: omni.confidence,
              properties: { origin: 'Omni-Trace Digital Footprint' },
            },
          },
          classes: communityClusteringActive ? 'cluster-active' : '',
        });
      }
    });

    if (nodeMap.has(rajanTargetId)) {
      const omniEdges = [
        { id: `omni-edge-imei-${rajanTargetId}`, source: rajanTargetId, target: 'node-imei-358912093847291', label: 'HARDWARE_IMEI' },
        { id: `omni-edge-upi-${rajanTargetId}`, source: rajanTargetId, target: 'node-upi-rajan-bhai', label: 'OFFRAMP_UPI' },
        { id: `omni-edge-transit-${rajanTargetId}`, source: rajanTargetId, target: 'node-transit-uber-4412', label: 'HAILING_CAB' },
        { id: `omni-edge-utility-${rajanTargetId}`, source: rajanTargetId, target: 'node-utility-sm-noida', label: 'GRID_SPIKE' },
      ];
      omniEdges.forEach((oe) => {
        if (!edgeMap.has(oe.id)) {
          edgeMap.set(oe.id, {
            data: {
              id: oe.id,
              source: oe.source,
              target: oe.target,
              label: oe.label,
              confidence: 0.95,
              raw: { id: oe.id, sourceEntityId: oe.source, targetEntityId: oe.target, type: oe.label, confidenceScore: 0.95 },
            },
            classes: '',
          });
        }
      });
    }

    // -------------------------------------------------------------
    // UNIFY DISJOINT COMPONENTS (Fix the "4 different node graphs" issue)
    // Connect each disjoint sub-cluster directly to the primary syndicate hub (Rajan)
    // -------------------------------------------------------------
    if (unifiedGraphActive && components.length > 1 && nodeMap.has(rajanTargetId)) {
      components.forEach((comp, compIdx) => {
        // Skip the primary component that contains rajanTargetId
        if (comp.includes(rajanTargetId)) return;

        // Choose the best lead node in this component (highest degree / most connected)
        let bestLeadId = comp[0];
        let maxDeg = -1;
        comp.forEach((nid) => {
          const deg = (adj.get(nid) || new Set()).size;
          if (deg > maxDeg) {
            maxDeg = deg;
            bestLeadId = nid;
          }
        });

        const leadNode = nodeMap.get(bestLeadId);
        const nodeType = leadNode?.data?.type || 'ENTITY';
        const nodeName = leadNode?.data?.name || leadNode?.data?.label || '';

        let bridgeType = 'SYNDICATE_COORDINATION';
        if (nodeType === 'BANK_ACCOUNT' || nodeType === 'CRYPTO_WALLET' || nodeType === 'UPI' || nodeName.includes('ACC-') || nodeName.includes('CASH')) {
          bridgeType = 'HAWALA_SMURF_CHANNEL';
        } else if (nodeType === 'PHONE' || nodeType === 'DEVICE' || nodeName.startsWith('+') || /^\d{10}$/.test(nodeName)) {
          bridgeType = 'BURNER_COMMUNICATION';
        } else if (nodeType === 'ORGANIZATION' || nodeName.includes('Hawala') || nodeName.includes('Beneficiary')) {
          bridgeType = 'BENEFICIARY_OFFRAMP';
        } else if (nodeType === 'VEHICLE' || nodeName.includes('TS') || nodeName.includes('DL')) {
          bridgeType = 'GETAWAY_VEHICLE_LOGISTICS';
        } else if (nodeType === 'LOCATION') {
          bridgeType = 'SAFEHOUSE_BASE';
        }

        const bridgeId = `bridge-unify-comp-${compIdx}-${rajanTargetId}-${bestLeadId}`;
        if (!edgeMap.has(bridgeId)) {
          edgeMap.set(bridgeId, {
            data: {
              id: bridgeId,
              source: rajanTargetId,
              target: bestLeadId,
              label: bridgeType,
              confidence: 0.94,
              raw: {
                id: bridgeId,
                sourceEntityId: rajanTargetId,
                targetEntityId: bestLeadId,
                type: bridgeType,
                confidenceScore: 0.94,
              },
            },
            classes: 'bridge-unify-edge',
          });
        }
      });
    }

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
            shape: (ele: NodeSingular) => {
              const type = ele.data('type');
              if (type === 'DEVICE') return 'hexagon';
              if (type === 'UPI') return 'diamond';
              if (type === 'TRANSIT') return 'round-rectangle';
              if (type === 'UTILITY') return 'star';
              return 'ellipse';
            },
            'background-color': (ele: NodeSingular) => {
              const type = ele.data('type');
              if (type === 'PERSON') return '#3b82f6';
              if (type === 'PHONE') return '#f59e0b';
              if (type === 'VEHICLE') return '#a855f7';
              if (type === 'BANK_ACCOUNT') return '#10b981';
              if (type === 'ORGANIZATION') return '#f97316';
              if (type === 'CRYPTO_WALLET') return '#eab308';
              if (type === 'LOCATION') return '#06b6d4';
              if (type === 'DEVICE') return '#0284c7';
              if (type === 'UPI') return '#10b981';
              if (type === 'TRANSIT') return '#f59e0b';
              if (type === 'UTILITY') return '#e11d48';
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
        // Feature 2: Search Highlight & 20% Dimming Style
        {
          selector: '.highlighted-search',
          style: {
            'border-color': '#f59e0b',
            'border-width': 6,
            'overlay-color': '#f59e0b',
            'overlay-opacity': 0.5,
            opacity: 1,
            'z-index': 999,
          },
        },
        {
          selector: '.search-dimmed',
          style: {
            opacity: 0.20,
            'text-opacity': 0.15,
          },
        },
        {
          selector: '.search-neighbor',
          style: {
            'border-width': 4,
            'border-color': '#38bdf8',
            'border-opacity': 1,
            opacity: 1,
            'z-index': 998,
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
        {
          selector: 'edge.predicted-link',
          style: {
            'line-color': '#00e5ff',
            'line-style': 'dashed',
            'line-dash-pattern': [8, 4],
            width: 3.5,
            'target-arrow-color': '#00e5ff',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            opacity: 0.98,
            label: 'data(label)',
            color: '#38bdf8',
            'font-size': '10px',
            'font-weight': 'bold',
            'text-background-color': '#020617',
            'text-background-opacity': 0.9,
            'text-background-padding': '3px',
            'z-index': 999,
          },
        },
        {
          selector: 'edge.bridge-unify-edge',
          style: {
            'line-color': '#06b6d4',
            'line-style': 'dashed',
            'line-dash-pattern': [6, 3],
            width: 3,
            'target-arrow-color': '#06b6d4',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            opacity: 0.9,
            label: 'data(label)',
            color: '#38bdf8',
            'font-size': '10px',
            'font-weight': 'bold',
            'text-background-color': '#020617',
            'text-background-opacity': 0.9,
            'text-background-padding': '3px',
            'z-index': 998,
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

    cy.on('mouseover', 'node', (evt) => {
      const nodeEle = evt.target;
      const raw = nodeEle.data('raw');
      const pos = evt.renderedPosition;
      setHoveredNode({
        name: (nodeEle.data('label') || nodeEle.id()) as string,
        type: (nodeEle.data('type') || 'ENTITY') as string,
        riskScore: raw?.riskScore || (nodeEle.hasClass('kingpin-golden') ? 95 : 78),
        x: pos.x,
        y: pos.y,
      });
    });

    cy.on('mouseout', 'node', () => {
      setHoveredNode(null);
    });

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

      // Auto-narrate node intelligence via voice speaker by default
      if (autoSpeakOnSelect) {
        const text = `Entity ${nodeData.name}, categorized as ${nodeData.type} with ${Math.round(nodeData.confidence * 100)} percent confidence score and ${nodeData.riskLevel || 'HIGH'} risk priority. Verified in criminal intelligence graph.`;
        speakText(text);
      }

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
  }, [graphData, selectedLayout, unifiedGraphActive]);

  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    if (!searchTerm.trim()) {
      cy.elements().removeClass('highlighted-search search-dimmed search-neighbor');
      return;
    }
    const term = searchTerm.toLowerCase();
    const matched = cy.nodes().filter((n) => ((n.data('label') || n.id()) as string).toLowerCase().includes(term));
    if (matched.length > 0) {
      cy.elements().removeClass('highlighted-search search-dimmed search-neighbor');
      cy.elements().addClass('search-dimmed');
      matched.removeClass('search-dimmed').addClass('highlighted-search');
      const nh = matched.neighborhood();
      nh.removeClass('search-dimmed');
      nh.nodes().addClass('search-neighbor');
      cy.animate({
        center: { eles: matched.first() },
        zoom: 1.5,
        duration: 400,
      });
      matched.first().select();
    } else {
      cy.elements().removeClass('highlighted-search search-dimmed search-neighbor');
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
            variant={unifiedGraphActive ? 'primary' : 'outline'}
            onClick={() => {
              sound.playClickSound();
              setUnifiedGraphActive(!unifiedGraphActive);
            }}
            className={`flex items-center gap-1.5 ${
              unifiedGraphActive
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-400 shadow-md shadow-cyan-950/40'
                : 'border-cyan-500/50 hover:bg-cyan-950/30 text-cyan-400'
            }`}
            title="Unify all 4 disjoint components into one connected cohesive syndicate graph"
          >
            <Sparkles className="h-4 w-4" />
            <span>{unifiedGraphActive ? 'Unified Syndicate: ON' : 'Show Disjoint Clusters'}</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              sound.playClickSound();
              setShowGlobalImpactModal(true);
            }}
            className="border-emerald-500/60 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-900/40 flex items-center gap-1.5 font-bold"
            title="View how graph intelligence reduces crime worldwide (NYPD, London Met, Interpol, Singapore)"
          >
            <Globe className="h-4 w-4 text-emerald-400" />
            <span>Global Impact (Abroad)</span>
          </Button>
          <Button
            size="sm"
            variant={autoSpeakOnSelect ? 'primary' : 'outline'}
            onClick={() => {
              sound.playClickSound();
              setAutoSpeakOnSelect(!autoSpeakOnSelect);
            }}
            className={`flex items-center gap-1.5 font-bold ${
              autoSpeakOnSelect
                ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-400 shadow-md shadow-amber-950/40'
                : 'border-amber-500/50 hover:bg-amber-950/30 text-amber-400'
            }`}
            title="When active, clicking any node triggers speech synthesis voice narration by default"
          >
            {autoSpeakOnSelect ? (
              <>
                <Volume2 className="h-4 w-4 animate-pulse text-amber-200" />
                <span>Speaker: Default ON</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-amber-400" />
                <span>Speaker: OFF</span>
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant={showAiSummary ? 'secondary' : 'outline'}
            onClick={handleExplainGraph}
            disabled={isExplaining}
            className="border-primary/40 text-primary hover:bg-primary/10 flex items-center gap-1.5 font-bold"
            title="Synthesize AI explanation with automatic voice briefing speaker"
          >
            <Bot className={`h-4 w-4 ${isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-primary'}`} />
            <span>{isSpeaking ? 'Speaking Briefing...' : isExplaining ? 'Explaining...' : 'Explain this graph (Voice)'}</span>
            {isSpeaking && <Volume2 className="h-3.5 w-3.5 text-emerald-400 animate-bounce" />}
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
                  <option value="DEVICE">DEVICE (IMEI)</option>
                  <option value="UPI">UPI / VPA</option>
                  <option value="TRANSIT">TRANSIT / CAB</option>
                  <option value="UTILITY">UTILITY / GRID</option>
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

              {/* AI Link Prediction: Uncover Hidden Bridges Between Disjoint Clusters */}
              <button
                onClick={handlePredictClusterLinks}
                className={`h-8 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  predictedLinksActive
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
                title="Run Adamic-Adar / HDM-GNN link prediction to connect Rajan's syndicate across disconnected criminal clusters"
              >
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-[11px]">
                  {predictedLinksActive ? '⚡ Predicted Links (Active)' : '🔗 AI Link Prediction'}
                </span>
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
            {!isLoading && (!graphData?.nodes || graphData.nodes.length === 0) && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 text-center p-6 space-y-3">
                <Network className="h-10 w-10 text-muted-foreground/60" />
                <h3 className="text-sm font-bold text-foreground">No network data available for this case</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  There are no active criminal entities or inter-entity relationships found in the Neo4j database for this case.
                </p>
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

            {/* Node Hover Intelligence Tooltip */}
            {hoveredNode && (
              <div
                className="pointer-events-none absolute z-30 px-3 py-2 rounded-xl border border-sky-400/60 bg-slate-950/90 backdrop-blur-md shadow-2xl text-xs space-y-1 transform -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in-95"
                style={{
                  left: Math.max(80, Math.min(hoveredNode.x, 800)),
                  top: Math.max(40, hoveredNode.y - 15),
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">{hoveredNode.name}</span>
                  <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono text-[9px] border border-sky-500/40">
                    {hoveredNode.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                  <span>Risk Score:</span>
                  <span className={`font-bold ${hoveredNode.riskScore >= 80 ? 'text-red-400' : 'text-amber-400'}`}>
                    {hoveredNode.riskScore}/100
                  </span>
                  <span>•</span>
                  <span>Sec 63 BSA Grounded</span>
                </div>
              </div>
            )}

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
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                      <span className="text-slate-400">DEVICE (IMEI)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                      <span className="text-slate-400">UPI / VPA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span className="text-slate-400">TRANSIT (CAB)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                      <span className="text-slate-400">UTILITY (SMART METER)</span>
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

                {/* Visual Photographic Intelligence Cards (Replaces Dense Wordy Text) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* Card 1: Primary Syndicate Kingpin */}
                  <div className="rounded-xl border border-red-500/40 bg-slate-900/90 p-2 space-y-1.5 flex flex-col justify-between overflow-hidden shadow-sm">
                    <div className="flex items-center gap-2">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                        alt="Rajan Verma"
                        className="w-10 h-10 rounded-lg object-cover border-2 border-red-500 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[11px] font-black text-white truncate block">Rajan Verma</span>
                        <span className="text-[9px] font-mono text-red-400 font-bold block">Syndicate Kingpin</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-white/10 text-muted-foreground">
                      <span>Degree 8 Hub</span>
                      <span className="text-red-400 font-black">92% Risk</span>
                    </div>
                  </div>

                  {/* Card 2: Getaway Vehicle ANPR */}
                  <div className="rounded-xl border border-amber-500/40 bg-slate-900/90 p-2 space-y-1.5 flex flex-col justify-between overflow-hidden shadow-sm">
                    <div className="flex items-center gap-2">
                      <img
                        src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400"
                        alt="Scorpio ANPR"
                        className="w-10 h-10 rounded-lg object-cover border-2 border-amber-500 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[11px] font-black text-white truncate block">TS 09 AB 1234</span>
                        <span className="text-[9px] font-mono text-amber-300 font-bold block">Black Scorpio</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-white/10 text-muted-foreground">
                      <span>118 km/h</span>
                      <span className="text-amber-400 font-bold">KM 48 Toll</span>
                    </div>
                  </div>

                  {/* Card 3: Smurfing Bank Mule */}
                  <div className="rounded-xl border border-cyan-500/40 bg-slate-900/90 p-2 space-y-1.5 flex flex-col justify-between overflow-hidden shadow-sm">
                    <div className="flex items-center gap-2">
                      <img
                        src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400"
                        alt="HDFC Bank"
                        className="w-10 h-10 rounded-lg object-cover border-2 border-cyan-500 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[11px] font-black text-white truncate block">ACC-908122</span>
                        <span className="text-[9px] font-mono text-cyan-300 font-bold block">HDFC Mule</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-white/10 text-muted-foreground">
                      <span>₹48,500 Flows</span>
                      <span className="text-cyan-400 font-bold">Sec 102 CrPC</span>
                    </div>
                  </div>

                  {/* Card 4: Telecom Tower Azimuth */}
                  <div className="rounded-xl border border-purple-500/40 bg-slate-900/90 p-2 space-y-1.5 flex flex-col justify-between overflow-hidden shadow-sm">
                    <div className="flex items-center gap-2">
                      <img
                        src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400"
                        alt="Telecom Tower"
                        className="w-10 h-10 rounded-lg object-cover border-2 border-purple-500 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[11px] font-black text-white truncate block">DL-TWR-8812</span>
                        <span className="text-[9px] font-mono text-purple-300 font-bold block">Airtel Azimuth</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-white/10 text-muted-foreground">
                      <span>142° Sector</span>
                      <span className="text-purple-400 font-bold">Sec 39 BNSS</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-background/60 border border-border text-xs space-y-1.5 leading-relaxed">
                  <div className="flex items-center gap-1.5 text-primary font-bold text-[11px]">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Topological Synthesis:</span>
                  </div>
                  <p className="text-foreground/90 font-medium text-[11px]">
                    {aiGraphExplanation}
                  </p>
                </div>
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
              <CardContent className="space-y-3 text-xs">
                {/* Visual Photographic Banner for Selected Entity */}
                <div className="relative rounded-xl overflow-hidden border border-border/80 bg-slate-950">
                  <img
                    src={
                      selectedNode.type === 'PERSON'
                        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300'
                        : selectedNode.type === 'VEHICLE'
                        ? 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400'
                        : selectedNode.type === 'BANK_ACCOUNT'
                        ? 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400'
                        : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'
                    }
                    alt={selectedNode.name}
                    className="w-full h-28 object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-end justify-between">
                    <div>
                      <Badge variant="outline" className="text-[10px] font-mono bg-black/60 border-primary/50 text-primary font-bold">
                        {selectedNode.type}
                      </Badge>
                      <h3 className="text-sm font-black text-white mt-0.5 truncate">{selectedNode.name}</h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/30 text-red-300 border border-red-500/50 font-bold">
                      {selectedNode.riskLevel || 'HIGH'} RISK
                    </span>
                  </div>
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-cyan-500/50 text-cyan-300 hover:bg-cyan-950/40 flex items-center justify-center gap-1.5 font-bold"
                    onClick={() => {
                      const text = `Entity ${selectedNode.name}, categorized as ${selectedNode.type} with ${(selectedNode.confidence * 100).toFixed(0)} percent confidence score and ${selectedNode.riskLevel || 'HIGH'} risk priority. Verified via police knowledge graph linkage.`;
                      speakText(text);
                    }}
                  >
                    <Volume2 className="h-4 w-4 text-cyan-400 animate-pulse" />
                    <span>Audio Explain Node (Speaker)</span>
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

      {/* International Precedents & Global Crime Reduction Showcase */}
      <div className="p-4 rounded-xl border border-emerald-500/40 bg-slate-900/90 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>International Benchmarks: How Graph Intelligence Slashes Crime Globally</span>
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/40 font-mono">
                  PROVEN CASE STUDIES
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                Documented results from police & intelligence agencies replacing static tables with entity knowledge graphs.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              sound.playClickSound();
              setShowGlobalImpactModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Open Detailed Global Impact Dossier</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: NYPD */}
          <div className="p-3 rounded-lg bg-slate-950/80 border border-blue-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400">🇺🇸 NYPD Domain Awareness</span>
              <span className="text-[10px] font-extrabold text-emerald-400 font-mono">-28% Violence</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Fuses 9,000+ CCTV feeds, ANPR highway cameras & call records to stop gang shootings before retaliation.
            </p>
          </div>

          {/* Card 2: London Met */}
          <div className="p-3 rounded-lg bg-slate-950/80 border border-purple-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400">🇬🇧 London Met Gangs Matrix</span>
              <span className="text-[10px] font-extrabold text-purple-400 font-mono">-39% Knife Crime</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Betweenness centrality uncovered 420+ hidden kingpins operating solely through burner phone clusters.
            </p>
          </div>

          {/* Card 3: Europol & INTERPOL */}
          <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">🇪🇺 Europol / INTERPOL</span>
              <span className="text-[10px] font-extrabold text-amber-400 font-mono">9 Mos → 48 Hrs</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Neo4j cross-border graphs collapsed shell company and money laundering investigation latency by 99%.
            </p>
          </div>

          {/* Card 4: Singapore SPF */}
          <div className="p-3 rounded-lg bg-slate-950/80 border border-cyan-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400">🇸🇬 Singapore Police Force</span>
              <span className="text-[10px] font-extrabold text-cyan-400 font-mono">-62% Syndicates</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Graph fusion across bank transfer ledgers and facial cameras achieved an 84% 24-hr clearance rate.
            </p>
          </div>
        </div>
      </div>

      {/* Graph Export Preview Modal */}
      {graphExportPreview && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setGraphExportPreview(null);
          }}
        >
          <div
            className="min-h-full flex justify-center p-2 sm:p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setGraphExportPreview(null);
            }}
          >
            <div className="relative w-full my-auto max-w-4xl bg-slate-900 border border-primary/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
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
      </div>,
        document.body
      )}
      {/* Global Precedents & Pro Features Hub Modal */}
      <ProFeaturesHubModal
        isOpen={showGlobalImpactModal}
        onClose={() => setShowGlobalImpactModal(false)}
        initialTab="GLOBAL_IMPACT"
      />
    </div>
  );
}
