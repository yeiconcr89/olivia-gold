import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CloudinarySettings from '../../components/CloudinarySettings';

// Mock del contexto de autenticación
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock de la configuración de API
vi.mock('../../config/api', () => ({
  API_CONFIG: {
    ENDPOINTS: {
      UPLOAD: {
        STATS: '/api/upload/stats',
        SINGLE: '/api/upload/single',
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

describe('CloudinarySettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      token: 'test-token',
    });
  });

  describe('Manejo de estadísticas con valores nulos', () => {
    it('debería manejar valores undefined en storage y bandwidth', async () => {
      const statsWithNullValues = {
        usage: {
          storage: undefined,
          bandwidth: null,
          resources: 7,
          requests: 106,
        },
        folders: [],
        limits: {
          maxFileSize: '5MB',
          allowedFormats: ['JPEG', 'PNG', 'WebP', 'GIF'],
          maxFilesPerUpload: 10,
        },
      };

      mockApiRequest.mockResolvedValueOnce(statsWithNullValues);

      render(<CloudinarySettings />);

      // Esperar a que se carguen las estadísticas
      await screen.findByText('Estadísticas de uso');

      // Verificar que se muestran valores por defecto en lugar de NaN
      expect(screen.getAllByText('No disponible').length).toBeGreaterThan(0);
      expect(screen.queryByText('NaN')).not.toBeInTheDocument();
      expect(screen.queryByText('undefined')).not.toBeInTheDocument();
      
      // Verificar que los valores válidos se muestran correctamente
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('106')).toBeInTheDocument();
    });

    it('debería manejar valores NaN en las estadísticas', async () => {
      const statsWithNaN = {
        usage: {
          storage: NaN,
          bandwidth: NaN,
          resources: NaN,
          requests: 0,
        },
        folders: [],
        limits: {},
      };

      mockApiRequest.mockResolvedValueOnce(statsWithNaN);

      render(<CloudinarySettings />);

      await screen.findByText('Estadísticas de uso');

      // Verificar que no hay texto "NaN" en el documento
      expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
      
      // Verificar que se muestran valores por defecto
      const noDisponibleElements = screen.getAllByText('No disponible');
      expect(noDisponibleElements.length).toBeGreaterThan(0);
    });

    it('debería manejar carpetas con valores count undefined', async () => {
      const statsWithUndefinedCount = {
        usage: {
          storage: 1024,
          bandwidth: 2048,
          resources: 5,
          requests: 100,
        },
        folders: [
          { name: 'products', count: undefined },
          { name: 'seo', count: null },
          { name: 'general', count: 10 },
        ],
        limits: {},
      };

      mockApiRequest.mockResolvedValueOnce(statsWithUndefinedCount);

      render(<CloudinarySettings />);

      await screen.findByText('Distribución por carpetas');

      // Verificar que las carpetas se muestran
      expect(screen.getByText('products')).toBeInTheDocument();
      expect(screen.getByText('seo')).toBeInTheDocument();
      expect(screen.getByText('general')).toBeInTheDocument();
      
      // Verificar que el valor válido se muestra correctamente
      expect(screen.getByText('10')).toBeInTheDocument();
      
      // Verificar que no hay valores undefined o null mostrados
      expect(screen.queryByText('undefined')).not.toBeInTheDocument();
      expect(screen.queryByText('null')).not.toBeInTheDocument();
    });

    it('debería manejar estadísticas completamente vacías', async () => {
      const emptyStats = {
        usage: {},
        folders: undefined,
        limits: undefined,
      };

      mockApiRequest.mockResolvedValueOnce(emptyStats);

      render(<CloudinarySettings />);

      await screen.findByText('Estadísticas de uso');

      // Verificar que se muestran valores por defecto
      expect(screen.getAllByText('No disponible').length).toBeGreaterThan(0);
      expect(screen.getByText('No hay carpetas configuradas')).toBeInTheDocument();
    });
  });

  describe('Formateo de bytes', () => {
    it('debería formatear bytes correctamente', async () => {
      const statsWithValidBytes = {
        usage: {
          storage: 1024 * 1024, // 1 MB
          bandwidth: 1024 * 1024 * 1024, // 1 GB
          resources: 50,
          requests: 1000,
        },
        folders: [],
        limits: {},
      };

      mockApiRequest.mockResolvedValueOnce(statsWithValidBytes);

      render(<CloudinarySettings />);

      await screen.findByText('Estadísticas de uso');

      // Verificar formateo correcto
      expect(screen.getByText('1 MB')).toBeInTheDocument();
      expect(screen.getByText('1 GB')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    it('debería manejar valor cero correctamente', async () => {
      const statsWithZero = {
        usage: {
          storage: 0,
          bandwidth: 0,
          resources: 0,
          requests: 0,
        },
        folders: [],
        limits: {},
      };

      mockApiRequest.mockResolvedValueOnce(statsWithZero);

      render(<CloudinarySettings />);

      await screen.findByText('Estadísticas de uso');

      // Verificar que cero se muestra correctamente
      expect(screen.getAllByText('0 Bytes').length).toBe(2); // storage y bandwidth
      expect(screen.getAllByText('0').length).toBe(2); // resources y requests
    });
  });

  describe('Estados de carga y error', () => {
    it('debería mostrar estado de carga', () => {
      mockApiRequest.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<CloudinarySettings />);

      expect(screen.getByText('Cargando configuración de Cloudinary...')).toBeInTheDocument();
    });

    it('debería mostrar estado de error', async () => {
      mockApiRequest.mockRejectedValueOnce(new Error('Error de conexión'));

      render(<CloudinarySettings />);

      await screen.findByText('Error de configuración');
      expect(screen.getByText('Error de conexión')).toBeInTheDocument();
    });
  });
});