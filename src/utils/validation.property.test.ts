/**
 * Property-Based Testing for Validation Functions
 * Uses fast-check to generate hundreds of test cases automatically
 */

import { describe, test } from 'vitest';
import * as fc from 'fast-check';
import {
  validateEmail,
  validatePassword,
  validatePrice,
  validateQuantity,
  validatePhoneNumber,
  calculateDiscount,
  formatCurrency,
  sanitizeInput
} from './validation';

describe('Property-Based Testing - Validation Functions', () => {

  describe('validateEmail properties', () => {
    test('should always return boolean', () => {
      fc.assert(fc.property(
        fc.string(),
        (input) => {
          const result = validateEmail(input);
          return typeof result === 'boolean';
        }
      ), { numRuns: 1000 });
    });

    test('valid emails should always contain @ and .', () => {
      fc.assert(fc.property(
        fc.emailAddress(),
        (email) => {
          const result = validateEmail(email);
          if (result) {
            return email.includes('@') && email.includes('.');
          }
          return true; // If invalid, we don't care about format
        }
      ), { numRuns: 500 });
    });

    test('empty or null inputs should always be invalid', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant(null),
          fc.constant(undefined),
          fc.string({ maxLength: 2 })
        ),
        (input) => {
          return validateEmail(input as string) === false;
        }
      ), { numRuns: 200 });
    });

    test('emails without @ should be invalid', () => {
      fc.assert(fc.property(
        fc.string().filter(s => !s.includes('@') && s.length > 0),
        (input) => {
          return validateEmail(input) === false;
        }
      ), { numRuns: 300 });
    });
  });

  describe('validatePassword properties', () => {
    test('should always return ValidationResult with isValid boolean and errors array', () => {
      fc.assert(fc.property(
        fc.string(),
        (password) => {
          const result = validatePassword(password);
          return typeof result === 'object' &&
                 typeof result.isValid === 'boolean' &&
                 Array.isArray(result.errors);
        }
      ), { numRuns: 500 });
    });

    test('passwords shorter than 8 chars should be invalid', () => {
      fc.assert(fc.property(
        fc.string({ maxLength: 7 }),
        (password) => {
          const result = validatePassword(password);
          if (password.length < 8) {
            return result.isValid === false;
          }
          return true;
        }
      ), { numRuns: 300 });
    });

    test('valid passwords should have all required criteria', () => {
      fc.assert(fc.property(
        fc.tuple(
          fc.string({ minLength: 8 }), // Base string
          fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), // Uppercase
          fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), // Lowercase  
          fc.constantFrom(...'0123456789'), // Digit
          fc.constantFrom(...'!@#$%^&*(),.?":{}|<>') // Special
        ),
        ([base, upper, lower, digit, special]) => {
          const password = base + upper + lower + digit + special;
          const result = validatePassword(password);
          
          // A password with all criteria should be valid
          const hasUpper = /[A-Z]/.test(password);
          const hasLower = /[a-z]/.test(password);
          const hasDigit = /\d/.test(password);
          const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
          const isLongEnough = password.length >= 8;
          
          if (hasUpper && hasLower && hasDigit && hasSpecial && isLongEnough) {
            return result.isValid === true;
          }
          return true;
        }
      ), { numRuns: 200 });
    });

    test('error count should reflect number of missing criteria', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (password) => {
          const result = validatePassword(password);
          
          // Count missing criteria
          let expectedErrors = 0;
          if (password.length < 8) expectedErrors++;
          if (!/[A-Z]/.test(password)) expectedErrors++;
          if (!/[a-z]/.test(password)) expectedErrors++;
          if (!/\d/.test(password)) expectedErrors++;
          if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) expectedErrors++;
          
          return result.errors.length === expectedErrors;
        }
      ), { numRuns: 300 });
    });
  });

  describe('validatePrice properties', () => {
    test('should always return boolean', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.float(),
          fc.integer(),
          fc.string()
        ),
        (input) => {
          const result = validatePrice(input);
          return typeof result === 'boolean';
        }
      ), { numRuns: 500 });
    });

    test('positive finite numbers should be valid if within range', () => {
      fc.assert(fc.property(
        fc.float({ min: 0.01, max: 999999, noNaN: true }),
        (price) => {
          const result = validatePrice(price);
          if (price > 0 && price <= 1000000 && Number.isFinite(price)) {
            return result === true;
          }
          return true;
        }
      ), { numRuns: 300 });
    });

    test('negative numbers should always be invalid', () => {
      fc.assert(fc.property(
        fc.float({ max: -0.01 }),
        (price) => {
          return validatePrice(price) === false;
        }
      ), { numRuns: 200 });
    });

    test('zero should be invalid', () => {
      fc.assert(fc.property(
        fc.constant(0),
        (price) => {
          return validatePrice(price) === false;
        }
      ), { numRuns: 50 });
    });

    test('NaN and Infinity should be invalid', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant(NaN),
          fc.constant(Infinity),
          fc.constant(-Infinity)
        ),
        (price) => {
          return validatePrice(price) === false;
        }
      ), { numRuns: 100 });
    });

    test('string to number conversion should work correctly', () => {
      fc.assert(fc.property(
        fc.float({ min: 0.01, max: 999999 }).map(n => n.toString()),
        (priceString) => {
          const numericValue = parseFloat(priceString);
          const stringResult = validatePrice(priceString);
          const numberResult = validatePrice(numericValue);
          
          // Both should give same result for valid numeric strings
          if (!isNaN(numericValue)) {
            return stringResult === numberResult;
          }
          return true;
        }
      ), { numRuns: 200 });
    });
  });

  describe('validateQuantity properties', () => {
    test('should always return boolean', () => {
      fc.assert(fc.property(
        fc.oneof(fc.integer(), fc.string()),
        (input) => {
          const result = validateQuantity(input);
          return typeof result === 'boolean';
        }
      ), { numRuns: 300 });
    });

    test('positive integers within range should be valid', () => {
      fc.assert(fc.property(
        fc.integer({ min: 1, max: 100 }),
        (quantity) => {
          return validateQuantity(quantity) === true;
        }
      ), { numRuns: 200 });
    });

    test('zero and negative integers should be invalid', () => {
      fc.assert(fc.property(
        fc.integer({ max: 0 }),
        (quantity) => {
          return validateQuantity(quantity) === false;
        }
      ), { numRuns: 200 });
    });

    test('quantities over 100 should be invalid', () => {
      fc.assert(fc.property(
        fc.integer({ min: 101, max: 1000 }),
        (quantity) => {
          return validateQuantity(quantity) === false;
        }
      ), { numRuns: 200 });
    });

    test('non-integers should be invalid', () => {
      fc.assert(fc.property(
        fc.float({ min: 0.1, max: 99.9 }).filter(n => !Number.isInteger(n)),
        (quantity) => {
          return validateQuantity(quantity) === false;
        }
      ), { numRuns: 200 });
    });
  });

  describe('validatePhoneNumber properties', () => {
    test('should always return boolean', () => {
      fc.assert(fc.property(
        fc.string(),
        (phone) => {
          const result = validatePhoneNumber(phone);
          return typeof result === 'boolean';
        }
      ), { numRuns: 300 });
    });

    test('empty strings should be invalid', () => {
      fc.assert(fc.property(
        fc.constant(''),
        (phone) => {
          return validatePhoneNumber(phone) === false;
        }
      ), { numRuns: 50 });
    });

    test('valid Colombian mobile format should work', () => {
      fc.assert(fc.property(
        fc.tuple(
          fc.constant('3'), // Colombian mobile prefix
          fc.string({ minLength: 9, maxLength: 9 }).map(s => s.replace(/\D/g, '').padEnd(9, '0').slice(0, 9))
        ),
        ([prefix, digits]) => {
          const phone = prefix + digits;
          const result = validatePhoneNumber(phone);
          
          // 10 digit number starting with 3 should be valid
          if (phone.length === 10 && phone.startsWith('3')) {
            return result === true;
          }
          return true;
        }
      ), { numRuns: 100 });
    });

    test('strings with non-digits should filter correctly', () => {
      fc.assert(fc.property(
        fc.string().filter(s => s.length > 0),
        (phone) => {
          const result = validatePhoneNumber(phone);
          const cleaned = phone.replace(/\D/g, '');
          
          // Should work same as validating the cleaned version
          const cleanedResult = validatePhoneNumber(cleaned);
          return result === cleanedResult;
        }
      ), { numRuns: 200 });
    });
  });

  describe('calculateDiscount properties', () => {
    test('should always return a number', () => {
      fc.assert(fc.property(
        fc.float(),
        fc.float(),
        (original, sale) => {
          const result = calculateDiscount(original, sale);
          return typeof result === 'number';
        }
      ), { numRuns: 300 });
    });

    test('discount should be 0 when sale price >= original price', () => {
      fc.assert(fc.property(
        fc.float({ min: 1, max: 1000 }),
        fc.float({ min: 1000, max: 2000 }),
        (original, sale) => {
          if (sale >= original) {
            return calculateDiscount(original, sale) === 0;
          }
          return true;
        }
      ), { numRuns: 200 });
    });

    test('discount should be between 0 and 100 for valid inputs', () => {
      fc.assert(fc.property(
        fc.float({ min: 100, max: 1000 }),
        fc.float({ min: 1, max: 99 }),
        (original, sale) => {
          if (original > 0 && sale >= 0 && sale < original) {
            const discount = calculateDiscount(original, sale);
            return discount >= 0 && discount <= 100;
          }
          return true;
        }
      ), { numRuns: 200 });
    });

    test('discount calculation should be mathematically correct', () => {
      fc.assert(fc.property(
        fc.float({ min: 100, max: 1000 }),
        fc.float({ min: 1, max: 99 }),
        (original, sale) => {
          if (original > sale && original > 0 && sale >= 0) {
            const discount = calculateDiscount(original, sale);
            const expectedDiscount = Math.round(((original - sale) / original) * 100 * 100) / 100;
            return Math.abs(discount - expectedDiscount) < 0.01; // Allow for floating point precision
          }
          return true;
        }
      ), { numRuns: 200 });
    });

    test('should handle edge cases gracefully', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant(0),
          fc.float({ max: 0 }),
          fc.constant(NaN),
          fc.constant(Infinity)
        ),
        fc.float(),
        (original, sale) => {
          const result = calculateDiscount(original, sale);
          // Edge cases should return 0 or a valid number
          return result === 0 || (typeof result === 'number' && !isNaN(result));
        }
      ), { numRuns: 100 });
    });
  });

  describe('formatCurrency properties', () => {
    test('should always return a string', () => {
      fc.assert(fc.property(
        fc.float(),
        (amount) => {
          const result = formatCurrency(amount);
          return typeof result === 'string';
        }
      ), { numRuns: 300 });
    });

    test('should always include COP currency code', () => {
      fc.assert(fc.property(
        fc.float({ min: -10000, max: 10000 }),
        (amount) => {
          const result = formatCurrency(amount);
          return result.includes('COP');
        }
      ), { numRuns: 200 });
    });

    test('should handle large numbers correctly', () => {
      fc.assert(fc.property(
        fc.float({ min: 1000000, max: 999999999 }),
        (amount) => {
          if (Number.isFinite(amount)) {
            const result = formatCurrency(amount);
            return result.includes('.') || result.length > 10; // Large numbers should have separators
          }
          return true;
        }
      ), { numRuns: 100 });
    });

    test('should handle special values consistently', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant(NaN),
          fc.constant(Infinity),
          fc.constant(-Infinity)
        ),
        (amount) => {
          const result = formatCurrency(amount);
          // Should return consistent format for invalid numbers
          return result === 'COP $0';
        }
      ), { numRuns: 100 });
    });
  });

  describe('sanitizeInput properties', () => {
    test('should always return a string', () => {
      fc.assert(fc.property(
        fc.anything(),
        (input) => {
          const result = sanitizeInput(input as string);
          return typeof result === 'string';
        }
      ), { numRuns: 300 });
    });

    test('sanitized output should not contain dangerous HTML chars', () => {
      fc.assert(fc.property(
        fc.string(),
        (input) => {
          const result = sanitizeInput(input);
          return !result.includes('<') && 
                 !result.includes('>') && 
                 !result.includes('"') &&
                 !result.includes("'") &&
                 !result.includes('/');
        }
      ), { numRuns: 300 });
    });

    test('safe characters should remain unchanged', () => {
      fc.assert(fc.property(
        fc.string().filter(s => !/[<>"'/]/.test(s) && s.trim() === s),
        (input: string) => {
          const result = sanitizeInput(input);
          // Safe strings should remain the same (except trimming)
          return result === input.trim();
        }
      ), { numRuns: 200 });
    });

    test('should handle null/undefined inputs gracefully', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant('')
        ),
        (input) => {
          const result = sanitizeInput(input as string);
          return result === '';
        }
      ), { numRuns: 100 });
    });

    test('output length should be >= input length (due to escaping)', () => {
      fc.assert(fc.property(
        fc.string(),
        (input) => {
          if (typeof input === 'string' && input.length > 0) {
            const result = sanitizeInput(input);
            return result.length >= input.trim().length;
          }
          return true;
        }
      ), { numRuns: 200 });
    });
  });

  describe('Cross-function properties', () => {
    test('price and quantity validation should be consistent with business rules', () => {
      fc.assert(fc.property(
        fc.float({ min: 0.01, max: 1000000 }),
        fc.integer({ min: 1, max: 100 }),
        (price, quantity) => {
          const validPrice = validatePrice(price);
          const validQuantity = validateQuantity(quantity);
          
          // If both are valid, they should work together in a cart
          if (validPrice && validQuantity) {
            const total = price * quantity;
            return total > 0 && total <= 100000000; // Reasonable total
          }
          return true;
        }
      ), { numRuns: 200 });
    });

    test('password validation and sanitization should not interfere', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 8, maxLength: 50 }),
        (password) => {
          const sanitized = sanitizeInput(password);
          const originalResult = validatePassword(password);
          const sanitizedResult = validatePassword(sanitized);
          
          // Sanitization shouldn't break password validation logic
          // (though it might change the result)
          return typeof originalResult.isValid === 'boolean' &&
                 typeof sanitizedResult.isValid === 'boolean';
        }
      ), { numRuns: 200 });
    });

    test('discount calculation with formatted currency should be consistent', () => {
      fc.assert(fc.property(
        fc.float({ min: 100, max: 1000 }),
        fc.float({ min: 50, max: 200 }),
        (original, sale) => {
          if (original > sale && sale > 0) {
            const discount = calculateDiscount(original, sale);
            const formattedOriginal = formatCurrency(original);
            const formattedSale = formatCurrency(sale);
            
            // All should be valid outputs
            return typeof discount === 'number' &&
                   discount >= 0 &&
                   formattedOriginal.includes('COP') &&
                   formattedSale.includes('COP');
          }
          return true;
        }
      ), { numRuns: 150 });
    });
  });
});