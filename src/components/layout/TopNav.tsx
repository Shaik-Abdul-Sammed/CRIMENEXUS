import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Shield,
  UserCheck,
  ChevronRight,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types';
import { Button } from '../ui/Button';

export function TopNav() {
  const location = useLocation();
  const { setGlobalSearchOpen, theme, toggleTheme, notifications, markNotificationAsRead } =
    useAppStore();
  const { activeRole, loginAsRole, logout } = useAuthStore();
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathParts.map((part, i) => {
    const url = '/' + pathParts.slice(0, i + 1).join('/');
    const formatted = part
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    return { name: formatted, url };
  });

  const roles: UserRole[] = ['INVESTIGATOR', 'ANALYST', 'SUPERVISOR', 'ADMIN'];

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-card/90 px-6 backdrop-blur-md">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/dashboard" className="hover:text-foreground font-medium transition-colors">
          Home
        </Link>
        {breadcrumbs.map((b, idx) => (
          <React.Fragment key={b.url}>
            <ChevronRight className="h-3 w-3 text-border" />
            <Link
              to={b.url}
              className={
                idx === breadcrumbs.length - 1
                  ? 'font-semibold text-foreground'
                  : 'hover:text-foreground transition-colors'
              }
            >
              {b.name}
            </Link>
          </React.Fragment>
        ))}
      </div>

      {/* Center Global Search Launcher */}
      <button
        onClick={() => setGlobalSearchOpen(true)}
        className="flex h-9 w-80 items-center justify-between rounded-lg border border-border bg-background/80 px-3 text-xs text-muted-foreground transition-all hover:border-primary/50 hover:bg-accent/50 focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-primary" />
          <span>Search cases, entities, evidence...</span>
        </div>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          /
        </kbd>
      </button>

      {/* Right Tools */}
      <div className="flex items-center gap-3">
        {/* Role Simulator Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-primary/30 bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Role: {activeRole}</span>
          </button>
          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-popover p-1 shadow-xl z-50 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase border-b border-border mb-1">
                Switch Active RBAC Role
              </div>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    loginAsRole(r);
                    setRoleMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    activeRole === r
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'hover:bg-accent text-popover-foreground'
                  }`}
                >
                  <span>{r}</span>
                  {activeRole === r && <UserCheck className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Toggle Dark / Light Theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
        </button>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card p-3 shadow-2xl z-50">
              <div className="flex items-center justify-between pb-2 border-b border-border mb-2">
                <span className="text-xs font-bold text-foreground">Intelligence Alerts</span>
                <span className="text-[10px] text-muted-foreground">{unreadCount} unread</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationAsRead(n.id)}
                    className={`p-2 rounded-lg text-xs border transition-colors cursor-pointer ${
                      n.read
                        ? 'bg-background/40 border-border/40 text-muted-foreground'
                        : 'bg-primary/5 border-primary/20 text-foreground font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold mb-0.5">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-400" />
                        {n.title}
                      </span>
                      <span className="text-[9px] text-muted-foreground">{n.timestamp}</span>
                    </div>
                    <p className="text-[11px] leading-tight text-muted-foreground">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Logout */}
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          icon={<LogOut className="h-3.5 w-3.5" />}
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
