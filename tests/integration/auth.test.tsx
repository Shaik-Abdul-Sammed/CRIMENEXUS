import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../../src/features/auth/ProtectedRoute';
import { useAuthStore } from '../../src/stores/authStore';

describe('RBAC & Protected Route Integration Tests', () => {
  it('renders children when authenticated with sufficient role', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      activeRole: 'ADMIN',
      currentUser: {
        id: 'usr-4',
        name: 'Admin',
        email: 'admin@test.com',
        role: 'ADMIN',
        avatar: '',
        department: 'IT',
        badgeNumber: '001',
      },
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <div>Admin Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Protected Content')).toBeInTheDocument();
  });
});
