import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
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
  Train,
  Grid,
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
import { PanicLockModal } from '../common/PanicLockModal';
import { AccessibilityBar } from '../common/AccessibilityBar';
import { WhatsNewChangelogModal } from '../common/WhatsNewChangelogModal';
import { Lock } from 'lucide-react';

export function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    setGlobalSearchOpen,
    setPageDirectoryOpen,
    setFeaturesHubModalOpen,
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
  const [tacticalMenuOpen, setTacticalMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [statutoryRulesOpen, setStatutoryRulesOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [audioMuted, setAudioMuted] = useState(!sound.isEnabled());
  const [isPanicLocked, setIsPanicLocked] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsServerOnline(true);
    const handleOffline = () => setIsServerOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Global Panic Lock hotkey (Ctrl+Alt+L)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        sound.playWarningBeep();
        setIsPanicLocked((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Periodic server health ping (critical for rural Thana 2 Mbps BSNL connections)
    const interval = setInterval(() => {
      fetch('/api/v1/ml/status', { method: 'GET' })
        .then(() => setIsServerOnline(true))
        .catch(() => setIsServerOnline(navigator.onLine));
    }, 20000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, []);

  const settingsRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const tacticalRef = useRef<HTMLDivElement>(null);

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
      if (tacticalRef.current && !tacticalRef.current.contains(event.target as Node)) {
        setTacticalMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Tactical Keyboard Shortcuts (?, /, M, P, N, E, S, Esc)
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isInput = target && (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
        target.isContentEditable
      );

      // ESC should always close active modals and dropdowns, even when focused in an input
      if (e.key === 'Escape') {
        setShortcutsOpen(false);
        setStatutoryRulesOpen(false);
        setSettingsMenuOpen(false);
        setNotifMenuOpen(false);
        setThemeMenuOpen(false);
        setDemoModalOpen(false);
        setGlobalSearchOpen(false);
        return;
      }

      // Ctrl+K or Cmd+K: Universal Search & Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        sound.playClickSound();
        setGlobalSearchOpen(true);
        return;
      }

      // Do not trigger single-key hotkeys if user is actively typing in a form or input
      if (isInput) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        sound.playClickSound();
        setShortcutsOpen((prev) => !prev);
      } else if (e.key === '/') {
        e.preventDefault();
        sound.playClickSound();
        setGlobalSearchOpen(true);
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        sound.playClickSound();
        navigate('/map');
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        sound.playClickSound();
        navigate('/live-tracking');
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        sound.playClickSound();
        navigate('/network-graph');
      } else if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        sound.playClickSound();
        navigate('/evidence');
      } else if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        sound.playClickSound();
        navigate('/dashboard');
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        sound.playClickSound();
        setStatutoryRulesOpen((prev) => !prev);
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [navigate, setGlobalSearchOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 w-full max-w-full items-center justify-between border-b border-border bg-card/98 px-3 sm:px-4 md:px-6 shadow-sm gap-2">
      {/* Left: Responsive Breadcrumbs with guaranteed full 'Home' visibility and no clipping */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground shrink-0 max-w-[200px] sm:max-w-[280px] md:max-w-[340px] overflow-hidden">
        <Link to="/dashboard" className="hover:text-foreground font-bold transition-colors shrink-0 flex items-center gap-1 text-primary">
          <span className="whitespace-nowrap font-extrabold text-xs">Home</span>
        </Link>
        {breadcrumbs.map((b, idx) => (
          <React.Fragment key={b.url}>
            <ChevronRight className="h-3 w-3 text-border shrink-0" />
            <Link
              to={b.url}
              className={`truncate max-w-[90px] sm:max-w-[130px] whitespace-nowrap ${
                idx === breadcrumbs.length - 1
                  ? 'font-extrabold text-foreground'
                  : 'hover:text-foreground transition-colors'
              }`}
              title={b.name}
            >
              {b.name}
            </Link>
          </React.Fragment>
        ))}
      </nav>

      {/* Right: Consolidated Tools & Actions (Streamlined, Zero Horizontal Overflow, Zero Stacking Traps) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 justify-end relative z-50">
        {/* 1. Global Intelligence Search Trigger (High Usage) */}
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="flex items-center gap-1.5 h-8 sm:h-9 px-2 sm:px-2.5 rounded-lg border border-border bg-background/80 text-xs text-muted-foreground hover:border-primary/50 hover:bg-accent/50 transition-all focus:outline-none shrink-0"
          title="Search cases, entities, pages, and evidence (Press /)"
          aria-label="Search cases, entities, and evidence"
        >
          <Search className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="hidden xl:inline text-[11px] truncate">{t('actions.search')}</span>
          <kbd className="hidden lg:inline-flex h-4 select-none items-center gap-0.5 rounded border border-border bg-muted px-1 font-mono text-[9px] font-medium text-muted-foreground">
            /
          </kbd>
        </button>

        {/* 2. All 25 Pages Directory & Quick Navigator (High Priority) */}
        <button
          onClick={() => {
            sound.playClickSound();
            setPageDirectoryOpen(true);
          }}
          className="flex items-center gap-1.5 h-8 sm:h-9 px-2 sm:px-2.5 rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all shadow-sm shrink-0"
          title="Open complete 25 Pages System Directory (Press ⌘P / Ctrl+P)"
          aria-label="All Pages Directory"
        >
          <Grid className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="hidden md:inline text-[11px]">Pages</span>
          <span className="px-1 py-0.2 rounded-full bg-primary/20 text-primary text-[9px] font-mono font-black">25</span>
        </button>

        {/* 3. 100 Technical Specifications & Next 96 Roadmap */}
        <Link
          to="/roadmap"
          className="flex items-center gap-1.5 h-8 sm:h-9 px-2 sm:px-2.5 rounded-lg border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-all shadow-sm shrink-0"
          title="100 Sovereign Technical Specifications & Next 96 Engineering Roadmap"
          aria-label="100 Specs Roadmap"
        >
          <Compass className="h-3.5 w-3.5 text-amber-400 shrink-0 animate-spin-slow" />
          <span className="hidden lg:inline text-[11px] font-black">Roadmap</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-400/25 text-amber-300 text-[9px] font-mono font-black border border-amber-400/40">96</span>
        </Link>

        {/* 4. 10 Core Pro Features Hub Modal Trigger */}
        <button
          onClick={() => {
            sound.playClickSound();
            setFeaturesHubModalOpen(true);
          }}
          className="flex items-center gap-1.5 h-8 sm:h-9 px-2 sm:px-2.5 rounded-lg border border-cyan-500/50 bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-300 text-xs font-bold transition-all shadow-sm shrink-0"
          title="CRIMENEXUS 10 Core Pro Features & Capabilities Hub"
          aria-label="Features Showcase"
        >
          <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span className="hidden xl:inline text-[11px]">Features</span>
          <span className="px-1 py-0.2 rounded-full bg-cyan-400/20 text-cyan-300 text-[9px] font-mono font-extrabold">10</span>
        </button>

        {/* 5. 1-Click Vernacular Full Page Language Switcher (Directly on TopNav) */}
        <div className="flex items-center gap-1 h-8 sm:h-9 px-2 rounded-lg border border-sky-500/40 bg-sky-950/40 text-xs shrink-0">
          <Languages className="h-3.5 w-3.5 text-sky-400 shrink-0" />
          <select
            value={language}
            onChange={(e) => {
              sound.playClickSound();
              setLanguage(e.target.value as SupportedLanguage);
            }}
            className="bg-transparent text-sky-200 font-bold text-xs focus:outline-none cursor-pointer pr-1"
            aria-label="Switch Entire Application Language"
            title="Full Entire Page Translation (EN / हिन्दी / मराठी / ಕನ್ನಡ / తెలుగు)"
          >
            <option value="en" className="bg-slate-900 text-slate-100">English (EN)</option>
            <option value="hi" className="bg-slate-900 text-slate-100">हिन्दी (Hindi)</option>
            <option value="mr" className="bg-slate-900 text-slate-100">मराठी (Marathi)</option>
            <option value="kn" className="bg-slate-900 text-slate-100">ಕನ್ನಡ (Kannada)</option>
            <option value="te" className="bg-slate-900 text-slate-100">తెలుగు (Telugu)</option>
          </select>
        </div>

        {/* 6. Consolidated Tactical Tools Popover (Prevents Navbar Overflow) */}
        <div className="relative shrink-0" ref={tacticalRef}>
          <button
            onClick={() => {
              sound.playClickSound();
              setTacticalMenuOpen(!tacticalMenuOpen);
            }}
            className={`flex items-center gap-1.5 h-8 sm:h-9 px-2 sm:px-2.5 rounded-lg border text-xs font-bold transition-all shadow-sm ${
              tacticalMenuOpen
                ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-md'
                : 'border-border/80 bg-background/80 text-foreground hover:border-amber-500/50 hover:bg-accent/40'
            }`}
            title="Tactical Field Tools (Railway TC Face, 15 Rules, Panic Lock, Audio Mute, Theme)"
            aria-label="Tactical Tools Menu"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline text-[11px]">Tactical</span>
            <span className="px-1 py-0.2 rounded-full bg-amber-400/20 text-amber-300 text-[9px] font-mono font-bold">Tools</span>
          </button>

          {tacticalMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-border bg-slate-900/98 backdrop-blur-xl p-3 shadow-2xl z-[999] animate-in fade-in zoom-in-95 space-y-2 select-none">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">Tactical Field Utilities</span>
                </div>
                <button
                  onClick={() => setTacticalMenuOpen(false)}
                  className="p-1 rounded text-muted-foreground hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Railway TC Aadhaar Face Verification Terminal */}
              <Link
                to="/railway-verification"
                onClick={() => setTacticalMenuOpen(false)}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-sky-950/40 border border-sky-500/30 hover:bg-sky-900/50 text-xs text-sky-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Train className="h-4 w-4 text-sky-400" />
                  <div className="text-left">
                    <div className="font-bold">Railway TC Biometric Face</div>
                    <div className="text-[10px] text-sky-300/70 font-mono">Aadhaar & CCTNS Watchlist</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">TC</span>
              </Link>

              {/* 15 Statutory Rules & Remand Guard */}
              <button
                onClick={() => {
                  sound.playClickSound();
                  setTacticalMenuOpen(false);
                  setStatutoryRulesOpen(true);
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 hover:bg-amber-900/50 text-xs text-amber-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-amber-400" />
                  <div className="text-left">
                    <div className="font-bold">15 Statutory Rules (BNS/BNSS)</div>
                    <div className="text-[10px] text-amber-300/70 font-mono">Mandatory Remand Guard (Press S)</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">Rules</span>
              </button>

              {/* Panic Lock Screen Button */}
              <button
                onClick={() => {
                  sound.playWarningBeep();
                  setTacticalMenuOpen(false);
                  setIsPanicLocked(true);
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-red-950/40 border border-red-500/30 hover:bg-red-900/50 text-xs text-red-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-red-400" />
                  <div className="text-left">
                    <div className="font-bold">Panic Lock Evidence Screen</div>
                    <div className="text-[10px] text-red-300/70 font-mono">Conceal Dossier (Ctrl+Alt+L)</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">Lock</span>
              </button>

              {/* Tactical Audio & Keyboard Shortcuts Dual Row */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                <button
                  onClick={() => {
                    const nextState = sound.toggleMute();
                    setAudioMuted(!nextState);
                    if (nextState) sound.playClickSound();
                  }}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-border/80 bg-slate-800/60 hover:bg-slate-700/60 text-xs font-semibold text-slate-200 transition-colors"
                >
                  {audioMuted ? <VolumeX className="h-3.5 w-3.5 text-muted-foreground" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-400" />}
                  <span>{audioMuted ? 'Audio Muted' : 'Audio On'}</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClickSound();
                    setTacticalMenuOpen(false);
                    setShortcutsOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-border/80 bg-slate-800/60 hover:bg-slate-700/60 text-xs font-semibold text-slate-200 transition-colors"
                >
                  <Keyboard className="h-3.5 w-3.5 text-sky-400" />
                  <span>Shortcuts (?)</span>
                </button>
              </div>

              {/* Figma Theme Quick Select */}
              <div className="pt-2 border-t border-border/50">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Palette Theme
                </span>
                <div className="grid grid-cols-2 gap-1">
                  {FIGMA_THEME_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        sound.playClickSound();
                        setFigmaTheme(opt.id);
                        setTacticalMenuOpen(false);
                      }}
                      className={`flex items-center gap-1.5 px-2 py-1.5 text-[11px] rounded-lg transition-colors ${
                        figmaTheme === opt.id
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'bg-muted/40 hover:bg-muted text-foreground'
                      }`}
                    >
                      <span>{opt.icon}</span>
                      <span className="truncate">{opt.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
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
            <div className="absolute right-0 mt-2 w-[92vw] max-w-sm sm:w-96 rounded-2xl border border-border/80 bg-slate-900/98 backdrop-blur-xl p-4 shadow-2xl z-[999] animate-in fade-in zoom-in-95 select-none">
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

        {/* Consolidated System Hub & Preferences (Gear Icon) */}
        <div className="relative shrink-0" ref={settingsRef}>
          <button
            onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
            className={`p-2 rounded-lg transition-colors border ${
              settingsMenuOpen
                ? 'bg-primary/10 border-primary text-primary'
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
            title="System Preferences, Themes, Languages, & Tools"
            aria-label="System Preferences, Themes, Languages, & Tools"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>

          {settingsMenuOpen && (
            <div className="absolute right-0 mt-2 w-[90vw] max-w-xs sm:w-80 rounded-xl border border-border bg-card/98 backdrop-blur-xl p-3 shadow-2xl z-[999] space-y-3 animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <SettingsIcon className="h-3.5 w-3.5 text-primary" />
                  Tactical Preferences
                </span>
                <button
                  onClick={() => setSettingsMenuOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* High Contrast / Sunlight Toggle */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Field Accessibility
                </label>
                <AccessibilityBar />
              </div>

              {/* What's New & Updates Button */}
              <div>
                <button
                  onClick={() => {
                    setSettingsMenuOpen(false);
                    setWhatsNewOpen(true);
                  }}
                  className="w-full flex items-center justify-between h-9 px-2.5 rounded-lg border border-primary/40 bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20 transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    What's New in v2.4 (Changelog)
                  </span>
                  <ChevronRight className="h-3 w-3 text-primary" />
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

              {/* Direct Jumps to 100 Specs Roadmap & All 25 Pages Directory */}
              <div className="pt-2 border-t border-border space-y-1">
                <Link
                  to="/roadmap"
                  onClick={() => setSettingsMenuOpen(false)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Compass className="h-3.5 w-3.5 text-amber-400 animate-spin-slow" />
                    <span>100 Specs & Next 96 Roadmap</span>
                  </div>
                  <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300">
                    96 NEW
                  </span>
                </Link>

                <button
                  onClick={() => {
                    setSettingsMenuOpen(false);
                    setPageDirectoryOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-bold transition-all text-left"
                >
                  <div className="flex items-center gap-2">
                    <Grid className="h-3.5 w-3.5 text-primary" />
                    <span>Complete 25 Pages Directory</span>
                  </div>
                  <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-primary/20 text-primary">
                    ⌘P
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Status Badge & Logout (No repeated name/role; full profile is in Sidebar) */}
        <div className="flex items-center gap-2 pl-2 border-l border-border/60">
          <div className="flex items-center gap-2">
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold font-mono tracking-wide border ${
                isServerOnline
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/40 text-red-400 animate-pulse'
              }`}
              title={
                isServerOnline
                  ? 'Server connectivity: ONLINE (BSNL 2 Mbps / Local Fast)'
                  : 'Server connectivity: OFFLINE (Check local interface)'
              }
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isServerOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                }`}
              />
              {isServerOnline ? 'ONLINE' : 'OFFLINE'}
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
    </header>

    {/* Top-Level Portal Modals (rendered as siblings outside header to eliminate CSS containment/stacking traps) */}
    <PanicLockModal isLocked={isPanicLocked} onUnlock={() => setIsPanicLocked(false)} />
    <PoliceDemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    <OnboardingTour isOpen={tourOpen} onClose={() => setTourOpen(false)} />
    <StatutoryRulesModal
      isOpen={statutoryRulesOpen}
      onClose={() => setStatutoryRulesOpen(false)}
    />
    <KeyboardShortcutsModal
      isOpen={shortcutsOpen}
      onClose={() => setShortcutsOpen(false)}
      onOpenRules={() => setStatutoryRulesOpen(true)}
    />
    <WhatsNewChangelogModal
      isOpen={whatsNewOpen}
      onClose={() => setWhatsNewOpen(false)}
    />
  </>
);
}
