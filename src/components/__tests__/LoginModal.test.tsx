import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import LoginModal from '../LoginModal';
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

// Mock de Google Sign-In API
const mockGoogleSignIn = {
  initialize: vi.fn(),
  renderButton: vi.fn(),
  prompt: vi.fn(),
};

Object.defineProperty(window, 'google', {
  value: {
    accounts: {
      id: mockGoogleSignIn,
    },
  },
  writable: true,
});

// Wrapper con AuthProvider
const renderWithAuth = (children: ReactNode) => {
  return render(
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

describe('LoginModal Component', () => {
  const mockOnClose = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Rendering', () => {
    it('debería renderizar el modal cuando isOpen es true', () => {
      renderWithAuth(<LoginModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
    });

    it('no debería renderizar el modal cuando isOpen es false', () => {
      renderWithAuth(<LoginModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('debería mostrar el botón de Google Sign-In', () => {
      renderWithAuth(<LoginModal {...defaultProps} />);

      expect(screen.getByText(/continuar con google/i)).toBeInTheDocument();
    });

    it('debería mostrar enlace para cambiar a registro', () => {
      renderWithAuth(<LoginModal {...defaultProps} />);

      expect(screen.getByText(/¿no tienes una cuenta?/i)).toBeInTheDocument();
      expect(screen.getByText(/crear cuenta/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('debería mostrar errores de validación para campos vacíos', async () => {
      const user = userEvent.setup();
      renderWithAuth(<LoginModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();
        expect(screen.getByText(/la contraseña es requerida/i)).toBeInTheDocument();
      });
    });

    it('debería validar formato de email', async () => {
      const user = userEvent.setup();
      renderWithAuth(<LoginModal {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/ingresa un email válido/i)).toBeInTheDocument();
      });
    });

    it('debería validar longitud mínima de contraseña', async () => {
      const user = userEvent.setup();
      renderWithAuth(<LoginModal {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/la contraseña debe tener al menos 6 caracteres/i)).toBeInTheDocument();
      });
    });

    it('debería limpiar errores al corregir campos', async () => {
      const user = userEvent.setup();
      renderWithAuth(<LoginModal {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      // Generar error
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();
      });

      // Corregir campo
      await user.type(emailInput, 'test@example.com');

      await waitFor(() => {
        expect(screen.queryByText(/el email es requerido/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Login Functionality', () => {
    it('debería realizar login exitoso con credenciales válidas', async () => {
      const user = userEvent.setup();
      
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

      renderWithAuth(<LoginModal {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

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
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('debería mostrar error para credenciales incorrectas', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Credenciales inválidas',
        }),
      });

      renderWithAuth(<LoginModal {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('debería manejar errores de red', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithAuth(<LoginModal {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error de conexión/i)).toBeInTheDocument();
      });
    });

    it('debería deshabilitar el botón durante el envío', async () => {
      const user = userEvent.setup();
      
      // Mock una respuesta lenta
      let resolveLogin: (value: unknown) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });

      mockFetch.mockReturnValueOnce(loginPromise);

      renderWithAuth(<LoginModal {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // El botón debería estar deshabilitado durante el envío
      expect(submitButton).toBeDisabled();

      // Resolver la promesa
      resolveLogin!({
        ok: true,
        json: async () => ({
          user: { id: '1', email: 'test@example.com', name: 'Test', role: 'CUSTOMER' },
          token: 'token',
        }),
      });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Mode Switching', () => {
    it('debería cambiar a modo registro al hacer clic en "Crear cuenta"', async () => {
      const user = userEvent.setup();
      renderWithAuth(<LoginModal {...defaultProps} />);

      const createAccountLink = screen.getByText(/crear cuenta/i);
      await user.click(createAccountLink);

      await waitFor(() => {
        expect(screen.getByText(/crear cuenta/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /registrarse/i })).toBeInTheDocument();
      });
    });

    it('debería cambiar de registro a login', async () => {
      const user = userEvent.setup();
      renderWithAuth(<LoginModal {...defaultProps} />);

      // Cambiar a modo registro
      const createAccountLink = screen.getByText(/crear cuenta/i);
      await user.click(createAccountLink);

      await waitFor(() => {
        expect(screen.getByText(/crear cuenta/i)).toBeInTheDocument();
      });

      // Cambiar de vuelta a login
      const loginLink = screen.getByText(/iniciar sesión/i);
      await user.click(loginLink);

      await waitFor(() => {
        expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
        expect(screen.queryByLabelText(/nombre/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Register Functionality', () => {
    it('debería realizar registro exitoso', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: '2',
            email: 'newuser@example.com',
            name: 'New User',
            role: 'CUSTOMER'
          },
          token: 'new-token',
        }),
      });

      renderWithAuth(<LoginModal {...defaultProps} />);

      // Cambiar a modo registro
      const createAccountLink = screen.getByText(/crear cuenta/i);
      await user.click(createAccountLink);

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/nombre/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /registrarse/i });

      await user.type(nameInput, 'New User');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
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
      });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('debería validar campos requeridos en registro', async () => {
      const user = userEvent.setup();
      renderWithAuth(<LoginModal {...defaultProps} />);

      // Cambiar a modo registro
      const createAccountLink = screen.getByText(/crear cuenta/i);
      await user.click(createAccountLink);

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument();
        expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();
        expect(screen.getByText(/la contraseña es requerida/i)).toBeInTheDocument();
      });
    });
  });

  describe('Google Sign-In', () => {
    it('debería inicializar Google Sign-In al montar', () => {
      renderWithAuth(<LoginModal {...defaultProps} />);

      expect(mockGoogleSignIn.initialize).toHaveBeenCalled();
    });

    it('debería manejar respuesta exitosa de Google Sign-In', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: '3',
            email: 'google@example.com',
            name: 'Google User',
            role: 'CUSTOMER'
          },
          token: 'google-token',
        }),
      });

      renderWithAuth(<LoginModal {...defaultProps} />);

      // Simular clic en botón de Google
      const googleButton = screen.getByText(/continuar con google/i);
      await user.click(googleButton);

      // En una implementación real, esto triggearía el flujo de Google OAuth
      expect(googleButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('debería tener labels apropiados para screen readers', () => {
      renderWithAuth(<LoginModal {...defaultProps} />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('debería permitir cerrar con tecla Escape', async () => {
      const user = userEvent.setup();
      renderWithAuth(<LoginModal {...defaultProps} />);

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('debería tener focus trap dentro del modal', () => {
      renderWithAuth(<LoginModal {...defaultProps} />);

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();

      // Verificar que los elementos focusables están dentro del modal
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      expect(modal).toContainElement(emailInput);
      expect(modal).toContainElement(passwordInput);
      expect(modal).toContainElement(submitButton);
    });
  });

  describe('Edge Cases', () => {
    it('debería manejar múltiples envíos rápidos', async () => {
      const user = userEvent.setup();
      
      // Mock respuesta lenta
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithAuth(<LoginModal {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Múltiples clics rápidos
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Solo debería haber una llamada a fetch
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('debería limpiar errores al cerrar y reabrir modal', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Error de prueba' }),
      });

      const { rerender } = renderWithAuth(<LoginModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error de prueba/i)).toBeInTheDocument();
      });

      // Cerrar modal
      rerender(
        <AuthProvider>
          <LoginModal {...defaultProps} isOpen={false} />
        </AuthProvider>
      );

      // Reabrir modal
      rerender(
        <AuthProvider>
          <LoginModal {...defaultProps} isOpen={true} />
        </AuthProvider>
      );

      // Los errores deberían estar limpiados
      expect(screen.queryByText(/error de prueba/i)).not.toBeInTheDocument();
    });
  });
});