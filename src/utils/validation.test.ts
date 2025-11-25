/**
 * Comprehensive tests for validation utilities
 * These tests will be used for mutation testing
 */

import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validatePrice,
  validateQuantity,
  validatePhoneNumber,
  validateProductName,
  validateAddress,
  calculateDiscount,
  formatCurrency,
  sanitizeInput
} from './validation';

describe('Validation Utilities', () => {
  
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.email@domain.co')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user@@domain.com')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
      expect(validateEmail(123 as any)).toBe(false);
    });

    it('should trim whitespace', () => {
      expect(validateEmail('  user@example.com  ')).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('MyStr0ng#P@ssw0rd');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should require all password criteria', () => {
      expect(validatePassword('password').isValid).toBe(false); // No uppercase, number, special
      expect(validatePassword('PASSWORD').isValid).toBe(false); // No lowercase, number, special
      expect(validatePassword('Password123').isValid).toBe(false); // No special character
      expect(validatePassword('Password!').isValid).toBe(false); // No number
    });

    it('should handle empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });
  });

  describe('validatePrice', () => {
    it('should validate correct prices', () => {
      expect(validatePrice(100)).toBe(true);
      expect(validatePrice(0.01)).toBe(true);
      expect(validatePrice(999999)).toBe(true);
      expect(validatePrice('123.45')).toBe(true);
    });

    it('should reject invalid prices', () => {
      expect(validatePrice(0)).toBe(false);
      expect(validatePrice(-10)).toBe(false);
      expect(validatePrice(1000001)).toBe(false); // Above maximum
      expect(validatePrice('invalid')).toBe(false);
      expect(validatePrice(NaN)).toBe(false);
      expect(validatePrice(Infinity)).toBe(false);
    });

    it('should handle string conversion', () => {
      expect(validatePrice('100.50')).toBe(true);
      expect(validatePrice('0')).toBe(false);
      expect(validatePrice('abc')).toBe(false);
    });
  });

  describe('validateQuantity', () => {
    it('should validate correct quantities', () => {
      expect(validateQuantity(1)).toBe(true);
      expect(validateQuantity(50)).toBe(true);
      expect(validateQuantity(100)).toBe(true);
      expect(validateQuantity('5')).toBe(true);
    });

    it('should reject invalid quantities', () => {
      expect(validateQuantity(0)).toBe(false);
      expect(validateQuantity(-5)).toBe(false);
      expect(validateQuantity(101)).toBe(false); // Above maximum
      expect(validateQuantity(1.5)).toBe(false); // Not integer
      expect(validateQuantity('invalid')).toBe(false);
    });

    it('should handle string conversion', () => {
      expect(validateQuantity('10')).toBe(true);
      expect(validateQuantity('0')).toBe(false);
      expect(validateQuantity('abc')).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate Colombian mobile numbers', () => {
      expect(validatePhoneNumber('3001234567')).toBe(true);
      expect(validatePhoneNumber('310 987 6543')).toBe(true);
      expect(validatePhoneNumber('+57 320 555 1234')).toBe(true);
      expect(validatePhoneNumber('300-123-4567')).toBe(true);
    });

    it('should validate Colombian landline numbers', () => {
      expect(validatePhoneNumber('6012345')).toBe(true); // 7 digits
      expect(validatePhoneNumber('6012345678')).toBe(true); // 10 digits
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('')).toBe(false);
      expect(validatePhoneNumber('123')).toBe(false); // Too short
      expect(validatePhoneNumber('12345678901')).toBe(false); // Too long
      expect(validatePhoneNumber('2001234567')).toBe(false); // Mobile starting with 2
    });

    it('should handle edge cases', () => {
      expect(validatePhoneNumber(null as any)).toBe(false);
      expect(validatePhoneNumber(undefined as any)).toBe(false);
    });
  });

  describe('validateProductName', () => {
    it('should validate correct product names', () => {
      const result = validateProductName('Anillo de Oro Elegante');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short names', () => {
      const result = validateProductName('ab');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product name must be at least 3 characters long');
    });

    it('should reject long names', () => {
      const longName = 'a'.repeat(101);
      const result = validateProductName(longName);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product name must not exceed 100 characters');
    });

    it('should reject names with invalid characters', () => {
      const result = validateProductName('Product <script>alert("xss")</script>');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product name contains invalid characters');
    });

    it('should handle empty names', () => {
      const result = validateProductName('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product name is required');
    });
  });

  describe('validateAddress', () => {
    it('should validate complete address', () => {
      const address = {
        street: 'Carrera 7 #32-16',
        city: 'Bogotá',
        state: 'Cundinamarca',
        zipCode: '110111'
      };
      
      const result = validateAddress(address);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require minimum field lengths', () => {
      const address = {
        street: '123',
        city: 'A',
        state: 'B',
        zipCode: '12345' // Wrong length
      };
      
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Street address must be at least 5 characters long');
      expect(result.errors).toContain('City is required');
      expect(result.errors).toContain('State/Department is required');
      expect(result.errors).toContain('ZIP code must be 6 digits');
    });

    it('should validate ZIP code format', () => {
      const address = {
        street: 'Valid Street Address',
        city: 'Valid City',
        state: 'Valid State',
        zipCode: 'ABC123'
      };
      
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ZIP code must be 6 digits');
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate correct discount percentage', () => {
      expect(calculateDiscount(100, 80)).toBe(20);
      expect(calculateDiscount(200, 150)).toBe(25);
      expect(calculateDiscount(50, 25)).toBe(50);
    });

    it('should handle no discount cases', () => {
      expect(calculateDiscount(100, 100)).toBe(0);
      expect(calculateDiscount(100, 120)).toBe(0); // Sale price higher
    });

    it('should handle edge cases', () => {
      expect(calculateDiscount(0, 10)).toBe(0);
      expect(calculateDiscount(-100, 50)).toBe(0);
      expect(calculateDiscount(100, -10)).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      expect(calculateDiscount(100, 66.666)).toBe(33.33);
    });
  });

  describe('formatCurrency', () => {
    it('should format Colombian pesos correctly', () => {
      expect(formatCurrency(100)).toBe('COP $100');
      expect(formatCurrency(1000)).toBe('COP $1.000');
      expect(formatCurrency(1000000)).toBe('COP $1.000.000');
    });

    it('should handle zero and negative values', () => {
      expect(formatCurrency(0)).toBe('COP $0');
      expect(formatCurrency(-100)).toBe('-COP $100');
    });

    it('should handle invalid numbers', () => {
      expect(formatCurrency(NaN)).toBe('COP $0');
      expect(formatCurrency(Infinity)).toBe('COP $0');
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize HTML characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      
      expect(sanitizeInput('<img src="x" onerror="alert(1)">'))
        .toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
    });

    it('should handle normal text', () => {
      expect(sanitizeInput('Normal text')).toBe('Normal text');
      expect(sanitizeInput('Email: user@example.com')).toBe('Email: user@example.com');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  text with spaces  ')).toBe('text with spaces');
    });

    it('should handle edge cases', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });

    it('should sanitize quotes and special characters', () => {
      expect(sanitizeInput('He said "Hello"')).toBe('He said &quot;Hello&quot;');
      expect(sanitizeInput("It's a test")).toBe('It&#x27;s a test');
      expect(sanitizeInput('Path/to/file')).toBe('Path&#x2F;to&#x2F;file');
    });
  });
});