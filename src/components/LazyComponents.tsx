import React, { Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';
// ============================================================================
// LAZY LOADED COMPONENTS WITH OPTIMIZED LOADING STATES
// ============================================================================

// Admin Components (Heavy - Load on demand)
export const LazyAdminDashboard = React.lazy(() => 
  import('./AdminDashboard')
);

export const LazyBulkImport = React.lazy(() => 
  import('./BulkImport')
);

export const LazyBulkOperations = React.lazy(() => 
  import('./BulkOperations')
);

export const LazyAnalytics = React.lazy(() => 
  import('./Analytics')
);

// Auth Components
export const LazyLoginModal = React.lazy(() => 
  import('./LoginModal')
);

export const LazyGoogleCallback = React.lazy(() => 
  import('./GoogleCallback')
);

export const LazyLogoutConfirmModal = React.lazy(() => 
  import('./LogoutConfirmModal')
);

// Checkout Flow (Heavy - Load when needed)
export const LazyCheckoutFlow = React.lazy(() => 
  import('./checkout/CheckoutFlow')
);

export const LazyCheckoutPage = React.lazy(() => 
  import('./checkout/CheckoutPage')
);

export const LazyPaymentStatus = React.lazy(() => 
  import('./checkout/PaymentStatus')
);

export const LazyOrderTracking = React.lazy(() => 
  import('./tracking/OrderTracking')
);

// Product Components (Frequently used - Preload)
export const LazyProductModal = React.lazy(() => 
  import('./ProductModal')
);

export const LazyProductForm = React.lazy(() => 
  import('./ProductForm')
);

// Management Components (Admin only)
export const LazyCustomerManagement = React.lazy(() => 
  import('./CustomerManagement')
);

export const LazyInventoryTable = React.lazy(() => 
  import('./InventoryTable')
);

// Payment Admin Components
export const LazyAdminPaymentsPage = React.lazy(() => 
  import('./admin/AdminPaymentsPage')
);

export const LazyPaymentsDashboard = React.lazy(() => 
  import('./admin/PaymentsDashboard')
);

export const LazyTransactionsList = React.lazy(() => 
  import('./admin/TransactionsList')
);

export const LazyPaymentAnalytics = React.lazy(() => 
  import('./admin/PaymentAnalytics')
);

export const LazySEOManager = React.lazy(() => 
  import('./SEOManager')
);

export const LazyHeroSlideManager = React.lazy(() => 
  import('./HeroSlideManager')
);

export const LazyCloudinarySettings = React.lazy(() => 
  import('./CloudinarySettings')
);

export const LazyCloudinaryGallery = React.lazy(() => 
  import('./CloudinaryGallery')
);

// Review System
export const LazyReviewSystem = React.lazy(() => 
  import('./ReviewSystem')
);

// Wrapped OrderManagement component with hooks
const OrderManagementBase = React.lazy(() => import('./OrderManagement'));

import { useOrders } from '../hooks/useOrders';
import OrderManagement from './OrderManagement';

const WrappedOrderManagement: React.FC = () => {
  const { orders, loading, error, updateOrder } = useOrders();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <OrderManagement 
        orders={orders || []}
        onUpdateOrder={updateOrder}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export const LazyOrderManagement = React.lazy(() => 
  Promise.resolve({ default: WrappedOrderManagement })
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

// Product-specific wrapper with product skeleton
export const ProductLazyWrapper: React.FC<LazyWrapperProps> = ({ children }) => (
  <Suspense fallback={
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  }>
    {children}
  </Suspense>
);

// Modal wrapper with minimal loading
export const ModalLazyWrapper: React.FC<LazyWrapperProps> = ({ children }) => (
  <Suspense fallback={
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8">
        <LoadingSpinner />
      </div>
    </div>
  }>
    {children}
  </Suspense>
);

// ============================================================================
// PRELOADING UTILITIES
// ============================================================================

// Preload components that are likely to be used
export const preloadComponents = {
  // Preload admin components when user is admin
  admin: () => {
    import('./AdminDashboard');
    import('./Analytics');
    import('./CustomerManagement');
    import('./OrderManagement');
    import('./admin/AdminPaymentsPage');
    import('./admin/PaymentsDashboard');
  },
  
  // Preload product components on homepage
  products: () => {
    import('./ProductModal');
    import('./ProductForm');
  },
  
  // Preload auth components on page load
  auth: () => {
    import('./LoginModal');
    import('./LogoutConfirmModal');
  },
  
  // Preload checkout when user adds to cart
  checkout: () => {
    import('./checkout/CheckoutFlow');
    import('./checkout/CheckoutPage');
    import('./checkout/PaymentStatus');
  },
};

// Hook to preload components based on user behavior
export const useComponentPreloader = () => {
  const preloadAdmin = React.useCallback(() => {
    preloadComponents.admin();
  }, []);
  
  const preloadProducts = React.useCallback(() => {
    preloadComponents.products();
  }, []);
  
  const preloadAuth = React.useCallback(() => {
    preloadComponents.auth();
  }, []);
  
  const preloadCheckout = React.useCallback(() => {
    preloadComponents.checkout();
  }, []);
  
  return {
    preloadAdmin,
    preloadProducts,
    preloadAuth,
    preloadCheckout,
  };
};