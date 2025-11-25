// Utilidades para manejo de archivos

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      reject(new Error('El archivo no es una imagen'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    reader.readAsDataURL(file);
  });
};

export const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      reject(new Error('El archivo no es una imagen'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo la proporción
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Dibujar imagen redimensionada
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convertir a blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Error al comprimir la imagen'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };

    img.src = URL.createObjectURL(file);
  });
};

export const validateImageDimensions = (file: File, minWidth?: number, minHeight?: number): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      reject(new Error('El archivo no es una imagen'));
      return;
    }

    const img = new Image();
    img.onload = () => {
      const isValid = (!minWidth || img.width >= minWidth) && (!minHeight || img.height >= minHeight);
      resolve(isValid);
    };
    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };
    img.src = URL.createObjectURL(file);
  });
};

// Tipos de archivo permitidos por categoría
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  documents: ['application/pdf', 'text/plain', 'application/msword'],
  videos: ['video/mp4', 'video/webm', 'video/ogg']
};

// Tamaños máximos recomendados (en MB)
export const MAX_FILE_SIZES = {
  image: 5,
  document: 10,
  video: 50
};

// Configuraciones de compresión por tipo de uso
export const COMPRESSION_SETTINGS = {
  thumbnail: { maxWidth: 300, quality: 0.7 },
  preview: { maxWidth: 800, quality: 0.8 },
  full: { maxWidth: 1920, quality: 0.9 }
};