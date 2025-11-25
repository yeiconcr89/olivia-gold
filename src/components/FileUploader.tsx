import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, File, Check, AlertCircle, Camera, FolderOpen, Link, Grid, Star } from 'lucide-react';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';
import { useToast } from '../hooks/useToast';
import CloudinaryGallery from './CloudinaryGallery';
import Notification from './Notification';

// Función para extraer el nombre de la imagen de una URL
const getImageNameFromUrl = (url: string): string => {
  try {
    // Extraer el nombre del archivo de la URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'imagen';
    
    // Decodificar el nombre del archivo y eliminar la extensión
    const decodedName = decodeURIComponent(filename);
    const nameWithoutExtension = decodedName.split('.').slice(0, -1).join('.');
    
    // Si el nombre es muy largo, truncarlo
    return nameWithoutExtension.length > 20
      ? nameWithoutExtension.substring(0, 20) + '...'
      : nameWithoutExtension || 'imagen';
  } catch {
    // Si hay algún error al procesar la URL, devolver un nombre genérico
    return 'imagen';
  }
};

interface FileUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  maxFileSize?: number; // en MB
  acceptedTypes?: string[];
  folder?: 'products' | 'seo' | 'general';
}

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  images, 
  onImagesChange, 
  maxImages = 5,
  maxFileSize = 5, // 5MB por defecto
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  folder = 'products'
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Hooks
  const { success, error, warning, info } = useToast();
  
  // Usar el hook de Cloudinary
  const { 
    uploadSingleImage, 
    uploadMultipleImages
  } = useCloudinaryUpload();

  const validateFile = (file: File): string | null => {
    // Validar tipo de archivo
    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Formatos aceptados: ${acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}`;
    }

    // Validar tamaño
    if (file.size > maxFileSize * 1024 * 1024) {
      return `El archivo es demasiado grande. Tamaño máximo: ${maxFileSize}MB`;
    }

    // Validar límite de archivos
    if (images.length + uploadedFiles.length >= maxImages) {
      return `Máximo ${maxImages} imágenes permitidas`;
    }

    return null;
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;

    // Verificar límite antes de procesar
    if (images.length >= maxImages) {
      warning(
        'Límite de imágenes alcanzado',
        `Ya tienes ${maxImages} imágenes. Elimina una para agregar otra.`
      );
      return;
    }

    // Feedback inmediato al seleccionar archivos
    const filesArray = Array.from(files);
    const validFiles = filesArray.filter(file => !validateFile(file));
    const totalAfterUpload = images.length + validFiles.length;
    
    if (totalAfterUpload > maxImages) {
      warning(
        'Demasiadas imágenes',
        `Solo puedes agregar ${maxImages - images.length} imagen(es) más. Seleccionaste ${filesArray.length}.`
      );
      return;
    }

    if (validFiles.length > 0) {
      info(
        'Subiendo imágenes...',
        `Procesando ${validFiles.length} imagen(es). Por favor espera.`
      );
    }

    setNotification({ show: false, message: '', type: 'success' });
    const newFiles: UploadedFile[] = [];
    const filesToUpload: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateFile(file);
      
      if (validationError) {
        error(
          `Error en ${file.name}`,
          validationError
        );
        continue;
      }

      const fileId = `${Date.now()}-${i}`;
      const preview = URL.createObjectURL(file);
      
      newFiles.push({
        id: fileId,
        file,
        preview,
        status: 'uploading',
        progress: 0
      });
      
      filesToUpload.push(file);
    }

    if (newFiles.length === 0) return;

    setUploadedFiles(prev => [...prev, ...newFiles]);

    try {
      // Subir múltiples archivos a Cloudinary
      const uploadedImages = await uploadMultipleImages(filesToUpload, {
        folder,
        quality: 80,
        format: 'auto'
      });
      
      // Actualizar estado de archivos subidos
      for (let i = 0; i < newFiles.length; i++) {
        const uploadFile = newFiles[i];
        const uploadedImage = uploadedImages[i];
        
        if (uploadedImage) {
          // Actualizar estado a éxito
          setUploadedFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'success', progress: 100 }
              : f
          ));
          
          // Agregar URL a la lista de imágenes
          const newImagesList = [...images, uploadedImage.url];
          onImagesChange(newImagesList);
          
          // Feedback de éxito inmediato
          success(
            'Imagen subida exitosamente',
            `Imagen ${newImagesList.length} de ${maxImages} agregada desde tu PC.`
          );
        } else {
          // Manejar error
          setUploadedFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { 
                  ...f, 
                  status: 'error', 
                  progress: 0,
                  error: 'Error al subir la imagen'
                }
              : f
          ));
          
          error(
            'Error al subir imagen',
            `No se pudo subir ${uploadFile.file.name}. Inténtalo de nuevo.`
          );
        }
      }
    } catch (error) {
      // Manejar error general
      newFiles.forEach(uploadFile => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { 
                ...f, 
                status: 'error', 
                progress: 0,
                error: error instanceof Error ? error.message : 'Error desconocido'
              }
            : f
        ));
      });
    }
  }, [images, onImagesChange, maxImages, folder, uploadMultipleImages, error, info, success, validateFile, warning]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleUrlAdd = () => {
    if (!urlInput.trim()) {
      warning('URL requerida', 'Por favor ingresa una URL válida.');
      return;
    }
    
    if (images.length >= maxImages) {
      warning(
        'Límite de imágenes alcanzado',
        `Ya tienes ${maxImages} imágenes. Elimina una para agregar otra.`
      );
      return;
    }
    
    // Verificar si la URL ya existe
    if (images.includes(urlInput.trim())) {
      info('URL ya agregada', 'Esta URL ya está en tu lista de imágenes.');
      return;
    }
    
    // Validar que sea una URL válida
    try {
      new URL(urlInput.trim());
      const newImages = [...images, urlInput.trim()];
      onImagesChange(newImages);
      setUrlInput('');
      setShowUrlInput(false);
      
      success(
        'Imagen agregada desde URL',
        `Imagen ${newImages.length} de ${maxImages} agregada exitosamente.`
      );
    } catch {
      error('URL inválida', 'Por favor ingresa una URL válida (debe empezar con http:// o https://).');
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    
    // Feedback al eliminar
    success(
      'Imagen eliminada',
      `Imagen eliminada. Ahora tienes ${newImages.length} de ${maxImages} imágenes.`
    );
  };

  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const retryUpload = async (fileId: string) => {
    const fileToRetry = uploadedFiles.find(f => f.id === fileId);
    if (!fileToRetry) return;

    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'uploading', progress: 0, error: undefined }
        : f
    ));

    try {
      // Usar Cloudinary para subir la imagen
      const uploadedImage = await uploadSingleImage(fileToRetry.file, {
        folder,
        quality: 80,
        format: 'auto'
      });
      
      if (uploadedImage) {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'success', progress: 100 }
            : f
        ));

        onImagesChange([...images, uploadedImage.url]);
      } else {
        throw new Error('Error al subir la imagen');
      }
    } catch (error) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              status: 'error', 
              progress: 0,
              error: error instanceof Error ? error.message : 'Error desconocido'
            }
          : f
      ));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Contador de imágenes prominente */}
      <div className="bg-gradient-to-r from-elegant-50 to-gold-50 border border-elegant-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              images.length === 0 
                ? 'bg-elegant-200 text-elegant-500' 
                : images.length >= maxImages 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gold-500 text-white'
            }`}>
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-elegant-900">
                Imágenes seleccionadas: {images.length} de {maxImages}
              </p>
              <p className="text-sm text-elegant-600">
                {images.length === 0 
                  ? 'Selecciona las imágenes de tu producto'
                  : images.length >= maxImages 
                    ? '¡Límite completo! Elimina una imagen para agregar otra'
                    : `Puedes agregar ${maxImages - images.length} imagen(es) más`
                }
              </p>
            </div>
          </div>
          
          {/* Barra de progreso visual */}
          <div className="flex-1 max-w-32 ml-4">
            <div className="w-full bg-elegant-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  images.length >= maxImages ? 'bg-green-500' : 'bg-gold-500'
                }`}
                style={{ width: `${(images.length / maxImages) * 100}%` }}
              />
            </div>
            <p className="text-xs text-elegant-500 text-center mt-1">
              {Math.round((images.length / maxImages) * 100)}%
            </p>
          </div>
        </div>
      </div>

      {/* Upload Area Principal - Mejorada */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer overflow-hidden ${
          dragOver 
            ? 'border-gold-500 bg-gradient-to-br from-gold-50 to-gold-100 scale-[1.02] shadow-gold' 
            : 'border-elegant-300 hover:border-gold-400 hover:bg-gradient-to-br hover:from-elegant-50 hover:to-gold-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        {/* Efecto de fondo animado */}
        {dragOver && (
          <div className="absolute inset-0 bg-gradient-to-r from-gold-400/20 via-gold-500/30 to-gold-400/20 animate-pulse"></div>
        )}
        
        <div className="relative z-10 space-y-6">
          {/* Icono principal con animación */}
          <div className="relative">
            <div className={`w-24 h-24 bg-gradient-gold rounded-full flex items-center justify-center mx-auto transition-all duration-500 ${
              dragOver ? 'scale-110 shadow-2xl rotate-12' : 'hover:scale-105 hover:shadow-gold'
            }`}>
              <Upload className={`h-12 w-12 text-elegant-900 transition-all duration-300 ${
                dragOver ? 'animate-bounce scale-110' : ''
              }`} />
            </div>
            {dragOver && (
              <div className="absolute inset-0 bg-gold-400 rounded-full animate-ping opacity-40"></div>
            )}
          </div>
          
          <div className="space-y-4">
            <h3 className={`text-2xl admin-heading transition-all duration-300 ${
              dragOver ? 'text-gold-800 scale-105' : 'text-elegant-900'
            }`}>
              {dragOver ? '¡Suelta las imágenes aquí!' : 'Subir Imágenes de Productos'}
            </h3>
            
            <p className="admin-body text-elegant-600 max-w-md mx-auto leading-relaxed">
              {dragOver 
                ? 'Perfecto, suelta los archivos para comenzar la subida automática'
                : 'Arrastra y suelta archivos desde tu computadora o haz clic para seleccionar'
              }
            </p>
            
            {/* Botones de acción principales */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="flex items-center space-x-3 bg-gradient-gold text-elegant-900 px-8 py-4 rounded-xl admin-button hover:shadow-gold transition-all transform hover:scale-105 font-semibold"
              >
                <FolderOpen className="h-6 w-6" />
                <span>Seleccionar desde PC</span>
              </button>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGallery(!showGallery);
                  setShowUrlInput(false);
                }}
                className="flex items-center space-x-3 bg-purple-600 text-white px-8 py-4 rounded-xl admin-button hover:bg-purple-700 transition-all transform hover:scale-105 font-semibold"
              >
                <Grid className="h-6 w-6" />
                <span>Galería de Cloudinary</span>
              </button>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUrlInput(!showUrlInput);
                  setShowGallery(false);
                }}
                className="flex items-center space-x-3 border-2 border-elegant-300 text-elegant-700 px-8 py-4 rounded-xl admin-button hover:border-gold-500 hover:bg-gold-50 hover:text-gold-700 transition-all transform hover:scale-105"
              >
                <Link className="h-6 w-6" />
                <span>Agregar por URL</span>
              </button>
            </div>
          </div>
          
          {/* Información de límites mejorada */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-elegant-200 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm admin-body text-elegant-600">
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-gold-500 rounded-full"></span>
                <span>Máximo {maxImages} imágenes</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Hasta {maxFileSize}MB por archivo</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>{acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Galería de Cloudinary */}
      {showGallery && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="admin-subheading flex items-center text-purple-900">
              <Grid className="h-5 w-5 mr-2" />
              Galería de Cloudinary
            </h4>
            <button
              onClick={() => setShowGallery(false)}
              className="p-1 hover:bg-purple-200 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-purple-600" />
            </button>
          </div>
          
          <CloudinaryGallery 
            onImageSelect={(imageUrl) => {
              console.log('🖼️ FileUploader: Imagen seleccionada de Cloudinary:', imageUrl);
              console.log('🖼️ FileUploader: Imágenes actuales antes de agregar:', images);
              
              // Agregar la imagen (las validaciones ya están en CloudinaryGallery)
              const newImages = [...images, imageUrl];
              console.log('🖼️ FileUploader: Nuevas imágenes después de agregar:', newImages);
              
              onImagesChange(newImages);
               
               // Cerrar la galería si se alcanza el límite
               const newCount = images.length + 1;
               if (newCount >= maxImages) {
                 setTimeout(() => {
                   setShowGallery(false);
                 }, 1000); // Delay para que el usuario vea el feedback
               }
             }}
             folder={folder}
            selectedImages={images}
            maxImages={maxImages}
          />
        </div>
      )}
      
      {/* Input de URL mejorado */}
      {showUrlInput && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="admin-subheading flex items-center text-blue-900">
              <Link className="h-5 w-5 mr-2" />
              Agregar Imagen por URL
            </h4>
            <button
              onClick={() => setShowUrlInput(false)}
              className="p-1 hover:bg-blue-200 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-blue-600" />
            </button>
          </div>
          
          <div className="flex space-x-3">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="flex-1 px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 admin-input bg-white"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleUrlAdd();
                }
              }}
            />
            <button
              type="button"
              onClick={handleUrlAdd}
              disabled={!urlInput.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg admin-button hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Agregar
            </button>
          </div>
          
          <div className="bg-blue-100 rounded-lg p-3">
            <p className="text-sm admin-body text-blue-800">
              💡 <strong>Tip:</strong> Asegúrate de que la URL sea accesible públicamente y apunte directamente a una imagen (JPG, PNG, WebP, etc.)
            </p>
          </div>
        </div>
      )}

      {/* Progress de archivos subiendo - Mejorado */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="admin-subheading flex items-center">
              <Upload className="h-5 w-5 mr-2 text-gold-600" />
              Subiendo Archivos
            </h4>
            <div className="flex items-center space-x-2 text-sm admin-body text-elegant-600">
              <div className="w-2 h-2 bg-gold-500 rounded-full animate-pulse"></div>
              <span>{uploadedFiles.filter(f => f.status === 'uploading').length} en progreso</span>
            </div>
          </div>
          
          {uploadedFiles.map((file) => (
            <div key={file.id} className="bg-white border border-elegant-200 rounded-xl p-4 transition-all hover:shadow-elegant">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-elegant-100 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                  {file.status === 'success' ? (
                    <div className="w-full h-full bg-green-100 flex items-center justify-center">
                      <Check className="h-7 w-7 text-green-600" />
                    </div>
                  ) : file.status === 'error' ? (
                    <div className="w-full h-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="h-7 w-7 text-red-600" />
                    </div>
                  ) : (
                    <>
                      <File className="h-7 w-7 text-elegant-600" />
                      <div 
                        className="absolute inset-0 bg-gold-500 transition-all duration-300"
                        style={{ 
                          width: `${file.progress}%`,
                          background: 'linear-gradient(90deg, rgba(255,215,0,0.3) 0%, rgba(218,165,32,0.5) 100%)'
                        }}
                      ></div>
                    </>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="admin-body font-semibold text-elegant-900 truncate">
                      {file.file.name}
                    </p>
                    <span className="text-xs admin-body text-elegant-500 bg-elegant-100 px-2 py-1 rounded-full">
                      {formatFileSize(file.file.size)}
                    </span>
                  </div>
                  
                  {file.status === 'uploading' && (
                    <div className="space-y-2">
                      <div className="w-full bg-elegant-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-gold h-2 rounded-full transition-all duration-300 relative"
                          style={{ width: `${file.progress}%` }}
                        >
                          <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs admin-body text-elegant-600">
                          Subiendo... {Math.round(file.progress)}%
                        </p>
                        <div className="flex space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 h-1 bg-gold-500 rounded-full animate-pulse"
                              style={{ animationDelay: `${i * 0.2}s` }}
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {file.status === 'success' && (
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full w-full"></div>
                      </div>
                      <p className="admin-body text-green-600 flex items-center whitespace-nowrap">
                        <Check className="h-4 w-4 mr-1" />
                        Completado
                      </p>
                    </div>
                  )}
                  
                  {file.status === 'error' && (
                    <div className="space-y-2">
                      <p className="admin-body text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {file.error}
                      </p>
                      <button
                        onClick={() => retryUpload(file.id)}
                        className="text-xs text-gold-600 hover:text-gold-700 admin-button bg-gold-50 px-3 py-1 rounded-full hover:bg-gold-100 transition-colors"
                      >
                        Reintentar subida
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => removeUploadedFile(file.id)}
                  className="p-2 hover:bg-red-100 text-red-500 rounded-full transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview de imágenes subidas - Mejorado */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="admin-subheading flex items-center">
              <Camera className="h-5 w-5 mr-2 text-gold-600" />
              Imágenes del Producto ({images.length}/{maxImages})
            </h4>
            {images.length > 1 && (
              <div className="flex items-center space-x-2 text-sm admin-body text-elegant-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Arrastra para reordenar</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-elegant-100 rounded-xl overflow-hidden shadow-elegant hover:shadow-gold transition-all duration-300 border-2 border-transparent hover:border-gold-300">
                  <img
                    src={image}
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yIGFsIGNhcmdhcjwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                </div>
                
                {/* Overlay con acciones mejorado */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 rounded-xl flex items-center justify-center">
                  <button
                    onClick={() => removeImage(index)}
                    className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-all transform hover:scale-110 shadow-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Badge de imagen principal mejorado */}
                {index === 0 && (
                  <div className="absolute top-3 left-3 bg-gradient-gold text-elegant-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg border border-gold-300">
                    ⭐ Principal
                  </div>
                )}
                
                {/* Información de la imagen mejorada */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-elegant-900/90 to-elegant-900/40 backdrop-blur-sm px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center space-x-2">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-white text-xs font-medium truncate">
                    {getImageNameFromUrl(image)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips de optimización mejorados */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <h5 className="admin-subheading text-blue-900 mb-4 flex items-center">
          💡 Consejos para Imágenes Profesionales
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 admin-body text-blue-800">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-700 text-xs font-bold">1</span>
              </div>
              <div>
                <p className="font-semibold">Resolución Alta</p>
                <p className="text-sm">Mínimo 800x800px para mejor calidad</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-700 text-xs font-bold">2</span>
              </div>
              <div>
                <p className="font-semibold">Múltiples Ángulos</p>
                <p className="text-sm">Incluye diferentes vistas del producto</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-700 text-xs font-bold">3</span>
              </div>
              <div>
                <p className="font-semibold">Buena Iluminación</p>
                <p className="text-sm">Luz natural o iluminación profesional</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-700 text-xs font-bold">4</span>
              </div>
              <div>
                <p className="font-semibold">Formato Correcto</p>
                <p className="text-sm">JPEG para fotos, PNG para transparencias</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-700 text-xs font-bold">5</span>
              </div>
              <div>
                <p className="font-semibold">Imagen Principal</p>
                <p className="text-sm">La primera imagen aparece en el catálogo</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-700 text-xs font-bold">6</span>
              </div>
              <div>
                <p className="font-semibold">Tamaño Optimizado</p>
                <p className="text-sm">Comprime para carga rápida</p>
              </div>
            </div>
          </div>
        </div>
        {/* Lista de imágenes cargadas */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div key={`image-${index}-${imageUrl.split('/').pop()}`} className="relative group">
              <img
                src={imageUrl}
                alt={`Imagen ${index + 1}`}
                className={`w-full h-32 object-cover rounded-lg border-2
                  ${index === 0 ? 'border-gold-500' : 'border-transparent'}`}
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (index !== 0) {
                      // Reordenar array: mover la imagen seleccionada al inicio
                      const newImages = [...images];
                      const selectedImage = newImages.splice(index, 1)[0];
                      newImages.unshift(selectedImage);
                      onImagesChange(newImages);
                    }
                  }}
                  className={`p-1 rounded-full ${
                    index === 0 ? 'bg-gold-500' : 'bg-white'
                  }`}
                  title={index === 0 ? 'Imagen principal' : 'Establecer como principal'}
                >
                  <Star className={`w-4 h-4 ${
                    index === 0 ? 'text-white' : 'text-gold-500'
                  }`} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const newImages = [...images];
                    newImages.splice(index, 1);
                    onImagesChange(newImages);
                    // Si eliminamos la primera imagen, la nueva primera se convierte en principal
                  }}
                  className="p-1 rounded-full bg-red-500"
                  title="Eliminar imagen"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-gold-500 text-white text-xs px-2 py-1 rounded-full">
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Notificación */}
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
};

export default FileUploader;