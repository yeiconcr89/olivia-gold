import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import PSEPaymentForm from '../../../components/checkout/PSEPaymentForm';

// Mock fetch
global.fetch = vi.fn();
const mockFetch = fetch as ReturnType<typeof vi.fn>;

describe('PSEPaymentForm', () => {
  const mockOnSubmit = vi.fn();
  const mockBanks = [
    { id: 'bancolombia', name: 'Bancolombia' },
    { id: 'davivienda', name: 'Davivienda' },
    { id: 'bbva', name: 'BBVA Colombia' },
    { id: 'banco_bogota', name: 'Banco de Bogotá' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error to reduce noise
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock banks API call
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ banks: mockBanks }),
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render form elements correctly', async () => {
    render(<PSEPaymentForm onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Pago con PSE')).toBeInTheDocument();
    expect(screen.getByText('Paga de forma segura desde tu banco')).toBeInTheDocument();
    
    // Check form fields
    expect(screen.getByText('Tipo de Persona')).toBeInTheDocument();
    expect(screen.getByText('Natural')).toBeInTheDocument();
    expect(screen.getByText('Jurídica')).toBeInTheDocument();
    
    expect(screen.getByText('Tipo de Documento')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Cédula de Ciudadanía' })).toBeInTheDocument();
    
    expect(screen.getByPlaceholderText('Ingresa tu número de documento')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Selecciona tu banco')).toBeInTheDocument();
    });
  });

  it('should load banks on mount', async () => {
    render(<PSEPaymentForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/payments/pse/banks');
    });

    await waitFor(() => {
      const bankSelect = screen.getByRole('combobox', { name: /selecciona tu banco/i });
      expect(bankSelect).toBeInTheDocument();
      
      // Check if banks are loaded
      mockBanks.forEach(bank => {
        expect(screen.getByRole('option', { name: bank.name })).toBeInTheDocument();
      });
    });
  });

  it('should handle person type selection', async () => {
    const user = userEvent.setup();
    render(<PSEPaymentForm onSubmit={mockOnSubmit} />);

    const naturalButton = screen.getByRole('button', { name: /natural/i });
    const juridicaButton = screen.getByRole('button', { name: /jurídica/i });

    // Natural should be selected by default
    expect(naturalButton).toHaveClass('border-blue-500', 'bg-blue-50');
    expect(juridicaButton).toHaveClass('border-gray-200');

    // Click jurídica
    await act(async () => {
      await user.click(juridicaButton);
    });

    expect(juridicaButton).toHaveClass('border-blue-500', 'bg-blue-50');
    expect(naturalButton).toHaveClass('border-gray-200');
  });

  it('should validate document number', async () => {
    const user = userEvent.setup();
    render(<PSEPaymentForm onSubmit={mockOnSubmit} />);

    const documentInput = screen.getByPlaceholderText('Ingresa tu número de documento');
    const submitButton = screen.getByRole('button', { name: /continuar con pse/i });

    // Try to submit with empty document
    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Ingresa tu número de documento')).toBeInTheDocument();
    });

    // Try with short document
    await act(async () => {
      await user.clear(documentInput);
      await user.type(documentInput, '123');
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Documento debe tener al menos 6 dígitos')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate bank selection', async () => {
    const user = userEvent.setup();
    render(<PSEPaymentForm onSubmit={mockOnSubmit} />);

    const documentInput = screen.getByPlaceholderText('Ingresa tu número de documento');
    const submitButton = screen.getByRole('button', { name: /continuar con pse/i });

    // Fill document but not bank
    await act(async () => {
      await user.type(documentInput, '12345678');
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Selecciona tu banco')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    render(<PSEPaymentForm onSubmit={mockOnSubmit} />);

    // Wait for banks to load
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Bancolombia' })).toBeInTheDocument();
    });

    const documentInput = screen.getByPlaceholderText('Ingresa tu número de documento');
    const bankSelect = screen.getByRole('combobox', { name: /selecciona tu banco/i });
    const submitButton = screen.getByRole('button', { name: /continuar con pse/i });

    // Fill form
    await act(async () => {
      await user.type(documentInput, '12345678');
    });
    await act(async () => {
      await user.selectOptions(bankSelect, 'bancolombia');
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        bankId: 'bancolombia',
        documentType: 'CC',
        documentNumber: '12345678',
        personType: 'natural',
      });
    });
  });

  it('should only allow numeric input for document', async () => {
    const user = userEvent.setup();
    render(<PSEPaymentForm onSubmit={mockOnSubmit} />);

    const documentInput = screen.getByPlaceholderText('Ingresa tu número de documento');

    // Try to enter non-numeric characters
    await act(async () => {
      await user.type(documentInput, 'abc123def456');
    });

    expect(documentInput).toHaveValue('123456');
  });

  it('should show loading state when submitting', async () => {
    render(<PSEPaymentForm onSubmit={mockOnSubmit} loading={true} />);

    const submitButton = screen.getByRole('button', { name: /procesando/i });
    
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Procesando...')).toBeInTheDocument();
  });

  it('should handle banks loading error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<PSEPaymentForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      // Should show fallback banks
      expect(screen.getByRole('option', { name: 'Bancolombia' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Davivienda' })).toBeInTheDocument();
    });
  });

  it('should show security information', async () => {
    render(<PSEPaymentForm onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Información Importante:')).toBeInTheDocument();
    expect(screen.getByText('• Serás redirigido al sitio web de tu banco')).toBeInTheDocument();
    expect(screen.getByText('• Ingresa tus credenciales bancarias de forma segura')).toBeInTheDocument();
    expect(screen.getByText('• El pago se confirmará automáticamente')).toBeInTheDocument();
  });

  it('should be accessible', async () => {
    render(<PSEPaymentForm onSubmit={mockOnSubmit} />);

    // Check form labels
    expect(screen.getByLabelText('Tipo de Documento')).toBeInTheDocument();
    expect(screen.getByLabelText('Número de Documento')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByLabelText('Selecciona tu Banco')).toBeInTheDocument();
    });

    // Check button accessibility
    const submitButton = screen.getByRole('button', { name: /continuar con pse/i });
    expect(submitButton).toBeVisible();
    expect(submitButton).not.toHaveAttribute('aria-disabled', 'true');
  });
});