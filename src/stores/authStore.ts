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

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: MOCK_USERS[0],
  isAuthenticated: true,
  activeRole: 'INVESTIGATOR',

  setCurrentUser: (user: User) => {
    set({ currentUser: user, isAuthenticated: true, activeRole: user.role });
  },

  loginAsRole: async (role: UserRole) => {
    const user = await api.login(role);
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
