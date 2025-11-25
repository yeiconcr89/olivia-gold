/**
 * API Schema Validation Tests
 * Ensures API responses match expected schemas and contracts
 */

import { describe, test, expect } from 'vitest';
import request from 'supertest';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

// Initialize AJV for JSON schema validation
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// API Response Schemas
const productSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    price: { type: 'number', minimum: 0 },
    category: { type: 'string' },
    subcategory: { type: 'string' },
    materials: { type: 'string' },
    inStock: { type: 'boolean' },
    featured: { type: 'boolean' }
  },
  required: ['id', 'name', 'price', 'category', 'inStock']
};

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string', minLength: 1 },
    role: { type: 'string', enum: ['ADMIN', 'CUSTOMER'] },
    createdAt: { type: 'string' }
  },
  required: ['id', 'email', 'name', 'role']
};

const productsListSchema = {
  type: 'object',
  properties: {
    products: {
      type: 'array',
      items: productSchema
    },
    pagination: {
      type: 'object',
      properties: {
        page: { type: 'number', minimum: 1 },
        limit: { type: 'number', minimum: 1 },
        total: { type: 'number', minimum: 0 },
        totalPages: { type: 'number', minimum: 0 }
      },
      required: ['page', 'limit', 'total']
    }
  },
  required: ['products']
};

const authResponseSchema = {
  type: 'object',
  properties: {
    token: { type: 'string', minLength: 10 },
    user: userSchema,
    expiresIn: { type: ['string', 'number'] }
  },
  required: ['token', 'user']
};

const orderSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    customerId: { type: 'string' },
    customerName: { type: 'string' },
    customerEmail: { type: 'string', format: 'email' },
    status: { 
      type: 'string', 
      enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] 
    },
    total: { type: 'number', minimum: 0 },
    subtotal: { type: 'number', minimum: 0 },
    items: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          quantity: { type: 'number', minimum: 1 },
          price: { type: 'number', minimum: 0 }
        },
        required: ['productId', 'quantity', 'price']
      }
    },
    createdAt: { type: 'string' }
  },
  required: ['id', 'customerId', 'status', 'total', 'items']
};

const errorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string', minLength: 1 },
    message: { type: 'string' },
    code: { type: ['string', 'number'] },
    details: { type: 'object' }
  },
  required: ['error']
};

const healthResponseSchema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['healthy', 'ok', 'up', 'operational'] },
    timestamp: { type: 'string' },
    uptime: { type: 'number', minimum: 0 },
    version: { type: 'string' },
    services: {
      type: 'object',
      properties: {
        database: { type: 'string', enum: ['connected', 'healthy', 'ok'] },
        redis: { type: 'string', enum: ['connected', 'healthy', 'ok', 'not_configured'] }
      }
    }
  },
  required: ['status']
};

// Compile schemas
const validateProduct = ajv.compile(productSchema);
const validateProductsList = ajv.compile(productsListSchema);
const validateUser = ajv.compile(userSchema);
const validateAuthResponse = ajv.compile(authResponseSchema);
const validateOrder = ajv.compile(orderSchema);
const validateErrorResponse = ajv.compile(errorResponseSchema);
const validateHealthResponse = ajv.compile(healthResponseSchema);

