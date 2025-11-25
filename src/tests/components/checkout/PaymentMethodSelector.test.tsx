import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import PaymentMethodSelector from '../../../components/checkout/PaymentMethodSelector';

// Mock fetch
global.fetch = vi.fn();
const mockFetch = fetch as ReturnType<typeof vi.fn>;

describe('PaymentMethodSelector', () => {
  const mockOnMethodSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockFetch.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(
      <PaymentMethodSelector
        selectedMethod={null}
        onMethodSelect={mockOnMethodSelect}
      />
    );

    expect(screen.getByText('Método de Pago')).toBeInTheDocument();
    expect(screen.getAllByRole('generic')).toHaveLength(3); // Loading skeletons
  });

  it('should render payment methods after loading', async () => {
    const mockResponse = {
      success: true,
      data: {
        methods: [
          { id: 'pse', name: 'PSE', type: 'pse', enabled: true, description: 'Pago Seguro en Línea' },
          { id: 'card', name: 'Tarjeta', type: 'card', enabled: true, description: 'Tarjeta de Crédito/Débito' },
          { id: 'nequi', name: 'Nequi', type: 'nequi', enabled: true, description: 'Pago con Nequi' }
        ]
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    render(
      <PaymentMethodSelector
        selectedMethod={null}
        onMethodSelect={mockOnMethodSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('PSE')).toBeInTheDocument();
      expect(screen.getByText('Tarjeta')).toBeInTheDocument();
      expect(screen.getByText('Nequi')).toBeInTheDocument();
      expect(screen.queryByText('Efectivo')).not.toBeInTheDocument(); // Disabled
    });

    expect(screen.getByText('Pago Seguro en Línea')).toBeInTheDocument();
    expect(screen.getByText('Tarjeta de Crédito/Débito')).toBeInTheDocument();
    expect(screen.getByText('Pago con Nequi')).toBeInTheDocument();
  });

  it('should handle method selection', async () => {
    const mockMethods = [
      { id: 'pse', name: 'PSE', type: 'pse', enabled: true },
      { id: 'card', name: 'Tarjeta', type: 'card', enabled: true },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { methods: mockMethods } }),
    } as Response);

    render(
      <PaymentMethodSelector
        selectedMethod={null}
        onMethodSelect={mockOnMethodSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('PSE')).toBeInTheDocument();
    });

    const pseButton = screen.getByRole('button', { name: /PSE/i });
    fireEvent.click(pseButton);

    expect(mockOnMethodSelect).toHaveBeenCalledWith('pse');
  });

  it('should show selected method with visual indicator', async () => {
    const mockMethods = [
      { id: 'pse', name: 'PSE', type: 'pse', enabled: true },
      { id: 'card', name: 'Tarjeta', type: 'card', enabled: true },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { methods: mockMethods } }),
    } as Response);

    render(
      <PaymentMethodSelector
        selectedMethod="pse"
        onMethodSelect={mockOnMethodSelect}
      />
    );

    await waitFor(() => {
      const pseButton = screen.getByRole('button', { name: /PSE/i });
      expect(pseButton).toHaveClass('border-blue-500', 'bg-blue-50');
    });
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <PaymentMethodSelector
        selectedMethod={null}
        onMethodSelect={mockOnMethodSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Error al cargar métodos de pago')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should show empty state when no methods available', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { methods: [] } }),
    } as Response);

    render(
      <PaymentMethodSelector
        selectedMethod={null}
        onMethodSelect={mockOnMethodSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No hay métodos de pago disponibles')).toBeInTheDocument();
      expect(screen.getByText('Contacta con soporte')).toBeInTheDocument();
    });
  });

  it('should be accessible', async () => {
    const mockMethods = [
      { id: 'pse', name: 'PSE', type: 'pse', enabled: true },
      { id: 'card', name: 'Tarjeta', type: 'card', enabled: true },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { methods: mockMethods } }),
    } as Response);

    render(
      <PaymentMethodSelector
        selectedMethod={null}
        onMethodSelect={mockOnMethodSelect}
      />
    );

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeVisible();
        expect(button).not.toHaveAttribute('aria-disabled', 'true');
      });
    });
  });
});