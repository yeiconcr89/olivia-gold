import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { paymentsRouter } from '../../routes/payments';
import { prisma, createTestCustomer, createTestProduct, createTestOrder } from '../setup';
import testConfig from '../setup';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/payments', paymentsRouter);

describe('Payment Flow Integration Tests', () => {
  let testCustomer: any;
  let testProduct: any;
  let testOrder: any;

  beforeEach(async () => {
    // Create test data
    testCustomer = await createTestCustomer();
    testProduct = await createTestProduct();
    testOrder = await createTestOrder(testCustomer.id, testProduct.id);
  });

  describe('Complete Card Payment Flow', () => {
    it('should complete successful card payment flow', async () => {
      // Step 1: Get payment methods
      const methodsResponse = await request(app)
        .get('/api/payments/methods')
        .expect(200);

      expect(methodsResponse.body.card.enabled).toBe(true);

      // Step 2: Create payment
      const paymentData = {
        orderId: testOrder.id,
        amount: testConfig.testData.amounts.medium,
        currency: 'COP',
        methodId: 'card',
        customer: {
          email: testCustomer.email,
          name: testCustomer.name,
          phone: testCustomer.phone,
          documentType: testCustomer.documentType,
          documentNumber: testCustomer.documentNumber,
        },
        card: {
          number: testConfig.testData.cards.visa.approved,
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
          cardholderName: 'JUAN PEREZ',
          installments: 1,
        },
      };

      const paymentResponse = await request(app)
        .post('/api/payments/create')
        .send(paymentData)
        .expect(200);

      expect(paymentResponse.body.success).toBe(true);
      const transactionId = paymentResponse.body.data.transactionId;

      // Step 3: Verify payment
      const verifyResponse = await request(app)
        .get(`/api/payments/${transactionId}/verify`)
        .expect(200);

      expect(verifyResponse.body.status).toBe('approved');

      // Step 4: Check database state
      const savedPayment = await prisma.paymentTransaction.findFirst({
        where: { id: transactionId },
      });

      expect(savedPayment).toBeDefined();
      expect(savedPayment?.status).toBe('APPROVED');
      expect(savedPayment?.amount).toBe(paymentData.amount);

      // Step 5: Check order status
      const updatedOrder = await prisma.order.findUnique({
        where: { id: testOrder.id },
      });

      expect(updatedOrder?.status).toBe('PAID');
    });

    it('should handle declined card payment flow', async () => {
      const paymentData = {
        orderId: testOrder.id,
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

      const paymentResponse = await request(app)
        .post('/api/payments/create')
        .send(paymentData)
        .expect(200);

      expect(paymentResponse.body.success).toBe(false);

      // Check failed attempt was logged
      const failedAttempt = await prisma.paymentFailedAttempt.findFirst({
        where: { orderId: testOrder.id },
      });

      expect(failedAttempt).toBeDefined();
      expect(failedAttempt?.reason).toContain('declined');

      // Order should remain pending
      const order = await prisma.order.findUnique({
        where: { id: testOrder.id },
      });

      expect(order?.status).toBe('PENDING');
    });
  });

  describe('Complete PSE Payment Flow', () => {
    it('should complete PSE payment flow with redirect', async () => {
      // Step 1: Get PSE banks
      const banksResponse = await request(app)
        .get('/api/payments/pse/banks')
        .expect(200);

      expect(banksResponse.body.banks.length).toBeGreaterThan(0);
      const bankId = banksResponse.body.banks[0].id;

      // Step 2: Create PSE payment
      const pseData = {
        orderId: testOrder.id,
        amount: testConfig.testData.amounts.medium,
        currency: 'COP',
        customer: testConfig.testData.customer,
        pse: {
          bankId,
        },
      };

      const paymentResponse = await request(app)
        .post('/api/payments/pse/create')
        .send(pseData)
        .expect(200);

      expect(paymentResponse.body.success).toBe(true);
      expect(paymentResponse.body.data.redirectUrl).toBeDefined();
      expect(paymentResponse.body.data.status).toBe('pending');

      const transactionId = paymentResponse.body.data.transactionId;

      // Step 3: Simulate webhook notification (PSE approval)
      const webhookPayload = {
        event: 'payment.approved',
        data: {
          transactionId,
          status: 'approved',
          amount: pseData.amount,
        },
        timestamp: new Date().toISOString(),
      };

      await request(app)
        .post('/api/payments/webhook/wompi')
        .send(webhookPayload)
        .set('X-Wompi-Signature', 'valid_signature')
        .expect(200);

      // Step 4: Verify payment status updated
      const verifyResponse = await request(app)
        .get(`/api/payments/${transactionId}/verify`)
        .expect(200);

      expect(verifyResponse.body.status).toBe('approved');

      // Step 5: Check database state
      const savedPayment = await prisma.paymentTransaction.findFirst({
        where: { id: transactionId },
      });

      expect(savedPayment?.status).toBe('APPROVED');

      const webhookEvent = await prisma.paymentWebhookEvent.findFirst({
        where: { 
          gateway: 'wompi',
          event: 'payment.approved',
        },
      });

      expect(webhookEvent).toBeDefined();
    });
  });

  describe('Payment Refund Flow', () => {
    it('should complete refund flow', async () => {
      // Step 1: Create approved payment
      const payment = await prisma.paymentTransaction.create({
        data: {
          orderId: testOrder.id,
          amount: testConfig.testData.amounts.medium,
          currency: 'COP',
          method: 'card',
          gateway: 'wompi',
          gatewayTransactionId: 'test_transaction_123',
          status: 'APPROVED',
          gatewayResponse: JSON.stringify({ status: 'approved' }),
        },
      });

      // Step 2: Request refund
      const refundData = {
        amount: testConfig.testData.amounts.medium,
        reason: 'Customer request',
      };

      const refundResponse = await request(app)
        .post(`/api/payments/${payment.id}/refund`)
        .send(refundData)
        .expect(200);

      expect(refundResponse.body.success).toBe(true);
      expect(refundResponse.body.data.refundId).toBeDefined();

      // Step 3: Check database state
      const savedRefund = await prisma.paymentRefund.findFirst({
        where: { paymentTransactionId: payment.id },
      });

      expect(savedRefund).toBeDefined();
      expect(savedRefund?.amount).toBe(refundData.amount);
      expect(savedRefund?.reason).toBe(refundData.reason);
      expect(savedRefund?.status).toBe('APPROVED');

      // Step 4: Check payment status updated
      const updatedPayment = await prisma.paymentTransaction.findUnique({
        where: { id: payment.id },
      });

      expect(updatedPayment?.status).toBe('REFUNDED');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle duplicate payment attempts', async () => {
      const paymentData = {
        orderId: testOrder.id,
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

      // First payment
      const firstResponse = await request(app)
        .post('/api/payments/create')
        .send(paymentData)
        .expect(200);

      expect(firstResponse.body.success).toBe(true);

      // Second payment attempt (should be prevented)
      const secondResponse = await request(app)
        .post('/api/payments/create')
        .send(paymentData)
        .expect(400);

      expect(secondResponse.body.success).toBe(false);
      expect(secondResponse.body.message).toContain('already has a payment');
    });

    it('should handle invalid order IDs', async () => {
      const paymentData = {
        orderId: 'non-existent-order',
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

      const response = await request(app)
        .post('/api/payments/create')
        .send(paymentData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Order not found');
    });

    it('should handle amount validation', async () => {
      const paymentData = {
        orderId: testOrder.id,
        amount: 500, // Below minimum
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

      const response = await request(app)
        .post('/api/payments/create')
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('minimum');
    });
  });

  describe('Gateway Health and Monitoring', () => {
    it('should report gateway health status', async () => {
      const response = await request(app)
        .get('/api/payments/health')
        .expect(200);

      expect(response.body.wompi).toBeDefined();
      expect(response.body.wompi.status).toBeDefined();
      expect(response.body.wompi.responseTime).toBeDefined();
    });
  });
});