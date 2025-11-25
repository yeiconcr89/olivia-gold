import { useEffect } from 'react';

export const useImagePreloader = (imageUrls: string[]) => {
  useEffect(() => {
    imageUrls.forEach(url => {
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [imageUrls]);
};