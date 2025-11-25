import React from 'react';
import { useLazyImage } from '../hooks/useLazyImage';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
  onClick?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = '',
  threshold = 0.1,
  rootMargin = '50px',
  onClick
}) => {
  const { imgRef, imageSrc, isLoaded } = useLazyImage({
    src,
    placeholder,
    threshold,
    rootMargin
  });

  return (
    <div className="relative overflow-hidden">
      <img
        ref={imgRef}
        src={imageSrc || placeholder}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onClick={onClick}
        loading="lazy"
      />
      
      {/* Skeleton loader mientras carga */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-sm">Cargando...</div>
        </div>
      )}
      
      {/* Blur placeholder effect */}
      {!isLoaded && placeholder && (
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-sm scale-110"
          style={{ backgroundImage: `url(${placeholder})` }}
        />
      )}
    </div>
  );
};

export default LazyImage;