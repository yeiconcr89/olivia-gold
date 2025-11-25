import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import HeroSlideManager from '../../components/HeroSlideManager';

// Mock del hook useHeroSlider
vi.mock('../../hooks/useHeroSlider', () => ({
  useHeroSlider: vi.fn(),
}));

// Mock del componente FileUploader
vi.mock('../../components/FileUploader', () => ({
  default: ({ onUploadSuccess }: { onUploadSuccess: (url: string) => void }) => (
    <div data-testid="file-uploader">
      <button 
        onClick={() => onUploadSuccess('https://example.com/test-image.jpg')}
        data-testid="upload-button"
      >
        Upload Test Image
      </button>
    </div>
  ),
}));

// Mock del componente ConfirmationModal
vi.mock('../../components/ConfirmationModal', () => ({
  default: ({ isOpen, onConfirm, onCancel }: { 
    isOpen: boolean; 
    onConfirm: () => void; 
    onCancel: () => void; 
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="confirmation-modal">
        <button onClick={onConfirm} data-testid="confirm-button">Confirmar</button>
        <button onClick={onCancel} data-testid="cancel-button">Cancelar</button>
      </div>
    );
  },
}));

// Importar el mock después de definirlo
import { useHeroSlider } from '../../hooks/useHeroSlider';
const mockUseHeroSlider = vi.mocked(useHeroSlider);

const mockSlides = [
  {
    id: '1',
    title: 'Test Slide 1',
    subtitle: 'Test Subtitle 1',
    description: 'Test Description 1',
    imageUrl: 'https://example.com/image1.jpg',
    ctaText: 'Ver Colección',
    ctaLink: '/productos',
    offerText: 'Hasta 30% OFF',
    isActive: true,
    orderIndex: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Test Slide 2',
    subtitle: 'Test Subtitle 2',
    description: 'Test Description 2',
    imageUrl: 'https://example.com/image2.jpg',
    ctaText: 'Comprar Ahora',
    ctaLink: '/checkout',
    offerText: 'Envío Gratis',
    isActive: false,
    orderIndex: 2,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

const defaultMockHookReturn = {
  slides: mockSlides,
  loading: false,
  error: null,
  fetchAllSlides: vi.fn(),
  createSlide: vi.fn(),
  updateSlide: vi.fn(),
  deleteSlide: vi.fn(),
  reorderSlides: vi.fn(),
  toggleSlideStatus: vi.fn(),
  fetchActiveSlides: vi.fn(),
  fetchSlideById: vi.fn(),
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('HeroSlideManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseHeroSlider.mockReturnValue(defaultMockHookReturn);
  });

  describe('Renderizado básico', () => {
    it('debería renderizar el título principal', () => {
      renderWithRouter(<HeroSlideManager />);

      expect(screen.getByText('Administración de Hero Slider')).toBeInTheDocument();
    });

    it('debería renderizar el botón de nuevo slide', () => {
      renderWithRouter(<HeroSlideManager />);

      expect(screen.getByRole('button', { name: /nuevo slide/i })).toBeInTheDocument();
    });

    it('debería mostrar estado de carga', () => {
      mockUseHeroSlider.mockReturnValue({
        ...defaultMockHookReturn,
        loading: true,
        slides: [],
      });

      renderWithRouter(<HeroSlideManager />);

      expect(screen.getByText('Cargando slides...')).toBeInTheDocument();
    });

    it('debería mostrar mensaje cuando no hay slides', () => {
      mockUseHeroSlider.mockReturnValue({
        ...defaultMockHookReturn,
        slides: [],
      });

      renderWithRouter(<HeroSlideManager />);

      expect(screen.getByText('No hay slides configurados')).toBeInTheDocument();
    });

    it('debería mostrar mensaje de error', () => {
      const errorMessage = 'Error al cargar slides';
      mockUseHeroSlider.mockReturnValue({
        ...defaultMockHookReturn,
        error: errorMessage,
        slides: [],
      });

      renderWithRouter(<HeroSlideManager />);

      expect(screen.getAllByText('Error al cargar slides')).toHaveLength(2); // Título y mensaje
    });
  });

  describe('Funcionalidad básica', () => {
    it('debería llamar fetchAllSlides al montar el componente', () => {
      const mockFetchAllSlides = vi.fn();
      mockUseHeroSlider.mockReturnValue({
        ...defaultMockHookReturn,
        fetchAllSlides: mockFetchAllSlides,
      });

      renderWithRouter(<HeroSlideManager />);

      expect(mockFetchAllSlides).toHaveBeenCalledTimes(1);
    });

    it('debería abrir modal para crear nuevo slide', () => {
      renderWithRouter(<HeroSlideManager />);

      fireEvent.click(screen.getByRole('button', { name: /nuevo slide/i }));

      // Verificar que aparece el modal (buscar por el título del modal)
      expect(screen.getAllByText('Nuevo Slide')).toHaveLength(2); // Botón + título del modal
    });

    it('debería mostrar slides en la tabla', () => {
      renderWithRouter(<HeroSlideManager />);

      // Verificar que se muestran los slides (pueden aparecer múltiples veces en desktop/mobile)
      expect(screen.getAllByText('Test Slide 1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Test Slide 2').length).toBeGreaterThanOrEqual(1);
    });

    it('debería mostrar botones de acción para cada slide', () => {
      renderWithRouter(<HeroSlideManager />);

      // Verificar que existen botones de editar y eliminar (pueden aparecer en desktop y mobile)
      const editButtons = screen.getAllByTitle('Editar slide');
      const deleteButtons = screen.getAllByTitle('Eliminar slide');
      
      expect(editButtons.length).toBeGreaterThanOrEqual(2); // Al menos dos slides
      expect(deleteButtons.length).toBeGreaterThanOrEqual(2); // Al menos dos slides
    });

    it('debería mostrar modal de confirmación para eliminar', () => {
      renderWithRouter(<HeroSlideManager />);

      const deleteButtons = screen.getAllByTitle('Eliminar slide');
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-button')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });
  });

  describe('Estados de slides', () => {
    it('debería mostrar estado activo/inactivo de slides', () => {
      renderWithRouter(<HeroSlideManager />);

      // Verificar que se muestran los estados (pueden aparecer múltiples veces)
      expect(screen.getAllByText('Activo').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Inactivo').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Integración con hook', () => {
    it('debería usar el hook useHeroSlider correctamente', () => {
      renderWithRouter(<HeroSlideManager />);

      expect(mockUseHeroSlider).toHaveBeenCalledWith({
        externalToast: undefined,
        manualInit: true,
      });
    });

    it('debería usar toastActions externos cuando se proporcionan', () => {
      const mockToastActions = {
        success: vi.fn(),
        error: vi.fn(),
      };

      renderWithRouter(<HeroSlideManager toastActions={mockToastActions} />);

      expect(mockUseHeroSlider).toHaveBeenCalledWith({
        externalToast: mockToastActions,
        manualInit: true,
      });
    });
  });

  describe('Responsive design', () => {
    it('debería mostrar vista de tabla', () => {
      renderWithRouter(<HeroSlideManager />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });
});