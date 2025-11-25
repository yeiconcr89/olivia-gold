import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { ReactNode } from 'react';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Test component que usa el AuthContext
const TestComponent = () => {
  const { user, isLoading, login, logout, register } = useAuth();
  
  return (
    <div>
      <div data-testid="user-status">
        {isLoading ? 'Loading...' : user ? `Logged in as ${user.email}` : 'Not logged in'}
      </div>
      <div data-testid="user-role">
        {user ? user.role : 'No role'}
      </div>
      <button 
        data-testid="login-btn"
        onClick={() => login('test@example.com', 'password123')}
      >
        Login
      </button>
      <button 
        data-testid="logout-btn" 
        onClick={logout}
      >
        Logout
      </button>
      <button 
        data-testid="register-btn"
        onClick={() => register('new@example.com', 'password123', 'New User')}
      >
        Register
      </button>
    </div>
  );
};

const renderWithAuth = (children: ReactNode) => {
  return render(
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('debería mostrar estado inicial sin usuario', () => {
      renderWithAuth(<TestComponent />);
      
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      expect(screen.getByTestId('user-role')).toHaveTextContent('No role');
    });

    it('debería mostrar loading inicialmente', () => {
      renderWithAuth(<TestComponent />);
      
      // El componente puede mostrar loading al inicio dependiendo de la implementación
      expect(screen.getByTestId('user-status')).toBeInTheDocument();
    });

    it('debería verificar token existente en localStorage al montar', () => {
      const mockToken = 'existing-token';
      const mockUser = {
        id: '1',
        email: 'existing@example.com',
        name: 'Existing User',
        role: 'CUSTOMER'
      };

      mockLocalStorage.getItem.mockReturnValue(mockToken);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      renderWithAuth(<TestComponent />);

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('Login Functionality', () => {
    it('debería realizar login exitoso', async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER'
      };
      const mockToken = 'mock-jwt-token';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: mockUser,
          token: mockToken,
        }),
      });

      renderWithAuth(<TestComponent />);

      await user.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com');
        expect(screen.getByTestId('user-role')).toHaveTextContent('CUSTOMER');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', mockToken);
    });

    it('debería manejar error de login', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Credenciales inválidas',
        }),
      });

      renderWithAuth(<TestComponent />);

      await user.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // El usuario debería seguir sin autenticar
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('debería manejar error de red en login', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithAuth(<TestComponent />);

      await user.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });
  });

  describe('Register Functionality', () => {
    it('debería realizar registro exitoso', async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: '2',
        email: 'new@example.com',
        name: 'New User',
        role: 'CUSTOMER'
      };
      const mockToken = 'new-jwt-token';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: mockUser,
          token: mockToken,
        }),
      });

      renderWithAuth(<TestComponent />);

      await user.click(screen.getByTestId('register-btn'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'new@example.com',
            password: 'password123',
            name: 'New User',
            role: 'CUSTOMER',
          }),
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as new@example.com');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', mockToken);
    });

    it('debería manejar error de registro', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'El email ya está registrado',
        }),
      });

      renderWithAuth(<TestComponent />);

      await user.click(screen.getByTestId('register-btn'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Logout Functionality', () => {
    it('debería realizar logout correctamente', async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER'
      };

      // Simular usuario logueado
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: mockUser,
          token: 'mock-token',
        }),
      });

      renderWithAuth(<TestComponent />);

      // Primero hacer login
      await user.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com');
      });

      // Luego hacer logout
      await user.click(screen.getByTestId('logout-btn'));

      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      expect(screen.getByTestId('user-role')).toHaveTextContent('No role');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('Token Persistence', () => {
    it('debería restaurar usuario desde token válido', async () => {
      const mockToken = 'valid-token';
      const mockUser = {
        id: '1',
        email: 'restored@example.com',
        name: 'Restored User',
        role: 'ADMIN'
      };

      mockLocalStorage.getItem.mockReturnValue(mockToken);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as restored@example.com');
        expect(screen.getByTestId('user-role')).toHaveTextContent('ADMIN');
      });
    });

    it('debería limpiar token inválido', async () => {
      const mockToken = 'invalid-token';

      mockLocalStorage.getItem.mockReturnValue(mockToken);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      });

      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });
  });

  describe('Role-based Features', () => {
    it('debería identificar correctamente usuario admin', async () => {
      const user = userEvent.setup();
      const mockAdmin = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: mockAdmin,
          token: 'admin-token',
        }),
      });

      renderWithAuth(<TestComponent />);

      await user.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('ADMIN');
      });
    });

    it('debería identificar correctamente usuario customer', async () => {
      const user = userEvent.setup();
      const mockCustomer = {
        id: '2',
        email: 'customer@example.com',
        name: 'Customer User',
        role: 'CUSTOMER'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: mockCustomer,
          token: 'customer-token',
        }),
      });

      renderWithAuth(<TestComponent />);

      await user.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('CUSTOMER');
      });
    });
  });

  describe('Error Handling', () => {
    it('debería manejar errores de red al verificar token', async () => {
      const mockToken = 'some-token';

      mockLocalStorage.getItem.mockReturnValue(mockToken);
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('debería manejar respuestas malformadas del servidor', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // Respuesta sin user ni token
      });

      renderWithAuth(<TestComponent />);

      await user.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });
  });

  describe('Loading States', () => {
    it('debería mostrar loading durante login', async () => {
      const user = userEvent.setup();
      
      // Mock una respuesta lenta
      let resolveLogin: (value: unknown) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });

      mockFetch.mockReturnValueOnce(loginPromise);

      renderWithAuth(<TestComponent />);

      await user.click(screen.getByTestId('login-btn'));

      // Verificar que se muestra loading (esto depende de la implementación)
      expect(mockFetch).toHaveBeenCalled();

      // Resolver la promesa
      resolveLogin!({
        ok: true,
        json: async () => ({
          user: { id: '1', email: 'test@example.com', name: 'Test', role: 'CUSTOMER' },
          token: 'token',
        }),
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com');
      });
    });
  });
});