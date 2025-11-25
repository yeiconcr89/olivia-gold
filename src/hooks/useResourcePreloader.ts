import { useEffect, useCallback } from 'react';
import { useBatchImagePreloader } from './useOptimizedImage';

interface UseResourcePreloaderOptions {
  preloadImages?: string[];
  preloadFonts?: string[];
  preloadCriticalCSS?: boolean;
  preloadOnIdle?: boolean;
}

// ============================================================================
// RESOURCE PRELOADER HOOK
// ============================================================================

export const useResourcePreloader = (options: UseResourcePreloaderOptions = {}) => {
  const {
    preloadImages = [],
    preloadFonts = [],
    preloadCriticalCSS = true,
    preloadOnIdle = true,
  } = options;

  const { preloadImages: batchPreloadImages, isPreloading } = useBatchImagePreloader();

  // Preload critical fonts
  const preloadFontsUtil = useCallback((fontUrls: string[]) => {
    fontUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = url;
      document.head.appendChild(link);
    });
  }, []);

  // Preload critical CSS
  const preloadCriticalStyles = useCallback(() => {
    // Preload Tailwind CSS if not already loaded
    const existingTailwind = document.querySelector('link[href*="tailwind"]');
    if (!existingTailwind) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
            // Usar ruta absoluta raíz para evitar error 404 en desarrollo/producción
      link.href = '/index.css';
      document.head.appendChild(link);
    }
  }, []);

  // Preload resources when browser is idle
  const preloadOnBrowserIdle = useCallback((callback: () => void) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 2000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(callback, 100);
    }
  }, []);

  // Main preload function
  const preloadResources = useCallback(() => {
    const preloadTasks = () => {
      // Preload images
      if (preloadImages.length > 0) {
        batchPreloadImages(preloadImages);
      }

      // Preload fonts
      if (preloadFonts.length > 0) {
        preloadFontsUtil(preloadFonts);
      }

      // Preload critical CSS sólo en producción para evitar 404 en desarrollo
      if (preloadCriticalCSS && import.meta.env.PROD) {
        preloadCriticalStyles();
      }
    };

    if (preloadOnIdle) {
      preloadOnBrowserIdle(preloadTasks);
    } else {
      preloadTasks();
    }
  }, [
    preloadImages,
    preloadFonts,
    preloadCriticalCSS,
    preloadOnIdle,
    batchPreloadImages,
    preloadFontsUtil,
    preloadCriticalStyles,
    preloadOnBrowserIdle,
  ]);

  // Auto-preload on mount
  useEffect(() => {
    preloadResources();
  }, [preloadResources]);

  return {
    preloadResources,
    isPreloading,
  };
};

// ============================================================================
// CRITICAL RESOURCE PRELOADER
// ============================================================================

export const useCriticalResourcePreloader = () => {
  useEffect(() => {
    // Preload critical resources immediately
    const preloadCritical = () => {
      // Preload hero images (first 3 slides)
      const heroImages = [
        'https://res.cloudinary.com/your-cloud/image/upload/f_auto,q_auto,w_1200/hero-1.jpg',
        'https://res.cloudinary.com/your-cloud/image/upload/f_auto,q_auto,w_1200/hero-2.jpg',
        'https://res.cloudinary.com/your-cloud/image/upload/f_auto,q_auto,w_1200/hero-3.jpg',
      ];

      heroImages.forEach(src => {
        const img = new Image();
        img.src = src;
      });

      // Preload critical fonts
      const criticalFonts = [
        '/fonts/inter-var.woff2',
        '/fonts/playfair-display.woff2',
      ];

      criticalFonts.forEach(font => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
        link.href = font;
        document.head.appendChild(link);
      });
    };

    // Preload immediately for critical resources
    preloadCritical();
  }, []);
};

// ============================================================================
// ROUTE-BASED PRELOADER
// ============================================================================

export const useRoutePreloader = (currentRoute: string) => {
  const { preloadImages } = useBatchImagePreloader();

  useEffect(() => {
    const preloadRouteResources = () => {
      switch (currentRoute) {
        case '/':
        case '/products':
          // Preload product images for homepage
          // This would be populated with actual product images
          preloadImages([
            // First 6 product images
          ]);
          break;
          
        case '/admin':
          // Preload admin assets
          preloadImages([
            '/images/admin-dashboard-bg.jpg',
            '/images/admin-icons.svg',
          ]);
          break;
          
        case '/checkout':
          // Preload checkout assets
          preloadImages([
            '/images/payment-icons.png',
            '/images/security-badges.png',
          ]);
          break;
      }
    };

    // Use requestIdleCallback for non-critical route preloading
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadRouteResources, { timeout: 3000 });
    } else {
      setTimeout(preloadRouteResources, 500);
    }
  }, [currentRoute, preloadImages]);
};

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export const usePerformanceMonitor = () => {
  useEffect(() => {
    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime);
        }
        if (entry.entryType === 'first-input') {
          console.log('FID:', entry.processingStart - entry.startTime);
        }
        if (entry.entryType === 'layout-shift') {
          if (!entry.hadRecentInput) {
            console.log('CLS:', entry.value);
          }
        }
      });
    });

    // Observe Core Web Vitals
    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

    // Monitor resource loading
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 1000) { // Resources taking > 1s
          console.warn('Slow resource:', entry.name, entry.duration + 'ms');
        }
      });
    });

    resourceObserver.observe({ entryTypes: ['resource'] });

    return () => {
      observer.disconnect();
      resourceObserver.disconnect();
    };
  }, []);
};