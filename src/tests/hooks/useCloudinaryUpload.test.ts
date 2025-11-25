import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';

// Mock del contexto de autenticación
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock de la configuración de API
vi.mock('../../config/api', () => ({
  API_CONFIG: {
    ENDPOINTS: {
      UPLOAD: {
        SINGLE: '/api/upload/single',
        MULTIPLE: '/api/upload/multiple',
        DELETE: (id: string) => `/api/upload/${id}`,
        GALLERY: '/api/upload/gallery',
      },
    },
  },
  apiRequest: vi.fn(),
  createAuthHeaders: vi.fn(() => ({ Authorization: 'Bearer test-token' })),
}));

// Importar los mocks después de definirlos
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../config/api';
const mockUseAuth = vi.mocked(useAuth);
const mockApiRequest = vi.mocked(apiRequest);

describe('useCloudinaryUpload Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      token: 'test-token',
    });
  });

  describe('Inicialización', () => {
    it('debería inicializar con estado por defecto', () => {
      const { result } = renderHook(() => useCloudinaryUpload());

      expect(result.current.isUploading).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Validaciones', () => {
    it('debería rechazar archivos sin autenticación', async () => {
      mockUseAuth.mockReturnValue({ token: null });
      
      const { result } = renderHook(() => useCloudinaryUpload());
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await act(async () => {
        const response = await result.current.uploadSingleImage(file);
        expect(response).toBe(null);
      });

      expect(result.current.error).toBe('No estás autenticado');
    });

    it('debería rechazar archivos demasiado grandes', async () => {
      const { result } = renderHook(() => useCloudinaryUpload());
      
      // Crear un archivo mock que simule ser mayor a 5MB
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      });

      await act(async () => {
        const response = await result.current.uploadSingleImage(largeFile);
        expect(response).toBe(null);
      });

      expect(result.current.error).toBe('El archivo es demasiado grande. Máximo 5MB permitido');
    });

    it('debería rechazar tipos de archivo no permitidos', async () => {
      const { result } = renderHook(() => useCloudinaryUpload());
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      await act(async () => {
        const response = await result.current.uploadSingleImage(invalidFile);
        expect(response).toBe(null);
      });

      expect(result.current.error).toBe('Tipo de archivo no permitido. Solo se permiten JPEG, PNG, WebP y GIF');
    });

    it('debería rechazar archivos nulos', async () => {
      const { result } = renderHook(() => useCloudinaryUpload());

      await act(async () => {
        const response = await result.current.uploadSingleImage(null as any);
        expect(response).toBe(null);
      });

      expect(result.current.error).toBe('No se ha seleccionado ningún archivo');
    });
  });

  describe('Upload múltiple', () => {
    it('debería rechazar más de 10 archivos', async () => {
      const { result } = renderHook(() => useCloudinaryUpload());
      
      // Crear 11 archivos
      const files = Array.from({ length: 11 }, (_, i) => 
        new File(['test'], `test${i}.jpg`, { type: 'image/jpeg' })
      );

      await act(async () => {
        const response = await result.current.uploadMultipleImages(files);
        expect(response).toEqual([]);
      });

      expect(result.current.error).toBe('Máximo 10 archivos permitidos por subida');
    });

    it('debería rechazar arrays vacíos', async () => {
      const { result } = renderHook(() => useCloudinaryUpload());

      await act(async () => {
        const response = await result.current.uploadMultipleImages([]);
        expect(response).toEqual([]);
      });

      expect(result.current.error).toBe('No se han seleccionado archivos');
    });
  });

  describe('Funciones de utilidad', () => {
    it('debería limpiar errores manualmente', () => {
      const { result } = renderHook(() => useCloudinaryUpload());

      // Simular un error
      act(() => {
        result.current.uploadSingleImage(null as any);
      });

      // Limpiar error
      act(() => {
        result.current.resetError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Tipos de archivo válidos', () => {
    const validTypes = [
      { type: 'image/jpeg', name: 'test.jpg' },
      { type: 'image/png', name: 'test.png' },
      { type: 'image/webp', name: 'test.webp' },
      { type: 'image/gif', name: 'test.gif' },
    ];

    validTypes.forEach(({ type, name }) => {
      it(`debería aceptar archivos ${type}`, async () => {
        const { result } = renderHook(() => useCloudinaryUpload());
        const file = new File(['test'], name, { type });

        // Mock de apiRequest para simular éxito
        mockApiRequest.mockResolvedValueOnce({
          image: {
            id: 'test-id',
            url: 'https://test.com/image.jpg',
            width: 100,
            height: 100,
            format: 'jpg',
            size: 1000,
            folder: 'test',
          },
        });

        await act(async () => {
          const response = await result.current.uploadSingleImage(file);
          expect(response).toBeTruthy();
        });

        expect(result.current.error).toBe(null);
      });
    });
  });
});