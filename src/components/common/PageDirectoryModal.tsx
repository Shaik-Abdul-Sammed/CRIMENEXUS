import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  FolderGit2,
  FileCheck2,
  Flame,
  Network,
  Users2,
  GitMerge,
  Clock,
  Bot,
  MapPin,
  Navigation,
  ShieldAlert,
  Layers,
  Train,
  Scale,
  FileText,
  History,
  Sparkles,
  Zap,
  Palette,
  Settings,
  Search,
  X,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileSearch,
  ExternalLink
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { sound } from '../../utils/soundEffects';

export interface AppDirectoryPage {
  id: string;
  order: number;
  title: string;
  route: string;
  category: 'COMMAND_OPS' | 'INTELLIGENCE_AI' | 'FIELD_PURSUIT' | 'LEGAL_REPORTS' | 'SPECS_SYSTEM';
  categoryLabel: string;
  icon: React.ElementType;
  description: string;
  badge?: string;
  badgeColor?: string;
  keywords: string[];
  isHero?: boolean;
}

export function PageDirectoryModal() {
  const { pageDirectoryOpen, setPageDirectoryOpen } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const navigate = useNavigate();

  // 25 Comprehensive Application Pages in Logical Operational Sequence
  const pages: AppDirectoryPage[] = useMemo(() => [
    // --- 1. COMMAND & OPERATIONS ---
    {
      id: 'page-dashboard',
      order: 1,
      title: 'Command Dashboard',
      route: '/dashboard',
      category: 'COMMAND_OPS',
      categoryLabel: 'Command & Ops',
      icon: LayoutDashboard,
      description: 'Central operational hub with live telemetry, urgent tripwires, remand countdown timer, and incident radar.',
      badge: 'CORE',
      badgeColor: 'border-primary/50 text-primary bg-primary/10',
      keywords: ['dashboard', 'home', 'overview', 'telemetry', 'remand', 'alerts', 'command'],
    },
    {
      id: 'page-cases',
      order: 2,
      title: 'Active Investigations & Cases',
      route: '/cases',
      category: 'COMMAND_OPS',
      categoryLabel: 'Command & Ops',
      icon: FolderGit2,
      description: 'Master FIR docket, 60/90-day statutory remand countdowns, case stage progress, and IO assignments.',
      badge: 'LIVE',
      badgeColor: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/40',
      keywords: ['cases', 'fir', 'investigation', 'remand', 'docket', 'chargesheet', 'police'],
    },
    {
      id: 'page-case-detail',
      order: 3,
      title: 'Investigation Case Detail Dossier',
      route: '/cases/case-101',
      category: 'COMMAND_OPS',
      categoryLabel: 'Command & Ops',
      icon: FileSearch,
      description: 'Deep-dive case evidence dossier, suspect linkage, statutory timeline, and digital proof bundle.',
      badge: 'DOSSIER',
      badgeColor: 'border-cyan-500/50 text-cyan-400 bg-cyan-950/40',
      keywords: ['case detail', 'dossier', 'fir detail', 'evidence chain', 'case-101', 'investigation view'],
    },
    {
      id: 'page-evidence',
      order: 4,
      title: 'Evidence Vault (Sec 63 BSA)',
      route: '/evidence',
      category: 'COMMAND_OPS',
      categoryLabel: 'Command & Ops',
      icon: FileCheck2,
      description: 'Court-certified cryptographic evidence repository, SHA-256 chain of custody, and digital seals.',
      badge: 'BSA 2023',
      badgeColor: 'border-amber-500/50 text-amber-400 bg-amber-950/40',
      keywords: ['evidence', 'vault', 'bsa', 'sha256', 'hash', 'custody', 'court', 'certificates'],
    },
    {
      id: 'page-evidence-detail',
      order: 5,
      title: 'Evidence Forensic Deep Inspection',
      route: '/evidence/ev-101',
      category: 'COMMAND_OPS',
      categoryLabel: 'Command & Ops',
      icon: ShieldCheck,
      description: 'Forensic media viewer, EXIF/hex inspection, Section 63 BSA certificate generator, and hash verification.',
      badge: 'FORENSICS',
      badgeColor: 'border-purple-500/50 text-purple-400 bg-purple-950/40',
      keywords: ['evidence detail', 'forensics', 'exif', 'hash verification', 'certificate', 'ev-101'],
    },
    {
      id: 'page-most-wanted',
      order: 6,
      title: 'District Most Wanted & Gang Watchlist',
      route: '/most-wanted',
      category: 'COMMAND_OPS',
      categoryLabel: 'Command & Ops',
      icon: Flame,
      description: 'High-risk fugitives, interstate syndicate kingpins, bounty tiers, and automated LOC immigration alerts.',
      badge: 'HOT',
      badgeColor: 'border-red-500/50 text-red-400 bg-red-950/40',
      keywords: ['most wanted', 'fugitive', 'syndicate', 'watchlist', 'loc', 'bounty', 'criminal'],
    },

    // --- 2. INTELLIGENCE & AI ANALYSIS ---
    {
      id: 'page-graph',
      order: 7,
      title: 'Syndicate Link Analysis & Graph',
      route: '/network-graph',
      category: 'INTELLIGENCE_AI',
      categoryLabel: 'Intelligence & AI',
      icon: Network,
      description: 'Interactive Cytoscape knowledge graph, Adamic-Adar link predictions, betweenness centrality, and voice briefings.',
      badge: 'HERO GNN',
      badgeColor: 'border-amber-400 text-amber-300 bg-amber-950/60 font-black',
      isHero: true,
      keywords: ['graph', 'network', 'cytoscape', 'link analysis', 'adamic adar', 'syndicate', 'centrality'],
    },
    {
      id: 'page-entities',
      order: 8,
      title: 'Entity Directory & Persons of Interest',
      route: '/entities',
      category: 'INTELLIGENCE_AI',
      categoryLabel: 'Intelligence & AI',
      icon: Users2,
      description: 'Multi-type directory cataloging suspects, witnesses, bank accounts, vehicles, and burner phones.',
      badge: 'CATALOG',
      badgeColor: 'border-blue-500/50 text-blue-400 bg-blue-950/40',
      keywords: ['entities', 'suspects', 'people', 'vehicles', 'phones', 'accounts', 'persons of interest'],
    },
    {
      id: 'page-entity-detail',
      order: 9,
      title: 'Entity Intelligence Profile & Biometrics',
      route: '/entities/ent-101',
      category: 'INTELLIGENCE_AI',
      categoryLabel: 'Intelligence & AI',
      icon: Users2,
      description: 'Comprehensive dossier on suspect: CDR contacts, biometric markers, movement radar, and risk score.',
      badge: 'DOSSIER',
      badgeColor: 'border-indigo-500/50 text-indigo-400 bg-indigo-950/40',
      keywords: ['entity detail', 'suspect profile', 'biometrics', 'cdr contacts', 'ent-101', 'rajan verma'],
    },
    {
      id: 'page-resolution',
      order: 10,
      title: 'AI Entity Resolution & Deduplication',
      route: '/entity-resolution',
      category: 'INTELLIGENCE_AI',
      categoryLabel: 'Intelligence & AI',
      icon: GitMerge,
      description: 'Cross-FIR identity deduplication matching aliases, burner IMEI pairs, and fuzzy Aadhaar phonetic matches.',
      badge: 'AI RESOLVE',
      badgeColor: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/40',
      keywords: ['entity resolution', 'deduplication', 'merge', 'aliases', 'phonetic', 'clustering', 'cctns'],
    },
    {
      id: 'page-timeline',
      order: 11,
      title: 'Chronological Timeline Stream',
      route: '/timeline',
      category: 'INTELLIGENCE_AI',
      categoryLabel: 'Intelligence & AI',
      icon: Clock,
      description: 'Temporal reconstruction fusing cellular tower dumps, FASTag toll records, CCTV sightings, and bank smurfing.',
      badge: 'CHRONO',
      badgeColor: 'border-cyan-500/50 text-cyan-400 bg-cyan-950/40',
      keywords: ['timeline', 'events', 'chronological', 'sequence', 'cdr', 'temporal', 'cdr logs'],
    },
    {
      id: 'page-assistant',
      order: 12,
      title: 'Copilot AI Investigation Assistant',
      route: '/ai-assistant',
      category: 'INTELLIGENCE_AI',
      categoryLabel: 'Intelligence & AI',
      icon: Bot,
      description: 'Conversational RAG AI copilot interrogating case files, drafting legal queries, and citing BNS/BNSS statutes.',
      badge: 'RAG COPILOT',
      badgeColor: 'border-violet-500/50 text-violet-400 bg-violet-950/40',
      keywords: ['assistant', 'copilot', 'ai', 'rag', 'chat', 'legal advisor', 'statutes'],
    },

    // --- 3. FIELD PURSUIT & SURVEILLANCE ---
    {
      id: 'page-map',
      order: 13,
      title: 'GIS Spatial Map Intelligence',
      route: '/map',
      category: 'FIELD_PURSUIT',
      categoryLabel: 'Field Pursuit',
      icon: MapPin,
      description: 'MapLibre GL vector cartography, KDE spatial crime heatmaps, OSRM police intercept routes, and 5 km geofences.',
      badge: 'GIS 3D',
      badgeColor: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/40',
      keywords: ['map', 'gis', 'spatial', 'geofence', 'kde heatmap', 'osrm', 'patrol', 'cartography'],
    },
    {
      id: 'page-live-tracking',
      order: 14,
      title: 'Live Real-Time Tactical Tracking',
      route: '/live-tracking',
      category: 'FIELD_PURSUIT',
      categoryLabel: 'Field Pursuit',
      icon: Navigation,
      description: 'Live vehicle speed HUD (118 km/h), directional compass bearing, breadcrumb replay, and toll gate telemetry.',
      badge: 'LIVE GPS',
      badgeColor: 'border-red-500/50 text-red-400 bg-red-950/40',
      keywords: ['live tracking', 'gps', 'telemetry', 'vehicle speed', 'breadcrumb', 'toll', 'pursuit'],
    },
    {
      id: 'page-escape-demo',
      order: 15,
      title: 'Operation Shatter Escape Simulation',
      route: '/escape-demo',
      category: 'FIELD_PURSUIT',
      categoryLabel: 'Field Pursuit',
      icon: ShieldAlert,
      description: 'Predictive expressway pursuit simulation, optimal roadblock placement, and aerial drone intercept vectors.',
      badge: 'HOT PURSUIT',
      badgeColor: 'border-rose-500/50 text-rose-400 bg-rose-950/40',
      keywords: ['escape simulation', 'blockade', 'drone', 'highway intercept', 'roadblock', 'osrm pursuit'],
    },
    {
      id: 'page-digital-footprint',
      order: 16,
      title: 'Omni-Trace 96-Feed Data Lake',
      route: '/digital-footprint',
      category: 'FIELD_PURSUIT',
      categoryLabel: 'Field Pursuit',
      icon: Layers,
      description: 'Multi-source surveillance fusion correlating FASTag, smart meter power spikes, UPI offramps, and burner IMEIs.',
      badge: '96 FEEDS',
      badgeColor: 'border-purple-500/50 text-purple-400 bg-purple-950/40',
      keywords: ['digital footprint', 'data lake', '96 feeds', 'iot', 'smart meter', 'fastag', 'upi', 'imei'],
    },
    {
      id: 'page-railway',
      order: 17,
      title: 'Railway TC Biometric Face Verification',
      route: '/railway-verification',
      category: 'FIELD_PURSUIT',
      categoryLabel: 'Field Pursuit',
      icon: Train,
      description: 'Indian Railways ticket inspector terminal with UIDAI Aadhaar FaceRD matching and CCTNS fugitive watchlist alerts.',
      badge: 'UIDAI TC',
      badgeColor: 'border-sky-500/50 text-sky-400 bg-sky-950/40',
      keywords: ['railway', 'train', 'tc', 'aadhaar', 'face verification', 'uidai', 'cctns watchlist', 'prs ticket'],
    },

    // --- 4. LEGAL COMPLIANCE & REPORTS ---
    {
      id: 'page-drafting',
      order: 18,
      title: 'BNS / BNSS Legal Drafting Engine',
      route: '/drafting',
      category: 'LEGAL_REPORTS',
      categoryLabel: 'Legal & Reports',
      icon: Scale,
      description: 'Automated synthesis of formal FIRs, Section 167 BNSS Remand Applications, and Sec 63 BSA Digital Certificates.',
      badge: 'AUTO LEGAL',
      badgeColor: 'border-blue-500/50 text-blue-400 bg-blue-950/40',
      keywords: ['drafting', 'fir', 'remand', 'bnss', 'bns', 'bsa', 'legal', 'remand application', 'court'],
    },
    {
      id: 'page-reports',
      order: 19,
      title: 'Court Dossiers & Intelligence Reports',
      route: '/reports',
      category: 'LEGAL_REPORTS',
      categoryLabel: 'Legal & Reports',
      icon: FileText,
      description: 'Court-admissible PDF dossiers, executive intelligence summaries, and instant document export previews.',
      badge: 'DOSSIER',
      badgeColor: 'border-teal-500/50 text-teal-400 bg-teal-950/40',
      keywords: ['reports', 'dossier', 'export', 'pdf', 'court document', 'intelligence summary'],
    },
    {
      id: 'page-audit-logs',
      order: 20,
      title: 'Station Judicial Audit Trail',
      route: '/audit-logs',
      category: 'LEGAL_REPORTS',
      categoryLabel: 'Legal & Reports',
      icon: History,
      description: 'Tamper-evident cryptographic access logs ensuring compliance with Section 105 BNSS and judicial oversight.',
      badge: 'AUDIT',
      badgeColor: 'border-amber-500/50 text-amber-400 bg-amber-950/40',
      keywords: ['audit logs', 'integrity', 'access log', 'judicial oversight', 'compliance', 'tamper evident'],
    },

    // --- 5. SYSTEM ARCHITECTURE & ROADMAP ---
    {
      id: 'page-roadmap',
      order: 21,
      title: '100 Technical Specs & Next 96 Roadmap',
      route: '/roadmap',
      category: 'SPECS_SYSTEM',
      categoryLabel: 'Specs & System',
      icon: Compass,
      description: 'Sovereign technical blueprint detailing all 100 claimed forensic and post-quantum capabilities across 4 phases.',
      badge: '96 NEW',
      badgeColor: 'border-amber-400 text-amber-300 bg-amber-950/60 font-black',
      isHero: true,
      keywords: ['roadmap', '100 specs', 'next 96', 'quantum', 'kyber', 'dilithium', 'algorithms', 'technical specifications'],
    },
    {
      id: 'page-about',
      order: 22,
      title: '32 Capabilities & Platform Benchmark',
      route: '/about',
      category: 'SPECS_SYSTEM',
      categoryLabel: 'Specs & System',
      icon: Sparkles,
      description: 'Architectural evaluation, before/after police workflow comparisons, and international crime reduction precedents.',
      badge: '32 DEMO',
      badgeColor: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/40',
      keywords: ['about', 'benchmark', '32 capabilities', 'comparison', 'international precedents', 'nypd', 'cctns'],
    },
    {
      id: 'page-lite',
      order: 23,
      title: 'Thana 2 Mbps Low-Bandwidth Mode',
      route: '/lite',
      category: 'SPECS_SYSTEM',
      categoryLabel: 'Specs & System',
      icon: Zap,
      description: 'Emergency stripped-down zero-WebGL interface engineered for rural police stations with severe bandwidth limits.',
      badge: '2 MBPS',
      badgeColor: 'border-yellow-500/50 text-yellow-400 bg-yellow-950/40',
      keywords: ['lite', 'thana mode', 'low bandwidth', 'offline', '2 mbps', 'emergency', 'fast'],
    },
    {
      id: 'page-design-system',
      order: 24,
      title: 'Figma Sovereign Design System',
      route: '/design-system',
      category: 'SPECS_SYSTEM',
      categoryLabel: 'Specs & System',
      icon: Palette,
      description: 'Tactical design tokens, WCAG AA high-contrast themes, component documentation, and accessibility guides.',
      badge: 'TOKENS',
      badgeColor: 'border-fuchsia-500/50 text-fuchsia-400 bg-fuchsia-950/40',
      keywords: ['design system', 'figma', 'themes', 'tokens', 'wcag', 'palette', 'components'],
    },
    {
      id: 'page-settings',
      order: 25,
      title: 'Station Settings & RBAC Profiles',
      route: '/settings',
      category: 'SPECS_SYSTEM',
      categoryLabel: 'Specs & System',
      icon: Settings,
      description: 'Station profile settings, RBAC role simulation, audio alerts, offline cache configuration, and security keys.',
      badge: 'CONFIG',
      badgeColor: 'border-slate-500/50 text-slate-400 bg-slate-800/40',
      keywords: ['settings', 'rbac', 'configuration', 'station', 'audio', 'roles', 'preferences'],
    },
  ], []);

  // Filter pages based on search query and category
  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      const matchesCategory = selectedCategory === 'ALL' || page.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        page.title.toLowerCase().includes(q) ||
        page.route.toLowerCase().includes(q) ||
        page.description.toLowerCase().includes(q) ||
        page.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [pages, selectedCategory, searchQuery]);

  // Global keyboard shortcut to open/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setPageDirectoryOpen(!pageDirectoryOpen);
      } else if (e.key === 'Escape' && pageDirectoryOpen) {
        setPageDirectoryOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageDirectoryOpen, setPageDirectoryOpen]);

  if (!pageDirectoryOpen) return null;

  const handleLaunch = (route: string) => {
    sound.playClickSound();
    setPageDirectoryOpen(false);
    navigate(route);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClickSound();
          setPageDirectoryOpen(false);
        }
      }}
    >
      <div
        className="min-h-full flex justify-center p-2 sm:p-4 md:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            sound.playClickSound();
            setPageDirectoryOpen(false);
          }
        }}
      >
        <div className="relative w-full my-auto max-w-5xl bg-slate-900 border-2 border-primary/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border/80 bg-slate-950 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary via-amber-500 to-primary text-black shadow-lg">
                <Compass className="h-5 w-5 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                    CRIMENEXUS Complete System Directory
                  </h2>
                  <Badge className="bg-primary text-black font-extrabold text-[10px] px-2">
                    25 PAGES ORDERED
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete directory of all 25 operational pages arranged in strict daily investigation usage sequence
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[11px] font-mono text-muted-foreground bg-slate-800/80 px-2 py-1 rounded border border-border/60">
                Press ⌘P / Ctrl+P
              </span>
              <button
                onClick={() => {
                  sound.playClickSound();
                  setPageDirectoryOpen(false);
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-800 transition-colors"
                title="Close directory (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search Bar & Category Filter Bar */}
          <div className="p-4 border-b border-border/60 bg-slate-950/70 space-y-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any page by name, keyword, route, or statute (e.g. 'roadmap', 'railway', 'escape', 'bsa', 'graph')..."
                className="w-full pl-9 pr-8 py-2.5 bg-slate-900 border border-border/80 rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {[
                { id: 'ALL', label: 'All Pages (25)' },
                { id: 'COMMAND_OPS', label: '1. Command & Ops (6)' },
                { id: 'INTELLIGENCE_AI', label: '2. Intelligence & AI (6)' },
                { id: 'FIELD_PURSUIT', label: '3. Field Pursuit (5)' },
                { id: 'LEGAL_REPORTS', label: '4. Legal & Reports (3)' },
                { id: 'SPECS_SYSTEM', label: '5. Specs & System (5)' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    sound.playClickSound();
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-black shadow-md'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pages Grid Container */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 scrollbar-thin scrollbar-thumb-border">
            {filteredPages.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Search className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold text-foreground">No matching pages found</p>
                <p className="text-xs text-muted-foreground">Try clearing your search query or switching categories</p>
                <Button
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                  }}
                  className="mt-2 text-xs"
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredPages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <div
                      key={page.id}
                      onClick={() => handleLaunch(page.route)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                        page.isHero
                          ? 'border-amber-500/60 bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10'
                          : 'border-border/80 bg-slate-900/80 hover:bg-slate-850 hover:border-primary/60 hover:shadow-md'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="h-6 w-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                              #{page.order}
                            </span>
                            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 group-hover:scale-105 group-hover:bg-primary group-hover:text-black transition-all">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="text-xs sm:text-sm font-extrabold text-foreground group-hover:text-primary transition-colors leading-tight">
                                {page.title}
                              </h3>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {page.route}
                              </span>
                            </div>
                          </div>

                          {page.badge && (
                            <Badge variant="outline" className={`text-[9px] font-mono font-bold shrink-0 ${page.badgeColor}`}>
                              {page.badge}
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                          {page.description}
                        </p>
                      </div>

                      <div className="pt-2.5 mt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                        <span className="text-[10px] font-semibold text-slate-400">
                          {page.categoryLabel}
                        </span>
                        <div className="flex items-center gap-1 text-primary group-hover:translate-x-0.5 transition-transform font-bold text-xs">
                          <span>Launch Page</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t border-border/80 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
              <Compass className="h-3.5 w-3.5 text-amber-400" />
              <span>All 25 CRIMENEXUS pages are live, route-anchored, and operational.</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                size="sm"
                onClick={() => {
                  sound.playClickSound();
                  setPageDirectoryOpen(false);
                  navigate('/roadmap');
                }}
                className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Next 96 Roadmap Workspace</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  sound.playClickSound();
                  setPageDirectoryOpen(false);
                }}
                className="w-full sm:w-auto text-xs"
              >
                Close Directory
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
