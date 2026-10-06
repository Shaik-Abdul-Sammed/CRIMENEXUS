import React from 'react';
import { NavLink } from 'react-router-dom';
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
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useInvestigations } from '../../hooks/useIntelligenceApi';
import { cn } from '../../utils/cn';

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, activeCaseId, setActiveCaseId } = useAppStore();
  const { currentUser, activeRole } = useAuthStore();
  const { data: cases } = useInvestigations();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Investigations', path: '/cases', icon: FolderGit2 },
    { label: 'Evidence Vault', path: '/evidence', icon: FileCheck2 },
    { label: 'Entity Directory', path: '/entities', icon: Users2 },
    { label: 'Entity Resolution', path: '/entity-resolution', icon: GitMerge, badge: 'AI' },
    { label: 'Network Graph', path: '/network-graph', icon: Network, hero: true },
    { label: 'Timeline Stream', path: '/timeline', icon: Clock },
    { label: 'Map Intelligence', path: '/map', icon: MapPin },
    { label: 'AI Assistant', path: '/ai-assistant', icon: Bot, badge: 'RAG' },
    { label: 'Reports', path: '/reports', icon: FileText },
    { label: 'Audit Logs', path: '/audit-logs', icon: History, minRole: 'ANALYST' },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-border bg-card/95 transition-all duration-300 z-30 shrink-0 select-none',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/60">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/40 shadow-glow">
            <ShieldAlert className="h-5 w-5 text-primary" />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-foreground text-sm flex items-center gap-1.5">
                CRIMENEXUS
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/20 text-primary border border-primary/30">
                  v2.4
                </span>
              </span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                Intel System
              </span>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Active Case Selector */}
      {sidebarOpen && (
        <div className="p-3 border-b border-border/50 bg-background/50">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            Active Target Case
          </label>
          <select
            value={activeCaseId}
            onChange={(e) => setActiveCaseId(e.target.value)}
            className="w-full h-8 px-2 text-xs rounded border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary truncate font-mono"
          >
            <option value="ALL">All Active Cases (Global Workspace)</option>
            {cases?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.caseNumber} - {c.title.slice(0, 26)}...
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors relative',
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  item.hero && !sidebarOpen && 'text-primary font-bold'
                )
              }
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
              {sidebarOpen && item.badge && (
                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {item.badge}
                </span>
              )}
              {sidebarOpen && item.hero && (
                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/30 text-primary-foreground">
                  HERO
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User & Compliance Footer */}
      {sidebarOpen ? (
        <div className="p-3 border-t border-border/60 bg-background/40 space-y-2">
          <div className="flex items-center gap-2.5 p-2 rounded-lg border border-border/50 bg-card">
            <img
              src={currentUser?.avatar}
              alt={currentUser?.name}
              className="h-8 w-8 rounded-full object-cover border border-primary/30 shrink-0"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-foreground truncate">{currentUser?.name}</span>
              <span className="text-[10px] text-muted-foreground truncate">{currentUser?.department}</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 shrink-0">
              {activeRole}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground bg-muted/40 p-2 rounded border border-border/30 leading-tight">
            <ShieldCheck className="h-3 w-3 text-emerald-400 shrink-0" />
            <span>AI Decision Support System. Human supervisor approval mandatory.</span>
          </div>
        </div>
      ) : (
        <div className="p-2 border-t border-border flex justify-center">
          <span className="h-2 w-2 rounded-full bg-emerald-500" title="Connected" />
        </div>
      )}
    </aside>
  );
}
