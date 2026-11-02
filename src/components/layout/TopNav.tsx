import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  UserCheck,
  ChevronRight,
  LogOut,
  AlertTriangle,
  Sparkles,
  Compass,
  Languages,
  Zap,
  Settings as SettingsIcon,
  X,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import { sound } from '../../utils/soundEffects';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation, SupportedLanguage } from '../../hooks/useTranslation';
import { UserRole } from '../../types';
import { Button } from '../ui/Button';
import { PoliceDemoModal } from './PoliceDemoModal';
import { OnboardingTour } from '../tour/OnboardingTour';

export function TopNav() {
  const location = useLocation();
  const {
    setGlobalSearchOpen,
    theme,
    toggleTheme,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
  } = useAppStore();
  const { currentUser, activeRole, loginAsRole, logout } = useAuthStore();
  const { language, setLanguage, t } = useTranslation();

  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  const settingsRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-card/90 px-4 md:px-6 backdrop-blur-md">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
        <Link to="/dashboard" className="hover:text-foreground font-medium transition-colors shrink-0">
          Home
        </Link>
        {breadcrumbs.map((b, idx) => (
          <React.Fragment key={b.url}>
            <ChevronRight className="h-3 w-3 text-border shrink-0" />
            <Link
              to={b.url}
              className={`truncate ${
                idx === breadcrumbs.length - 1
                  ? 'font-semibold text-foreground'
                  : 'hover:text-foreground transition-colors'
              }`}
            >
              {b.name}
            </Link>
          </React.Fragment>
        ))}
      </div>

      {/* Right: Consolidated Tools & Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Search Trigger (Modal Launcher) */}
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-background/80 text-xs text-muted-foreground hover:border-primary/50 hover:bg-accent/50 transition-all focus:outline-none"
          title="Search cases, entities, and evidence (Ctrl+K)"
          aria-label="Search cases, entities, and evidence"
        >
          <Search className="h-4 w-4 text-primary" />
          <span className="hidden md:inline">{t('actions.search')}</span>
          <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            /
          </kbd>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Intelligence Alerts & Notifications"
            aria-label="Intelligence Alerts & Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 mt-2 w-84 rounded-xl border border-border bg-card p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-border mb-2">
                <div>
                  <span className="text-xs font-bold text-foreground">Intelligence Alerts</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">
                    ({unreadCount} unread / {notifications.length} total)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        sound.playSuccessChime();
                        markAllNotificationsAsRead();
                      }}
                      className="text-[10px] text-primary hover:text-primary/80 font-medium flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-primary/10 transition-colors"
                      title="Mark all notifications as read"
                    >
                      <CheckCheck className="h-3 w-3" />
                      <span>Mark all read</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={() => {
                        sound.playClickSound();
                        clearNotifications();
                      }}
                      className="text-[10px] text-muted-foreground hover:text-destructive font-medium flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-destructive/10 transition-colors"
                      title="Clear all notifications"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6 font-mono">
                    No active notifications or alerts
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        sound.playClickSound();
                        markNotificationAsRead(n.id);
                      }}
                      className={`p-2 rounded-lg text-xs border transition-colors cursor-pointer ${
                        n.read
                          ? 'bg-background/40 border-border/40 text-muted-foreground'
                          : 'bg-primary/5 border-primary/20 text-foreground font-medium shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-0.5">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className={`h-3 w-3 ${n.type === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}`} />
                          {n.title}
                        </span>
                        <span className="text-[9px] text-muted-foreground">{n.timestamp}</span>
                      </div>
                      <p className="text-[11px] leading-tight text-muted-foreground">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Consolidated Settings & Tools Dropdown (Gear Icon) */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
            className={`p-2 rounded-lg transition-colors border ${
              settingsMenuOpen
                ? 'bg-primary/10 border-primary text-primary'
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
            title="System Settings, Language, Mode, & Tour"
            aria-label="System Settings, Language, Mode, & Tour"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>

          {settingsMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-card p-3 shadow-2xl z-50 space-y-3 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <SettingsIcon className="h-3.5 w-3.5 text-primary" />
                  System Preferences
                </span>
                <button
                  onClick={() => setSettingsMenuOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Vernacular Language Selector */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Language (Vernacular)
                </label>
                <div className="flex items-center gap-2 h-9 px-2.5 rounded-lg border border-border bg-background/80 text-xs">
                  <Languages className="h-4 w-4 text-cyan-400 shrink-0" />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                    className="w-full bg-transparent text-foreground font-medium text-xs focus:outline-none cursor-pointer"
                    aria-label="Select Language"
                  >
                    <option value="en" className="bg-slate-900 text-slate-100">English (EN)</option>
                    <option value="hi" className="bg-slate-900 text-slate-100">हिन्दी (Hindi)</option>
                    <option value="mr" className="bg-slate-900 text-slate-100">मराठी (Marathi)</option>
                    <option value="kn" className="bg-slate-900 text-slate-100">ಕನ್ನಡ (Kannada)</option>
                    <option value="te" className="bg-slate-900 text-slate-100">తెలుగు (Telugu)</option>
                  </select>
                </div>
              </div>

              {/* Bandwidth Mode Switcher */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Bandwidth & Network Mode
                </label>
                <Link
                  to="/lite"
                  onClick={() => setSettingsMenuOpen(false)}
                  className="flex items-center justify-between h-9 px-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    Thana 2 Mbps Lite Mode
                  </span>
                  <ChevronRight className="h-3 w-3 text-amber-400" />
                </Link>
              </div>

              {/* RBAC Role Selector */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Active Role (RBAC Simulation)
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        loginAsRole(r);
                      }}
                      className={`flex items-center justify-between px-2 py-1.5 text-[11px] rounded-md transition-colors ${
                        activeRole === r
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <span>{r}</span>
                      {activeRole === r && <UserCheck className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Features (Tour & Demo) */}
              <div className="pt-2 border-t border-border flex items-center gap-2">
                <button
                  onClick={() => {
                    setSettingsMenuOpen(false);
                    setTourOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-primary/40 bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20 transition-all"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>IO Tour</span>
                </button>

                <button
                  onClick={() => {
                    setSettingsMenuOpen(false);
                    setDemoModalOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-amber-500/40 bg-amber-500/10 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Showcase</span>
                </button>

                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title="Toggle Theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-3.5 w-3.5 text-amber-400" />
                  ) : (
                    <Moon className="h-3.5 w-3.5 text-slate-700" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2 pl-1 border-l border-border/60">
          <div className="flex items-center gap-2">
            <img
              src={currentUser?.avatar}
              alt={currentUser?.name || 'User'}
              className="h-8 w-8 rounded-full object-cover border border-primary/30"
            />
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-foreground leading-none">{currentUser?.name}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{activeRole}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Police Command Demo Showcase Modal */}
      <PoliceDemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />

      {/* Investigating Officer Interactive Onboarding Tour */}
      <OnboardingTour isOpen={tourOpen} onClose={() => setTourOpen(false)} />
    </header>
  );
}
