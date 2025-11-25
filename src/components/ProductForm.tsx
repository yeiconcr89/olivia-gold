import React, { useState, useEffect } from 'react';
import { X, Save, Package, Info, Settings, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { CATEGORIES } from '../config/categories';
import FileUploader from './FileUploader';

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (product: Omit<Product, 'id'>) => void;
  onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSubmit, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    originalPrice: '',
    category: 'collares',
    subcategory: '',
    images: [''],
    description: '',
    materials: '',
    dimensions: '',
    care: '',
    inStock: true,
    featured: false,
    rating: 4.5,
    reviewCount: 0,
    tags: ['']
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price.toString(),
        originalPrice: product.originalPrice ? product.originalPrice.toString() : '',
        category: product.category,
        subcategory: product.subcategory || '',
        images: product.images,
        description: product.description,
        materials: product.materials,
        dimensions: product.dimensions,
        care: product.care,
        inStock: product.inStock,
        featured: product.featured,
        rating: product.rating,
        reviewCount: product.reviewCount,
        tags: product.tags
      });
    }
  }, [product]);

  // Validaciones en tiempo real
  const validateField = (field: string, value: string | boolean | string[]): string => {
    switch (field) {
      case 'name':
        if (!value || value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
        break;
      case 'price': {
        const priceValue = typeof value === 'string' ? parseFloat(value) : value;
        if (!value || value === '' || isNaN(priceValue) || priceValue <= 0) return 'El precio debe ser mayor a 0';
        if (priceValue > 99999999.99) return 'El precio no puede exceder $99,999,999.99';
        break;
      }
      case 'description':
        if (!value || value.trim().length < 5) return 'La descripción debe tener al menos 5 caracteres';
        break;
      case 'materials':
        if (!value || value.trim().length < 1) return 'Los materiales son requeridos';
        break;
      case 'dimensions':
        if (!value || value.trim().length < 1) return 'Las dimensiones son requeridas';
        break;
      case 'care':
        if (!value || value.trim().length < 1) return 'Las instrucciones de cuidado son requeridas';
        break;
      case 'images':
        if (!value || value.filter((img: string) => img.trim()).length === 0) return 'Al menos una imagen es requerida';
        break;
    }
    return '';
  };

  const handleFieldChange = (field: string, value: string | boolean | string[]) => {
    if (field === 'images') {
      console.log('📝 ProductForm: Cambio de imágenes detectado:', value);
      console.log('📝 ProductForm: FormData actual antes del cambio:', formData.images);
    }
    
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value };
      if (field === 'images') {
        console.log('📝 ProductForm: FormData después del cambio:', newFormData.images);
      }
      return newFormData;
    });
    
    setTouched(prev => ({ ...prev, [field]: true }));
    
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevenir doble envío
    
    setIsSubmitting(true);
    
    try {
      console.log('🚀 ProductForm: Iniciando envío del formulario');
      console.log('🚀 ProductForm: FormData completo:', formData);
      console.log('🚀 ProductForm: Imágenes en formData:', formData.images);
      
      // Preparar los datos con las conversiones de tipo correctas
      const productData: Omit<Product, 'id'> = {
        name: formData.name,
        price: typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price,
        originalPrice: formData.originalPrice === '' ? undefined : (typeof formData.originalPrice === 'string' ? parseFloat(formData.originalPrice) : formData.originalPrice),
        category: formData.category,
        subcategory: formData.subcategory || 'General',
        description: formData.description,
        materials: formData.materials,
        dimensions: formData.dimensions,
        care: formData.care,
        inStock: Boolean(formData.inStock),
        featured: Boolean(formData.featured),
        images: formData.images.filter(img => img.trim() !== ''),
        tags: formData.tags.filter(tag => tag.trim() !== '')
      };
      
      console.log('🚀 ProductForm: Datos preparados para envío:', productData);
      console.log('🚀 ProductForm: Imágenes filtradas:', productData.images);

      // Eliminar originalPrice si es undefined
      if (productData.originalPrice === undefined) {
        delete productData.originalPrice;
      }

      await onSubmit(productData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagChange = (index: number, value: string) => {
    const newTags = [...formData.tags];
    newTags[index] = value;
    setFormData({ ...formData, tags: newTags });
  };

  const addTagField = () => {
    setFormData({ ...formData, tags: [...formData.tags, ''] });
  };

  const removeTagField = (index: number) => {
    const newTags = formData.tags.filter((_, i) => i !== index);
    setFormData({ ...formData, tags: newTags });
  };

  const categories = CATEGORIES.map(cat => ({ 
    value: cat.id, 
    label: cat.name 
  }));

  const steps = [
    { id: 1, name: 'Información Básica', icon: Package },
    { id: 2, name: 'Imágenes', icon: ImageIcon },
    { id: 3, name: 'Detalles', icon: Info },
    { id: 4, name: 'Configuración', icon: Settings }
  ];

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1: {
        const priceValue = typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price;
        return !errors.name && !errors.price && !errors.description && 
               formData.name && priceValue > 0 && formData.description.length >= 5;
      }
      case 2:
        return !errors.images && formData.images.filter(img => img.trim()).length > 0;
      case 3:
        return !errors.materials && !errors.dimensions && !errors.care &&
               formData.materials && formData.dimensions && formData.care;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 4 && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute inset-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-elegant-200 bg-elegant-50">
          <div>
            <h2 className="text-2xl admin-heading">
              {product ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <p className="admin-body">
              Paso {currentStep} de 4: {steps.find(s => s.id === currentStep)?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-elegant-200 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-elegant-600" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center p-4 bg-white border-b border-elegant-200">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  currentStep === step.id 
                    ? 'bg-gradient-gold text-elegant-900' 
                    : currentStep > step.id 
                      ? 'bg-green-500 text-white'
                      : 'bg-elegant-200 text-elegant-600'
                }`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <span className={`ml-2 admin-label ${
                  currentStep >= step.id ? 'text-elegant-900' : 'text-elegant-500'
                }`}>
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-4 rounded-full ${
                  currentStep > step.id ? 'bg-green-500' : 'bg-elegant-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="bg-elegant-50 p-6 rounded-xl">
                  <h3 className="text-lg admin-subheading mb-4">
                    Información Básica del Producto
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block admin-label mb-2">
                        Nombre del Producto *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 admin-input ${
                          touched.name && errors.name 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-elegant-300 focus:ring-gold-500'
                        }`}
                        placeholder="Ej: Collar Veneciano Premium"
                        required
                      />
                      {touched.name && errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block admin-label mb-2">
                          Precio de Venta *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-elegant-600">$</span>
                          <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => handleFieldChange('price', e.target.value)}
                            className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 admin-input ${
                              touched.price && errors.price 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'border-elegant-300 focus:ring-gold-500'
                            }`}
                            placeholder="89900"
                            min="1"
                            max="99999999.99"
                            required
                          />
                        </div>
                        {touched.price && errors.price && (
                          <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                        )}
                        <p className="text-xs text-elegant-500 mt-1">
                          Máximo: $99,999,999.99
                        </p>
                      </div>
                      <div>
                        <label className="block admin-label mb-2">
                          Precio Original (Opcional)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-elegant-600">$</span>
                          <input
                            type="number"
                            value={formData.originalPrice}
                            onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                            className="w-full pl-8 pr-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                            placeholder="129900 (opcional)"
                            min="0"
                            max="99999999.99"
                          />
                        </div>
                        <p className="text-xs text-elegant-500 mt-1">
                          Máximo: $99,999,999.99
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block admin-label mb-2">
                          Categoría *
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                          required
                        >
                          {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block admin-label mb-2">
                          Subcategoría
                        </label>
                        <input
                          type="text"
                          value={formData.subcategory}
                          onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                          className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                          placeholder="Ej: cadenas, elegantes, premium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block admin-label mb-2">
                        Descripción del Producto *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        rows={4}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 admin-input ${
                          touched.description && errors.description 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-elegant-300 focus:ring-gold-500'
                        }`}
                        placeholder="Describe las características principales del producto... (mínimo 5 caracteres)"
                        required
                      />
                      {touched.description && errors.description && (
                        <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                      )}
                      <div className="text-right text-xs text-elegant-500 mt-1">
                        {formData.description.length}/5 caracteres mínimos
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Images */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-elegant-50 p-6 rounded-xl">
                  <h3 className="text-lg admin-subheading mb-4">
                    Imágenes del Producto
                  </h3>
                  <p className="admin-body mb-6">
                    Sube imágenes de alta calidad desde tu computadora. La primera imagen será la imagen principal.
                  </p>
                  
                  <FileUploader
                    images={formData.images.filter(img => img.trim() !== '')}
                    onImagesChange={(images) => handleFieldChange('images', images)}
                    maxImages={5}
                    maxFileSize={5}
                    acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                  />
                  {touched.images && errors.images && (
                    <p className="text-red-500 text-sm mt-2">{errors.images}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-elegant-50 p-6 rounded-xl">
                  <h3 className="text-lg admin-subheading mb-4">
                    Detalles del Producto
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block admin-label mb-2">
                        Materiales *
                      </label>
                      <input
                        type="text"
                        value={formData.materials}
                        onChange={(e) => handleFieldChange('materials', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 admin-input ${
                          touched.materials && errors.materials 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-elegant-300 focus:ring-gold-500'
                        }`}
                        placeholder="Ej: Oro laminado 18k sobre base de acero inoxidable"
                        required
                      />
                      {touched.materials && errors.materials && (
                        <p className="text-red-500 text-sm mt-1">{errors.materials}</p>
                      )}
                    </div>

                    <div>
                      <label className="block admin-label mb-2">
                        Dimensiones *
                      </label>
                      <input
                        type="text"
                        value={formData.dimensions}
                        onChange={(e) => handleFieldChange('dimensions', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 admin-input ${
                          touched.dimensions && errors.dimensions 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-elegant-300 focus:ring-gold-500'
                        }`}
                        placeholder="Ej: Largo: 45cm, Ancho: 3mm"
                        required
                      />
                      {touched.dimensions && errors.dimensions && (
                        <p className="text-red-500 text-sm mt-1">{errors.dimensions}</p>
                      )}
                    </div>

                    <div>
                      <label className="block admin-label mb-2">
                        Instrucciones de Cuidado *
                      </label>
                      <textarea
                        value={formData.care}
                        onChange={(e) => handleFieldChange('care', e.target.value)}
                        rows={3}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 admin-input ${
                          touched.care && errors.care 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-elegant-300 focus:ring-gold-500'
                        }`}
                        placeholder="Instrucciones para el cuidado y mantenimiento del producto..."
                        required
                      />
                      {touched.care && errors.care && (
                        <p className="text-red-500 text-sm mt-1">{errors.care}</p>
                      )}
                    </div>

                    <div>
                      <label className="block admin-label mb-2">
                        Etiquetas del Producto
                      </label>
                      <div className="space-y-3">
                        {formData.tags.map((tag, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={tag}
                              onChange={(e) => handleTagChange(index, e.target.value)}
                              placeholder="Etiqueta"
                              className="flex-1 px-4 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                            />
                            {formData.tags.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTagField(index)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addTagField}
                          className="text-gold-600 hover:text-gold-700 admin-button text-sm"
                        >
                          + Agregar etiqueta
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Settings */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-elegant-50 p-6 rounded-xl">
                  <h3 className="text-lg admin-subheading mb-4">
                    Configuración del Producto
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-elegant-200">
                        <div>
                          <label className="admin-label">
                            Producto en Stock
                          </label>
                          <p className="text-xs text-elegant-500">
                            Disponible para la venta
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.inStock}
                          onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                          className="w-5 h-5 accent-gold-500"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-elegant-200">
                        <div>
                          <label className="admin-label">
                            Producto Destacado
                          </label>
                          <p className="text-xs text-elegant-500">
                            Aparece en la sección premium
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.featured}
                          onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                          className="w-5 h-5 accent-gold-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block admin-label mb-2">
                          Calificación Inicial
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={formData.rating}
                          onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                          className="w-full px-4 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                        />
                      </div>

                      <div>
                        <label className="block admin-label mb-2">
                          Número de Reseñas
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.reviewCount}
                          onChange={(e) => setFormData({ ...formData, reviewCount: Number(e.target.value) })}
                          className="w-full px-4 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-white border border-elegant-200 rounded-xl p-6">
                  <h4 className="admin-subheading mb-4">
                    Vista Previa del Producto
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      {formData.images.filter(img => img.trim())[0] && (
                        <img
                          src={formData.images.filter(img => img.trim())[0]}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <h5 className="admin-subheading">
                        {formData.name || 'Nombre del producto'}
                      </h5>
                      <p className="admin-body">
                        {formData.category} • {formData.subcategory}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-elegant-900">
                          ${(() => {
                            const price = typeof formData.price === 'string' ? parseFloat(formData.price || '0') : formData.price;
                            return price.toLocaleString('es-CO');
                          })()}
                        </span>
                        {formData.originalPrice && formData.originalPrice !== '' && parseFloat(formData.originalPrice) > 0 && (
                          <span className="text-sm text-elegant-500 line-through">
                            ${parseFloat(formData.originalPrice).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="admin-body">
                        {formData.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer with Navigation */}
        <div className="p-6 border-t border-elegant-200 bg-elegant-50">
          {/* Mensaje de validación centrado arriba de los botones */}
          {currentStep < 4 && !isStepValid(currentStep) && (
            <div className="mb-4 text-center">
              <p className="text-red-500 text-sm font-medium">
                Completa todos los campos requeridos correctamente para continuar
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 border border-elegant-300 text-elegant-700 rounded-lg admin-button hover:bg-elegant-100 transition-colors"
                >
                  Anterior
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className={`px-6 py-2 border rounded-lg admin-button transition-colors ${
                  isSubmitting 
                    ? 'border-elegant-200 text-elegant-400 cursor-not-allowed bg-elegant-50' 
                    : 'border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400'
                }`}
              >
                Cancelar
              </button>
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStepValid(currentStep)}
                  className={`px-6 py-2 rounded-lg admin-button transition-all ${
                    isStepValid(currentStep)
                      ? 'bg-gradient-gold text-elegant-900 hover:shadow-gold'
                      : 'bg-elegant-200 text-elegant-500 cursor-not-allowed'
                  }`}
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`px-6 py-2 rounded-lg admin-button transition-all flex items-center space-x-2 ${
                    isSubmitting 
                      ? 'bg-elegant-200 text-elegant-500 cursor-not-allowed' 
                      : 'bg-gradient-gold text-elegant-900 hover:shadow-gold'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>{product ? 'Actualizar Producto' : 'Crear Producto'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;