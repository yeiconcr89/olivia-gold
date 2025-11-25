import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  folder?: 'products' | 'seo' | 'general';
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  images, 
  onImagesChange, 
  maxImages = 5,
  folder = 'products'
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Usar el hook de Cloudinary
  const { 
    uploadMultipleImages, 
    progress: uploadProgress, 
    error: cloudinaryError 
  } = useCloudinaryUpload();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    
    setIsUploading(true);
    setUploadError(null);

    const filesToUpload: File[] = [];
    const remainingSlots = maxImages - images.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        filesToUpload.push(file);
      }
    }
    
    if (filesToUpload.length === 0) {
      setIsUploading(false);
      return;
    }
    
    try {
      // Subir múltiples archivos a Cloudinary
      const uploadedImages = await uploadMultipleImages(filesToUpload, {
        folder,
        quality: 80,
        format: 'auto'
      });
      
      if (uploadedImages.length > 0) {
        const newImageUrls = uploadedImages.map(img => img.url);
        onImagesChange([...images, ...newImageUrls]);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Error al subir las imágenes');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleUrlAdd = (url: string) => {
    if (url.trim() && images.length < maxImages) {
      onImagesChange([...images, url.trim()]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragOver 
            ? 'border-gold-500 bg-gold-50' 
            : 'border-elegant-300 hover:border-gold-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <Upload className="h-12 w-12 text-elegant-400 mx-auto mb-4" />
        <h3 className="text-lg font-playfair font-semibold text-elegant-900 mb-2">
          Subir Imágenes
        </h3>
        <p className="text-elegant-600 font-lato mb-4">
          Arrastra y suelta imágenes aquí o haz clic para seleccionar
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-gradient-gold text-elegant-900 px-6 py-2 rounded-lg font-lato font-semibold hover:shadow-gold transition-all"
        >
          Seleccionar Archivos
        </button>
        <p className="text-sm text-elegant-500 font-lato mt-2">
          Máximo {maxImages} imágenes. Formatos: JPG, PNG, WebP
        </p>
      </div>

      {/* Estado de carga */}
      {isUploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
          <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-3" />
          <div>
            <p className="text-blue-700 font-medium">Subiendo imágenes...</p>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mensaje de error */}
      {(uploadError || cloudinaryError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Error al subir las imágenes</p>
          <p className="text-sm">{uploadError || cloudinaryError}</p>
        </div>
      )}
      
      {/* URL Input */}
      <div className="flex space-x-2">
        <input
          type="url"
          placeholder="O pega una URL de imagen..."
          className="flex-1 px-4 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 font-lato"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleUrlAdd((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
        />
        <button
          type="button"
          onClick={(e) => {
            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
            handleUrlAdd(input.value);
            input.value = '';
          }}
          className="px-4 py-2 bg-elegant-200 text-elegant-700 rounded-lg font-lato font-semibold hover:bg-elegant-300 transition-colors"
        >
          Agregar
        </button>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-elegant-100 rounded-lg overflow-hidden">
                <img
                  src={image}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-gold-500 text-white px-2 py-1 rounded text-xs font-bold">
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;