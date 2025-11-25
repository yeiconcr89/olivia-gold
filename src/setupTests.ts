import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';

// Only define browser-specific mocks when window exists (jsdom)
// const hasWindow = typeof window !== 'undefined' && typeof (window as Window & typeof globalThis).matchMedia !== 'undefined';

// Mock IntersectionObserver
(global as typeof globalThis).IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock ResizeObserver
(global as typeof globalThis).ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock matchMedia (guard against node env without window)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
(global as typeof globalThis).localStorage = localStorageMock as unknown as Storage;

// Mock sessionStorage
(global as typeof globalThis).sessionStorage = localStorageMock as unknown as Storage;

// Mock fetch globally
(global as typeof globalThis).fetch = vi.fn();

// Mock URL.createObjectURL
(global as typeof globalThis).URL.createObjectURL = vi.fn(() => 'mocked-url');

// Mock process.env for Vite (guard import.meta in node)
try {
  Object.defineProperty(import.meta, 'env', {
    value: {
      DEV: true,
      PROD: false,
      VITE_API_URL: 'http://localhost:3001',
    },
    writable: true,
  });
} catch {
  // Ignore errors when import.meta is not available
}

// Suppress console warnings in tests
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('ReactDOM.render') || args[0].includes('Warning: '))
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});