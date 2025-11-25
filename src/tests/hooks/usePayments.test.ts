import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import usePayments from '../../hooks/usePayments';

// Define types for better type safety
interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}

interface PaymentResponse {
  success: boolean;
  data?: {
    transactionId: string;
    status: string;
    redirectUrl?: string;
    message?: string;
  };
  message?: string;
}

interface PaymentVerification {
  transactionId: string;
  status: string;
  message?: string;
}

interface PaymentStatus {
  transactionId: string;
  status: string;
  amount: number;
  gateway: string;
}

interface PSEBank {
  id: string;
  name: string;
}

// Mock fetch
global.fetch = vi.fn();
const mockFetch = fetch as ReturnType<typeof vi.fn>;

describe('usePayments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchPaymentMethods', () => {
    it('should fetch payment methods successfully', async () => {
      const mockMethods = {
        pse: { enabled: true, name: 'PSE' },
        card: { enabled: true, name: 'Tarjeta' },
        nequi: { enabled: false, name: 'Nequi' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMethods,
      } as Response);

      const { result } = renderHook(() => usePayments());

      let methods: PaymentMethod[];
      await act(async () => {
        methods = await result.current.fetchPaymentMethods();
      });

      expect(methods).toEqual([
        { id: 'pse', name: 'PSE', type: 'pse', enabled: true },
        { id: 'card', name: 'Tarjeta', type: 'card', enabled: true },
        { id: 'nequi', name: 'Nequi', type: 'nequi', enabled: false },
      ]);

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Server error' }),
      } as Response);

      const { result } = renderHook(() => usePayments());

      await act(async () => {
        try {
          await result.current.fetchPaymentMethods();
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Server error');
    });

    it('should set loading state correctly', async () => {
      mockFetch.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, data: { methods: [] } }),
        } as Response), 100))
      );

      const { result } = renderHook(() => usePayments());

      act(() => {
        result.current.fetchPaymentMethods();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('fetchPSEBanks', () => {
    it('should fetch PSE banks successfully', async () => {
      const mockBanks = [
        { id: 'bancolombia', name: 'Bancolombia' },
        { id: 'davivienda', name: 'Davivienda' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ banks: mockBanks }),
      } as Response);

      const { result } = renderHook(() => usePayments());

      let banks: PSEBank[];
      await act(async () => {
        banks = await result.current.fetchPSEBanks();
      });

      expect(banks).toEqual(mockBanks);
      expect(mockFetch).toHaveBeenCalledWith('/api/payments/pse/banks');
    });
  });

  describe('createPayment', () => {
    it('should create payment successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          transactionId: 'test_123',
          status: 'approved',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => usePayments());

      const paymentRequest = {
        orderId: 'order_123',
        amount: 100000,
        currency: 'COP',
        methodId: 'card',
      };

      let response: PaymentResponse;
      await act(async () => {
        response = await result.current.createPayment(paymentRequest);
      });

      expect(response).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      });
    });

    it('should handle payment creation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Payment declined' }),
      } as Response);

      const { result } = renderHook(() => usePayments());

      const paymentRequest = {
        orderId: 'order_123',
        amount: 100000,
        currency: 'COP',
        methodId: 'card',
      };

      await act(async () => {
        try {
          await result.current.createPayment(paymentRequest);
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Payment declined');
    });
  });

  describe('createPSEPayment', () => {
    it('should create PSE payment successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          transactionId: 'pse_123',
          status: 'pending',
          redirectUrl: 'https://bank.com/redirect',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => usePayments());

      const pseRequest = {
        orderId: 'order_123',
        amount: 100000,
        currency: 'COP',
        methodId: 'pse',
        bankId: 'bancolombia',
        userType: 'person',
        identificationType: 'CC',
        identification: '123456789',
        pse: {
          bankId: 'bancolombia',
        },
      };

      let response: PaymentResponse;
      await act(async () => {
        response = await result.current.createPSEPayment(pseRequest);
      });

      expect(response).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/payments/pse/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pseRequest),
      });
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment successfully', async () => {
      const mockVerification = {
        transactionId: 'test_123',
        status: 'approved',
        message: 'Payment approved',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVerification,
      } as Response);

      const { result } = renderHook(() => usePayments());

      let verification: PaymentVerification;
      await act(async () => {
        verification = await result.current.verifyPayment('test_123');
      });

      expect(verification).toEqual(mockVerification);
      expect(mockFetch).toHaveBeenCalledWith('/api/payments/test_123/verify');
    });
  });

  describe('getPaymentStatus', () => {
    it('should get payment status successfully', async () => {
      const mockStatus = {
        transactionId: 'test_123',
        status: 'approved',
        amount: 100000,
        gateway: 'wompi',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      } as Response);

      const { result } = renderHook(() => usePayments());

      let status: PaymentStatus;
      await act(async () => {
        status = await result.current.getPaymentStatus('test_123');
      });

      expect(status).toEqual(mockStatus);
      expect(mockFetch).toHaveBeenCalledWith('/api/payments/transactions/test_123');
    });
  });

  describe('retryPayment', () => {
    it('should retry payment successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          transactionId: 'test_123_retry',
          status: 'approved',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => usePayments());

      let response: PaymentResponse;
      await act(async () => {
        response = await result.current.retryPayment('test_123');
      });

      expect(response).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/payments/test_123/retry', {
        method: 'POST',
      });
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      // First set an error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Test error' }),
      } as Response);

      const { result } = renderHook(() => usePayments());

      await act(async () => {
        try {
          await result.current.fetchPaymentMethods();
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Test error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => usePayments());

      await act(async () => {
        try {
          await result.current.fetchPaymentMethods();
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should handle unknown errors', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error');

      const { result } = renderHook(() => usePayments());

      await act(async () => {
        try {
          await result.current.fetchPaymentMethods();
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Unknown error');
    });
  });
});