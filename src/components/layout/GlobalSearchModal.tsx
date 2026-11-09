import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  FolderGit2,
  User,
  Phone,
  Car,
  FileCheck,
  Building,
  MapPin,
  X,
  Compass,
  ArrowRight,
  Layers,
  Sparkles,
  Train,
  ShieldAlert,
  Scale,
  LayoutDashboard
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { api } from '../../services/api';
import { GlobalSearchResult } from '../../types';
import { sound } from '../../utils/soundEffects';

interface PageSearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'PAGE';
  url: string;
  badge?: string;
  keywords: string[];
}

const SYSTEM_PAGES: PageSearchResult[] = [
  { id: 'p-dashboard', title: 'Command Dashboard', subtitle: 'Central operational hub & live telemetry feeds', category: 'PAGE', url: '/dashboard', badge: 'CORE', keywords: ['dashboard', 'home', 'command', 'alerts', 'remand'] },
  { id: 'p-cases', title: 'Active Investigations & Cases', subtitle: 'Master FIR docket & 60/90-day statutory countdown', category: 'PAGE', url: '/cases', badge: 'LIVE', keywords: ['cases', 'fir', 'investigation', 'chargesheet'] },
  { id: 'p-evidence', title: 'Evidence Vault (Sec 63 BSA)', subtitle: 'Cryptographic digital custody & SHA-256 seal', category: 'PAGE', url: '/evidence', badge: 'BSA', keywords: ['evidence', 'vault', 'bsa', 'sha256', 'hash'] },
  { id: 'p-wanted', title: 'District Most Wanted & Gang Watchlist', subtitle: 'Interstate syndicate kingpins & LOC departure alerts', category: 'PAGE', url: '/most-wanted', badge: 'HOT', keywords: ['wanted', 'fugitive', 'syndicate', 'watchlist', 'loc'] },
  { id: 'p-graph', title: 'Syndicate Network Graph', subtitle: 'Cytoscape link analysis & Adamic-Adar predictions', category: 'PAGE', url: '/network-graph', badge: 'HERO', keywords: ['graph', 'network', 'cytoscape', 'link analysis', 'adamic'] },
  { id: 'p-entities', title: 'Entity Directory & Suspect Profiles', subtitle: 'Suspects, associates, vehicles, bank accounts', category: 'PAGE', url: '/entities', badge: 'ENTITIES', keywords: ['entities', 'suspects', 'people', 'vehicles', 'phones'] },
  { id: 'p-resolution', title: 'AI Entity Resolution & Deduplication', subtitle: 'Cross-FIR identity deduplication & alias matching', category: 'PAGE', url: '/entity-resolution', badge: 'AI', keywords: ['resolution', 'deduplication', 'merge', 'aliases'] },
  { id: 'p-timeline', title: 'Chronological Timeline Stream', subtitle: 'Temporal crime sequence, tower dumps & toll logs', category: 'PAGE', url: '/timeline', badge: 'CHRONO', keywords: ['timeline', 'events', 'chronological', 'sequence', 'cdr'] },
  { id: 'p-assistant', title: 'Copilot AI Investigation Assistant', subtitle: 'Conversational RAG AI querying case evidence', category: 'PAGE', url: '/ai-assistant', badge: 'RAG', keywords: ['assistant', 'copilot', 'ai', 'rag', 'chat'] },
  { id: 'p-map', title: 'GIS Spatial Map Intelligence', subtitle: 'MapLibre vector maps & KDE spatial crime heatmaps', category: 'PAGE', url: '/map', badge: 'GIS', keywords: ['map', 'gis', 'spatial', 'geofence', 'kde'] },
  { id: 'p-tracking', title: 'Live Tactical GPS Tracking', subtitle: 'Live speed HUD (118 km/h) & breadcrumb replay', category: 'PAGE', url: '/live-tracking', badge: 'LIVE GPS', keywords: ['live tracking', 'gps', 'telemetry', 'speed', 'toll'] },
  { id: 'p-escape', title: 'Operation Shatter Escape Simulation', subtitle: 'Expressway pursuit blockade & drone intercept', category: 'PAGE', url: '/escape-demo', badge: 'PURSUIT', keywords: ['escape', 'blockade', 'drone', 'intercept', 'pursuit'] },
  { id: 'p-datalake', title: 'Omni-Trace 96-Feed Data Lake', subtitle: 'FASTag, smart meter power spikes & UPI offramps', category: 'PAGE', url: '/digital-footprint', badge: '96 IOT', keywords: ['data lake', 'footprint', '96 feeds', 'iot', 'fastag'] },
  { id: 'p-railway', title: 'Railway TC Aadhaar Face Verification', subtitle: 'UIDAI biometric match & CCTNS passenger terminal', category: 'PAGE', url: '/railway-verification', badge: 'UIDAI', keywords: ['railway', 'train', 'tc', 'aadhaar', 'face verification'] },
  { id: 'p-drafting', title: 'BNS / BNSS Legal Drafting Engine', subtitle: 'Auto-synthesize FIRs & Sec 167 BNSS remand orders', category: 'PAGE', url: '/drafting', badge: 'AUTO', keywords: ['drafting', 'fir', 'remand', 'bnss', 'bns', 'legal'] },
  { id: 'p-reports', title: 'Court Dossiers & Intelligence Reports', subtitle: 'Court-admissible PDF dossiers & export previews', category: 'PAGE', url: '/reports', badge: 'DOSSIER', keywords: ['reports', 'dossier', 'export', 'pdf', 'court'] },
  { id: 'p-audit', title: 'Station Judicial Audit Trail', subtitle: 'Tamper-evident logs under Section 105 BNSS', category: 'PAGE', url: '/audit-logs', badge: 'AUDIT', keywords: ['audit', 'logs', 'integrity', 'judicial', 'tamper'] },
  { id: 'p-roadmap', title: '100 Technical Specs & Next 96 Roadmap', subtitle: 'Sovereign technical roadmap across 4 phases', category: 'PAGE', url: '/roadmap', badge: '96 NEW', keywords: ['roadmap', '100 specs', 'next 96', 'quantum', 'specs'] },
  { id: 'p-about', title: '32 Capabilities & Platform Benchmark', subtitle: 'Architectural evaluation & international precedents', category: 'PAGE', url: '/about', badge: '32 DEMO', keywords: ['about', 'benchmark', '32 capabilities', 'precedents'] },
  { id: 'p-lite', title: 'Thana 2 Mbps Low-Bandwidth Mode', subtitle: 'Emergency stripped-down zero-WebGL mode', category: 'PAGE', url: '/lite', badge: '2 MBPS', keywords: ['lite', 'thana mode', 'low bandwidth', 'offline', 'fast'] },
  { id: 'p-design', title: 'Figma Sovereign Design System', subtitle: 'Tactical design tokens & component library', category: 'PAGE', url: '/design-system', badge: 'TOKENS', keywords: ['design system', 'figma', 'themes', 'tokens'] },
  { id: 'p-settings', title: 'Station Settings & RBAC Profiles', subtitle: 'Station profile settings & RBAC role simulation', category: 'PAGE', url: '/settings', badge: 'CONFIG', keywords: ['settings', 'rbac', 'configuration', 'station'] },
];

