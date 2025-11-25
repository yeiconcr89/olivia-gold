import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { WishlistProvider } from '../context/WishlistContext';

// Wrapper personalizado para providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WishlistProvider>
          {children}
        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

// Re-export everything
export * from '@testing-library/react';

// Override render method
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock helpers
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  role: 'CUSTOMER' as const,
  profile: {
    id: '1',
    userId: '1',
    name: 'Test User',
    phone: '+57 300 123 4567',
    avatar: null,
    birthDate: null,
    preferences: ['collares', 'anillos'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }
};

export const mockAdminUser = {
  ...mockUser,
  email: 'admin@example.com',
  role: 'ADMIN' as const,
  profile: {
    ...mockUser.profile,
    name: 'Admin User',
  }
};

export const mockProduct = {
  id: '1',
  name: 'Test Product',
  price: 100000,
  originalPrice: 150000,
  category: 'collares',
  subcategory: 'elegantes',
  images: ['https://example.com/image1.jpg'],
  description: 'Test product description',
  materials: 'Oro laminado 18k',
  dimensions: '45cm x 3mm',
  care: 'Evitar agua y perfumes',
  inStock: true,
  featured: true,
  rating: 4.5,
  reviewCount: 10,
  tags: ['elegante', 'premium'],
};

// API mocking helpers  
export const createMockFetch = (responses: Record<string, { status?: number; data: unknown }>) => {
  return jest.fn().mockImplementation((url: string) => {
    const response = responses[url];
    if (!response) {
      return Promise.reject(new Error(`No mock response for ${url}`));
    }
    
    return Promise.resolve({
      ok: response.status >= 200 && response.status < 300,
      status: response.status || 200,
      json: () => Promise.resolve(response.data),
      text: () => Promise.resolve(JSON.stringify(response.data)),
    });
  });
};

// Local storage mock
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Timer helpers for testing async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default renderWithProviders;