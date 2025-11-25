import React, { Suspense } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductSkeleton from '../components/ProductSkeleton';

// ============================================================================
// LAZY LOADED COMPONENTS WITH OPTIMIZED LOADING STATES
// ============================================================================

// Admin Components (Heavy - Load on demand)
export const LazyAdminDashboard = React.lazy(() => 
  import('../components/AdminDashboard')
);

export const LazyBulkImport = React.lazy(() => 
  import('../components/BulkImport')
);

export const LazyBulkOperations = React.lazy(() => 
  import('../components/BulkOperations')
);

export const LazyAnalytics = React.lazy(() => 
  import('../components/Analytics')
);

// Auth Components
export const LazyLoginModal = React.lazy(() => 
  import('../components/LoginModal')
);

export const LazyGoogleCallback = React.lazy(() => 
  import('../components/GoogleCallback')
);

export const LazyLogoutConfirmModal = React.lazy(() => 
  import('../components/LogoutConfirmModal')
);

// Checkout Flow (Heavy - Load when needed)
export const LazyCheckoutFlow = React.lazy(() => 
  import('../components/checkout/CheckoutFlow')
);

export const LazyCheckoutPage = React.lazy(() => 
  import('../components/checkout/CheckoutPage')
);

export const LazyPaymentStatus = React.lazy(() => 
  import('../components/checkout/PaymentStatus')
);

export const LazyOrderTracking = React.lazy(() => 
  import('../components/tracking/OrderTracking')
);

// Product Components (Frequently used - Preload)
export const LazyProductModal = React.lazy(() => 
  import('../components/ProductModal')
);

export const LazyProductForm = React.lazy(() => 
  import('../components/ProductForm')
);

// Management Components (Admin only)
export const LazyCustomerManagement = React.lazy(() => 
  import('../components/CustomerManagement')
);

export const LazyOrderManagement = React.lazy(() => 
  import('../components/admin/WrappedOrderManagement')
);

export const LazyInventoryTable = React.lazy(() => 
  import('../components/InventoryTable')
);

// Payment Admin Components
export const LazyAdminPaymentsPage = React.lazy(() => 
  import('../components/admin/AdminPaymentsPage')
);

export const LazyPaymentsDashboard = React.lazy(() => 
  import('../components/admin/PaymentsDashboard')
);

export const LazyTransactionsList = React.lazy(() => 
  import('../components/admin/TransactionsList')
);

export const LazyPaymentAnalytics = React.lazy(() => 
  import('../components/admin/PaymentAnalytics')
);

export const LazySEOManager = React.lazy(() => 
  import('../components/SEOManager')
);

export const LazyHeroSlideManager = React.lazy(() => 
  import('../components/HeroSlideManager')
);

export const LazyCloudinarySettings = React.lazy(() => 
  import('../components/CloudinarySettings')
);

export const LazyCloudinaryGallery = React.lazy(() => 
  import('../components/CloudinaryGallery')
);

// Review System
export const LazyReviewSystem = React.lazy(() => 
  import('../components/ReviewSystem')
);

// ============================================================================
// WRAPPER COMPONENTS WITH OPTIMIZED LOADING STATES
// ============================================================================

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

// Generic lazy wrapper with loading spinner
export const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback,
  className = "min-h-screen flex items-center justify-center"
}) => (
  <Suspense fallback={fallback || (
    <div className={className}>
      <LoadingSpinner />
    </div>
  )}>
    {children}
  </Suspense>
);

// Admin-specific wrapper with admin-styled loading
export const AdminLazyWrapper: React.FC<LazyWrapperProps> = ({ children }) => (
  <Suspense fallback={
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Cargando panel de administración...</p>
      </div>
    </div>
  }>
    {children}
  </Suspense>
);

// Modal-specific wrapper with modal-styled loading
export const ModalLazyWrapper: React.FC<LazyWrapperProps> = ({ children }) => (
  <Suspense fallback={
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <LoadingSpinner />
      </div>
    </div>
  }>
    {children}
  </Suspense>
);

// Hook to preload frequently used components
export const useComponentPreloader = () => {
  const preloadComponents = () => {
    const preloadQueue = [
      LazyProductModal,
      LazyProductForm,
      LazyLoginModal,
      LazyLogoutConfirmModal,
    ];

    preloadQueue.forEach(component => {
      try {
        // @ts-ignore - We know this is safe for React.lazy components
        const preloadPromise = component.preload?.();
        if (preloadPromise) {
          preloadPromise.catch(() => {
            // Silently handle preload failures
          });
        }
      } catch (error) {
        // Ignore preload errors
      }
    });
  };

  return { preloadComponents };
};