export function GlobalSearchModal() {
  const { globalSearchOpen, setGlobalSearchOpen, setPageDirectoryOpen } = useAppStore();
  const [query, setQuery] = useState('');
  const [dbResults, setDbResults] = useState<GlobalSearchResult[]>([]);
  const [pageResults, setPageResults] = useState<PageSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Listen for global '/' or 'Ctrl+K' / 'Cmd+K' shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) ||
        (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName))
      ) {
        e.preventDefault();
        setGlobalSearchOpen(true);
      } else if (e.key === 'Escape') {
        setGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setGlobalSearchOpen]);

  // Execute search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setDbResults([]);
      setPageResults([]);
      return;
    }

    const q = query.toLowerCase().trim();

    // Instant local page search
    const matchedPages = SYSTEM_PAGES.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.url.toLowerCase().includes(q) ||
      p.subtitle.toLowerCase().includes(q) ||
      p.keywords.some((k) => k.toLowerCase().includes(q))
    );
    setPageResults(matchedPages);

    if (q.length < 2) {
      setDbResults([]);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      api.globalSearch(query).then((res) => {
        setDbResults(res);
        setIsLoading(false);
      });
    }, 120);
    return () => clearTimeout(timer);
  }, [query]);

  if (!globalSearchOpen) return null;

  const handleSelect = (url: string) => {
    sound.playClickSound();
    setGlobalSearchOpen(false);
    setQuery('');
    navigate(url);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'PAGE':
        return <Compass className="h-4 w-4 text-amber-400" />;
      case 'CASES':
        return <FolderGit2 className="h-4 w-4 text-emerald-400" />;
      case 'PEOPLE':
        return <User className="h-4 w-4 text-blue-400" />;
      case 'PHONES':
        return <Phone className="h-4 w-4 text-amber-400" />;
      case 'VEHICLES':
        return <Car className="h-4 w-4 text-purple-400" />;
      case 'EVIDENCE':
        return <FileCheck className="h-4 w-4 text-cyan-400" />;
      case 'ORGANIZATIONS':
        return <Building className="h-4 w-4 text-orange-400" />;
      case 'LOCATIONS':
        return <MapPin className="h-4 w-4 text-pink-400" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const totalResultsCount = pageResults.length + dbResults.length;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-150 p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) setGlobalSearchOpen(false);
      }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl border-2 border-primary/40 bg-card shadow-2xl overflow-hidden mx-auto mt-12 sm:mt-16">
        {/* Search Header */}
        <div className="flex items-center px-4 border-b border-border bg-background/50">
          <Search className="h-5 w-5 text-primary shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (pageResults.length > 0) {
                  e.preventDefault();
                  handleSelect(pageResults[0].url);
                } else if (dbResults.length > 0) {
                  e.preventDefault();
                  handleSelect(dbResults[0].url);
                }
              }
            }}
            placeholder="Search pages, suspects, cases, vehicles, or statutes (e.g. 'roadmap', 'railway', 'Rajan')..."
            aria-label="Search cases, entities, and pages"
            className="w-full h-14 bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results Stream */}
        <div className="max-h-[65vh] overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-border">
          {isLoading && (
            <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Compass className="h-4 w-4 animate-spin text-primary" />
              <span>Scanning CRIMENEXUS intelligence databases...</span>
            </div>
          )}

          {/* Matched App Pages */}
          {pageResults.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold font-mono uppercase tracking-wider text-amber-400 flex items-center justify-between">
                <span>Application Workspace Pages ({pageResults.length})</span>
                <span className="text-muted-foreground">Press Enter to Launch</span>
              </div>
              {pageResults.map((page) => (
                <div
                  key={page.id}
                  onClick={() => handleSelect(page.url)}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40 hover:border-amber-400 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                      {getCategoryIcon(page.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-amber-300 transition-colors truncate">
                          {page.title}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                          {page.url}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{page.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {page.badge && (
                      <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        {page.badge}
                      </span>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Database Entities & Cases */}
          {dbResults.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold font-mono uppercase tracking-wider text-muted-foreground">
                Intelligence Database Records ({dbResults.length})
              </div>
              {dbResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.url)}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-primary/40 hover:bg-accent/60 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-background border border-border shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors block truncate">
                        {item.title}
                      </span>
                      <span className="text-xs text-muted-foreground block truncate">{item.subtitle}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase border border-border shrink-0">
                    {item.category}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!isLoading && query.length >= 2 && totalResultsCount === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
              <p>No matching intelligence records or pages found for &quot;{query}&quot;.</p>
              <button
                onClick={() => {
                  setGlobalSearchOpen(false);
                  setPageDirectoryOpen(true);
                }}
                className="text-primary hover:underline font-bold"
              >
                Browse All 25 Pages Directory →
              </button>
            </div>
          )}

          {!query && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Quick Navigation Direct Jumps
                </span>
                <button
                  onClick={() => {
                    sound.playClickSound();
                    setGlobalSearchOpen(false);
                    setPageDirectoryOpen(true);
                  }}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Browse All 25 Pages Directory</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { title: '100 Specs Roadmap', url: '/roadmap', icon: Compass, badge: '96 NEW', color: 'border-amber-500/40 text-amber-300' },
                  { title: 'Command Dashboard', url: '/dashboard', icon: LayoutDashboard, badge: 'CORE', color: 'border-primary/40 text-primary' },
                  { title: 'Railway TC Aadhaar Face', url: '/railway-verification', icon: Train, badge: 'UIDAI', color: 'border-sky-500/40 text-sky-300' },
                  { title: 'Syndicate Graph (GNN)', url: '/network-graph', icon: Sparkles, badge: 'HERO', color: 'border-amber-500/40 text-amber-300' },
                  { title: 'Escape Simulation', url: '/escape-demo', icon: ShieldAlert, badge: 'PURSUIT', color: 'border-rose-500/40 text-rose-300' },
                  { title: 'BNS Legal Drafting', url: '/drafting', icon: Scale, badge: 'AUTO', color: 'border-blue-500/40 text-blue-300' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.url}
                      onClick={() => handleSelect(item.url)}
                      className={`p-2.5 rounded-xl border bg-slate-900/80 hover:bg-slate-800 text-left transition-all flex flex-col justify-between space-y-1.5 ${item.color}`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className="h-4 w-4" />
                        <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-slate-800 border border-slate-700">
                          {item.badge}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-foreground leading-tight">
                        {item.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-background/50 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Press <kbd className="px-1 py-0.5 rounded bg-muted font-mono border">ESC</kbd> to close</span>
            <span>•</span>
            <span>Press <kbd className="px-1 py-0.5 rounded bg-muted font-mono border">ENTER</kbd> to jump</span>
          </div>
          <button
            onClick={() => {
              sound.playClickSound();
              setGlobalSearchOpen(false);
              setPageDirectoryOpen(true);
            }}
            className="text-primary hover:underline font-bold"
          >
            Open 25 Pages Directory (⌘P)
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
