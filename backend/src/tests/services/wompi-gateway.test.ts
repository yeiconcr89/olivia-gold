import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WompiGatewayService } from '../../services/payment/wompi-gateway.service';
import testConfig from '../setup';

// Mock fetch for API calls
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('WompiGatewayService', () => {
  let wompiService: WompiGatewayService;

  beforeEach(() => {
    wompiService = new WompiGatewayService();
    mockFetch.mockClear();
  });

  describe('Payment Methods', () => {
    it('should fetch available payment methods', async () => {
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => testConfig.mocks.wompi.paymentMethods,
      } as Response);

      const methods = await wompiService.getPaymentMethods();

      expect(methods).toEqual(testConfig.mocks.wompi.paymentMethods);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/payment-methods'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
          }),
        })
      );
    });

    it('should handle API errors when fetching payment methods', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' }),
      } as Response);

      await expect(wompiService.getPaymentMethods()).rejects.toThrow();
    });
  });

  describe('PSE Banks', () => {
    it('should fetch PSE banks list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ banks: testConfig.mocks.wompi.pseBanks }),
      } as Response);

      const banks = await wompiService.getPSEBanks();

      expect(banks).toEqual(testConfig.mocks.wompi.pseBanks);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/pse/banks'),
        expect.any(Object)
      );
    });
  });

  describe('Card Payments', () => {
    it('should create a successful card payment', async () => {
      const paymentRequest = {
        orderId: 'test-order-123',
        amount: testConfig.testData.amounts.medium,
        currency: 'COP' as const,
        customer: {
          email: testConfig.testData.customer.email,
          name: testConfig.testData.customer.name,
          phone: testConfig.testData.customer.phone,
          document: {
            type: 'CC' as const,
            number: '12345678',
          },
        },
        method: {
          id: 'card',
          name: 'Tarjeta de Crédito',
          type: 'CARD' as const,
          icon: 'card-icon',
          description: 'Pago con tarjeta',
          enabled: true,
          processingTime: 'Inmediato',
          fees: { percentage: 0.029, fixed: 0 }
        },
        returnUrl: 'https://test.com/success',
        cancelUrl: 'https://test.com/cancel',
        notificationUrl: 'https://test.com/webhook',
        description: 'Test payment',
        reference: 'test-ref-123',
        card: {
          number: testConfig.testData.cards.visa.approved,
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
          cardholderName: 'JUAN PEREZ',
          installments: 1,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => testConfig.mocks.wompi.successResponse,
      } as Response);

      const result = await wompiService.createPayment(paymentRequest);

      expect(result.success).toBe(true);
      expect(result.status).toBe('APPROVED');
      expect(result.transactionId).toBeDefined();
    });

    it('should handle declined card payment', async () => {
      const paymentRequest = {
        orderId: 'test-order-123',
        amount: testConfig.testData.amounts.medium,
        currency: 'COP' as const,
        customer: {
          email: testConfig.testData.customer.email,
          name: testConfig.testData.customer.name,
          phone: testConfig.testData.customer.phone,
          document: {
            type: 'CC' as const,
            number: '12345678',
          },
        },
        method: {
          id: 'card',
          name: 'Tarjeta de Crédito',
          type: 'CARD' as const,
          icon: 'card-icon',
          description: 'Pago con tarjeta',
          enabled: true,
          processingTime: 'Inmediato',
          fees: { percentage: 0.029, fixed: 0 }
        },
        returnUrl: 'https://test.com/success',
        cancelUrl: 'https://test.com/cancel',
        notificationUrl: 'https://test.com/webhook',
        description: 'Test payment',
        reference: 'test-ref-123',
        card: {
          number: testConfig.testData.cards.visa.declined,
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
          cardholderName: 'JUAN PEREZ',
          installments: 1,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => testConfig.mocks.wompi.errorResponse,
      } as Response);

      const result = await wompiService.createPayment(paymentRequest);

      expect(result.success).toBe(false);
      expect(result.status).toBe('DECLINED');
    });

    it('should validate minimum amount', async () => {
      const paymentRequest = {
        orderId: 'test-order-123',
        amount: 500, // Below minimum
        currency: 'COP' as const,
        customer: {
          email: testConfig.testData.customer.email,
          name: testConfig.testData.customer.name,
          phone: testConfig.testData.customer.phone,
          document: {
            type: 'CC' as const,
            number: '12345678',
          },
        },
        method: {
          id: 'card',
          name: 'Tarjeta de Crédito',
          type: 'CARD' as const,
          icon: 'card-icon',
          description: 'Pago con tarjeta',
          enabled: true,
          processingTime: 'Inmediato',
          fees: { percentage: 0.029, fixed: 0 }
        },
        returnUrl: 'https://test.com/success',
        cancelUrl: 'https://test.com/cancel',
        notificationUrl: 'https://test.com/webhook',
        description: 'Test payment',
        reference: 'test-ref-123',
        card: {
          number: testConfig.testData.cards.visa.approved,
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
          cardholderName: 'JUAN PEREZ',
          installments: 1,
        },
      };

      await expect(wompiService.createPayment(paymentRequest)).rejects.toThrow(
        'Amount must be at least 1000 COP'
      );
    });
  });

  describe('PSE Payments', () => {
    it('should create a PSE payment with redirect', async () => {
      const pseRequest = {
        orderId: 'test-order-123',
        amount: testConfig.testData.amounts.medium,
        currency: 'COP' as const,
        customer: {
          email: testConfig.testData.customer.email,
          name: testConfig.testData.customer.name,
          phone: testConfig.testData.customer.phone,
          document: {
            type: 'CC' as const,
            number: '12345678',
          },
        },
        method: {
          id: 'pse',
          name: 'PSE',
          type: 'PSE' as const,
          icon: 'pse-icon',
          description: 'Pago por PSE',
          enabled: true,
          processingTime: 'Inmediato',
          fees: { percentage: 0.019, fixed: 0 }
        },
        returnUrl: 'https://test.com/success',
        cancelUrl: 'https://test.com/cancel',
        notificationUrl: 'https://test.com/webhook',
        description: 'Test payment',
        reference: 'test-ref-123',
        pse: {
          bankId: 'bancolombia',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => testConfig.mocks.wompi.pendingResponse,
      } as Response);

      const result = await wompiService.createPayment(pseRequest);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('pending');
      expect(result.data?.redirectUrl).toBeDefined();
    });

    it('should validate PSE bank selection', async () => {
      const pseRequest = {
        orderId: 'test-order-123',
        amount: testConfig.testData.amounts.medium,
        currency: 'COP',
        customer: testConfig.testData.customer,
        pse: {
          bankId: '', // Empty bank ID
        },
      };

      await expect(wompiService.createPayment(pseRequest)).rejects.toThrow(
        'Bank ID is required for PSE payments'
      );
    });
  });

  describe('Payment Verification', () => {
    it('should verify payment status', async () => {
      const transactionId = 'test_transaction_123';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          transactionId,
          status: 'approved',
          amount: testConfig.testData.amounts.medium,
          currency: 'COP',
        }),
      } as Response);

      const result = await wompiService.verifyPayment(transactionId);

      expect(result.transactionId).toBe(transactionId);
      expect(result.status).toBe('approved');
    });

    it('should handle verification errors', async () => {
      const transactionId = 'invalid_transaction';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Transaction not found' }),
      } as Response);

      await expect(wompiService.verifyPayment(transactionId)).rejects.toThrow();
    });
  });

  describe('Webhook Handling', () => {
    it('should validate webhook signature', async () => {
      const payload = {
        event: 'payment.approved',
        data: {
          transactionId: 'test_transaction_123',
          status: 'approved',
        },
      };

      const signature = 'valid_signature_hash';

      // Mock crypto validation (in real implementation, this would use actual crypto)
      const result = await wompiService.handleWebhook(payload, signature);

      expect(result).toBeDefined();
      expect(result.event).toBe('payment.approved');
    });

    it('should reject invalid webhook signatures', async () => {
      const payload = {
        event: 'payment.approved',
        data: {
          transactionId: 'test_transaction_123',
          status: 'approved',
        },
      };

      const invalidSignature = 'invalid_signature';

      await expect(
        wompiService.handleWebhook(payload, invalidSignature)
      ).rejects.toThrow('Invalid webhook signature');
    });
  });

  describe('Refunds', () => {
    it('should process refund successfully', async () => {
      const refundRequest = {
        transactionId: 'test_transaction_123',
        amount: testConfig.testData.amounts.medium,
        reason: 'Customer request',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          refundId: 'refund_123',
          status: 'approved',
          amount: refundRequest.amount,
        }),
      } as Response);

      const result = await wompiService.refundPayment(refundRequest);

      expect(result.success).toBe(true);
      expect(result.refundId).toBe('refund_123');
    });

    it('should handle refund failures', async () => {
      const refundRequest = {
        transactionId: 'test_transaction_123',
        amount: testConfig.testData.amounts.medium,
        reason: 'Customer request',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Refund not allowed' }),
      } as Response);

      await expect(wompiService.refundPayment(refundRequest)).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(wompiService.getPaymentMethods()).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), testConfig.timeouts.api + 1000)
        )
      );

      await expect(wompiService.getPaymentMethods()).rejects.toThrow();
    });
  });
});