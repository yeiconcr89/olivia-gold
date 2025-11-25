import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PaymentRouterService } from '../../services/payment/payment-router.service';
import { WompiGatewayService } from '../../services/payment/wompi-gateway.service';
import testConfig from '../setup';

// Mock the gateway services
jest.mock('../../services/payment/wompi-gateway.service');
const MockWompiGateway = WompiGatewayService as jest.MockedClass<typeof WompiGatewayService>;

describe('PaymentRouterService', () => {
  let paymentRouter: PaymentRouterService;
  let mockWompiGateway: jest.Mocked<WompiGatewayService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock instance
    mockWompiGateway = new MockWompiGateway() as jest.Mocked<WompiGatewayService>;
    
    // Create payment router
    paymentRouter = new PaymentRouterService();
  });

  describe('Gateway Selection', () => {
    it('should select Wompi as primary gateway', async () => {
      const paymentRequest = {
        orderId: 'test-order-123',
        amount: testConfig.testData.amounts.medium,
        currency: 'COP',
        methodId: 'card',
        customer: testConfig.testData.customer,
        card: {
          number: testConfig.testData.cards.visa.approved,
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
          cardholderName: 'JUAN PEREZ',
          installments: 1,
        },
      };

      // Mock successful Wompi response
      mockWompiGateway.createPayment.mockResolvedValueOnce(
        testConfig.mocks.wompi.successResponse
      );

      const result = await paymentRouter.processPayment(paymentRequest);

      expect(result.success).toBe(true);
      expect(result.data?.gateway).toBe('wompi');
      expect(mockWompiGateway.createPayment).toHaveBeenCalledWith(paymentRequest);
    });

    it('should fallback to secondary gateway on primary failure', async () => {
      const paymentRequest = {
        orderId: 'test-order-123',
        amount: testConfig.testData.amounts.medium,
        currency: 'COP',
        methodId: 'card',
        customer: testConfig.testData.customer,
        card: {
          number: testConfig.testData.cards.visa.approved,
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
          cardholderName: 'JUAN PEREZ',
          installments: 1,
        },
      };

      // Mock Wompi failure
      mockWompiGateway.createPayment.mockRejectedValueOnce(
        new Error('Gateway unavailable')
      );

      // Mock PayU success (when implemented)
      // For now, expect the router to handle the failure gracefully
      
      const result = await paymentRouter.processPayment(paymentRequest);

      expect(mockWompiGateway.createPayment).toHaveBeenCalledWith(paymentRequest);
      // Should attempt retry or return appropriate error
      expect(result.success).toBe(false);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed payments with exponential backoff', async () => {
      const paymentRequest = {
        orderId: 'test-order-123',
        amount: testConfig.testData.amounts.medium,
        currency: 'COP',
        methodId: 'card',
        customer: testConfig.testData.customer,
        card: {
          number: testConfig.testData.cards.visa.approved,
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
          cardholderName: 'JUAN PEREZ',
          installments: 1,
        },
      };

      // Mock first two attempts fail, third succeeds
      mockWompiGateway.createPayment
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce(testConfig.mocks.wompi.successResponse);

      const result = await paymentRouter.processPayment(paymentRequest);

      expect(result.success).toBe(true);
      expect(mockWompiGateway.createPayment).toHaveBeenCalledTimes(3);
    });

    it('should stop retrying after max attempts', async () => {
      const paymentRequest = {
        orderId: 'test-order-123',
        amount: testConfig.testData.amounts.medium,
        currency: 'COP',
        methodId: 'card',
        customer: testConfig.testData.customer,
        card: {
          number: testConfig.testData.cards.visa.declined,
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
          cardholderName: 'JUAN PEREZ',
          installments: 1,
        },
      };

      // Mock all attempts fail
      mockWompiGateway.createPayment.mockRejectedValue(
        new Error('Payment declined')
      );

      const result = await paymentRouter.processPayment(paymentRequest);

      expect(result.success).toBe(false);
      expect(mockWompiGateway.createPayment).toHaveBeenCalledTimes(3); // Max retries
    });
  });

  describe('Payment Method Routing', () => {
    it('should route PSE payments correctly', async () => {
      const pseRequest = {
        orderId: 'test-order-123',
        amount: testConfig.testData.amounts.medium,
        currency: 'COP',
        methodId: 'pse',
        customer: testConfig.testData.customer,
        pse: {
          bankId: 'bancolombia',
        },
      };

      mockWompiGateway.createPayment.mockResolvedValueOnce(
        testConfig.mocks.wompi.pendingResponse
      );

      const result = await paymentRouter.processPayment(pseRequest);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('pending');
      expect(mockWompiGateway.createPayment).toHaveBeenCalledWith(pseRequest);
    });

    it('should route card payments correctly', async () => {
      const cardRequest = {
        orderId: 'test-order-123',
        amount: testConfig.testData.amounts.medium,
        currency: 'COP',
        methodId: 'card',
        customer: testConfig.testData.customer,
        card: {
          number: testConfig.testData.cards.visa.approved,
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
          cardholderName: 'JUAN PEREZ',
          installments: 1,
        },
      };

      mockWompiGateway.createPayment.mockResolvedValueOnce(
        testConfig.mocks.wompi.successResponse
      );

      const result = await paymentRouter.processPayment(cardRequest);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('approved');
      expect(mockWompiGateway.createPayment).toHaveBeenCalledWith(cardRequest);
    });
  });

  describe('Health Monitoring', () => {
    it('should check gateway health status', async () => {
      // Mock health check responses
      mockWompiGateway.healthCheck = jest.fn().mockResolvedValueOnce({
        status: 'healthy',
        responseTime: 45,
        lastCheck: new Date().toISOString(),
      });

      const healthStatus = await paymentRouter.getGatewayHealthStatus();

      expect(healthStatus.wompi).toBeDefined();
      expect(healthStatus.wompi.status).toBe('healthy');
      expect(healthStatus.wompi.responseTime).toBe(45);
    });

    it('should handle unhealthy gateways', async () => {
      mockWompiGateway.healthCheck = jest.fn().mockRejectedValueOnce(
        new Error('Gateway timeout')
      );

      const healthStatus = await paymentRouter.getGatewayHealthStatus();

      expect(healthStatus.wompi.status).toBe('unhealthy');
      expect(healthStatus.wompi.error).toBeDefined();
    });
  });

  describe('Load Balancing', () => {
    it('should distribute load based on gateway priority', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        orderId: `test-order-${i}`,
        amount: testConfig.testData.amounts.medium,
        currency: 'COP',
        methodId: 'card',
        customer: testConfig.testData.customer,
        card: {
          number: testConfig.testData.cards.visa.approved,
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
          cardholderName: 'JUAN PEREZ',
          installments: 1,
        },
      }));

      // Mock all requests succeed
      mockWompiGateway.createPayment.mockResolvedValue(
        testConfig.mocks.wompi.successResponse
      );

      const results = await Promise.all(
        requests.map(req => paymentRouter.processPayment(req))
      );

      // All should succeed and use Wompi (primary gateway)
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data?.gateway).toBe('wompi');
      });

      expect(mockWompiGateway.createPayment).toHaveBeenCalledTimes(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid payment methods', async () => {
      const invalidRequest = {
        orderId: 'test-order-123',
        amount: testConfig.testData.amounts.medium,
        currency: 'COP',
        methodId: 'invalid_method',
        customer: testConfig.testData.customer,
      };

      const result = await paymentRouter.processPayment(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid payment method');
    });

    it('should handle insufficient funds', async () => {
      const paymentRequest = {
        orderId: 'test-order-123',
        amount: testConfig.testData.amounts.medium,
        currency: 'COP',
        methodId: 'card',
        customer: testConfig.testData.customer,
        card: {
          number: testConfig.testData.cards.visa.insufficient,
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
          cardholderName: 'JUAN PEREZ',
          installments: 1,
        },
      };

      mockWompiGateway.createPayment.mockResolvedValueOnce({
        success: false,
        message: 'Insufficient funds',
        code: 'INSUFFICIENT_FUNDS',
      });

      const result = await paymentRouter.processPayment(paymentRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Insufficient funds');
      expect(result.code).toBe('INSUFFICIENT_FUNDS');
    });
  });
});