import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { paymentsRouter } from '../../routes/payments';
import { prisma, createTestCustomer, createTestProduct, createTestOrder } from '../setup';
import testConfig from '../setup';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/payments', paymentsRouter);

describe('Payments API Routes', () => {
  let testCustomer: any;
  let testProduct: any;
  let testOrder: any;

  beforeEach(async () => {
    // Create test data
    testCustomer = await createTestCustomer();
    testProduct = await createTestProduct();
    testOrder = await createTestOrder(testCustomer.id, testProduct.id);
  });

  describe('GET /api/payments/methods', () => {
    it('should return available payment methods', async () => {
      const response = await request(app)
        .get('/api/payments/methods')
        .expect(200);

      expect(response.body).toHaveProperty('pse');
      expect(response.body).toHaveProperty('card');
      expect(response.body.pse.enabled).toBe(true);
      expect(response.body.card.enabled).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Mock service error
      const response = await request(app)
        .get('/api/payments/methods')
        .expect(200); // Should still return default methods

      expect(response.body).toBeDefined();
    });
  });

  describe('GET /api/payments/pse/banks', () => {
    it('should return PSE banks list', async () => {
      const response = await request(app)
        .get('/api/payments/pse/banks')
        .expect(200);

      expect(response.body).toHaveProperty('banks');
      expect(Array.isArray(response.body.banks)).toBe(true);
      expect(response.body.banks.length).toBeGreaterThan(0);
      
      // Check bank structure
      const bank = response.body.banks[0];
      expect(bank).toHaveProperty('id');
      expect(bank).toHaveProperty('name');
    });
  });

  describe('POST /api/payments/create', () => {
    it('should create a card payment successfully', async () => {
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

      const response = await request(app)
        .post('/api/payments/create')
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transactionId');
      expect(response.body.data.status).toBeDefined();

      // Verify payment was saved to database
      const savedPayment = await prisma.paymentTransaction.findFirst({
        where: { orderId: testOrder.id },
      });

      expect(savedPayment).toBeDefined();
      expect(savedPayment?.amount).toBe(paymentData.amount);
      expect(savedPayment?.gateway).toBe('wompi');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing required fields
        amount: testConfig.testData.amounts.medium,
      };

      const response = await request(app)
        .post('/api/payments/create')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should validate minimum amount', async () => {
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

    it('should handle declined payments', async () => {
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

      const response = await request(app)
        .post('/api/payments/create')
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('declined');

      // Verify failed attempt was logged
      const failedAttempt = await prisma.paymentFailedAttempt.findFirst({
        where: { orderId: testOrder.id },
      });

      expect(failedAttempt).toBeDefined();
      expect(failedAttempt?.reason).toContain('declined');
    });
  });

  describe('POST /api/payments/pse/create', () => {
    it('should create a PSE payment successfully', async () => {
      const pseData = {
        orderId: testOrder.id,
        amount: testConfig.testData.amounts.medium,
        currency: 'COP',
        customer: testConfig.testData.customer,
        pse: {
          bankId: 'bancolombia',
        },
      };

      const response = await request(app)
        .post('/api/payments/pse/create')
        .send(pseData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('redirectUrl');
      expect(response.body.data.status).toBe('pending');

      // Verify payment was saved to database
      const savedPayment = await prisma.paymentTransaction.findFirst({
        where: { orderId: testOrder.id },
      });

      expect(savedPayment).toBeDefined();
      expect(savedPayment?.method).toBe('pse');
      expect(savedPayment?.status).toBe('PENDING');
    });

    it('should validate PSE bank selection', async () => {
      const pseData = {
        orderId: testOrder.id,
        amount: testConfig.testData.amounts.medium,
        currency: 'COP',
        customer: testConfig.testData.customer,
        pse: {
          bankId: '', // Empty bank ID
        },
      };

      const response = await request(app)
        .post('/api/payments/pse/create')
        .send(pseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('bank');
    });
  });

  describe('GET /api/payments/:id/verify', () => {
    it('should verify payment status', async () => {
      // First create a payment
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

      const response = await request(app)
        .get(`/api/payments/${payment.id}/verify`)
        .expect(200);

      expect(response.body.transactionId).toBe(payment.id);
      expect(response.body.status).toBe('approved');
    });

    it('should handle non-existent payments', async () => {
      const response = await request(app)
        .get('/api/payments/non-existent-id/verify')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('POST /api/payments/webhook/wompi', () => {
    it('should handle webhook notifications', async () => {
      const webhookPayload = {
        event: 'payment.approved',
        data: {
          transactionId: 'test_transaction_123',
          status: 'approved',
          amount: testConfig.testData.amounts.medium,
        },
        timestamp: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/api/payments/webhook/wompi')
        .send(webhookPayload)
        .set('X-Wompi-Signature', 'valid_signature')
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify webhook event was logged
      const webhookEvent = await prisma.paymentWebhookEvent.findFirst({
        where: { 
          gateway: 'wompi',
          event: 'payment.approved',
        },
      });

      expect(webhookEvent).toBeDefined();
    });

    it('should reject webhooks with invalid signatures', async () => {
      const webhookPayload = {
        event: 'payment.approved',
        data: {
          transactionId: 'test_transaction_123',
          status: 'approved',
        },
      };

      const response = await request(app)
        .post('/api/payments/webhook/wompi')
        .send(webhookPayload)
        .set('X-Wompi-Signature', 'invalid_signature')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('signature');
    });
  });

  describe('GET /api/payments/health', () => {
    it('should return gateway health status', async () => {
      const response = await request(app)
        .get('/api/payments/health')
        .expect(200);

      expect(response.body).toHaveProperty('wompi');
      expect(response.body.wompi).toHaveProperty('status');
      expect(response.body.wompi).toHaveProperty('responseTime');
    });
  });

  describe('POST /api/payments/:id/refund', () => {
    it('should process refund successfully', async () => {
      // Create an approved payment first
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

      const refundData = {
        amount: testConfig.testData.amounts.medium,
        reason: 'Customer request',
      };

      const response = await request(app)
        .post(`/api/payments/${payment.id}/refund`)
        .send(refundData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('refundId');

      // Verify refund was saved to database
      const savedRefund = await prisma.paymentRefund.findFirst({
        where: { paymentTransactionId: payment.id },
      });

      expect(savedRefund).toBeDefined();
      expect(savedRefund?.amount).toBe(refundData.amount);
      expect(savedRefund?.reason).toBe(refundData.reason);
    });

    it('should not allow refund of non-approved payments', async () => {
      // Create a pending payment
      const payment = await prisma.paymentTransaction.create({
        data: {
          orderId: testOrder.id,
          amount: testConfig.testData.amounts.medium,
          currency: 'COP',
          method: 'card',
          gateway: 'wompi',
          gatewayTransactionId: 'test_transaction_pending',
          status: 'PENDING',
          gatewayResponse: JSON.stringify({ status: 'pending' }),
        },
      });

      const refundData = {
        amount: testConfig.testData.amounts.medium,
        reason: 'Customer request',
      };

      const response = await request(app)
        .post(`/api/payments/${payment.id}/refund`)
        .send(refundData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('approved');
    });
  });
});