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
  Palette,
  Check,
  Scale,
  Keyboard,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { sound } from '../../utils/soundEffects';
import { useAppStore, FigmaTheme } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation, SupportedLanguage } from '../../hooks/useTranslation';
import { UserRole } from '../../types';
import { Button } from '../ui/Button';
import { PoliceDemoModal } from './PoliceDemoModal';
import { OnboardingTour } from '../tour/OnboardingTour';
import { StatutoryRulesModal } from '../common/StatutoryRulesModal';
import { KeyboardShortcutsModal } from '../common/KeyboardShortcutsModal';

export function TopNav() {
  const location = useLocation();
  const {
    setGlobalSearchOpen,
    theme,
    toggleTheme,
    figmaTheme,
    setFigmaTheme,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
  } = useAppStore();
  const { currentUser, activeRole, loginAsRole, logout } = useAuthStore();
  const { language, setLanguage, t } = useTranslation();

  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [statutoryRulesOpen, setStatutoryRulesOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [audioMuted, setAudioMuted] = useState(!sound.isEnabled());

  const settingsRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

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

const FIGMA_THEME_OPTIONS: { id: FigmaTheme; name: string; icon: string; dotColor: string; badge: string }[] = [
  { id: 'dark', name: 'Palantir Midnight', icon: '🌙', dotColor: '#3B82F6', badge: 'Command' },
  { id: 'light', name: 'Daylight Patrol', icon: '☀️', dotColor: '#F59E0B', badge: 'Thana' },
  { id: 'cyber-matrix', name: 'Cyber Matrix', icon: '⚡', dotColor: '#10B981', badge: 'Forensics' },
  { id: 'amber-tactical', name: 'Highway Intercept', icon: '🚨', dotColor: '#EF4444', badge: 'Pursuit' },
];

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifMenuOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setThemeMenuOpen(false);
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
          title="Search cases, entities, and evidence (Press /)"
          aria-label="Search cases, entities, and evidence"
        >
          <Search className="h-4 w-4 text-primary" />
          <span className="hidden md:inline">{t('actions.search')}</span>
          <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            /
          </kbd>
        </button>

        {/* 15 Statutory Rules & Remand Guard Button */}
        <button
          onClick={() => {
            sound.playClickSound();
            setStatutoryRulesOpen(true);
          }}
          className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-bold transition-all"
          title="15 Sovereign Statutory Criminal Rules & Remand Guard (Press S)"
          aria-label="15 Sovereign Statutory Criminal Rules"
        >
          <Scale className="h-4 w-4 text-amber-400" />
          <span className="hidden lg:inline text-[11px]">15 Rules</span>
        </button>

        {/* Global Keyboard Shortcuts Hub */}
        <button
          onClick={() => {
            sound.playClickSound();
            setShortcutsOpen(true);
          }}
          className="flex items-center justify-center h-9 w-9 rounded-lg border border-border/80 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
          title="Investigating Officer Keyboard Shortcuts (Press ?)"
          aria-label="Keyboard Shortcuts"
        >
          <Keyboard className="h-4 w-4" />
        </button>

        {/* Tactical Audio Feedback Mute / Unmute Toggle */}
        <button
          onClick={() => {
            const nextState = sound.toggleMute();
            setAudioMuted(!nextState);
            if (nextState) sound.playClickSound();
          }}
          className={`flex items-center justify-center h-9 w-9 rounded-lg border transition-colors ${
            audioMuted
              ? 'border-border/60 text-muted-foreground/50 hover:text-muted-foreground'
              : 'border-border/80 bg-background/80 text-foreground hover:bg-accent/40'
          }`}
          title={audioMuted ? 'Tactical Audio: Muted (Click to Unmute)' : 'Tactical Audio: Enabled (Click to Mute)'}
          aria-label={audioMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {audioMuted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
        </button>

        {/* Figma Sovereign Theme Switcher */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => {
              sound.playClickSound();
              setThemeMenuOpen(!themeMenuOpen);
            }}
            className={`flex items-center gap-1.5 h-9 px-2.5 rounded-lg border transition-all text-xs font-semibold ${
              themeMenuOpen
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-border/70 bg-background/80 text-foreground hover:border-primary/50 hover:bg-accent/40'
            }`}
            title="Switch Figma Sovereign Theme"
            aria-label="Switch Figma Sovereign Theme"
          >
            <Palette className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline text-[11px] font-medium">
              {FIGMA_THEME_OPTIONS.find((t) => t.id === figmaTheme)?.icon || '🎨'}{' '}
              {FIGMA_THEME_OPTIONS.find((t) => t.id === figmaTheme)?.badge || 'Theme'}
            </span>
          </button>

          {themeMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-card p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 select-none">
              <div className="flex items-center justify-between pb-2 border-b border-border mb-2">
                <div className="flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-bold text-foreground">Figma Sovereign Themes</span>
                </div>
                <Link
                  to="/design-system"
                  onClick={() => setThemeMenuOpen(false)}
                  className="text-[10px] text-primary hover:underline font-mono"
                >
                  Tokens Guide
                </Link>
              </div>

              <div className="space-y-1.5">
                {FIGMA_THEME_OPTIONS.map((opt) => {
                  const isActive = figmaTheme === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        sound.playClickSound();
                        setFigmaTheme(opt.id);
                        setThemeMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                          : 'bg-muted/40 hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{opt.icon}</span>
                        <div className="text-left">
                          <div className="leading-tight">{opt.name}</div>
                          <div
                            className={`text-[9px] font-mono ${
                              isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                            }`}
                          >
                            {opt.badge} Palette
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-white/20"
                          style={{ backgroundColor: opt.dotColor }}
                        />
                        {isActive && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

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
            <div className="absolute right-0 mt-2 w-96 rounded-2xl border border-border/80 bg-slate-900/95 backdrop-blur-md p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 select-none">
              <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Police Telemetry & Statutory Alerts
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ({unreadCount} unread)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        sound.playSuccessChime();
                        markAllNotificationsAsRead();
                      }}
                      className="text-[10px] text-primary hover:text-primary/80 font-bold flex items-center gap-1 px-2 py-0.5 rounded hover:bg-primary/10 transition-colors"
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
                  <button
                    onClick={() => {
                      sound.playClickSound();
                      setNotifMenuOpen(false);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
                    title="Close notifications"
                    aria-label="Close notifications"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8 font-mono">
                    No active tripwires or alerts
                  </p>
                ) : (
                  notifications.map((n) => {
                    const borderColor =
                      n.type === 'CRITICAL'
                        ? 'border-l-red-500 bg-red-950/20'
                        : n.type === 'WARNING'
                        ? 'border-l-amber-500 bg-amber-950/20'
                        : n.type === 'SUCCESS'
                        ? 'border-l-emerald-500 bg-emerald-950/20'
                        : 'border-l-sky-500 bg-sky-950/20';

                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          sound.playClickSound();
                          markNotificationAsRead(n.id);
                        }}
                        className={`p-3 rounded-xl text-xs border border-border/50 border-l-4 transition-all ${borderColor} ${
                          n.read ? 'opacity-60' : 'shadow-md opacity-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-extrabold text-foreground text-xs leading-snug">
                            {n.title}
                          </span>
                          <span className="text-[9px] font-mono text-muted-foreground shrink-0 mt-0.5">
                            {n.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-300">
                          {n.message}
                        </p>
                        {n.link && (
                          <div className="mt-2 pt-1.5 border-t border-white/5 flex justify-end">
                            <Link
                              to={n.link}
                              onClick={() => {
                                setNotifMenuOpen(false);
                                markNotificationAsRead(n.id);
                              }}
                              className="text-[10px] font-bold text-primary hover:text-primary-foreground hover:bg-primary/20 px-2 py-0.5 rounded transition-all inline-flex items-center gap-1"
                            >
                              <span>Inspect Lead</span>
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })
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

              {/* Figma Theme Selector */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Figma Sovereign Theme
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {FIGMA_THEME_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        sound.playClickSound();
                        setFigmaTheme(opt.id);
                      }}
                      className={`flex items-center gap-1.5 px-2 py-1.5 text-[11px] rounded-md transition-colors ${
                        figmaTheme === opt.id
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <span>{opt.icon}</span>
                      <span className="truncate">{opt.name.split(' ')[0]}</span>
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
                  onClick={() => {
                    sound.playClickSound();
                    toggleTheme();
                  }}
                  className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title="Toggle Light/Dark"
                  aria-label="Toggle Light/Dark"
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

        {/* User Status Badge & Logout (No repeated name/role; full profile is in Sidebar) */}
        <div className="flex items-center gap-2 pl-2 border-l border-border/60">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-400 font-mono tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              GRID ACTIVE
            </span>
            <img
              src={currentUser?.avatar}
              alt={currentUser?.name || 'User'}
              className="h-8 w-8 rounded-full object-cover border border-primary/30"
              title={`${currentUser?.name} (${activeRole})`}
            />
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

      {/* 15 Statutory Criminal Rules & Remand Guard Modal */}
      <StatutoryRulesModal
        isOpen={statutoryRulesOpen}
        onClose={() => setStatutoryRulesOpen(false)}
      />

      {/* Global Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </header>
  );
}
