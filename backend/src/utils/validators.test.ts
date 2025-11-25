/**
 * Validators Testing Suite
 * Tests for input validation, sanitization, and business rules
 */

import {
  validateEmail,
  validatePassword,
  validatePhoneNumber,
  validateProductData,
  validateOrderData,
  sanitizeInput,
  validatePaymentData,
  validateSearchQuery,
  validatePagination,
  validateDateRange,
  validateImageUpload,
  validateUserRole,
  validateAddress
} from './validators';

describe('🔍 Validators Testing Suite', () => {

  describe('📧 Email Validation', () => {
    test('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co',
        'user+tag@example.org',
        'user.name@sub.domain.com',
        'user123@test-domain.com',
        'a@b.co'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    test('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        'invalid-email',
        '@example.com',
        'user@',
        'user@@domain.com',
        'user@domain',
        'user name@domain.com',
        'user@domain..com',
        'user@.com',
        '.user@domain.com'
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    test('should handle edge cases', () => {
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
      expect(validateEmail(123 as any)).toBe(false);
      expect(validateEmail({}  as any)).toBe(false);
    });
  });

  describe('🔐 Password Validation', () => {
    test('should accept strong passwords', () => {
      const validPasswords = [
        'Password123!',
        'MyStr0ng#P@ssw0rd',
        'C0mplex$Password!',
        'Secure123@Pass',
        'Valid#P@ssw0rd1'
      ];

      validPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should reject weak passwords', () => {
      const weakPasswords = [
        { password: '123', expectedErrors: ['too-short', 'no-uppercase', 'no-lowercase', 'no-special'] },
        { password: 'password', expectedErrors: ['no-uppercase', 'no-number', 'no-special'] },
        { password: 'PASSWORD', expectedErrors: ['no-lowercase', 'no-number', 'no-special'] },
        { password: '12345678', expectedErrors: ['no-uppercase', 'no-lowercase', 'no-special'] },
        { password: 'Password', expectedErrors: ['too-short', 'no-number', 'no-special'] },
        { password: 'Password123', expectedErrors: ['no-special'] }
      ];

      weakPasswords.forEach(({ password, expectedErrors }) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expectedErrors.forEach(error => {
          expect(result.errors).toContain(error);
        });
      });
    });

    test('should provide detailed error messages', () => {
      const result = validatePassword('weak');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          'too-short',
          'no-uppercase',
          'no-number',
          'no-special'
        ])
      );
      expect(result.message).toContain('La contraseña debe tener al menos 8 caracteres');
    });

    test('should handle edge cases', () => {
      expect(validatePassword('').isValid).toBe(false);
      expect(validatePassword(null as any).isValid).toBe(false);
      expect(validatePassword(undefined as any).isValid).toBe(false);
    });
  });

  describe('📞 Phone Number Validation', () => {
    test('should accept valid Colombian phone numbers', () => {
      const validPhones = [
        '+57 300 123 4567',
        '+57 310 987 6543',
        '+57 320 555 1234',
        '+573001234567',
        '3001234567',
        '310 987 6543',
        '320-555-1234'
      ];

      validPhones.forEach(phone => {
        expect(validatePhoneNumber(phone, 'CO')).toBe(true);
      });
    });

    test('should accept international phone numbers', () => {
      const internationalPhones = [
        '+1 555 123 4567', // USA
        '+44 20 7946 0958', // UK
        '+33 1 42 86 83 26', // France
        '+49 30 12345678'   // Germany
      ];

      internationalPhones.forEach(phone => {
        expect(validatePhoneNumber(phone, 'international')).toBe(true);
      });
    });

    test('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '',
        '123',
        'not-a-phone',
        '00000000',
        '+57 123',
        '123-45-67',
        '+999 999 999 999'
      ];

      invalidPhones.forEach(phone => {
        expect(validatePhoneNumber(phone)).toBe(false);
      });
    });

    test('should normalize phone numbers', () => {
      const phoneData = [
        { input: '+57 300 123 4567', expected: '+573001234567' },
        { input: '300 123 4567', expected: '+573001234567' },
        { input: '300-123-4567', expected: '+573001234567' },
        { input: '3001234567', expected: '+573001234567' }
      ];

      phoneData.forEach(({ input, expected }) => {
        const normalized = validatePhoneNumber(input, 'CO', true);
        expect(normalized).toBe(expected);
      });
    });
  });

  describe('📦 Product Data Validation', () => {
    test('should accept valid product data', () => {
      const validProduct = {
        name: 'Anillo de Oro',
        price: 299.99,
        category: 'Anillos',
        subcategory: 'Oro',
        description: 'Hermoso anillo de oro 18k',
        materials: 'Oro 18k',
        dimensions: 'Talla 7',
        care: 'Limpiar con paño suave',
        inStock: true,
        featured: false,
        images: ['image1.jpg', 'image2.jpg'],
        tags: ['oro', 'elegante']
      };

      const result = validateProductData(validProduct);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid product data', () => {
      const invalidProduct = {
        name: '',
        price: -100,
        category: 'InvalidCategory',
        subcategory: '',
        description: 'a', // Too short
        materials: '',
        dimensions: '',
        care: '',
        inStock: 'yes', // Should be boolean
        featured: 'no', // Should be boolean
        images: [],
        tags: []
      };

      const result = validateProductData(invalidProduct);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'name', message: expect.any(String) }),
          expect.objectContaining({ field: 'price', message: expect.any(String) }),
          expect.objectContaining({ field: 'category', message: expect.any(String) }),
          expect.objectContaining({ field: 'inStock', message: expect.any(String) })
        ])
      );
    });

    test('should validate product categories', () => {
      const validCategories = ['Anillos', 'Collares', 'Pulseras', 'Aretes', 'Conjuntos'];
      const invalidCategories = ['Electronics', 'Clothing', ''];

      validCategories.forEach(category => {
        const product = { category, name: 'Test', price: 100 };
        const result = validateProductData(product);
        expect(result.errors.find(e => e.field === 'category')).toBeUndefined();
      });

      invalidCategories.forEach(category => {
        const product = { category, name: 'Test', price: 100 };
        const result = validateProductData(product);
        expect(result.errors.find(e => e.field === 'category')).toBeDefined();
      });
    });

    test('should validate price ranges', () => {
      const priceTests = [
        { price: 0, shouldBeValid: false },
        { price: -10, shouldBeValid: false },
        { price: 0.01, shouldBeValid: true },
        { price: 10000, shouldBeValid: true },
        { price: 'invalid', shouldBeValid: false }
      ];

      priceTests.forEach(({ price, shouldBeValid }) => {
        const product = { name: 'Test Product', price, category: 'Anillos' };
        const result = validateProductData(product);
        const priceError = result.errors.find(e => e.field === 'price');
        
        if (shouldBeValid) {
          expect(priceError).toBeUndefined();
        } else {
          expect(priceError).toBeDefined();
        }
      });
    });
  });

  describe('🛒 Order Data Validation', () => {
    test('should accept valid order data', () => {
      const validOrder = {
        customerId: 'customer-123',
        customerEmail: 'customer@example.com',
        customerPhone: '+57 300 123 4567',
        items: [
          {
            productId: 'product-123',
            quantity: 2,
            price: 199.99
          }
        ],
        shippingAddress: {
          street: 'Calle 123 #45-67',
          city: 'Bogotá',
          state: 'Cundinamarca',
          zipCode: '110111',
          country: 'Colombia'
        },
        paymentMethod: 'Tarjeta de Crédito',
        total: 399.98
      };

      const result = validateOrderData(validOrder);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid order data', () => {
      const invalidOrder = {
        customerId: '',
        customerEmail: 'invalid-email',
        customerPhone: '123',
        items: [],
        shippingAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        paymentMethod: '',
        total: -100
      };

      const result = validateOrderData(invalidOrder);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate order items', () => {
      const orderWithInvalidItems = {
        customerId: 'customer-123',
        items: [
          {
            productId: '',
            quantity: 0,
            price: -50
          },
          {
            productId: 'product-123',
            quantity: 'two', // Should be number
            price: 100
          }
        ]
      };

      const result = validateOrderData(orderWithInvalidItems);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field.includes('items'))).toBe(true);
    });

    test('should validate shipping address', () => {
      const orderWithInvalidAddress = {
        customerId: 'customer-123',
        items: [{ productId: 'product-123', quantity: 1, price: 100 }],
        shippingAddress: {
          street: '',
          city: '',
          zipCode: '123', // Too short
          country: 'InvalidCountry'
        }
      };

      const result = validateOrderData(orderWithInvalidAddress);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field.includes('shippingAddress'))).toBe(true);
    });
  });

  describe('🧹 Input Sanitization', () => {
    test('should sanitize HTML input', () => {
      const dangerousInputs = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        '<div onmouseover="alert(1)">Test</div>',
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)"></iframe>'
      ];

      dangerousInputs.forEach(input => {
        const sanitized = sanitizeInput(input);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onmouseover');
      });
    });

    test('should preserve safe HTML content', () => {
      const safeInputs = [
        'Normal text',
        '<p>Safe paragraph</p>',
        '<strong>Bold text</strong>',
        '<em>Italic text</em>',
        'Email: user@example.com'
      ];

      safeInputs.forEach(input => {
        const sanitized = sanitizeInput(input);
        expect(sanitized).toBeTruthy();
      });
    });

    test('should handle SQL injection attempts', () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "UNION SELECT * FROM users",
        "1; DELETE FROM products"
      ];

      sqlInjectionAttempts.forEach(input => {
        const sanitized = sanitizeInput(input, { 
          allowSqlKeywords: false,
          escapeQuotes: true 
        });
        expect(sanitized).not.toContain('DROP');
        expect(sanitized).not.toContain('DELETE');
        expect(sanitized).not.toContain('UNION');
      });
    });
  });

  describe('💳 Payment Data Validation', () => {
    test('should validate credit card data', () => {
      const validCardData = {
        type: 'credit_card',
        cardNumber: '4111111111111111', // Test Visa number
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        holderName: 'John Doe'
      };

      const result = validatePaymentData(validCardData);
      expect(result.isValid).toBe(true);
    });

    test('should validate PSE payment data', () => {
      const validPSEData = {
        type: 'pse',
        bank: 'banco_de_bogota',
        documentType: 'CC',
        documentNumber: '12345678',
        userType: 'NATURAL'
      };

      const result = validatePaymentData(validPSEData);
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid payment data', () => {
      const invalidCardData = {
        type: 'credit_card',
        cardNumber: '123', // Too short
        expiryMonth: '13', // Invalid month
        expiryYear: '2020', // Expired
        cvv: '12', // Too short
        holderName: ''
      };

      const result = validatePaymentData(invalidCardData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('🔍 Search Query Validation', () => {
    test('should accept valid search queries', () => {
      const validQueries = [
        'anillo oro',
        'collar plata 925',
        'pulsera elegante',
        'aretes perlas',
        'joyería fina'
      ];

      validQueries.forEach(query => {
        const result = validateSearchQuery(query);
        expect(result.isValid).toBe(true);
      });
    });

    test('should reject invalid search queries', () => {
      const invalidQueries = [
        '', // Empty
        'a', // Too short
        'x'.repeat(201), // Too long
        '<script>alert(1)</script>', // XSS attempt
        'SELECT * FROM products' // SQL injection attempt
      ];

      invalidQueries.forEach(query => {
        const result = validateSearchQuery(query);
        expect(result.isValid).toBe(false);
      });
    });

    test('should sanitize search queries', () => {
      const dangerousQuery = '<script>alert("xss")</script>anillo';
      const result = validateSearchQuery(dangerousQuery);
      
      expect(result.sanitizedQuery).not.toContain('<script>');
      expect(result.sanitizedQuery).toContain('anillo');
    });
  });

  describe('📄 Pagination Validation', () => {
    test('should accept valid pagination parameters', () => {
      const validPagination = [
        { page: 1, limit: 10 },
        { page: 5, limit: 20 },
        { page: 100, limit: 50 }
      ];

      validPagination.forEach(params => {
        const result = validatePagination(params);
        expect(result.isValid).toBe(true);
      });
    });

    test('should reject invalid pagination parameters', () => {
      const invalidPagination = [
        { page: 0, limit: 10 }, // Page must be >= 1
        { page: 1, limit: 0 }, // Limit must be > 0
        { page: -1, limit: 10 }, // Negative page
        { page: 1, limit: 101 }, // Limit too high
        { page: 'invalid', limit: 10 }, // Invalid type
      ];

      invalidPagination.forEach(params => {
        const result = validatePagination(params);
        expect(result.isValid).toBe(false);
      });
    });

    test('should provide default values', () => {
      const result = validatePagination({ page: undefined, limit: undefined });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('📅 Date Range Validation', () => {
    test('should accept valid date ranges', () => {
      const validRanges = [
        {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        },
        {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z'
        }
      ];

      validRanges.forEach(range => {
        const result = validateDateRange(range);
        expect(result.isValid).toBe(true);
      });
    });

    test('should reject invalid date ranges', () => {
      const invalidRanges = [
        {
          startDate: '2024-01-31',
          endDate: '2024-01-01' // End before start
        },
        {
          startDate: 'invalid-date',
          endDate: '2024-01-31'
        },
        {
          startDate: '2024-01-01',
          endDate: 'invalid-date'
        }
      ];

      invalidRanges.forEach(range => {
        const result = validateDateRange(range);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('🖼️ Image Upload Validation', () => {
    test('should accept valid image files', () => {
      const validImages = [
        { mimetype: 'image/jpeg', size: 1024 * 1024 }, // 1MB JPEG
        { mimetype: 'image/png', size: 500 * 1024 }, // 500KB PNG
        { mimetype: 'image/webp', size: 200 * 1024 } // 200KB WebP
      ];

      validImages.forEach(image => {
        const result = validateImageUpload(image);
        expect(result.isValid).toBe(true);
      });
    });

    test('should reject invalid image files', () => {
      const invalidImages = [
        { mimetype: 'text/plain', size: 1024 }, // Wrong type
        { mimetype: 'image/jpeg', size: 10 * 1024 * 1024 }, // Too large (10MB)
        { mimetype: 'application/exe', size: 1024 } // Executable file
      ];

      invalidImages.forEach(image => {
        const result = validateImageUpload(image);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('👤 User Role Validation', () => {
    test('should accept valid user roles', () => {
      const validRoles = ['ADMIN', 'CUSTOMER', 'MODERATOR'];

      validRoles.forEach(role => {
        expect(validateUserRole(role)).toBe(true);
      });
    });

    test('should reject invalid user roles', () => {
      const invalidRoles = ['admin', 'customer', 'INVALID', '', null, undefined];

      invalidRoles.forEach(role => {
        expect(validateUserRole(role)).toBe(false);
      });
    });
  });

  describe('🏠 Address Validation', () => {
    test('should accept valid Colombian addresses', () => {
      const validAddress = {
        street: 'Carrera 7 #32-16',
        city: 'Bogotá',
        state: 'Cundinamarca',
        zipCode: '110111',
        country: 'Colombia'
      };

      const result = validateAddress(validAddress);
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid addresses', () => {
      const invalidAddress = {
        street: '',
        city: '',
        state: '',
        zipCode: '123', // Too short
        country: ''
      };

      const result = validateAddress(invalidAddress);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate Colombian cities and departments', () => {
      const colombianCities = [
        { city: 'Bogotá', state: 'Cundinamarca' },
        { city: 'Medellín', state: 'Antioquia' },
        { city: 'Cali', state: 'Valle del Cauca' },
        { city: 'Barranquilla', state: 'Atlántico' }
      ];

      colombianCities.forEach(({ city, state }) => {
        const address = {
          street: 'Test Street',
          city,
          state,
          zipCode: '110111',
          country: 'Colombia'
        };

        const result = validateAddress(address);
        expect(result.isValid).toBe(true);
      });
    });
  });
});