/**
 * Validation utilities for mutation testing demonstration
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates price value
 */
export function validatePrice(price: number | string): boolean {
  if (typeof price === 'string') {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) {
      return false;
    }
    price = numericPrice;
  }
  
  return typeof price === 'number' && 
         !isNaN(price) && 
         isFinite(price) && 
         price > 0 && 
         price <= 1000000; // Maximum price limit
}

/**
 * Validates quantity value
 */
export function validateQuantity(quantity: number | string): boolean {
  if (typeof quantity === 'string') {
    const numericQuantity = parseInt(quantity, 10);
    if (isNaN(numericQuantity)) {
      return false;
    }
    quantity = numericQuantity;
  }
  
  return Number.isInteger(quantity) && quantity > 0 && quantity <= 100;
}

/**
 * Validates phone number format (Colombian)
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Colombian mobile numbers: 10 digits starting with 3
  // Colombian landlines: 7-10 digits
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    return true; // Mobile
  }
  
  if (cleaned.length >= 7 && cleaned.length <= 10) {
    return true; // Landline
  }
  
  return false;
}

/**
 * Validates product name
 */
export function validateProductName(name: string): ValidationResult {
  const errors: string[] = [];
  
  if (!name || typeof name !== 'string') {
    errors.push('Product name is required');
    return { isValid: false, errors };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 3) {
    errors.push('Product name must be at least 3 characters long');
  }
  
  if (trimmedName.length > 100) {
    errors.push('Product name must not exceed 100 characters');
  }
  
  // Check for prohibited characters
  if (/[<>"]/.test(trimmedName)) {
    errors.push('Product name contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates Colombian address
 */
export function validateAddress(address: {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}): ValidationResult {
  const errors: string[] = [];
  
  if (!address.street || address.street.trim().length < 5) {
    errors.push('Street address must be at least 5 characters long');
  }
  
  if (!address.city || address.city.trim().length < 2) {
    errors.push('City is required');
  }
  
  if (!address.state || address.state.trim().length < 2) {
    errors.push('State/Department is required');
  }
  
  if (address.zipCode) {
    const zipCode = address.zipCode.replace(/\D/g, '');
    if (zipCode.length !== 6) {
      errors.push('ZIP code must be 6 digits');
    }
  }
  
  // Validate Colombian cities (sample)
  const colombianCities = [
    'bogota', 'medellin', 'cali', 'barranquilla', 'cartagena',
    'cucuta', 'bucaramanga', 'pereira', 'santa marta', 'ibague'
  ];
  
  if (address.city && 
      !colombianCities.includes(address.city.toLowerCase().trim())) {
    // This is a warning, not an error
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculates discount percentage
 */
export function calculateDiscount(originalPrice: number, salePrice: number): number {
  if (originalPrice <= 0 || salePrice < 0) {
    return 0;
  }
  
  if (salePrice >= originalPrice) {
    return 0;
  }
  
  const discount = ((originalPrice - salePrice) / originalPrice) * 100;
  return Math.round(discount * 100) / 100; // Round to 2 decimal places
}

/**
 * Formats currency for Colombian Pesos
 */
export function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) {
    return 'COP $0';
  }
  
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}