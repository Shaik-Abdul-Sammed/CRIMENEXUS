import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  FolderGit2,
  FileCheck2,
  Users2,
  GitMerge,
  Network,
  Clock,
  MapPin,
  Bot,
  FileText,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Brain,
  Shield,
  ShieldCheck,
  Flame,
  Scale,
  Palette,
  Navigation,
  Sparkles,
  Camera,
  Compass,
  Layers,
  Train,
  Zap,
  Grid,
  ScrollText,
  Globe2,
  Radio,
  Crosshair,
  Dna,
  Banknote,
  ListFilter,
  Focus,
  HeartCrack,
  Languages,
  BellRing,
  Route,
  Activity,
  RadioTower,
  Link2,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useInvestigations } from '../../hooks/useIntelligenceApi';
import { useTranslation } from '../../hooks/useTranslation';
import { cn } from '../../utils/cn';
import { sound } from '../../utils/soundEffects';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  hero?: boolean;
  minRole?: 'INVESTIGATOR' | 'ANALYST' | 'SUPERVISOR' | 'ADMIN';
  id: string;
}

interface NavSubCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  items: NavItem[];
}

interface NavSection {
  id: string;
  title: string;
  shortTitle: string;
  items?: NavItem[];
  subCategories?: NavSubCategory[];
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    sidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    activeCaseId,
    setActiveCaseId,
    setPageDirectoryOpen,
    setFeaturesHubModalOpen,
  } = useAppStore();
  const { currentUser, activeRole } = useAuthStore();
  const { data: cases } = useInvestigations();
  const { t } = useTranslation();

  const handleCaseChange = (newCaseId: string) => {
    setActiveCaseId(newCaseId);
    if (location.pathname.startsWith('/cases/')) {
      if (newCaseId && newCaseId !== 'ALL') {
        navigate(`/cases/${newCaseId}`);
      } else {
        navigate('/cases');
      }
    } else {
      const currentParams = new URLSearchParams(location.search);
      if (newCaseId && newCaseId !== 'ALL') {
        currentParams.set('case', newCaseId);
      } else {
        currentParams.delete('case');
      }
      const searchStr = currentParams.toString() ? `?${currentParams.toString()}` : '';
      navigate(`${location.pathname}${searchStr}`);
    }
  };

  React.useEffect(() => {
    // Prevent accidental collapse on large desktop screens
    if (typeof window !== 'undefined' && window.innerWidth >= 1024 && !sidebarOpen) {
      setSidebarOpen(true);
    }
  }, []);

  const isItemActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const isSubCategoryActive = (subCat: NavSubCategory) => {
    return subCat.items.some((item) => isItemActive(item.path));
  };

  const [openSubCategories, setOpenSubCategories] = React.useState<Record<string, boolean>>({
    'sub-predictive': true,
  });

  const toggleSubCategory = (subId: string) => {
    sound.playClickSound();
    setOpenSubCategories((prev) => ({
      ...prev,
      [subId]: !prev[subId],
    }));
  };

  // Structured Sections Ordered Strictly by Real-World Investigative Usage
  const navSections: NavSection[] = [
    {
      id: 'sec-command',
      title: 'COMMAND & OPERATIONS',
      shortTitle: 'OPS',
      items: [
        { label: t('nav.dashboard') || 'Command Dashboard', path: '/dashboard', icon: LayoutDashboard, id: 'sidebar-dashboard' },
        { label: t('nav.investigations') || 'Investigations & Cases', path: '/cases', icon: FolderGit2, badge: 'LIVE', id: 'sidebar-cases' },
        { label: 'Citizen Reports Queue', path: '/police-reports', icon: Shield, badge: 'NEW', id: 'sidebar-citizen-reports' },
        { label: t('nav.evidence') || 'Evidence Vault (Sec 63 BSA)', path: '/evidence', icon: FileCheck2, badge: 'BSA', id: 'sidebar-evidence' },
        { label: t('nav.mostWanted') || 'District Most Wanted', path: '/most-wanted', icon: Flame, badge: 'HOT', id: 'sidebar-most-wanted' },
      ],
    },
    {
      id: 'sec-intel',
      title: 'INTELLIGENCE & AI ANALYSIS',
      shortTitle: 'INTEL',
      items: [
        { label: t('nav.graph') || 'Syndicate Network Graph', path: '/network-graph', icon: Network, hero: true, badge: 'HERO', id: 'sidebar-graph' },
        { label: t('nav.entities') || 'Entity Directory & Profiles', path: '/entities', icon: Users2, id: 'sidebar-entities' },
        { label: t('nav.resolution') || 'AI Entity Resolution', path: '/entity-resolution', icon: GitMerge, badge: 'AI', id: 'sidebar-resolution' },
        { label: t('nav.timeline') || 'Timeline Stream & Logs', path: '/timeline', icon: Clock, id: 'sidebar-timeline' },
        { label: 'FIR Intelligence Archive', path: '/fir-archive', icon: ScrollText, badge: '25 AI', id: 'sidebar-fir-archive' },
        { label: t('nav.aiAssistant') || 'Copilot AI Assistant', path: '/ai-assistant', icon: Bot, badge: 'RAG', id: 'sidebar-assistant' },
      ],
    },
    {
      id: 'sec-pursuit',
      title: 'FIELD PURSUIT & SURVEILLANCE',
      shortTitle: 'FIELD',
      items: [
        { label: t('nav.map') || 'GIS Map Intelligence', path: '/map', icon: MapPin, id: 'sidebar-map' },
        { label: 'Live GPS Tactical Tracking', path: '/live-tracking', icon: Navigation, badge: 'LIVE', id: 'sidebar-live-tracking' },
        { label: 'Escape Pursuit Simulation', path: '/escape-demo', icon: ShieldAlert, badge: 'TRACE', id: 'sidebar-escape-demo' },
        { label: 'Omni-Trace 96 Feeds', path: '/digital-footprint', icon: Layers, badge: '96 IOT', id: 'sidebar-data-lake' },
        { label: 'Railway TC Aadhaar Face', path: '/railway-verification', icon: Train, badge: 'UIDAI', id: 'sidebar-railway' },
        { label: 'Guardian Trace (Rescue)', path: '/guardian-trace', icon: ShieldAlert, badge: 'RESCUE', id: 'sidebar-guardian-trace' },
      ],
    },
    {
      id: 'sec-legal',
      title: 'LEGAL & COURT DOSSIERS',
      shortTitle: 'LEGAL',
      items: [
        { label: t('nav.legalDrafting') || 'Legal Drafting Engine', path: '/drafting', icon: Scale, badge: 'AUTO', id: 'sidebar-drafting' },
        { label: t('nav.reports') || 'Court Dossiers & Reports', path: '/reports', icon: FileText, id: 'sidebar-reports' },
        { label: t('nav.auditLogs') || 'Judicial Audit Logs', path: '/audit-logs', icon: History, minRole: 'ANALYST', id: 'sidebar-audit-logs' },
      ],
    },
    {
      id: 'sec-international-intel',
      title: 'INTERNATIONAL INTELLIGENCE & ANALYTICS',
      shortTitle: 'INTL',
      subCategories: [
        {
          id: 'sub-predictive',
          title: 'Predictive AI & Threat Risk',
          icon: Brain,
          items: [
            { label: 'Intelligence Fusion', path: '/intelligence-fusion', icon: Network, badge: 'S-1', id: 'sidebar-intel-fusion' },
            { label: 'Person Predictive Risk', path: '/risk-scoring', icon: Activity, badge: 'XGB', id: 'sidebar-person-risk' },
            { label: 'Threat Assessment (TRAP)', path: '/threat-assessment', icon: ShieldAlert, badge: 'S-3', id: 'sidebar-threat-assessment' },
            { label: 'DV Fatality Risk Assessment', path: '/dv-risk', icon: HeartCrack, badge: 'S-4', id: 'sidebar-dv-risk' },
            { label: 'AI Case Solvability Triage', path: '/case-triage', icon: ListFilter, badge: 'NDM', id: 'sidebar-case-triage' },
          ],
        },
        {
          id: 'sub-spatial',
          title: 'Spatial & Tactical Forecasting',
          icon: Compass,
          items: [
            { label: 'Micro-Hotspot Forecast', path: '/hotspot-forecast', icon: Compass, badge: '100M', id: 'sidebar-hotspot-forecast' },
            { label: 'Route Pattern Theory', path: '/route-analysis', icon: Route, badge: 'S-2', id: 'sidebar-route-analysis' },
            { label: 'Near-Repeat Alerts', path: '/near-repeat', icon: BellRing, badge: 'KNOX', id: 'sidebar-near-repeat' },
            { label: 'Real-Time Crime Center', path: '/rtcc', icon: Radio, badge: 'RTCC', id: 'sidebar-rtcc' },
            { label: 'SNA Gang Intervention', path: '/sna-gangs', icon: Zap, badge: 'CUTS', id: 'sidebar-sna-gangs' },
          ],
        },
        {
          id: 'sub-surveillance',
          title: 'Surveillance & Intercepts',
          icon: RadioTower,
          items: [
            { label: 'OSINT & Dark Web Monitor', path: '/osint-monitor', icon: Camera, badge: 'TOR', id: 'sidebar-osint-monitor' },
            { label: 'Intercept Slang Translation', path: '/intercept-translate', icon: Languages, badge: '65B', id: 'sidebar-intercept-translate' },
            { label: 'IMSI Catcher Oversight', path: '/imsi-catcher', icon: RadioTower, badge: 'WORM', id: 'sidebar-imsi-catcher' },
            { label: 'Geofence Reverse Warrants', path: '/geofence', icon: MapPin, badge: 'JUDICIAL', id: 'sidebar-geofence' },
          ],
        },
        {
          id: 'sub-forensics',
          title: 'Forensics & Evidence Integrity',
          icon: Dna,
          items: [
            { label: 'Forensic Intelligence DB', path: '/forensics-db', icon: Dna, badge: 'CFSL', id: 'sidebar-forensic-db' },
            { label: 'IBIS Ballistics Match', path: '/ibis', icon: Focus, badge: 'FSL', id: 'sidebar-ibis' },
            { label: 'Crime Gun Intelligence', path: '/gun-intelligence', icon: Crosshair, badge: 'CGIC', id: 'sidebar-gun-intelligence' },
            { label: 'Blockchain Chain-of-Custody', path: '/blockchain-evidence', icon: Link2, badge: 'BSA', id: 'sidebar-blockchain-evidence' },
          ],
        },
        {
          id: 'sub-crossborder',
          title: 'Cross-Border & Financial Intel',
          icon: Globe2,
          items: [
            { label: 'Interpol I-24/7 Sharing', path: '/interpol-sync', icon: Globe2, badge: 'RED', id: 'sidebar-interpol-sync' },
            { label: 'FIU-IND SAR Analytics', path: '/sar-analytics', icon: Banknote, badge: 'PMLA', id: 'sidebar-sar-analytics' },
          ],
        },
      ],
    },
    {
      id: 'sec-specs',
      title: 'SYSTEM SPECS & ROADMAP',
      shortTitle: 'SPECS',
      items: [
        {
          label: '100 Specs & Next 96 Roadmap',
          path: '/roadmap',
          icon: Compass,
          badge: '96 NEW',
          badgeColor: 'border-amber-400/60 bg-amber-400/20 text-amber-300 font-black',
          hero: true,
          id: 'sidebar-roadmap'
        },
        { label: '32 Capabilities & Benchmark', path: '/about', icon: Sparkles, badge: '32 DEMO', id: 'sidebar-about' },
        { label: 'Thana 2 Mbps Lite Mode', path: '/lite', icon: Zap, badge: 'FAST', id: 'sidebar-lite' },
        { label: t('nav.designSystem') || 'Figma Design System', path: '/design-system', icon: Palette, badge: 'FIGMA', id: 'sidebar-design' },
        { label: t('nav.settings') || 'Station Settings & RBAC', path: '/settings', icon: Settings, id: 'sidebar-settings' },
      ],
    },
  ];

  return (
    <>
      <aside
        className={cn(
          'relative flex flex-col border-r border-border bg-card/95 transition-all duration-300 z-30 shrink-0 select-none h-screen max-h-screen',
          sidebarOpen ? 'w-72 min-w-[18rem]' : 'w-16 min-w-[4rem]'
        )}
      >
        {/* Brand Header */}
        <div className={cn(
          'flex h-16 items-center px-4 border-b border-border/60 shrink-0',
          sidebarOpen ? 'justify-between' : 'justify-center'
        )}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/40 shadow-glow">
              <ShieldAlert className="h-5 w-5 text-primary" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold tracking-tight text-foreground text-sm flex items-center gap-1.5 truncate">
                  CRIMENEXUS
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/20 text-primary border border-primary/30 shrink-0">
                    v2.4
                  </span>
                </span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest truncate">
                  Intel System
                </span>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Expand Button when collapsed */}
        {!sidebarOpen && (
          <div className="flex justify-center py-2 border-b border-border/40">
            <button
              onClick={toggleSidebar}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Active Case Selector */}
        {sidebarOpen && (
          <div className="p-3 border-b border-border/50 bg-background/50 shrink-0">
            <label htmlFor="sidebar-case-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              {t('sidebar.activeTargetCase')}
            </label>
            <select
              id="sidebar-case-select"
              aria-label={t('sidebar.activeTargetCase')}
              value={activeCaseId}
              onChange={(e) => handleCaseChange(e.target.value)}
              title={cases?.find((c) => c.id === activeCaseId)?.title || t('sidebar.allCases')}
              className="w-full h-8 px-2 text-xs rounded border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary truncate font-sans font-medium [&>option]:bg-slate-900 [&>option]:text-slate-100"
            >
              <option value="ALL" className="bg-slate-900 text-slate-100">{t('sidebar.allCases')}</option>
              {cases?.map((c) => (
                <option key={c.id} value={c.id} title={`${c.caseNumber} - ${c.title}`} className="bg-slate-900 text-slate-100">
                  {c.caseNumber} • {c.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Top Launcher Buttons: All Pages Directory + Features Hub */}
        <div className="px-2 pt-2.5 pb-1 space-y-1.5 shrink-0 border-b border-border/40">
          {sidebarOpen ? (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  sound.playClickSound();
                  setPageDirectoryOpen(true);
                }}
                className="p-2 rounded-lg bg-gradient-to-r from-amber-500/20 via-primary/20 to-amber-500/10 border border-amber-500/50 text-amber-300 hover:text-white flex items-center justify-between text-xs font-bold transition-all shadow-sm"
                title="Open complete 25 Pages Directory & Navigation Hub (Press ⌘P / Ctrl+P)"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <Grid className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="truncate text-xs">30 Pages</span>
                </div>
                <span className="px-1 py-0.2 rounded bg-amber-500/30 text-amber-300 text-[9px] font-mono shrink-0 ml-1">
                  DIR
                </span>
              </button>

              <button
                onClick={() => {
                  sound.playClickSound();
                  setFeaturesHubModalOpen(true);
                }}
                className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-primary/20 border border-cyan-500/50 text-cyan-300 hover:text-white flex items-center justify-between text-xs font-bold transition-all shadow-sm"
                title="Open 15 Core AI Engines & Capabilities Hub"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0 animate-pulse" />
                  <span className="truncate text-xs">Hub</span>
                </div>
                <span className="px-1 py-0.2 rounded bg-cyan-500/30 text-cyan-300 text-[9px] font-mono shrink-0 ml-1">
                  15
                </span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 items-center">
              <button
                onClick={() => {
                  sound.playClickSound();
                  setPageDirectoryOpen(true);
                }}
                className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 flex items-center justify-center hover:bg-amber-500/30 transition-all"
                title="All 30 Pages Directory (⌘P)"
              >
                <Grid className="h-4 w-4 text-amber-400" />
              </button>
              <button
                onClick={() => {
                  sound.playClickSound();
                  setFeaturesHubModalOpen(true);
                }}
                className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 flex items-center justify-center hover:bg-cyan-500/30 transition-all"
                title="Features Hub (15 Engines)"
              >
                <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
              </button>
            </div>
          )}
        </div>

        {/* Grouped Navigation Links Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 scrollbar-thin scrollbar-thumb-border">
          <nav className="space-y-4">
            {navSections.map((section) => {
              const totalItems = section.items
                ? section.items.length
                : (section.subCategories?.reduce((acc, sub) => acc + sub.items.length, 0) || 0);

              const renderNavItem = (item: NavItem, isNested: boolean = false) => {
                const Icon = item.icon;
                const active = isItemActive(item.path);

                if (item.minRole && activeRole === 'INVESTIGATOR' && item.minRole !== 'INVESTIGATOR') {
                  return null;
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    id={item.id}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group flex items-center rounded-lg text-xs font-medium transition-colors relative w-full',
                      sidebarOpen ? (isNested ? 'gap-2 px-2 py-1.5' : 'gap-2.5 px-2.5 py-1.5') : 'justify-center p-2.5',
                      active
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                      item.hero && !active && 'text-primary font-bold'
                    )}
                    title={item.label}
                    aria-label={item.label}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary-foreground' : '')} />
                    {sidebarOpen && (
                      <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0">
                        {item.label}
                      </span>
                    )}
                    {sidebarOpen && item.badge && (
                      <span
                        className={cn(
                          'text-[9px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0',
                          item.badgeColor
                            ? item.badgeColor
                            : 'bg-muted/80 text-muted-foreground border border-border/60'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                    {sidebarOpen && item.hero && !item.badge && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-primary/30 text-primary-foreground shrink-0">
                        HERO
                      </span>
                    )}
                  </NavLink>
                );
              };

              return (
                <div key={section.id} className="space-y-1">
                  {sidebarOpen ? (
                    <div className="px-2 pt-1 pb-0.5 text-[9px] font-black font-mono tracking-widest text-muted-foreground uppercase flex items-center justify-between">
                      <span>{section.title}</span>
                      <span className="text-[8px] px-1 py-0.2 rounded bg-muted text-muted-foreground/80">
                        {totalItems}
                      </span>
                    </div>
                  ) : (
                    <div className="my-1 border-t border-border/40 mx-2" title={section.title} />
                  )}

                  {/* Standard Flat Items */}
                  {section.items && (
                    <div className="space-y-0.5">
                      {section.items.map((item) => renderNavItem(item, false))}
                    </div>
                  )}

                  {/* Categorized Sub-Sections (Submerged Accordion Folders) */}
                  {section.subCategories && (
                    <div className="space-y-1">
                      {sidebarOpen ? (
                        section.subCategories.map((subCat) => {
                          const SubIcon = subCat.icon;
                          const hasActiveChild = isSubCategoryActive(subCat);
                          const isOpen = openSubCategories[subCat.id] ?? hasActiveChild;

                          return (
                            <div key={subCat.id} className="space-y-0.5">
                              <button
                                type="button"
                                onClick={() => toggleSubCategory(subCat.id)}
                                className={cn(
                                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                                  hasActiveChild
                                    ? 'text-cyan-300 bg-cyan-950/40 border border-cyan-500/30'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                )}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <SubIcon className={cn('h-3.5 w-3.5 shrink-0', hasActiveChild ? 'text-cyan-400' : 'text-muted-foreground')} />
                                  <span className="truncate text-[11px] font-semibold">{subCat.title}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-muted/60 text-muted-foreground">
                                    {subCat.items.length}
                                  </span>
                                  {isOpen ? (
                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                  )}
                                </div>
                              </button>

                              {isOpen && (
                                <div className="border-l-2 border-border/70 pl-2 ml-4 space-y-0.5 animate-in slide-in-from-top-1 duration-150">
                                  {subCat.items.map((item) => renderNavItem(item, true))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="space-y-0.5">
                          {section.subCategories.flatMap((sc) => sc.items).map((item) => renderNavItem(item, false))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User & Compliance Footer */}
        {sidebarOpen ? (
          <div className="p-3 border-t border-border/60 bg-background/40 space-y-2 shrink-0">
            <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-card">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                  className="h-8 w-8 rounded-full object-cover border border-primary/30 shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-foreground truncate">
                  {currentUser?.name || 'Inspector Rajesh Varma'}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  <span className="text-amber-400 font-semibold">{activeRole}</span> • Special Crime Branch
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
              <span className="flex items-center gap-1 font-mono">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span>Sec 65 BSA</span>
              </span>
              <span className="font-mono text-primary/80">CRIMENEXUS v2.4</span>
            </div>
          </div>
        ) : (
          <div className="p-2 border-t border-border/60 flex justify-center shrink-0">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-7 w-7 rounded-full object-cover border border-primary/30"
                title={`${currentUser?.name} (${activeRole})`}
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
