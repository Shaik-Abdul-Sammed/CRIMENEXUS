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

interface AppState {
  sidebarOpen: boolean;
  activeCaseId: string;
  globalSearchOpen: boolean;
  theme: 'dark' | 'light';
  notifications: AppNotification[];
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveCaseId: (caseId: string) => void;
  setGlobalSearchOpen: (open: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  sidebarOpen: true,
  activeCaseId: 'case-101',
  globalSearchOpen: false,
  theme: 'dark',
  notifications: [
    {
      id: 'notif-1',
      title: 'AI High Confidence Match',
      message: 'Duplicate candidate "R. Kumar" matches Ramesh Kumar (89% similarity). Review required.',
      timestamp: '10 mins ago',
      type: 'WARNING',
      read: false,
      link: '/entity-resolution',
    },
    {
      id: 'notif-2',
      title: 'New Financial Evidence Extracted',
      message: 'Suspicious transaction of ₹ 4.5 Cr linked to HDFC-ACCT-908122 processed successfully.',
      timestamp: '1 hour ago',
      type: 'SUCCESS',
      read: false,
      link: '/evidence/ev-102',
    },
    {
      id: 'notif-3',
      title: 'ANPR Vehicle Sighting Alert',
      message: 'Toyota Fortuner KA-01-MJ-4091 detected near Sector 62 Noida Toll Checkpoint.',
      timestamp: '3 hours ago',
      type: 'CRITICAL',
      read: true,
      link: '/map',
    },
  ],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveCaseId: (caseId) => set({ activeCaseId: caseId }),
  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),
  setTheme: (theme) => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },
  markNotificationAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));
