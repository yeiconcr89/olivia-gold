import React from 'react';
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary, useErrorHandler } from '../ErrorBoundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Mock console.error to avoid noise in test output
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for error logging
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should render error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('¡Oops! Algo salió mal')).toBeInTheDocument();
    expect(screen.getByText(/Ha ocurrido un error inesperado/)).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('¡Oops! Algo salió mal')).not.toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onErrorMock = vi.fn();

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('should show retry button and allow retry', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Intentar de nuevo')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Intentar de nuevo'));

    // After retry, component should attempt to render children again
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should show reload button when showReload is not false', () => {
    const originalReload = Object.getOwnPropertyDescriptor(window.location, 'reload');
    const mockReload = vi.fn();
    Object.defineProperty(window.location, 'reload', {
      value: mockReload,
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Recargar página')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Recargar página'));
    expect(mockReload).toHaveBeenCalled();

    // Restore original reload
    if (originalReload) {
      Object.defineProperty(window.location, 'reload', originalReload);
    }
  });

  it('should show go home button', () => {
    const originalHref = Object.getOwnPropertyDescriptor(window.location, 'href');
    let mockHref = '';
    Object.defineProperty(window.location, 'href', {
      get: () => mockHref,
      set: (value) => { mockHref = value; },
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Ir al inicio')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Ir al inicio'));
    expect(mockHref).toBe('/');

    // Restore original href
    if (originalHref) {
      Object.defineProperty(window.location, 'href', originalHref);
    }
  });

  it('should hide reload button when showReload is false', () => {
    render(
      <ErrorBoundary showReload={false}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Recargar página')).not.toBeInTheDocument();
  });
});

describe('withErrorBoundary HOC', () => {
  it('should wrap component with ErrorBoundary', () => {
    const TestComponent = () => <div>Test component</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('Test component')).toBeInTheDocument();
  });

  it('should handle errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);

    render(<WrappedComponent shouldThrow={true} />);

    expect(screen.getByText('¡Oops! Algo salió mal')).toBeInTheDocument();
  });

  it('should pass through error boundary props', () => {
    const customFallback = <div>HOC Custom error</div>;
    const WrappedComponent = withErrorBoundary(ThrowError, {
      fallback: customFallback,
    });

    render(<WrappedComponent shouldThrow={true} />);

    expect(screen.getByText('HOC Custom error')).toBeInTheDocument();
  });
});

describe('useErrorHandler Hook', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  it('should provide error handler function', () => {
    let errorHandler: ((error: Error, additionalInfo?: string) => void) | undefined;
    
    const TestComponent = () => {
      errorHandler = useErrorHandler();
      return <div>Test</div>;
    };

    render(<TestComponent />);

    expect(typeof errorHandler).toBe('function');
  });

  it('should log errors when called', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
    let errorHandler: ((error: Error, additionalInfo?: string) => void) | undefined;
    
    const TestComponent = () => {
      errorHandler = useErrorHandler();
      return <div>Test</div>;
    };

    render(<TestComponent />);

    const testError = new Error('Manual error');
    errorHandler(testError, 'Additional info');

    expect(consoleSpy).toHaveBeenCalledWith('Error reportado manualmente:', testError);
    
    consoleSpy.mockRestore();
  });
});