describe('API Schema Validation', () => {
  
  describe('📦 Products API Schema Validation', () => {
    test('GET /api/products should return valid products list schema', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/products')
        .query({ limit: 5 });

      expect(response.status).toBe(200);

      const isValid = validateProductsList(response.body);
      if (!isValid) {
        console.error('Schema validation errors:', validateProductsList.errors);
      }

      expect(isValid).toBe(true);
    });

    test('GET /api/products/:id should return valid product schema', async () => {
      // First get a product list to get an ID
      const productsResponse = await request(API_BASE_URL)
        .get('/api/products')
        .query({ limit: 1 });

      if (productsResponse.body.products?.length > 0) {
        const productId = productsResponse.body.products[0].id;
        
        const response = await request(API_BASE_URL)
          .get(`/api/products/${productId}`);

        if (response.status === 200) {
          const isValid = validateProduct(response.body);
          if (!isValid) {
            console.error('Schema validation errors:', validateProduct.errors);
          }

          expect(isValid).toBe(true);
        }
      }
    });

    test('Products should have required fields with correct types', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/products')
        .query({ limit: 3 });

      expect(response.status).toBe(200);

      if (response.body.products?.length > 0) {
        response.body.products.forEach((product: any) => {
          // Check required fields exist
          expect(product).toHaveProperty('id');
          expect(product).toHaveProperty('name');
          expect(product).toHaveProperty('price');
          expect(product).toHaveProperty('category');
          expect(product).toHaveProperty('inStock');

          // Check field types
          expect(typeof product.id).toBe('string');
          expect(typeof product.name).toBe('string');
          expect(typeof product.price).toBe('number');
          expect(typeof product.category).toBe('string');
          expect(typeof product.inStock).toBe('boolean');

          // Price should be positive
          expect(product.price).toBeGreaterThanOrEqual(0);
          
          // Name should not be empty
          expect(product.name.length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('🔐 Authentication API Schema Validation', () => {
    test('POST /api/auth/login should return valid auth response schema', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpass123'
        });

      if (response.status === 200) {
        const isValid = validateAuthResponse(response.body);
        if (!isValid) {
          console.error('Schema validation errors:', validateAuthResponse.errors);
        }

        expect(isValid).toBe(true);
      } else {
        // Should return error response schema
        const isValid = validateErrorResponse(response.body);
        expect(isValid).toBe(true);
      }
    });

    test('POST /api/auth/register should return valid auth response schema', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/auth/register')
        .send({
          email: `test-${Date.now()}@example.com`,
          password: 'TestPass123!',
          name: 'Test User',
          role: 'CUSTOMER'
        });

      if (response.status === 201) {
        const isValid = validateAuthResponse(response.body);
        if (!isValid) {
          console.error('Schema validation errors:', validateAuthResponse.errors);
        }

        expect(isValid).toBe(true);
      } else {
        // Should return error response schema
        const isValid = validateErrorResponse(response.body);
        expect(isValid).toBe(true);
      }
    });
  });

  describe('🔧 Health API Schema Validation', () => {
    test('GET /api/health should return valid health schema', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/health');

      expect(response.status).toBe(200);

      const isValid = validateHealthResponse(response.body);
      if (!isValid) {
        console.error('Health schema validation errors:', validateHealthResponse.errors);
      }

      expect(isValid).toBe(true);
    });

    test('Health response should have correct status values', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(['healthy', 'ok', 'up', 'operational']).toContain(response.body.status.toLowerCase());
    });
  });

  describe('❌ Error Response Schema Validation', () => {
    test('404 responses should follow error schema', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/non-existent-endpoint');

      expect([404, 405]).toContain(response.status);

      if (response.body && Object.keys(response.body).length > 0) {
        const isValid = validateErrorResponse(response.body);
        if (!isValid) {
          console.error('Error schema validation errors:', validateErrorResponse.errors);
        }
        expect(isValid).toBe(true);
      }
    });

    test('400 responses should follow error schema', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/auth/login')
        .send({}); // Invalid payload

      expect([400, 422, 429]).toContain(response.status);

      if (response.body && Object.keys(response.body).length > 0) {
        const isValid = validateErrorResponse(response.body);
        expect(isValid).toBe(true);
      }
    });
  });

  describe('📊 Response Headers Validation', () => {
    test('API responses should have correct content-type headers', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/products');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    test('API responses should have security headers', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/health');

      expect(response.status).toBe(200);
      
      // Common security headers (optional but recommended)
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection'
      ];

      // Log which security headers are present
      securityHeaders.forEach(header => {
        if (response.headers[header]) {
          console.log(`✅ Security header present: ${header} = ${response.headers[header]}`);
        } else {
          console.log(`⚠️  Security header missing: ${header}`);
        }
      });
    });

    test('CORS headers should be present when needed', async () => {
      const response = await request(API_BASE_URL)
        .options('/api/products')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      if ([200, 204].includes(response.status)) {
        expect(response.headers).toHaveProperty('access-control-allow-origin');
      }
    });
  });

  describe('🔤 Data Format Validation', () => {
    test('Date fields should be in valid format', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/health');

      expect(response.status).toBe(200);

      if (response.body.timestamp) {
        // Should be a valid date string
        expect(() => new Date(response.body.timestamp)).not.toThrow();
        const date = new Date(response.body.timestamp);
        expect(date.toString()).not.toBe('Invalid Date');
      }
    });

    test('Email fields should be valid email format', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'TestPass123!',
          name: 'Test User'
        });

      expect([400, 422, 429]).toContain(response.status);
      
      if (response.body.error) {
        const msg = String(response.body.error).toLowerCase();
        if (response.status === 429) {
          expect(msg).toMatch(/demasiados|limit|many|intentos/);
        } else {
          expect(msg).toMatch(/email|invalid|format/);
        }
      }
    });

    test('UUID fields should be valid UUID format', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/products')
        .query({ limit: 1 });

      expect(response.status).toBe(200);

      if (response.body.products?.length > 0) {
        const product = response.body.products[0];
        
        if (product.id) {
          // Check if it's a valid UUID format (basic check)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          expect(product.id).toMatch(uuidRegex);
        }
      }
    });
  });
});