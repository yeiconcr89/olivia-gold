import { useState, useCallback } from 'react';

interface UploadedFile {
  id: string;
  file: File;
  url: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface UseFileUploadOptions {
  maxFileSize?: number; // en MB
  acceptedTypes?: string[];
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const {
    maxFileSize = 5,
    acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    onUploadComplete,
    onUploadError
  } = options;

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Simular subida de archivo a servidor
  const simulateUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Simular tiempo de subida
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% de éxito
          // En producción, aquí recibirías la URL del servidor
          const mockUrl = URL.createObjectURL(file);
          resolve(mockUrl);
        } else {
          reject(new Error('Error al subir el archivo al servidor'));
        }
      }, 1000 + Math.random() * 2000);
    });
  };

  const validateFile = useCallback((file: File): string | null => {
    // Validar tipo
    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Formatos aceptados: ${acceptedTypes.map(type => type.split('/')[1]).join(', ')}`;
    }

    // Validar tamaño
    if (file.size > maxFileSize * 1024 * 1024) {
      return `El archivo es demasiado grande. Tamaño máximo: ${maxFileSize}MB`;
    }

    return null;
  }, [acceptedTypes, maxFileSize]);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const validationError = validateFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const fileId = `${Date.now()}-${Math.random()}`;
    const newFile: UploadedFile = {
      id: fileId,
      file,
      url: '',
      status: 'uploading',
      progress: 0
    };

    setUploadedFiles(prev => [...prev, newFile]);
    setIsUploading(true);

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, progress: Math.min(f.progress + Math.random() * 30, 90) }
            : f
        ));
      }, 200);

      // Subir archivo
      const url = await simulateUpload(file);
      
      clearInterval(progressInterval);
      
      // Actualizar estado
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'success', progress: 100, url }
          : f
      ));

      onUploadComplete?.(url);
      return url;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'error', progress: 0, error: errorMessage }
          : f
      ));

      onUploadError?.(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [validateFile, onUploadComplete, onUploadError]);

  const uploadMultipleFiles = useCallback(async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(file => uploadFile(file));
    
    try {
      const results = await Promise.allSettled(uploadPromises);
      const successfulUploads: string[] = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulUploads.push(result.value);
        } else {
          console.error(`Error uploading ${files[index].name}:`, result.reason);
        }
      });
      
      return successfulUploads;
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  }, [uploadFile]);

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove && fileToRemove.url) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter(f => f.id !== fileId);
    });
  }, []);

  const retryUpload = useCallback(async (fileId: string) => {
    const fileToRetry = uploadedFiles.find(f => f.id === fileId);
    if (!fileToRetry) return;

    try {
      await uploadFile(fileToRetry.file);
    } catch (error) {
      console.error('Error retrying upload:', error);
    }
  }, [uploadedFiles, uploadFile]);

  const clearAll = useCallback(() => {
    uploadedFiles.forEach(file => {
      if (file.url) {
        URL.revokeObjectURL(file.url);
      }
    });
    setUploadedFiles([]);
  }, [uploadedFiles]);

  return {
    uploadedFiles,
    isUploading,
    uploadFile,
    uploadMultipleFiles,
    removeFile,
    retryUpload,
    clearAll,
    validateFile
  };
};