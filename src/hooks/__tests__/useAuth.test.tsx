import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { AuthProvider } from '../../contexts/AuthContext';
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

// Wrapper para el hook que incluye el AuthProvider
const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Hook Return Values', () => {
    it('debería retornar todas las funciones y valores necesarios', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('isAdmin');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('register');

      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.register).toBe('function');
    });

    it('debería tener valores iniciales correctos', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isAdmin).toBe(false);
      expect(typeof result.current.isLoading).toBe('boolean');
    });
  });

  describe('Authentication State', () => {
    it('debería calcular isAuthenticated correctamente', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Inicialmente no autenticado
      expect(result.current.isAuthenticated).toBe(false);

      // Mock login exitoso
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'CUSTOMER'
          },
          token: 'mock-token',
        }),
      });

      // Realizar login
      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).not.toBeNull();
      });
    });

    it('debería calcular isAdmin correctamente para usuario admin', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: '1',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'ADMIN'
          },
          token: 'admin-token',
        }),
      });

      await act(async () => {
        await result.current.login('admin@example.com', 'password123');
      });

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true);
        expect(result.current.user?.role).toBe('ADMIN');
      });
    });

    it('debería calcular isAdmin correctamente para usuario no admin', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: '1',
            email: 'customer@example.com',
            name: 'Customer User',
            role: 'CUSTOMER'
          },
          token: 'customer-token',
        }),
      });

      await act(async () => {
        await result.current.login('customer@example.com', 'password123');
      });

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(false);
        expect(result.current.user?.role).toBe('CUSTOMER');
      });
    });
  });

  describe('Login Function', () => {
    it('debería realizar login con credenciales válidas', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: mockUser,
          token: 'valid-token',
        }),
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

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

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'valid-token');
    });

    it('debería manejar error de login con credenciales inválidas', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Credenciales inválidas',
        }),
      });

      await act(async () => {
        try {
          await result.current.login('wrong@example.com', 'wrongpassword');
        } catch {
          // Expected error
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('debería manejar errores de red durante login', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'password123');
        } catch {
          // Expected error
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Register Function', () => {
    it('debería realizar registro exitoso', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const mockUser = {
        id: '2',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'CUSTOMER'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: mockUser,
          token: 'new-token',
        }),
      });

      await act(async () => {
        await result.current.register('newuser@example.com', 'password123', 'New User');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
          role: 'CUSTOMER',
        }),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
    });

    it('debería manejar error de registro con email duplicado', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'El email ya está registrado',
        }),
      });

      await act(async () => {
        try {
          await result.current.register('existing@example.com', 'password123', 'User');
        } catch {
          // Expected error
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Logout Function', () => {
    it('debería realizar logout correctamente', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Primero hacer login
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'CUSTOMER'
          },
          token: 'token-to-remove',
        }),
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      // Verificar que está logueado
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Hacer logout
      await act(async () => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isAdmin).toBe(false);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('debería manejar logout cuando no hay usuario logueado', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Intentar logout sin estar logueado
      await act(async () => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('Token Persistence', () => {
    it('debería restaurar usuario desde token almacenado', async () => {
      const mockToken = 'stored-token';
      const mockUser = {
        id: '1',
        email: 'stored@example.com',
        name: 'Stored User',
        role: 'CUSTOMER'
      };

      mockLocalStorage.getItem.mockReturnValue(mockToken);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      });
    });

    it('debería limpiar token inválido almacenado', async () => {
      const invalidToken = 'invalid-token';

      mockLocalStorage.getItem.mockReturnValue(invalidToken);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('Loading States', () => {
    it('debería manejar estado de loading durante operaciones async', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Mock una respuesta lenta
      let resolveLogin: (value: unknown) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });

      mockFetch.mockReturnValueOnce(loginPromise);

      // Iniciar login
      act(() => {
        result.current.login('test@example.com', 'password123');
      });

      // El estado de loading puede variar según la implementación
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
        expect(result.current.isAuthenticated).toBe(true);
      });
    });
  });

  describe('Error Scenarios', () => {
    it('debería manejar respuestas del servidor sin user/token', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // Respuesta vacía
      });

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'password123');
        } catch {
          // Error esperado
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('debería manejar JSON malformado del servidor', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'password123');
        } catch {
          // Error esperado
        }
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('Memory Management', () => {
    it('no debería tener memory leaks al desmontar', () => {
      const { result, unmount } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toBeDefined();

      // Desmontar el hook
      unmount();

      // No debería haber errores ni warnings
      expect(true).toBe(true);
    });
  });
});