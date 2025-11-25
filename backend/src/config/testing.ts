import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

export const testConfig = {
  // Database
  database: {
    url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/olivia_gold_test',
  },
  
  // Wompi Test Configuration
  wompi: {
    publicKey: process.env.WOMPI_TEST_PUBLIC_KEY || 'pub_test_G4GCnfxXKYvkzDat2lHwXNe4jdGjOeKz',
    privateKey: process.env.WOMPI_TEST_PRIVATE_KEY || 'prv_test_QhKnfxXKYvkzDat2lHwXNe4jdGjOeKz',
    webhookSecret: process.env.WOMPI_TEST_WEBHOOK_SECRET || 'test_webhook_secret_123',
    environment: 'sandbox' as const,
    baseUrl: 'https://sandbox.wompi.co/v1',
  },
  
  // PayU Test Configuration (for future implementation)
  payu: {
    apiKey: process.env.PAYU_TEST_API_KEY || 'test_api_key',
    merchantId: process.env.PAYU_TEST_MERCHANT_ID || 'test_merchant',
    accountId: process.env.PAYU_TEST_ACCOUNT_ID || 'test_account',
    environment: 'sandbox' as const,
  },
  
  // Test Data
  testData: {
    // Valid test card numbers for Wompi (SANDBOX ONLY)
    cards: {
      visa: {
        approved: '4242424242424242',
        declined: '4000000000000002',
        insufficient: '4000000000009995',
        cvv: '123',
        expiry: '12/25'
      },
      mastercard: {
        approved: '5555555555554444',
        declined: '5000000000000009',
        cvv: '123',
        expiry: '12/25'
      },
      amex: {
        approved: '378282246310005',
        declined: '371449635398431',
        cvv: '1234',
        expiry: '12/25'
      },
    },
    
    // Test customer data
    customer: {
      email: 'test@oliviagold.com',
      name: 'Juan Pérez',
      phone: '+573001234567',
      document: {
        type: 'CC' as const,
        number: '12345678',
      },
      address: {
        line1: 'Calle 123 #45-67',
        city: 'Bogotá',
        state: 'Cundinamarca',
        country: 'CO',
        postalCode: '110111',
      },
    },
    
    // Test amounts (in COP)
    amounts: {
      minimum: 1000,
      small: 50000,
      medium: 250000,
      large: 1000000,
      maximum: 20000000,
    },
    
    // PSE Test Banks
    pseBanks: [
      { id: 'bancolombia', name: 'Bancolombia' },
      { id: 'davivienda', name: 'Davivienda' },
      { id: 'banco_bogota', name: 'Banco de Bogotá' },
    ],
  },
  
  // Test timeouts
  timeouts: {
    api: 10000, // 10 seconds
    webhook: 30000, // 30 seconds
    payment: 60000, // 1 minute
  },
  
  // Mock responses
  mocks: {
    wompi: {
      paymentMethods: {
        pse: { enabled: true, name: 'PSE' },
        card: { enabled: true, name: 'Tarjeta' },
        nequi: { enabled: true, name: 'Nequi' },
        cash: { enabled: false, name: 'Efectivo' },
      },
      
      pseBanks: [
        { id: 'bancolombia', name: 'Bancolombia', logo: null },
        { id: 'davivienda', name: 'Davivienda', logo: null },
        { id: 'bbva', name: 'BBVA Colombia', logo: null },
        { id: 'banco_bogota', name: 'Banco de Bogotá', logo: null },
      ],
      
      successResponse: {
        success: true,
        data: {
          transactionId: 'test_transaction_123',
          status: 'approved',
          amount: 100000,
          currency: 'COP',
          gateway: 'wompi',
          createdAt: new Date().toISOString(),
        },
      },
      
      pendingResponse: {
        success: true,
        data: {
          transactionId: 'test_transaction_pending',
          status: 'pending',
          redirectUrl: 'https://sandbox.wompi.co/redirect/test123',
        },
      },
      
      errorResponse: {
        success: false,
        message: 'Payment declined',
        code: 'PAYMENT_DECLINED',
      },
    },
  },
};

export default testConfig;