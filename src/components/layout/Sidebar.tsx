import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  ShieldCheck,
  Flame,
  Scale,
  Palette,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useInvestigations } from '../../hooks/useIntelligenceApi';
import { useTranslation } from '../../hooks/useTranslation';
import { cn } from '../../utils/cn';

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, activeCaseId, setActiveCaseId } = useAppStore();
  const { currentUser, activeRole } = useAuthStore();
  const { data: cases } = useInvestigations();
  const { t } = useTranslation();

  const isItemActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { label: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard, id: 'sidebar-dashboard' },
    { label: t('nav.investigations'), path: '/cases', icon: FolderGit2, id: 'sidebar-cases' },
    { label: t('nav.evidence'), path: '/evidence', icon: FileCheck2, id: 'sidebar-evidence' },
    { label: t('nav.mostWanted'), path: '/most-wanted', icon: Flame, badge: 'HOT', id: 'sidebar-most-wanted' },
    { label: t('nav.entities'), path: '/entities', icon: Users2, id: 'sidebar-entities' },
    { label: t('nav.resolution'), path: '/entity-resolution', icon: GitMerge, badge: 'AI', id: 'sidebar-resolution' },
    { label: t('nav.graph'), path: '/network-graph', icon: Network, hero: true, id: 'sidebar-graph' },
    { label: t('nav.timeline'), path: '/timeline', icon: Clock, id: 'sidebar-timeline' },
    { label: t('nav.map'), path: '/map', icon: MapPin, id: 'sidebar-map' },
    { label: t('nav.aiAssistant'), path: '/ai-assistant', icon: Bot, badge: 'RAG', id: 'sidebar-assistant' },
    { label: t('nav.legalDrafting'), path: '/drafting', icon: Scale, badge: 'AUTO', id: 'sidebar-drafting' },
    { label: t('nav.reports'), path: '/reports', icon: FileText, id: 'sidebar-reports' },
    { label: t('nav.auditLogs'), path: '/audit-logs', icon: History, minRole: 'ANALYST', id: 'sidebar-audit-logs' },
    { label: t('nav.designSystem'), path: '/design-system', icon: Palette, badge: 'FIGMA', id: 'sidebar-design' },
    { label: t('nav.settings'), path: '/settings', icon: Settings, id: 'sidebar-settings' },
  ];

  return (
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
            onChange={(e) => setActiveCaseId(e.target.value)}
            title={cases?.find((c) => c.id === activeCaseId)?.title || t('sidebar.allCases')}
            className="w-full h-8 px-2 text-xs rounded border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary truncate font-sans font-medium"
          >
            <option value="ALL">{t('sidebar.allCases')}</option>
            {cases?.map((c) => (
              <option key={c.id} value={c.id} title={`${c.caseNumber} - ${c.title}`}>
                {c.caseNumber} • {c.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation Links Scrollable Wrapper */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin scrollbar-thumb-border">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                id={item.id}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex items-center rounded-lg text-xs font-medium transition-colors relative w-full',
                  sidebarOpen ? 'gap-3 px-3 py-2' : 'justify-center p-2.5',
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
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                    {item.badge}
                  </span>
                )}
                {sidebarOpen && item.hero && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/30 text-primary-foreground shrink-0">
                    HERO
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User & Compliance Footer */}
      {sidebarOpen ? (
        <div className="p-3 border-t border-border/60 bg-background/40 space-y-2 shrink-0">
          <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-card">
            <img
              src={currentUser?.avatar}
              alt={currentUser?.name}
              className="h-9 w-9 rounded-full object-cover border border-primary/30 shrink-0"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-foreground truncate" title={currentUser?.name}>
                {currentUser?.name}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary/20 text-primary border border-primary/30 shrink-0">
                  {activeRole}
                </span>
                <span className="text-[10px] text-muted-foreground truncate" title={currentUser?.department}>
                  {currentUser?.department}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground bg-muted/40 p-2 rounded border border-border/30 leading-tight">
            <ShieldCheck className="h-3 w-3 text-emerald-400 shrink-0" />
            <span>{t('sidebar.complianceNotice')}</span>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-border flex flex-col items-center gap-2 shrink-0">
          <img
            src={currentUser?.avatar}
            alt={currentUser?.name}
            className="h-7 w-7 rounded-full object-cover border border-primary/30"
            title={`${currentUser?.name} (${activeRole})`}
          />
          <span className="h-2 w-2 rounded-full bg-emerald-500" title="Connected" />
        </div>
      )}
    </aside>
  );
}
