import React, { useState, useEffect } from 'react';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';
import { useToast } from '../hooks/useToast';
import { Loader2, Search, Check, FolderOpen } from 'lucide-react';
import type { CloudinaryUploadResult } from '../types/cloudinary';

interface CloudinaryGalleryProps {
  onImageSelect: (imageUrl: string) => void;
  folder?: 'products' | 'seo' | 'general';
  maxItems?: number;
  selectedImages?: string[]; // Lista de imágenes ya seleccionadas
  maxImages?: number; // Límite máximo de imágenes
}

const CloudinaryGallery: React.FC<CloudinaryGalleryProps> = ({
  onImageSelect,
  folder,
  maxItems = 50,
  selectedImages = [],
  maxImages = 5
}) => {
  const [images, setImages] = useState<CloudinaryUploadResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(folder);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { getGallery, error } = useCloudinaryUpload();
  const { success, warning, info } = useToast();
  
  // Función para manejar la selección con feedback completo
  const handleImageSelection = (imageUrl: string) => {
    // Verificar límite
    if (selectedImages.length >= maxImages) {
      warning(
        'Límite de imágenes alcanzado',
        `Ya tienes ${maxImages} imágenes. Elimina una para agregar otra.`
      );
      return;
    }
    
    // Verificar duplicados
    if (selectedImages.includes(imageUrl)) {
      info(
        'Imagen ya seleccionada',
        'Esta imagen ya está en tu lista de imágenes.'
      );
      return;
    }
    
    // Seleccionar imagen
    onImageSelect(imageUrl);
    
    // Feedback de éxito inmediato
    const newCount = selectedImages.length + 1;
    success(
      '¡Imagen seleccionada!',
      `Imagen ${newCount} de ${maxImages} agregada desde Cloudinary.`
    );
    
    // Información adicional si está cerca del límite
    if (newCount === maxImages) {
      info(
        'Límite completo',
        'Has alcanzado el límite máximo de imágenes.'
      );
    } else if (newCount === maxImages - 1) {
      info(
        'Una imagen más',
        'Puedes agregar solo 1 imagen más.'
      );
    }
  };
  
  useEffect(() => {
    const loadGallery = async () => {
      setLoading(true);
      try {
        const galleryImages = await getGallery(selectedFolder, maxItems);
        setImages(galleryImages);
      } catch (err) {
        console.error('Error cargando galería:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadGallery();
  }, [selectedFolder, maxItems, getGallery]);
  
  const filteredImages = images.filter(image => 
    image.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedFolder(value === 'all' ? undefined : value);
  };
  
  return (
    <div className="space-y-6">
      {/* Contador de imágenes seleccionadas */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              selectedImages.length === 0 
                ? 'bg-gray-200 text-gray-500' 
                : selectedImages.length >= maxImages 
                  ? 'bg-green-500 text-white' 
                  : 'bg-blue-500 text-white'
            }`}>
              {selectedImages.length}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {selectedImages.length} de {maxImages} imágenes seleccionadas
              </p>
              <p className="text-xs text-gray-600">
                {selectedImages.length === 0 
                  ? 'Haz clic en las imágenes para seleccionarlas'
                  : selectedImages.length >= maxImages 
                    ? '¡Límite completo!'
                    : `Puedes seleccionar ${maxImages - selectedImages.length} más`
                }
              </p>
            </div>
          </div>
          
          {/* Barra de progreso */}
          <div className="w-24">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  selectedImages.length >= maxImages ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${(selectedImages.length / maxImages) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-elegant-400" />
          <input
            type="text"
            placeholder="Buscar imágenes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <FolderOpen className="h-5 w-5 text-elegant-600" />
          <select
            value={selectedFolder || 'all'}
            onChange={handleFolderChange}
            className="px-4 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
          >
            <option value="all">Todas las carpetas</option>
            <option value="products">Productos</option>
            <option value="seo">SEO</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
          <span className="ml-3 text-elegant-600">Cargando imágenes...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium">Error al cargar la galería</p>
          <p className="text-sm text-red-600 mt-2">{error}</p>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="bg-elegant-50 border border-elegant-200 rounded-lg p-8 text-center">
          <p className="text-elegant-600">No se encontraron imágenes</p>
          {searchTerm && (
            <p className="text-sm text-elegant-500 mt-2">
              Intenta con otra búsqueda o selecciona otra carpeta
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredImages.map((image) => (
            <div 
              key={image.id}
              className="relative group cursor-pointer"
              onClick={() => handleImageSelection(image.url)}
            >
              <div className={`aspect-square bg-elegant-100 rounded-lg overflow-hidden border-2 transition-all ${
                selectedImages.includes(image.url)
                  ? 'border-green-500 bg-green-50' 
                  : 'border-transparent hover:border-gold-500'
              }`}>
                <img
                  src={image.url}
                  alt={image.id}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              </div>
              
              {/* Overlay con botón de selección o indicador de seleccionada */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 rounded-lg flex items-center justify-center">
                {selectedImages.includes(image.url) ? (
                  <div className="bg-green-500 text-white p-2 rounded-full shadow-lg">
                    <Check className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="opacity-0 group-hover:opacity-100 bg-gold-500 text-white p-2 rounded-full hover:bg-gold-600 transition-all transform hover:scale-110 shadow-lg">
                    <Check className="h-5 w-5" />
                  </div>
                )}
              </div>
              
              {/* Información de la imagen */}
              <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-white/20">
                <p className="truncate font-medium text-white">{image.id.split('/').pop()}</p>
                <p className="text-gray-200">{image.width}x{image.height} • {image.format.toUpperCase()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CloudinaryGallery;