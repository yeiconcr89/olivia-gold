import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG, apiRequest, createAuthHeaders } from '../config/api';
import type { 
  CloudinaryUploadOptions, 
  CloudinaryUploadResult, 
  CloudinaryUploadResponse,
  CloudinaryMultipleUploadResponse,
  CloudinaryGalleryResponse
} from '../types/cloudinary';

export const useCloudinaryUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // Auto-clear error after 10 seconds
  const setErrorWithTimeout = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 10000);
  };

  const uploadSingleImage = useCallback(async (
    file: File,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult | null> => {
    if (!token) {
      setErrorWithTimeout('No estás autenticado');
      return null;
    }

    // Validaciones del archivo
    if (!file) {
      setErrorWithTimeout('No se ha seleccionado ningún archivo');
      return null;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      setErrorWithTimeout('El archivo es demasiado grande. Máximo 5MB permitido');
      return null;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setErrorWithTimeout('Tipo de archivo no permitido. Solo se permiten JPEG, PNG, WebP y GIF');
      return null;
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);  // Usar 'image' como nombre del campo
      
      // Agregar opciones
      if (options.folder) formData.append('folder', options.folder);
      if (options.quality) formData.append('quality', options.quality.toString());
      if (options.width) formData.append('width', options.width.toString());
      if (options.height) formData.append('height', options.height.toString());
      if (options.format) formData.append('format', options.format);

      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = Math.min(prev + Math.random() * 15, 90);
          return newProgress;
        });
      }, 200);

      const response = await apiRequest<CloudinaryUploadResponse>(API_CONFIG.ENDPOINTS.UPLOAD.SINGLE, {
        method: 'POST',
        headers: createAuthHeaders(token || undefined),
        body: formData,
        timeout: 10000,
      });

      clearInterval(progressInterval);

      const data = response;
      setProgress(100);
      
      return data.image;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 
                          err?.message || 
                          'Error desconocido al subir la imagen';
      setErrorWithTimeout(errorMessage);
      console.error('Error uploading single image:', err);
      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 1000); // Reset progress after delay
    }
  }, [token]);

  const uploadMultipleImages = useCallback(async (
    files: File[],
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult[]> => {
    if (!token) {
      setErrorWithTimeout('No estás autenticado');
      return [];
    }

    // Validaciones de archivos múltiples
    if (!files || files.length === 0) {
      setErrorWithTimeout('No se han seleccionado archivos');
      return [];
    }

    if (files.length > 10) {
      setErrorWithTimeout('Máximo 10 archivos permitidos por subida');
      return [];
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setErrorWithTimeout(`${invalidFiles.length} archivos tienen formato no válido. Solo se permiten JPEG, PNG, WebP y GIF`);
      return [];
    }

    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setErrorWithTimeout(`${oversizedFiles.length} archivos son demasiado grandes. Máximo 5MB por archivo`);
      return [];
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      
      // Agregar todos los archivos
      files.forEach((file) => {
        formData.append('images', file);
      });
      
      // Agregar opciones
      if (options.folder) formData.append('folder', options.folder);
      if (options.quality) formData.append('quality', options.quality.toString());
      if (options.width) formData.append('width', options.width.toString());
      if (options.height) formData.append('height', options.height.toString());
      if (options.format) formData.append('format', options.format);

      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = Math.min(prev + Math.random() * 10, 90);
          return newProgress;
        });
      }, 300);

      const response = await apiRequest<CloudinaryMultipleUploadResponse>(API_CONFIG.ENDPOINTS.UPLOAD.MULTIPLE, {
        method: 'POST',
        headers: createAuthHeaders(token || undefined),
        body: formData,
        timeout: 15000,
      });

      clearInterval(progressInterval);

      const data = response;
      setProgress(100);
      
      if (data.failed && data.failed.length > 0) {
        setError(`${data.failed.length} imágenes fallaron al subir`);
      }
      
      return data.successful || [];
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 
                          err?.message || 
                          'Error desconocido al subir las imágenes';
      setErrorWithTimeout(errorMessage);
      console.error('Error uploading multiple images:', err);
      return [];
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 1000); // Reset progress after delay
    }
  }, [token]);

  const deleteImage = useCallback(async (publicId: string): Promise<boolean> => {
    if (!token) {
      setErrorWithTimeout('No estás autenticado');
      return false;
    }

    try {
      await apiRequest<void>(API_CONFIG.ENDPOINTS.UPLOAD.DELETE(publicId), {
         method: 'DELETE',
         headers: {
           ...createAuthHeaders(token || undefined),
           'Content-Type': 'application/json',
         },
         timeout: 8000,
       });

       return true;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 
                          err?.message || 
                          'Error desconocido al eliminar la imagen';
      setErrorWithTimeout(errorMessage);
      console.error('Error deleting image:', err);
      return false;
    }
  }, [token]);

  const getGallery = useCallback(async (folder?: string, limit = 50): Promise<CloudinaryUploadResult[]> => {
    if (!token) {
      setErrorWithTimeout('No estás autenticado');
      return [];
    }

    try {
      let url = API_CONFIG.ENDPOINTS.UPLOAD.GALLERY + `?limit=${limit}`;
      if (folder) {
        url += `&folder=${folder}`;
      }

      const data = await apiRequest<CloudinaryGalleryResponse>(url, {
        method: 'GET',
        headers: {
          ...createAuthHeaders(token || undefined),
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      });

      return data.images || [];
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 
                          err?.message || 
                          'Error desconocido al obtener la galería';
      setErrorWithTimeout(errorMessage);
      console.error('Error fetching gallery:', err);
      return [];
    }
  }, [token]);

  return {
    uploadSingleImage,
    uploadMultipleImages,
    deleteImage,
    getGallery,
    isUploading,
    progress,
    error,
    resetError: () => setError(null),
  };
};