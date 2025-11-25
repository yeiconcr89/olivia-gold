import React from 'react';
import { useOptimizedImage, generateResponsiveSizes, imageOptimization } from '../hooks/useOptimizedImage';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  quality?: 'low' | 'medium' | 'high';
  format?: 'webp' | 'jpg' | 'png' | 'auto';
  preload?: boolean;
  responsive?: boolean;
  breakpoints?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    xl?: number;
  };
  width?: number;
  height?: number;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
}

// ============================================================================
// OPTIMIZED IMAGE COMPONENT
// ============================================================================

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  quality = 'medium',
  format = 'auto',
  preload = false,
  responsive = true,
  breakpoints,
  width,
  height,
  onClick,
  onLoad,
  onError,
}) => {
  // Generate responsive sizes if responsive is enabled
  const sizes = responsive && breakpoints 
    ? generateResponsiveSizes(breakpoints)
    : undefined;

  // Generate placeholder if dimensions are provided
  const defaultPlaceholder = width && height 
    ? imageOptimization.getPlaceholder(width, height)
    : placeholder;

  const {
    src: currentSrc,
    isLoading,
    hasError,
    imgRef,
    retry,
  } = useOptimizedImage({
    src,
    placeholder: defaultPlaceholder,
    quality,
    format,
    sizes,
    preload,
  });

  // Generate srcSet for responsive images
  const srcSet = responsive && src.includes('cloudinary.com')
    ? imageOptimization.generateSrcSet(src, imageOptimization.breakpoints.product)
    : undefined;

  const handleLoad = () => {
    onLoad?.();
  };

  const handleError = () => {
    onError?.();
  };

  const handleRetry = () => {
    retry();
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        ref={imgRef}
        src={currentSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        className={`
          transition-all duration-300 ease-in-out
          ${isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}
          ${hasError ? 'opacity-50' : ''}
          ${onClick ? 'cursor-pointer' : ''}
          w-full h-full object-cover
        `}
        onClick={onClick}
        onLoad={handleLoad}
        onError={handleError}
        loading={preload ? 'eager' : 'lazy'}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-500">
          <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm mb-2">Error al cargar imagen</p>
          <button
            onClick={handleRetry}
            className="px-3 py-1 text-xs bg-gold-500 text-white rounded hover:bg-gold-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}
      
      {/* Loading progress indicator */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div className="h-full bg-gold-500 animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SPECIALIZED IMAGE COMPONENTS
// ============================================================================

// Product image with optimized settings
export const ProductImage: React.FC<Omit<OptimizedImageProps, 'breakpoints' | 'quality'>> = (props) => (
  <OptimizedImage
    {...props}
    quality="high"
    breakpoints={{
      mobile: 100,
      tablet: 50,
      desktop: 33,
      xl: 25,
    }}
  />
);

// Hero image with high quality
export const HeroImage: React.FC<Omit<OptimizedImageProps, 'breakpoints' | 'quality' | 'preload'>> = (props) => (
  <OptimizedImage
    {...props}
    quality="high"
    preload={true}
    breakpoints={{
      mobile: 100,
      tablet: 100,
      desktop: 100,
      xl: 100,
    }}
  />
);

// Thumbnail with low quality for fast loading
export const ThumbnailImage: React.FC<Omit<OptimizedImageProps, 'breakpoints' | 'quality'>> = (props) => (
  <OptimizedImage
    {...props}
    quality="medium"
    breakpoints={{
      mobile: 25,
      tablet: 20,
      desktop: 15,
      xl: 10,
    }}
  />
);

// Avatar image
export const AvatarImage: React.FC<Omit<OptimizedImageProps, 'breakpoints' | 'quality' | 'responsive'>> = (props) => (
  <OptimizedImage
    {...props}
    quality="medium"
    responsive={false}
  />
);

// Gallery image with medium quality
export const GalleryImage: React.FC<Omit<OptimizedImageProps, 'breakpoints' | 'quality'>> = (props) => (
  <OptimizedImage
    {...props}
    quality="high"
    breakpoints={{
      mobile: 100,
      tablet: 50,
      desktop: 33,
      xl: 25,
    }}
  />
);

export default OptimizedImage;