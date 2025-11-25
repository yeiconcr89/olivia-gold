import { useState, useEffect, useRef } from 'react';

interface UseLazyImageOptions {
  src: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
}

export const useLazyImage = ({
  src,
  placeholder = '',
  threshold = 0.1,
  rootMargin = '100px'
}: UseLazyImageOptions) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholder);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  useEffect(() => {
    if (!isIntersecting || !src) return;

    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };

    img.onerror = () => {
      setImageSrc(placeholder || '/placeholder-image.jpg');
      setIsLoaded(true);
    };

    img.src = src;
  }, [isIntersecting, src, placeholder]);

  return {
    imgRef,
    imageSrc,
    isLoaded,
    isIntersecting
  };
};

export default useLazyImage;