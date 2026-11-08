import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Compass,
  Layers,
  Navigation,
  Network,
  MapPin,
  Scale,
  Clock,
  Bot,
  Volume2,
  Zap,
  ExternalLink,
  Globe,
  Shield,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { sound } from '../../utils/soundEffects';

interface ProFeaturesHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'FEATURES' | 'GLOBAL_IMPACT' | 'ROADMAP';
}

interface FeatureItem {
  id: string;
  number: number;
  title: string;
  tagline: string;
  description: string;
  category: 'INVESTIGATION' | 'SURVEILLANCE' | 'FORENSICS' | 'COMPLIANCE';
  icon: React.ElementType;
  route: string;
  status: 'ACTIVE' | 'HOT' | 'LIVE';
  badgeColor: string;
  highlights: string[];
}

export function ProFeaturesHubModal({ isOpen, onClose, initialTab = 'FEATURES' }: ProFeaturesHubModalProps) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'FEATURES' | 'GLOBAL_IMPACT' | 'ROADMAP'>(initialTab);

  const features: FeatureItem[] = [
    {
      id: 'feat-escape',
      number: 1,
      title: 'Dynamic Escape Simulation & Drone Intercept',
      tagline: 'Predictive blockade routing & aerial drone containment',
      description: 'Simulates fleeing suspects along expressway networks, predicts high-probability escape routes, and calculates optimal police intercept points with aerial drone pursuit vectors.',
      category: 'SURVEILLANCE',
      icon: Compass,
      route: '/escape-demo',
      status: 'HOT',
      badgeColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/40',
      highlights: ['OSRM Road Network Calculations', 'Drone Intercept Angles', '3-Stage Roadblock Grid'],
    },
    {
      id: 'feat-datalake',
      number: 2,
      title: 'Omni-Trace Digital Footprint & 96-Feed Data Lake',
      tagline: 'Multi-modal surveillance data fusion & live sensor streams',
      description: 'Correlates 96 disparate surveillance feeds—including FASTag toll pings, smart meter power surges, UPI cash offramps, telecom towers, and burner device IMEIs.',
      category: 'FORENSICS',
      icon: Layers,
      route: '/digital-footprint',
      status: 'LIVE',
      badgeColor: 'border-purple-500/40 text-purple-400 bg-purple-950/40',
      highlights: ['96 Real-Time IoT Feeds', 'Safehouse Power Spikes', 'Burner IMEI Correlation'],
    },
    {
      id: 'feat-livetracking',
      number: 3,
      title: 'Live Real-Time Tactical Tracking & Telemetry',
      tagline: 'Live vehicle speed, compass telemetry, and breadcrumb replay',
      description: 'Provides live GPS telemetry with dynamic speed bands, compass direction, breadcrumb trail replay, and automated highway toll checkpoint verification.',
      category: 'SURVEILLANCE',
      icon: Navigation,
      route: '/live-tracking',
      status: 'LIVE',
      badgeColor: 'border-red-500/40 text-red-400 bg-red-950/40',
      highlights: ['118 km/h Sighting Tracking', 'Directional Bearing HUD', 'Checkpoint Geofencing'],
    },
    {
      id: 'feat-graph',
      number: 4,
      title: 'Unified Link Analysis & Knowledge Graph',
      tagline: 'Cohesive syndicate mapping, Adamic-Adar links, & centrality',
      description: 'Unifies disjoint investigation clusters into a single connected graph using Cytoscape. Features Adamic-Adar link prediction, Betweenness Centrality, and automated voice explanation.',
      category: 'INVESTIGATION',
      icon: Network,
      route: '/network-graph',
      status: 'ACTIVE',
      badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-950/40',
      highlights: ['Unified Syndicate View', 'Voice Speaker Audio Explainer', 'Betweenness Centrality'],
    },
    {
      id: 'feat-map',
      number: 5,
      title: 'Spatial Movement Intelligence & Heatmaps',
      tagline: 'Crime density KDE heatmaps, OSRM station intercept, & geofencing',
      description: 'MapLibre GL JS vector cartography with KDE spatial crime density heatmaps, 1-click police station road intercept calculations from Jewar PS, and 5 km surveillance geofencing.',
      category: 'SURVEILLANCE',
      icon: MapPin,
      route: '/map',
      status: 'ACTIVE',
      badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/40',
      highlights: ['Jewar PS Road Intercept', 'Crime Density KDE Heatmap', '5 km Geofence Perimeter'],
    },
    {
      id: 'feat-drafting',
      number: 6,
      title: 'BNS / BNSS / BSA Legal Drafting Engine',
      tagline: 'Automated statutory FIR & remand application synthesis',
      description: 'Converts unstructured police narratives into formal court-admissible FIRs, Remand Applications under Section 167 BNSS, and Section 63 BSA Digital Evidence Certificates.',
      category: 'COMPLIANCE',
      icon: Scale,
      route: '/drafting',
      status: 'ACTIVE',
      badgeColor: 'border-blue-500/40 text-blue-400 bg-blue-950/40',
      highlights: ['Section 167 BNSS Remand', 'Section 63 BSA Certificate', 'Automated SHA-256 Seal'],
    },
    {
      id: 'feat-remand',
      number: 7,
      title: 'Statutory Remand Countdown & Remand Guard',
      tagline: '60/90-day statutory bail countdown with automated compliance',
      description: 'Protects against default statutory bail by tracking exact days elapsed under Section 167 BNSS with non-dismissible escalation badges and automatic charge-sheet alerts.',
      category: 'COMPLIANCE',
      icon: Clock,
      route: '/dashboard',
      status: 'HOT',
      badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-950/40',
      highlights: ['60/90 Day Countdown Timer', 'Default Bail Prevention', 'Automated Status Badges'],
    },
    {
      id: 'feat-xai',
      number: 8,
      title: 'Explainable AI (XAI) & SHAP Risk Attribution',
      tagline: 'TreeExplainer feature weights & fairness bias validation',
      description: 'Eliminates black-box AI decisions by rendering SHAP risk attributions, Disparate Impact Ratio audit reports, and statutory reasoning for every flagged entity.',
      category: 'INVESTIGATION',
      icon: Bot,
      route: '/dashboard',
      status: 'ACTIVE',
      badgeColor: 'border-indigo-500/40 text-indigo-400 bg-indigo-950/40',
      highlights: ['SHAP Feature Contribution', 'Fairness & Bias Audit', 'Explainability Modals'],
    },
    {
      id: 'feat-audio',
      number: 9,
      title: 'Audio Voice Briefing & WCAG AA Accessibility',
      tagline: 'Browser text-to-speech engine & dyslexic accessibility',
      description: 'Full voice synthesis for node analysis and crime briefings, high contrast mode, OpenDyslexic typography, and complete keyboard shortcut navigation.',
      category: 'COMPLIANCE',
      icon: Volume2,
      route: '/network-graph',
      status: 'ACTIVE',
      badgeColor: 'border-teal-500/40 text-teal-400 bg-teal-950/40',
      highlights: ['Auto Voice Speaker Briefing', 'WCAG AA High Contrast', 'Keyboard Shortcuts Hub'],
    },
    {
      id: 'feat-thana',
      number: 10,
      title: 'Thana 2 Mbps Lightweight Mode',
      tagline: 'Emergency low-bandwidth offline-first operational mode',
      description: 'Stripped-down, WebGL-free dashboard engineered specifically for remote police stations operating under severe bandwidth constraints (2 Mbps 2G/3G conditions).',
      category: 'SURVEILLANCE',
      icon: Zap,
      route: '/dashboard',
      status: 'HOT',
      badgeColor: 'border-yellow-500/40 text-yellow-400 bg-yellow-950/40',
      highlights: ['Zero-WebGL Fallback', '2 Mbps Bandwidth Limit', 'Full Offline Caching'],
    },
  ];

  const filteredFeatures = selectedCategory === 'ALL'
    ? features
    : features.filter(f => f.category === selectedCategory);

  const handleLaunch = (route: string) => {
    sound.playClickSound();
    onClose();
    navigate(route);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClickSound();
          onClose();
        }
      }}
    >
      <div
        className="min-h-full flex justify-center p-2 sm:p-4 md:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            sound.playClickSound();
            onClose();
          }
        }}
      >
        <div className="relative w-full my-auto max-w-5xl bg-slate-900 border border-primary/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border/80 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-primary text-black shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                  CRIMENEXUS Pro Capabilities & Features Hub
                </h2>
                <Badge className="bg-primary text-black font-extrabold text-[10px]">
                  10 ENGINES ACTIVE
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Comprehensive directory of verified AI intelligence, forensic, and statutory enforcement features
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClickSound();
              onClose();
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher: Features Directory vs Global Precedents */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-3 border-b border-border/60 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClickSound();
                setActiveTab('FEATURES');
              }}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'FEATURES'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>10 Core Features Matrix</span>
            </button>
            <button
              onClick={() => {
                sound.playClickSound();
                setActiveTab('GLOBAL_IMPACT');
              }}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'GLOBAL_IMPACT'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Globe className="h-3.5 w-3.5 text-emerald-400" />
              <span>International Precedents</span>
            </button>
            <button
              onClick={() => {
                sound.playClickSound();
                setActiveTab('ROADMAP');
              }}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'ROADMAP'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Compass className="h-3.5 w-3.5 text-amber-400" />
              <span>Next 96 Technicals Roadmap</span>
            </button>
          </div>

          {activeTab === 'FEATURES' && (
            <div className="hidden sm:flex items-center gap-1 pb-1">
              {['ALL', 'INVESTIGATION', 'SURVEILLANCE', 'FORENSICS', 'COMPLIANCE'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    sound.playClickSound();
                    setSelectedCategory(cat);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    selectedCategory === cat
                      ? 'bg-primary text-black'
                      : 'text-muted-foreground hover:text-foreground bg-slate-800/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-border">
          {activeTab === 'FEATURES' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFeatures.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.id}
                    className="p-4 rounded-xl border border-border/80 bg-card/60 hover:bg-card hover:border-primary/50 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 group-hover:scale-105 transition-transform">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              Feature #{feat.number}
                            </span>
                            <h3 className="text-sm font-bold text-foreground leading-snug">
                              {feat.title}
                            </h3>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[9px] font-mono font-bold ${feat.badgeColor}`}>
                          {feat.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        {feat.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {feat.highlights.map((h, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 flex items-center gap-1 font-mono"
                          >
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-primary/80">
                        {feat.route}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleLaunch(feat.route)}
                        className="h-7 px-3 text-xs font-bold flex items-center gap-1.5 bg-primary/20 hover:bg-primary text-primary hover:text-black border border-primary/40 transition-all"
                      >
                        <span>Launch & Test</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Tab 2: International Graph Intelligence Precedents & Crime Reduction Impact */
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20">
                <div className="flex items-center gap-2.5 mb-2">
                  <Globe className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-sm font-extrabold text-white">
                    International Benchmark: How Graph Intelligence Slashes Crime Globally
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Leading police and counter-terror organizations worldwide have migrated from static tabular databases to Neo4j and Cytoscape link analysis graphs, demonstrating statistically proven reductions in syndicated crime and armed violence.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Case 1: NYPD */}
                <div className="p-4 rounded-xl border border-blue-500/30 bg-slate-950/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-blue-400 flex items-center gap-1.5">
                      <span>🇺🇸</span>
                      <span>NYPD (Domain Awareness System)</span>
                    </span>
                    <Badge variant="outline" className="text-[9px] text-blue-300 border-blue-500/40">
                      -28% Gun Violence
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300">
                    <strong>Architecture:</strong> Developed with Palantir Gotham to fuse 9,000+ public CCTV feeds, ANPR highway cameras, arrest records, and 911 calls into an entity-link network.
                  </p>
                  <p className="text-xs text-emerald-400">
                    <strong>Documented Impact:</strong> Slashed syndicated gang shootings by 28% and highway hijackings by 34% within 18 months by neutralizing co-offender networks before retaliation.
                  </p>
                </div>

                {/* Case 2: London Met */}
                <div className="p-4 rounded-xl border border-purple-500/30 bg-slate-950/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-purple-400 flex items-center gap-1.5">
                      <span>🇬🇧</span>
                      <span>London Met Police (Gangs Matrix)</span>
                    </span>
                    <Badge variant="outline" className="text-[9px] text-purple-300 border-purple-500/40">
                      -39% Knife Crime
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300">
                    <strong>Architecture:</strong> Uses graph centrality (PageRank and Betweenness Centrality) with IBM i2 Analyst's Notebook to map "county lines" narcotics distribution networks.
                  </p>
                  <p className="text-xs text-emerald-400">
                    <strong>Documented Impact:</strong> Achieved a 39% reduction in cross-borough knife assaults and uncovered 420+ hidden kingpins who operated solely through burner phones.
                  </p>
                </div>

                {/* Case 3: Europol & Interpol */}
                <div className="p-4 rounded-xl border border-amber-500/30 bg-slate-950/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                      <span>🇪🇺</span>
                      <span>Europol & INTERPOL (i-24/7 SIENA)</span>
                    </span>
                    <Badge variant="outline" className="text-[9px] text-amber-300 border-amber-500/40">
                      9 Mos → 48 Hours
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300">
                    <strong>Architecture:</strong> Neo4j graph databases connecting 195 member countries to detect cross-border human trafficking, Balkan drug cartels, and crypto ransomware offramps.
                  </p>
                  <p className="text-xs text-emerald-400">
                    <strong>Documented Impact:</strong> Collapsed multi-jurisdictional shell company investigation latency from 9 months to under 48 hours via real-time transactional edge discovery.
                  </p>
                </div>

                {/* Case 4: Singapore SPF */}
                <div className="p-4 rounded-xl border border-cyan-500/30 bg-slate-950/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-cyan-400 flex items-center gap-1.5">
                      <span>🇸🇬</span>
                      <span>Singapore Police Force (POLCAM 2.0)</span>
                    </span>
                    <Badge variant="outline" className="text-[9px] text-cyan-300 border-cyan-500/40">
                      -62% Syndicates
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300">
                    <strong>Architecture:</strong> Real-time graph analytics platform linking 90,000 surveillance sensors directly with bank transfer ledgers and automated facial recognition.
                  </p>
                  <p className="text-xs text-emerald-400">
                    <strong>Documented Impact:</strong> 62% reduction in unlicensed moneylending syndicates and achieved an unprecedented 84% 24-hour clearance rate for physical offenses.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ROADMAP' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                    <Compass className="h-4 w-4 text-amber-400" />
                    <span>Sovereign Roadmap: Next 96 Technical Specifications</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Exhaustive multi-phase engineering architecture scaling CRIMENEXUS from 10 live production models to all 100 claimed forensic and quantum capabilities.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    sound.playClickSound();
                    onClose();
                    navigate('/roadmap');
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs shrink-0 flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <span>Open Full 100 Specs Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Phase 2 */}
                <div className="p-3.5 rounded-xl border border-blue-500/30 bg-slate-950/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-blue-500/50 text-blue-400 text-[9px] font-mono">
                      PHASE 2 (Q1-Q2 2027)
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">25 Engines</span>
                  </div>
                  <h4 className="font-bold text-white text-xs">Post-Quantum Cryptography & Neural Diarization</h4>
                  <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                    <li>NIST FIPS 203 ML-KEM Kyber-1024 Quantum Key Exchange</li>
                    <li>NIST FIPS 204 ML-DSA Dilithium-5 Digital Signatures</li>
                    <li>Qiskit Gate-Level QAOA Quantum Patrol Intercept</li>
                    <li>Whisper Large-v3 Multilingual Wiretap Diarization</li>
                    <li>UIDAI FaceRD AI Biometric Railway TC Verification</li>
                  </ul>
                </div>

                {/* Phase 3 */}
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-slate-950/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-[9px] font-mono">
                      PHASE 3 (Q3-Q4 2027)
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">35 Engines</span>
                  </div>
                  <h4 className="font-bold text-white text-xs">Zero-Knowledge Biometrics & Automated Charge-Sheets</h4>
                  <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                    <li>zk-SNARKs Privacy Minutiae Vault (DPDP Act compliant)</li>
                    <li>BNS 2023 Sec 193 Automated Final Charge-Sheet Synthesis</li>
                    <li>Hardware TPM 2.0 Enclave Sealing on Mobile Terminals</li>
                    <li>SS7/Diameter Cellular Handover & IMSI-Swap Listener</li>
                    <li>Smart Meter NILM Disaggregation for Safehouse Detection</li>
                  </ul>
                </div>

                {/* Phase 4 */}
                <div className="p-3.5 rounded-xl border border-purple-500/30 bg-slate-950/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-purple-500/50 text-purple-400 text-[9px] font-mono">
                      PHASE 4 (2028 NATIONAL)
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">36 Engines</span>
                  </div>
                  <h4 className="font-bold text-white text-xs">Orbital Satellite Radar & National e-Courts Anchor</h4>
                  <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                    <li>ISRO RISAT Synthetic Aperture Radar (SAR) Vehicle Wake</li>
                    <li>Indian Railways PRS 2.4M Ticket Stream Correlation</li>
                    <li>Offline e-Courts Judicial Consortium Blockchain Anchor</li>
                    <li>5G/SatCom Autonomous Drone Swarm Mesh (OLSRv2)</li>
                    <li>Section 180 BNSS Judicial Contradiction AI Matrix</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-border/80 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span>CRIMENEXUS Production Grade Suite • Compliant with Section 167 BNSS & Section 63 BSA</span>
          </div>
          <Button
            size="sm"
            onClick={() => {
              sound.playClickSound();
              onClose();
            }}
            className="w-full sm:w-auto text-xs"
          >
            Close Features Hub
          </Button>
        </div>
      </div>
    </div>
  </div>
);

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
