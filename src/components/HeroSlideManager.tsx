import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, CheckCircle, XCircle, Loader2, AlertCircle, Image, X } from 'lucide-react';
import { useHeroSlider, HeroSlide, CreateHeroSlideData, UpdateHeroSlideData } from '../hooks/useHeroSlider';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from '../hooks/useToast';

import FileUploader from './FileUploader';

interface HeroSlideFormData {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  offerText: string;
  isActive: boolean;
}

interface HeroSlideManagerProps {
  // Funciones de toast del componente padre (AdminDashboard)
  toastActions?: {
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
  };
}

const HeroSlideManager: React.FC<HeroSlideManagerProps> = ({ toastActions }) => {
  const {
    slides,
    loading,
    error,
    fetchAllSlides,
    createSlide,
    updateSlide,
    deleteSlide,
    reorderSlides,
    toggleSlideStatus
  } = useHeroSlider({
    externalToast: toastActions,
    manualInit: true // No hacer llamados automáticos en admin
  });
  
  // Solo usar toast interno para errores locales si no hay toastActions externas
  const internalToast = useToast();
  const showError = toastActions?.error || internalToast.error;
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState<HeroSlide | null>(null);
  const [formData, setFormData] = useState<HeroSlideFormData>({
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    ctaText: '',
    ctaLink: '',
    offerText: '',
    isActive: true
  });
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Cargar todos los slides al montar el componente
  useEffect(() => {
    fetchAllSlides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo cargar una vez al montar

  const handleAddSlide = () => {
    setSelectedSlide(null);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      imageUrl: '',
      ctaText: '',
      ctaLink: '',
      offerText: '',
      isActive: true
    });
    setIsFormOpen(true);
  };

  const handleEditSlide = (slide: HeroSlide) => {
    setSelectedSlide(slide);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle,
      description: slide.description,
      imageUrl: slide.imageUrl,
      ctaText: slide.ctaText,
      ctaLink: slide.ctaLink || '',
      offerText: slide.offerText || '',
      isActive: slide.isActive
    });
    setIsFormOpen(true);
  };

  const handleDeleteSlide = (slide: HeroSlide) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Slide',
      message: `¿Estás seguro de que deseas eliminar el slide "${slide.title}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        const result = await deleteSlide(slide.id);
        if (!result) {
          showError('Error al eliminar', 'No se pudo eliminar el slide. Inténtalo de nuevo.');
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
      type: 'danger'
    });
  };

  const handleToggleStatus = async (slide: HeroSlide) => {
    const result = await toggleSlideStatus(slide.id);
    if (!result) {
      showError('Error al cambiar estado', 'No se pudo cambiar el estado del slide. Inténtalo de nuevo.');
    }
  };

  const handleMoveUp = async (slide: HeroSlide, index: number) => {
    if (index === 0) return;
    
    const newSlides = [...slides];
    const prevSlide = newSlides[index - 1];
    
    const reorderData = [
      { id: slide.id, orderIndex: prevSlide.orderIndex },
      { id: prevSlide.id, orderIndex: slide.orderIndex }
    ];
    
    const result = await reorderSlides(reorderData);
    if (!result) {
      showError('Error al reordenar', 'No se pudo actualizar el orden de los slides. Inténtalo de nuevo.');
    }
  };

  const handleMoveDown = async (slide: HeroSlide, index: number) => {
    if (index === slides.length - 1) return;
    
    const newSlides = [...slides];
    const nextSlide = newSlides[index + 1];
    
    const reorderData = [
      { id: slide.id, orderIndex: nextSlide.orderIndex },
      { id: nextSlide.id, orderIndex: slide.orderIndex }
    ];
    
    const result = await reorderSlides(reorderData);
    if (!result) {
      showError('Error al reordenar', 'No se pudo actualizar el orden de los slides. Inténtalo de nuevo.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos requeridos
    if (!formData.title || !formData.subtitle || !formData.description || !formData.imageUrl) {
      showError('Campos incompletos', 'Por favor completa todos los campos requeridos.');
      return;
    }
    
    try {
      if (selectedSlide) {
        // Actualizar slide existente
        const slideData: UpdateHeroSlideData = {
          title: formData.title,
          subtitle: formData.subtitle,
          description: formData.description,
          imageUrl: formData.imageUrl,
          ctaText: formData.ctaText,
          ctaLink: formData.ctaLink || undefined,
          offerText: formData.offerText || undefined,
          isActive: formData.isActive
        };
        
        const result = await updateSlide(selectedSlide.id, slideData);
        if (result) {
          setIsFormOpen(false);
        } else {
          showError('Error al actualizar', 'No se pudo actualizar el slide. Inténtalo de nuevo.');
        }
      } else {
        // Crear nuevo slide
        const slideData: CreateHeroSlideData = {
          title: formData.title,
          subtitle: formData.subtitle,
          description: formData.description,
          imageUrl: formData.imageUrl,
          ctaText: formData.ctaText,
          ctaLink: formData.ctaLink || undefined,
          offerText: formData.offerText || undefined,
          isActive: formData.isActive
        };
        
        const result = await createSlide(slideData);
        if (result) {
          setIsFormOpen(false);
        } else {
          showError('Error al crear', 'No se pudo crear el slide. Inténtalo de nuevo.');
        }
      }
    } catch (err) {
      console.error('Error en handleFormSubmit:', err);
      showError(
        'Error inesperado',
        selectedSlide 
          ? 'Ocurrió un error al actualizar el slide.' 
          : 'Ocurrió un error al crear el slide.'
      );
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-elegant p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-elegant-900 mb-1">Administración de Hero Slider</h2>
            <p className="text-elegant-600 text-sm">Gestiona los slides que aparecen en el slider principal de la página de inicio.</p>
          </div>
          <button
            onClick={handleAddSlide}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-gold text-elegant-900 rounded-xl hover:shadow-lg hover:scale-105 transition-all admin-button font-semibold text-sm whitespace-nowrap shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Slide</span>
          </button>
        </div>
      </div>

      {/* Estado de carga y errores */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-elegant">
          <Loader2 className="h-12 w-12 text-gold-500 animate-spin mb-4" />
          <p className="text-elegant-600">Cargando slides...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Error al cargar slides</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => fetchAllSlides()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : slides.length === 0 ? (
        <div className="bg-elegant-50 border border-elegant-200 rounded-xl p-12 text-center">
          <Image className="h-16 w-16 text-elegant-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-elegant-700 mb-2">No hay slides configurados</h3>
          <p className="text-elegant-600 mb-6">Comienza agregando tu primer slide para el hero slider</p>
          <button 
            onClick={handleAddSlide}
            className="px-6 py-3 bg-gradient-gold text-elegant-900 rounded-lg hover:shadow-lg transition-all admin-button font-medium"
          >
            <Plus className="h-5 w-5 mr-2 inline-block" />
            Agregar Slide
          </button>
        </div>
      ) : (
        <>
          {/* Vista Desktop - Tabla */}
          <div className="hidden lg:block bg-white rounded-xl shadow-elegant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-elegant-50 border-b border-elegant-200">
                    <th className="px-6 py-4 text-left text-xs font-medium text-elegant-500 uppercase tracking-wider">Imagen</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-elegant-500 uppercase tracking-wider">Título</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-elegant-500 uppercase tracking-wider">Subtítulo</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-elegant-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-elegant-500 uppercase tracking-wider">Orden</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-elegant-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-elegant-200">
                  {slides.map((slide, index) => (
                    <tr key={slide.id} className="hover:bg-elegant-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-16 w-24 rounded-md overflow-hidden">
                          <img 
                            src={slide.imageUrl} 
                            alt={slide.title} 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-elegant-900">{slide.title}</div>
                        <div className="text-xs text-elegant-500">{slide.ctaText}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-elegant-600 line-clamp-2">{slide.subtitle}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${slide.isActive ? 'bg-green-100 text-green-800' : 'bg-elegant-100 text-elegant-800'}`}>
                          {slide.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-elegant-600">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{slide.orderIndex}</span>
                          <div className="flex flex-col">
                            <button 
                              onClick={() => handleMoveUp(slide, index)}
                              disabled={index === 0}
                              className={`p-1 rounded-full ${index === 0 ? 'text-elegant-300 cursor-not-allowed' : 'text-elegant-600 hover:bg-elegant-100'}`}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button 
                              onClick={() => handleMoveDown(slide, index)}
                              disabled={index === slides.length - 1}
                              className={`p-1 rounded-full ${index === slides.length - 1 ? 'text-elegant-300 cursor-not-allowed' : 'text-elegant-600 hover:bg-elegant-100'}`}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleToggleStatus(slide)}
                            className={`p-1.5 rounded-full ${slide.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-elegant-100 text-elegant-700 hover:bg-elegant-200'}`}
                            title={slide.isActive ? 'Desactivar slide' : 'Activar slide'}
                          >
                            {slide.isActive ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleEditSlide(slide)}
                            className="p-1.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
                            title="Editar slide"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSlide(slide)}
                            className="p-1.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200"
                            title="Eliminar slide"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vista Móvil/Tablet - Cards */}
          <div className="lg:hidden space-y-4">
            {slides.map((slide, index) => (
              <div key={slide.id} className="bg-white rounded-xl shadow-elegant p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Imagen */}
                  <div className="flex-shrink-0 mx-auto sm:mx-0">
                    <div className="h-24 w-32 sm:h-20 sm:w-28 rounded-lg overflow-hidden">
                      <img 
                        src={slide.imageUrl} 
                        alt={slide.title} 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                        }}
                      />
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 space-y-3">
                    <div className="text-center sm:text-left">
                      <h3 className="text-lg font-bold text-elegant-900 mb-1">{slide.title}</h3>
                      {slide.ctaText && (
                        <p className="text-sm text-elegant-600 font-medium">{slide.ctaText}</p>
                      )}
                      <p className="text-sm text-elegant-500 mt-1">{slide.subtitle}</p>
                    </div>

                    {/* Estado y Orden */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-elegant-600 font-medium">Estado:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${slide.isActive ? 'bg-green-100 text-green-800' : 'bg-elegant-100 text-elegant-800'}`}>
                          {slide.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-elegant-600 font-medium">Orden:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-elegant-900">{slide.orderIndex}</span>
                          <div className="flex flex-col">
                            <button 
                              onClick={() => handleMoveUp(slide, index)}
                              disabled={index === 0}
                              className={`p-0.5 rounded ${index === 0 ? 'text-elegant-300 cursor-not-allowed' : 'text-elegant-600 hover:bg-elegant-100'}`}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button 
                              onClick={() => handleMoveDown(slide, index)}
                              disabled={index === slides.length - 1}
                              className={`p-0.5 rounded ${index === slides.length - 1 ? 'text-elegant-300 cursor-not-allowed' : 'text-elegant-600 hover:bg-elegant-100'}`}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                      <button
                        onClick={() => handleToggleStatus(slide)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${slide.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-elegant-100 text-elegant-700 hover:bg-elegant-200'}`}
                        title={slide.isActive ? 'Desactivar slide' : 'Activar slide'}
                      >
                        {slide.isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        <span>{slide.isActive ? 'Desactivar' : 'Activar'}</span>
                      </button>
                      <button
                        onClick={() => handleEditSlide(slide)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-medium transition-colors"
                        title="Editar slide"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSlide(slide)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium transition-colors"
                        title="Eliminar slide"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Formulario Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsFormOpen(false)} />
          
          <div className="absolute inset-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-w-4xl mx-auto left-0 right-0">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-elegant-200 bg-elegant-50">
              <div>
                <h2 className="text-2xl admin-heading">
                  {selectedSlide ? 'Editar Slide' : 'Nuevo Slide'}
                </h2>
                <p className="admin-body">
                  Información del Slide
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-elegant-200 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-elegant-600" />
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleFormSubmit}>
                <div className="space-y-6">
                  <div className="bg-elegant-50 p-6 rounded-xl">
                    <h3 className="text-lg admin-subheading mb-4">
                      Información del Slide
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block admin-label mb-2">
                          Título del Slide *
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                          placeholder="Ej: Nueva Colección Primavera"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block admin-label mb-2">
                          Subtítulo *
                        </label>
                        <input
                          type="text"
                          name="subtitle"
                          value={formData.subtitle}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                          placeholder="Ej: Descubre nuestra exclusiva selección"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block admin-label mb-2">
                          Descripción *
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                          placeholder="Describe brevemente el contenido del slide..."
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block admin-label mb-2">
                            Texto del Botón (Opcional)
                          </label>
                          <input
                            type="text"
                            name="ctaText"
                            value={formData.ctaText}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                            placeholder="Ej: Ver Colección"
                          />
                        </div>
                        <div>
                          <label className="block admin-label mb-2">
                            Enlace del Botón
                          </label>
                          <select
                            name="ctaLink"
                            value={formData.ctaLink}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input bg-white"
                          >
                            <option value="">Seleccionar enlace...</option>
                            <optgroup label="Páginas principales">
                              <option value="/">Página de inicio</option>
                              <option value="/productos">Todos los productos</option>
                              <option value="/checkout">Proceso de compra</option>
                            </optgroup>
                            <optgroup label="Categorías de productos">
                              <option value="/?category=collares">Collares</option>
                              <option value="/?category=anillos">Anillos</option>
                              <option value="/?category=pulseras">Pulseras</option>
                              <option value="/?category=aretes">Aretes</option>
                              <option value="/?category=conjuntos">Conjuntos</option>
                              <option value="/?category=relojes">Relojes</option>
                            </optgroup>
                            <optgroup label="Enlaces externos">
                              <option value="#contacto">Sección de contacto</option>
                              <option value="#newsletter">Newsletter</option>
                            </optgroup>
                          </select>
                          <p className="text-xs text-elegant-600 mt-1">
                            Selecciona un enlace predefinido para evitar errores de navegación
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block admin-label mb-2">
                            Texto de Oferta (Opcional)
                          </label>
                          <input
                            type="text"
                            name="offerText"
                            value={formData.offerText}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                            placeholder="Ej: Hasta 30% OFF"
                          />
                        </div>
                        <div className="flex items-center h-full pt-8">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="isActive"
                              checked={formData.isActive}
                              onChange={handleInputChange}
                              className="h-5 w-5 text-gold-600 focus:ring-gold-500 border-elegant-300 rounded accent-gold-500"
                            />
                            <span className="ml-2 admin-label">Slide Activo</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-elegant-700">Imagen del Slide *</label>
                    <div className="border border-elegant-300 rounded-xl p-5 bg-elegant-50">
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-elegant-800 mb-2">Selecciona o sube una imagen</h4>
                        <p className="text-xs text-elegant-600">Formato recomendado: 1920x1080px, máximo 5MB</p>
                      </div>
                      
                      <FileUploader
                        images={formData.imageUrl ? [formData.imageUrl] : []}
                        onImagesChange={(images) => {
                          setFormData(prev => ({
                            ...prev,
                            imageUrl: images[0] || ''
                          }));
                        }}
                        maxImages={1}
                        folder="general"
                        acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                      />
                      
                      {!formData.imageUrl && (
                        <p className="text-sm text-red-500 mt-3">* Se requiere una imagen para el slide</p>
                      )}
                      
                      {formData.imageUrl && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-elegant-800 mb-2">Vista previa</h4>
                          <div className="relative aspect-[16/9] rounded-lg overflow-hidden border border-elegant-200 bg-white shadow-sm">
                            <img 
                              src={formData.imageUrl} 
                              alt="Vista previa" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            {/* Footer with Navigation */}
            <div className="p-6 border-t border-elegant-200 bg-elegant-50">
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-2 border border-elegant-300 text-elegant-700 rounded-lg admin-button hover:bg-elegant-100 transition-colors"
                >
                  Cancelar
                </button>
                
                <button
                  type="button"
                  onClick={handleFormSubmit}
                  className="px-6 py-2 rounded-lg admin-button transition-all bg-gradient-gold text-elegant-900 hover:shadow-gold flex items-center space-x-2"
                >
                  {selectedSlide ? (
                    <>
                      <Edit className="h-5 w-5" />
                      <span>Actualizar Slide</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      <span>Crear Slide</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        type={confirmModal.type}
        confirmText={confirmModal.type === 'danger' ? 'Eliminar' : 'Confirmar'}
      />
    </div>
  );
};

export default HeroSlideManager;