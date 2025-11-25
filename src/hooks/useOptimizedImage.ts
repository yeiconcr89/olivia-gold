import { useState, useEffect, useRef, useCallback } from 'react';

interface UseOptimizedImageOptions {
  src: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
  quality?: 'low' | 'medium' | 'high';
  format?: 'webp' | 'jpg' | 'png' | 'auto';
  sizes?: string;
  preload?: boolean;
}

interface OptimizedImageState {
  src: string;
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  isInView: boolean;
}

// ============================================================================
// OPTIMIZED IMAGE HOOK WITH LAZY LOADING AND FORMAT OPTIMIZATION
// ============================================================================

export const useOptimizedImage = (options: UseOptimizedImageOptions) => {
  const {
    src,
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE0cHgiIGZpbGw9IiNjY2MiPkNhcmdhbmRvLi4uPC90ZXh0Pjwvc3ZnPg==',
    threshold = 0.1,
    rootMargin = '50px',
    quality = 'medium',
    format = 'auto',
    sizes,
    preload = false,
  } = options;

  const [state, setState] = useState<OptimizedImageState>({
    src: placeholder,
    isLoading: false,
    isLoaded: false,
    hasError: false,
    isInView: false,
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate optimized image URL
  const getOptimizedSrc = useCallback((originalSrc: string) => {
    // Temporarily disable Cloudinary optimization to fix loading issues
    if (originalSrc.includes('cloudinary.com')) {
      return originalSrc; // Return original URL without optimization
    }
    
    // For non-Cloudinary images, return as-is
    return originalSrc;
  }, [quality, format]);

  // Preload image
  const preloadImage = useCallback((imageSrc: string) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${imageSrc}`));
      };
      
      // Set sizes attribute for responsive images
      if (sizes) {
        img.sizes = sizes;
      }
      
      img.src = imageSrc;
    });
  }, [sizes]);

  // Load image when in view
  const loadImage = useCallback(async () => {
    if (state.isLoading || state.isLoaded || !src) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const optimizedSrc = getOptimizedSrc(src);
      await preloadImage(optimizedSrc);
      
      setState(prev => ({
        ...prev,
        src: optimizedSrc,
        isLoading: false,
        isLoaded: true,
        hasError: false,
      }));
    } catch (error) {
      console.warn('Failed to load optimized image:', error);
      
      // Fallback to original image
      try {
        await preloadImage(src);
        setState(prev => ({
          ...prev,
          src,
          isLoading: false,
          isLoaded: true,
          hasError: false,
        }));
      } catch {
        // Use a generated placeholder as final fallback
        const placeholderSrc = `data:image/svg+xml;base64,${btoa(`
          <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f0f0f0"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" 
                  fill="#666" text-anchor="middle" dy=".3em">
              Imagen no disponible
            </text>
          </svg>
        `)}`;
        
        setState(prev => ({
          ...prev,
          src: placeholderSrc,
          isLoading: false,
          isLoaded: true,
          hasError: true,
        }));
      }
    }
  }, [src, state.isLoading, state.isLoaded, getOptimizedSrc, preloadImage]);

  // Intersection Observer setup
  useEffect(() => {
    if (!imgRef.current || preload) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setState(prev => ({ ...prev, isInView: true }));
            loadImage();
            
            // Stop observing once image is in view
            if (observerRef.current && entry.target) {
              observerRef.current.unobserve(entry.target);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, loadImage, preload]);

  // Preload immediately if preload is true
  useEffect(() => {
    if (preload && src && !state.isLoaded && !state.isLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadImage();
    }
  }, [preload, src, state.isLoaded, state.isLoading, loadImage]);

  // Retry loading
  const retry = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasError: false,
      isLoading: false,
      isLoaded: false,
    }));
    loadImage();
  }, [loadImage]);

  return {
    ...state,
    imgRef,
    retry,
  };
};

// ============================================================================
// BATCH IMAGE PRELOADER
// ============================================================================

export const useBatchImagePreloader = () => {
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const [isPreloading, setIsPreloading] = useState(false);

  const preloadImages = useCallback(async (urls: string[]) => {
    if (isPreloading) return;
    
    setIsPreloading(true);
    
    const promises = urls
      .filter(url => !preloadedImages.has(url))
      .map(async (url) => {
        try {
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = url;
          });
          
          setPreloadedImages(prev => new Set([...prev, url]));
          return url;
        } catch {
          console.warn(`Failed to preload image: ${url}`);
          return null;
        }
      });

    await Promise.allSettled(promises);
    setIsPreloading(false);
  }, [preloadedImages, isPreloading]);

  const isPreloaded = useCallback((url: string) => {
    return preloadedImages.has(url);
  }, [preloadedImages]);

  return {
    preloadImages,
    isPreloaded,
    isPreloading,
    preloadedCount: preloadedImages.size,
  };
};

// ============================================================================
// RESPONSIVE IMAGE SIZES GENERATOR
// ============================================================================

export const generateResponsiveSizes = (breakpoints: {
  mobile?: number;
  tablet?: number;
  desktop?: number;
  xl?: number;
}) => {
  const { mobile = 100, tablet = 50, desktop = 33, xl = 25 } = breakpoints;
  
  return [
    `(max-width: 640px) ${mobile}vw`,
    `(max-width: 768px) ${tablet}vw`, 
    `(max-width: 1024px) ${desktop}vw`,
    `${xl}vw`
  ].join(', ');
};

// ============================================================================
// IMAGE OPTIMIZATION UTILITIES
// ============================================================================

export const imageOptimization = {
  // Generate srcSet for responsive images
  generateSrcSet: (baseUrl: string, widths: number[]) => {
    if (!baseUrl.includes('cloudinary.com')) return '';
    
    return widths
      .map(width => {
        const optimizedUrl = baseUrl.replace(
          '/upload/',
          `/upload/f_auto,q_auto,w_${width},dpr_auto/`
        );
        return `${optimizedUrl} ${width}w`;
      })
      .join(', ');
  },
  
  // Get placeholder for specific dimensions
  getPlaceholder: (width: number, height: number, text = 'Cargando...') => {
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#f7f7f7"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
              font-family="monospace" font-size="14px" fill="#ccc">${text}</text>
      </svg>
    `)}`;
  },
  
  // Common responsive breakpoints
  breakpoints: {
    product: [300, 600, 900, 1200],
    hero: [640, 768, 1024, 1280, 1536],
    thumbnail: [150, 300],
    avatar: [50, 100, 150],
  },
};