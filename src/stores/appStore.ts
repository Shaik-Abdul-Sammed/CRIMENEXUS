import { create } from 'zustand';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  read: boolean;
  link?: string;
}

export type FigmaTheme = 'dark' | 'light' | 'cyber-matrix' | 'amber-tactical';

interface AppState {
  sidebarOpen: boolean;
  activeCaseId: string;
  globalSearchOpen: boolean;
  theme: 'dark' | 'light';
  figmaTheme: FigmaTheme;
  notifications: AppNotification[];
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveCaseId: (caseId: string) => void;
  setGlobalSearchOpen: (open: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setFigmaTheme: (theme: FigmaTheme) => void;
  toggleTheme: () => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>((set, get) => {
  const initialFigmaTheme = (typeof localStorage !== 'undefined' ? (localStorage.getItem('crimenexus-figma-theme') as FigmaTheme) : null) || 'dark';

  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('light', 'dark', 'theme-palantir', 'theme-daylight', 'theme-cyber-matrix', 'theme-amber-tactical');
    if (initialFigmaTheme === 'light') {
      document.documentElement.classList.add('light', 'theme-daylight');
    } else if (initialFigmaTheme === 'cyber-matrix') {
      document.documentElement.classList.add('dark', 'theme-cyber-matrix');
    } else if (initialFigmaTheme === 'amber-tactical') {
      document.documentElement.classList.add('dark', 'theme-amber-tactical');
    } else {
      document.documentElement.classList.add('dark', 'theme-palantir');
    }
  }

  return {
    sidebarOpen: true,
    activeCaseId: 'case-101',
    globalSearchOpen: false,
    theme: initialFigmaTheme === 'light' ? 'light' : 'dark',
    figmaTheme: initialFigmaTheme,
    notifications: [
    {
      id: 'notif-1',
      title: '🚨 Hawala Smurfing Velocity Tripwire Triggered',
      message: 'Bank Account ACC-908122 received 8 cash deposits under ₹50,000 within 4 hours (Total: ₹3,92,000). Syndicate beneficiary match flagged under PMLA Sec 3 & 4.',
      timestamp: '4 mins ago',
      type: 'CRITICAL',
      read: false,
      link: '/evidence/ev-102',
    },
    {
      id: 'notif-2',
      title: '⏱️ 24h Remand Countdown Alert (BNSS Sec 57)',
      message: 'Accused Rajan Verma: 24-hour constitutional production deadline expires in 3h 15m. File Section 480 opposition & transit remand immediately.',
      timestamp: '12 mins ago',
      type: 'CRITICAL',
      read: false,
      link: '/dashboard',
    },
    {
      id: 'notif-3',
      title: '🚔 ANPR Sighting: Intercept Vehicle KA-01-MJ-4091',
      message: 'Toyota Fortuner scanned at NH-48 Kherki Daula Toll Plaza KM 48. Speed: 84 km/h heading toward Sector 62. Patrol Sector 20 dispatched.',
      timestamp: '28 mins ago',
      type: 'WARNING',
      read: false,
      link: '/live-tracking',
    },
    {
      id: 'notif-4',
      title: '📄 CCTNS FIR Sync: Inter-State Syndicate Case',
      message: 'FIR-2026-DEL-0891 synced automatically from Special Cell under Sec 111 BNS (Organized Crime). 4 co-conspirators auto-linked in Neo4j.',
      timestamp: '1 hour ago',
      type: 'INFO',
      read: false,
      link: '/cases/case-101',
    },
    {
      id: 'notif-5',
      title: '🛂 Look-Out Circular (LOC) Transmitted to BOI',
      message: 'LOC-MHA-2026-8812 transmitted to all 32 international airport departure terminals and seaports for fugitive Rajan.',
      timestamp: '2 hours ago',
      type: 'SUCCESS',
      read: true,
      link: '/most-wanted',
    },
    {
      id: 'notif-6',
      title: '🎙️ Voice Biometrics Wiretap Match (94.2%)',
      message: 'Intercepted cellular audio intercept_call_04.wav confirmed speaker match to enrolled voiceprint of Vikram Malhotra.',
      timestamp: '3 hours ago',
      type: 'SUCCESS',
      read: true,
      link: '/entities',
    },
  ],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveCaseId: (caseId) => set({ activeCaseId: caseId }),
  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),
  setFigmaTheme: (theme: FigmaTheme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark', 'theme-palantir', 'theme-daylight', 'theme-cyber-matrix', 'theme-amber-tactical');
      if (theme === 'light') {
        document.documentElement.classList.add('light', 'theme-daylight');
      } else if (theme === 'cyber-matrix') {
        document.documentElement.classList.add('dark', 'theme-cyber-matrix');
      } else if (theme === 'amber-tactical') {
        document.documentElement.classList.add('dark', 'theme-amber-tactical');
      } else {
        document.documentElement.classList.add('dark', 'theme-palantir');
      }
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('crimenexus-figma-theme', theme);
    }
    set({ figmaTheme: theme, theme: theme === 'light' ? 'light' : 'dark' });
  },
  setTheme: (theme) => {
    get().setFigmaTheme(theme === 'light' ? 'light' : 'dark');
  },
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setFigmaTheme(nextTheme);
  },
  markNotificationAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllNotificationsAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  clearNotifications: () => set({ notifications: [] }),
  };
});
