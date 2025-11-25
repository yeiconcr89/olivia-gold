#!/usr/bin/env node

/**
 * Payment System Testing Script
 * 
 * This script tests the complete payment system with real Wompi sandbox API
 * Run with: node scripts/test-payments.js
 */

const fetch = require('node-fetch');
const crypto = require('crypto');

// Wompi Sandbox Configuration
const WOMPI_CONFIG = {
  publicKey: 'pub_test_G4GCnfxXKYvkzDat2lHwXNe4jdGjOeKz',
  privateKey: 'prv_test_QhKnfxXKYvkzDat2lHwXNe4jdGjOeKz',
  baseUrl: 'https://sandbox.wompi.co/v1',
  webhookSecret: 'test_webhook_secret_123',
};

// Test Data
const TEST_DATA = {
  cards: {
    visa: {
      approved: '4242424242424242',
      declined: '4000000000000002',
      insufficient: '4000000000009995',
    },
    mastercard: {
      approved: '5555555555554444',
      declined: '5000000000000009',
    },
  },
  customer: {
    email: 'test@oliviagold.com',
    name: 'Juan Pérez',
    phone: '+573001234567',
    documentType: 'CC',
    documentNumber: '12345678',
  },
  amounts: {
    small: 50000,
    medium: 250000,
    large: 1000000,
  },
};

class PaymentTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: [],
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Payment System Tests\n');
    console.log('=' .repeat(50));

    try {
      // Test 1: Payment Methods
      await this.testPaymentMethods();

      // Test 2: PSE Banks
      await this.testPSEBanks();

      // Test 3: Card Payment - Approved
      await this.testCardPaymentApproved();

      // Test 4: Card Payment - Declined
      await this.testCardPaymentDeclined();

      // Test 5: PSE Payment
      await this.testPSEPayment();

      // Test 6: Payment Verification
      await this.testPaymentVerification();

      // Test 7: Webhook Handling
      await this.testWebhookHandling();

      // Test 8: Gateway Health
      await this.testGatewayHealth();

      // Test 9: Error Handling
      await this.testErrorHandling();

      // Test 10: Security Validation
      await this.testSecurityValidation();

    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    }

    this.printResults();
  }

  async testPaymentMethods() {
    console.log('📋 Testing Payment Methods...');
    
    try {
      const response = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/payments/methods`);
      const data = await response.json();

      this.assert(response.ok, 'Payment methods API should respond successfully');
      this.assert(data.pse, 'PSE should be available');
      this.assert(data.card, 'Card payments should be available');
      this.assert(data.pse.enabled, 'PSE should be enabled');
      this.assert(data.card.enabled, 'Card payments should be enabled');

      this.logSuccess('Payment methods test passed');
    } catch (error) {
      this.logError('Payment methods test failed', error);
    }
  }

  async testPSEBanks() {
    console.log('🏦 Testing PSE Banks...');
    
    try {
      const response = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/payments/pse/banks`);
      const data = await response.json();

      this.assert(response.ok, 'PSE banks API should respond successfully');
      this.assert(Array.isArray(data.banks), 'Banks should be an array');
      this.assert(data.banks.length > 0, 'Should have at least one bank');
      
      const bank = data.banks[0];
      this.assert(bank.id, 'Bank should have ID');
      this.assert(bank.name, 'Bank should have name');

      this.logSuccess('PSE banks test passed');
    } catch (error) {
      this.logError('PSE banks test failed', error);
    }
  }

  async testCardPaymentApproved() {
    console.log('💳 Testing Card Payment (Approved)...');
    
    try {
      const paymentData = {
        orderId: `test-order-${Date.now()}`,
        amount: TEST_DATA.amounts.medium,
        currency: 'COP',
        methodId: 'card',
        customer: TEST_DATA.customer,
        card: {
          number: TEST_DATA.cards.visa.approved,
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
          cardholderName: 'JUAN PEREZ',
          installments: 1,
        },
      };

      const response = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      this.assert(response.ok, 'Card payment API should respond successfully');
      this.assert(data.success, 'Payment should be successful');
      this.assert(data.data.transactionId, 'Should return transaction ID');
      this.assert(data.data.status === 'approved' || data.data.status === 'pending', 'Status should be approved or pending');

      this.logSuccess('Card payment (approved) test passed');
      return data.data.transactionId;
    } catch (error) {
      this.logError('Card payment (approved) test failed', error);
      return null;
    }
  }

  async testCardPaymentDeclined() {
    console.log('❌ Testing Card Payment (Declined)...');
    
    try {
      const paymentData = {
        orderId: `test-order-declined-${Date.now()}`,
        amount: TEST_DATA.amounts.medium,
        currency: 'COP',
        methodId: 'card',
        customer: TEST_DATA.customer,
        card: {
          number: TEST_DATA.cards.visa.declined,
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
          cardholderName: 'JUAN PEREZ',
          installments: 1,
        },
      };

      const response = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      this.assert(response.ok, 'API should respond even for declined payments');
      this.assert(!data.success, 'Payment should be unsuccessful');
      this.assert(data.message, 'Should return error message');

      this.logSuccess('Card payment (declined) test passed');
    } catch (error) {
      this.logError('Card payment (declined) test failed', error);
    }
  }

  async testPSEPayment() {
    console.log('🏛️ Testing PSE Payment...');
    
    try {
      const paymentData = {
        orderId: `test-pse-order-${Date.now()}`,
        amount: TEST_DATA.amounts.medium,
        currency: 'COP',
        customer: TEST_DATA.customer,
        pse: {
          bankId: 'bancolombia',
        },
      };

      const response = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/payments/pse/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      this.assert(response.ok, 'PSE payment API should respond successfully');
      this.assert(data.success, 'PSE payment should be successful');
      this.assert(data.data.redirectUrl, 'Should return redirect URL');
      this.assert(data.data.status === 'pending', 'PSE status should be pending');

      this.logSuccess('PSE payment test passed');
      return data.data.transactionId;
    } catch (error) {
      this.logError('PSE payment test failed', error);
      return null;
    }
  }

  async testPaymentVerification() {
    console.log('🔍 Testing Payment Verification...');
    
    try {
      // First create a payment to verify
      const transactionId = await this.testCardPaymentApproved();
      
      if (!transactionId) {
        throw new Error('Could not create payment for verification test');
      }

      // Wait a moment for payment to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/payments/${transactionId}/verify`);
      const data = await response.json();

      this.assert(response.ok, 'Payment verification API should respond successfully');
      this.assert(data.transactionId, 'Should return transaction ID');
      this.assert(data.status, 'Should return payment status');

      this.logSuccess('Payment verification test passed');
    } catch (error) {
      this.logError('Payment verification test failed', error);
    }
  }

  async testWebhookHandling() {
    console.log('🔗 Testing Webhook Handling...');
    
    try {
      const webhookPayload = {
        event: 'payment.approved',
        data: {
          transactionId: `test_webhook_${Date.now()}`,
          status: 'approved',
          amount: TEST_DATA.amounts.medium,
        },
        timestamp: new Date().toISOString(),
      };

      // Create signature
      const signature = crypto
        .createHmac('sha256', WOMPI_CONFIG.webhookSecret)
        .update(JSON.stringify(webhookPayload))
        .digest('hex');

      const response = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/payments/webhook/wompi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wompi-Signature': signature,
        },
        body: JSON.stringify(webhookPayload),
      });

      const data = await response.json();

      this.assert(response.ok, 'Webhook API should respond successfully');
      this.assert(data.success, 'Webhook should be processed successfully');

      this.logSuccess('Webhook handling test passed');
    } catch (error) {
      this.logError('Webhook handling test failed', error);
    }
  }

  async testGatewayHealth() {
    console.log('🏥 Testing Gateway Health...');
    
    try {
      const response = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/payments/health`);
      const data = await response.json();

      this.assert(response.ok, 'Health API should respond successfully');
      this.assert(data.wompi, 'Should return Wompi health status');
      this.assert(data.wompi.status, 'Should return status');
      this.assert(typeof data.wompi.responseTime === 'number', 'Should return response time');

      this.logSuccess('Gateway health test passed');
    } catch (error) {
      this.logError('Gateway health test failed', error);
    }
  }

  async testErrorHandling() {
    console.log('⚠️ Testing Error Handling...');
    
    try {
      // Test with invalid data
      const invalidPaymentData = {
        orderId: '', // Invalid
        amount: 500, // Below minimum
        currency: 'USD', // Invalid currency
        methodId: 'invalid_method',
      };

      const response = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPaymentData),
      });

      const data = await response.json();

      this.assert(!response.ok || !data.success, 'Should reject invalid payment data');
      this.assert(data.message, 'Should return error message');

      this.logSuccess('Error handling test passed');
    } catch (error) {
      this.logError('Error handling test failed', error);
    }
  }

  async testSecurityValidation() {
    console.log('🔒 Testing Security Validation...');
    
    try {
      // Test webhook with invalid signature
      const webhookPayload = {
        event: 'payment.approved',
        data: {
          transactionId: 'test_security',
          status: 'approved',
        },
      };

      const response = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/payments/webhook/wompi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wompi-Signature': 'invalid_signature',
        },
        body: JSON.stringify(webhookPayload),
      });

      this.assert(!response.ok, 'Should reject invalid webhook signatures');

      this.logSuccess('Security validation test passed');
    } catch (error) {
      this.logError('Security validation test failed', error);
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  logSuccess(message) {
    console.log(`✅ ${message}`);
    this.results.passed++;
    this.results.tests.push({ status: 'PASSED', message });
  }

  logError(message, error) {
    console.log(`❌ ${message}: ${error.message}`);
    this.results.failed++;
    this.results.tests.push({ status: 'FAILED', message, error: error.message });
  }

  printResults() {
    console.log('\n' + '=' .repeat(50));
    console.log('📊 TEST RESULTS');
    console.log('=' .repeat(50));
    
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Total: ${this.results.passed + this.results.failed}`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`  • ${test.message}: ${test.error}`);
        });
    }

    const successRate = (this.results.passed / (this.results.passed + this.results.failed)) * 100;
    console.log(`\n🎯 Success Rate: ${successRate.toFixed(1)}%`);

    if (successRate >= 80) {
      console.log('🎉 Payment system is ready for production!');
    } else if (successRate >= 60) {
      console.log('⚠️ Payment system needs some fixes before production');
    } else {
      console.log('🚨 Payment system has critical issues that must be fixed');
    }
  }
}

// Run tests
if (require.main === module) {
  const tester = new PaymentTester();
  tester.runAllTests().catch(console.error);
}

module.exports = PaymentTester;