import { useState, useCallback } from 'react';
import { API_CONFIG, apiRequest, createAuthHeaders } from '../config/api';
import { PaymentMethod } from '../types/payments';

interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  methodId: string;
  [key: string]: unknown;
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
  status: 'pending' | 'approved' | 'rejected' | 'failed';
  message?: string;
}

export const usePayments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available payment methods
  const fetchPaymentMethods = useCallback(async (): Promise<PaymentMethod[]> => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_CONFIG.BASE_URL}/api/payments/methods`;
      const result = await apiRequest<{ success: boolean; data: { methods: PaymentMethod[] } }>(url, {
        method: 'GET',
        timeout: 8000,
      });

      if (!result.success || !result.data?.methods) {
        throw new Error('Error fetching payment methods');
      }

      return result.data.methods;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch PSE banks
  const fetchPSEBanks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_CONFIG.BASE_URL}/api/payments/pse/banks`;
      const result = await apiRequest<{ success: boolean; data?: { banks: Array<{ id: string; name: string }> } }>(url, {
        method: 'GET',
        timeout: 8000,
      });

      return result.data?.banks || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create payment
  const createPayment = useCallback(async (request: PaymentRequest): Promise<PaymentResponse> => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_CONFIG.BASE_URL}/api/payments/create`;
      const result = await apiRequest<PaymentResponse>(url, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify(request),
        timeout: 8000,
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create PSE payment
  const createPSEPayment = useCallback(async (request: PaymentRequest & { bankId: string; userType: string; identificationType: string; identification: string }): Promise<PaymentResponse> => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_CONFIG.BASE_URL}/api/payments/pse/create`;
      const result = await apiRequest<PaymentResponse>(url, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify(request),
        timeout: 8000,
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify payment
  const verifyPayment = useCallback(async (transactionId: string): Promise<PaymentVerification> => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_CONFIG.BASE_URL}/api/payments/${transactionId}/verify`;
      const result = await apiRequest<{ success: boolean; data: PaymentVerification }>(url, {
        method: 'GET',
        timeout: 8000,
      });

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get payment status (admin endpoint)
  const getPaymentStatus = useCallback(async (transactionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_CONFIG.BASE_URL}/api/admin/payments/transaction/${transactionId}`;
      const result = await apiRequest<{ success: boolean; data: { transaction: any } }>(url, {
        method: 'GET',
        headers: createAuthHeaders(),
        timeout: 8000,
      });

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Retry payment (fallback to verify as retry flow is not supported server-side)
  const retryPayment = useCallback(async (transactionId: string): Promise<PaymentResponse> => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_CONFIG.BASE_URL}/api/payments/${transactionId}/verify`;
      const verification = await apiRequest<{ success: boolean; data: PaymentVerification }>(url, {
        method: 'GET',
        timeout: 8000,
      });

      return {
        success: verification.success,
        data: {
          transactionId,
          status: verification.data.status,
        },
        message: verification.success ? 'Verification completed' : 'Verification failed',
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    fetchPaymentMethods,
    fetchPSEBanks,
    createPayment,
    createPSEPayment,
    verifyPayment,
    getPaymentStatus,
    retryPayment,
    clearError,
  };
};

export default usePayments;