import { create } from 'zustand';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../services/mockData';
import { api } from '../services/api';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  activeRole: UserRole;
  setCurrentUser: (user: User) => void;
  loginAsRole: (role: UserRole) => Promise<void>;
  logout: () => void;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  INVESTIGATOR: 1,
  ANALYST: 2,
  SUPERVISOR: 3,
  ADMIN: 4,
};

const getInitialAuth = () => {
  if (typeof localStorage === 'undefined') {
    return {
      currentUser: MOCK_USERS[0],
      isAuthenticated: true,
      activeRole: 'INVESTIGATOR' as UserRole,
    };
  }
  try {
    const stored = localStorage.getItem('crimenexus_auth_user');
    if (stored) {
      const user = JSON.parse(stored);
      return {
        currentUser: user,
        isAuthenticated: true,
        activeRole: user.role || 'INVESTIGATOR',
      };
    }
  } catch (e) {
    console.warn('Failed to parse auth user from localStorage:', e);
  }
  return {
    currentUser: MOCK_USERS[0],
    isAuthenticated: true,
    activeRole: 'INVESTIGATOR' as UserRole,
  };
};

const initialAuth = getInitialAuth();

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: initialAuth.currentUser,
  isAuthenticated: initialAuth.isAuthenticated,
  activeRole: initialAuth.activeRole,

  setCurrentUser: (user: User) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('crimenexus_auth_user', JSON.stringify(user));
    }
    set({ currentUser: user, isAuthenticated: true, activeRole: user.role });
  },

  loginAsRole: async (role: UserRole) => {
    const user = await api.login(role);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('crimenexus_auth_user', JSON.stringify(user));
    }
    set({ currentUser: user, isAuthenticated: true, activeRole: role });
  },

  logout: () => {
    if (get().currentUser) {
      api.addAuditLog({
        userId: get().currentUser!.id,
        userName: get().currentUser!.name,
        userRole: get().currentUser!.role,
        action: 'LOGOUT',
        target: 'System Session',
        ipAddress: '127.0.0.1',
      });
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('crimenexus_auth_user');
    }
    set({ currentUser: null, isAuthenticated: false, activeRole: 'INVESTIGATOR' });
  },

  hasPermission: (requiredRole: UserRole | UserRole[]) => {
    const { activeRole, isAuthenticated } = get();
    if (!isAuthenticated) return false;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(activeRole);
    }
    return ROLE_HIERARCHY[activeRole] >= ROLE_HIERARCHY[requiredRole];
  },
}));
