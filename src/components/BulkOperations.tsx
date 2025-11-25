import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Square, 
  Edit3, 
  Trash2, 
  Package, 
  Star,
  AlertCircle,
  Save,
  X,
  Loader2
} from 'lucide-react';
import { Product } from '../types';

interface BulkOperationsProps {
  products: Product[];
  onUpdateProducts: (productIds: string[], updates: Partial<Product>) => Promise<void>;
  onDeleteProducts: (productIds: string[]) => Promise<void>;
}

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Product>) => void;
  selectedCount: number;
  operation: 'edit' | 'delete';
}

const BulkEditModal: React.FC<BulkEditModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  selectedCount, 
  operation 
}) => {
  const [updates, setUpdates] = useState<Partial<Product>>({});
  const [updateFields, setUpdateFields] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleFieldToggle = (field: string) => {
    setUpdateFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleSave = () => {
    const filteredUpdates = {};
    updateFields.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });
    onSave(filteredUpdates);
  };

  if (operation === 'delete') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <h3 className="text-lg font-medium text-elegant-900">
              Confirmar Eliminación
            </h3>
          </div>
          <p className="text-elegant-600 mb-6">
            ¿Estás seguro de que deseas eliminar {selectedCount} producto(s)? 
            Esta acción no se puede deshacer.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => onSave({})}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Eliminar
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-elegant-300 rounded-lg hover:bg-elegant-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-elegant-900">
            Editar {selectedCount} Producto(s)
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-elegant-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Precio */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={updateFields.includes('price')}
              onChange={() => handleFieldToggle('price')}
              className="rounded border-elegant-300"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium text-elegant-700 mb-1">
                Precio
              </label>
              <input
                type="number"
                disabled={!updateFields.includes('price')}
                value={updates.price || ''}
                onChange={(e) => setUpdates(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 disabled:bg-elegant-100"
                placeholder="Nuevo precio"
              />
            </div>
          </div>

          {/* Precio Original */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={updateFields.includes('originalPrice')}
              onChange={() => handleFieldToggle('originalPrice')}
              className="rounded border-elegant-300"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium text-elegant-700 mb-1">
                Precio Original
              </label>
              <input
                type="number"
                disabled={!updateFields.includes('originalPrice')}
                value={updates.originalPrice || ''}
                onChange={(e) => setUpdates(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 disabled:bg-elegant-100"
                placeholder="Precio original"
              />
            </div>
          </div>

          {/* Categoría */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={updateFields.includes('category')}
              onChange={() => handleFieldToggle('category')}
              className="rounded border-elegant-300"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium text-elegant-700 mb-1">
                Categoría
              </label>
              <select
                disabled={!updateFields.includes('category')}
                value={updates.category || ''}
                onChange={(e) => setUpdates(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 disabled:bg-elegant-100"
              >
                <option value="">Seleccionar categoría</option>
                <option value="collares">Collares</option>
                <option value="anillos">Anillos</option>
                <option value="pulseras">Pulseras</option>
                <option value="aretes">Aretes</option>
                <option value="conjuntos">Conjuntos</option>
                <option value="relojes">Relojes</option>
              </select>
            </div>
          </div>

          {/* En Stock */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={updateFields.includes('inStock')}
              onChange={() => handleFieldToggle('inStock')}
              className="rounded border-elegant-300"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium text-elegant-700 mb-1">
                Disponibilidad
              </label>
              <select
                disabled={!updateFields.includes('inStock')}
                value={updates.inStock !== undefined ? updates.inStock.toString() : ''}
                onChange={(e) => setUpdates(prev => ({ ...prev, inStock: e.target.value === 'true' }))}
                className="w-full px-3 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 disabled:bg-elegant-100"
              >
                <option value="">Seleccionar estado</option>
                <option value="true">En Stock</option>
                <option value="false">Agotado</option>
              </select>
            </div>
          </div>

          {/* Destacado */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={updateFields.includes('featured')}
              onChange={() => handleFieldToggle('featured')}
              className="rounded border-elegant-300"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium text-elegant-700 mb-1">
                Producto Destacado
              </label>
              <select
                disabled={!updateFields.includes('featured')}
                value={updates.featured !== undefined ? updates.featured.toString() : ''}
                onChange={(e) => setUpdates(prev => ({ ...prev, featured: e.target.value === 'true' }))}
                className="w-full px-3 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 disabled:bg-elegant-100"
              >
                <option value="">Seleccionar estado</option>
                <option value="true">Destacado</option>
                <option value="false">No destacado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleSave}
            disabled={updateFields.length === 0}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-gold text-elegant-900 rounded-lg hover:shadow-lg transition-all disabled:bg-elegant-300 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            <span>Aplicar Cambios</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-elegant-300 rounded-lg hover:bg-elegant-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

const BulkOperations: React.FC<BulkOperationsProps> = ({ 
  products, 
  onUpdateProducts, 
  onDeleteProducts 
}) => {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOperation, setModalOperation] = useState<'edit' | 'delete'>('edit');
  const [isLoading, setIsLoading] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, filterCategory]);

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkEdit = () => {
    setModalOperation('edit');
    setIsModalOpen(true);
  };

  const handleBulkDelete = () => {
    setModalOperation('delete');
    setIsModalOpen(true);
  };

  const handleModalSave = async (updates: Partial<Product>) => {
    setIsLoading(true);
    try {
      if (modalOperation === 'delete') {
        await onDeleteProducts(Array.from(selectedProducts));
      } else {
        await onUpdateProducts(Array.from(selectedProducts), updates);
      }
      setSelectedProducts(new Set());
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error en operación masiva:', error);
      alert('Error al realizar la operación. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCount = selectedProducts.size;
  const isAllSelected = selectedProducts.size === filteredProducts.length && filteredProducts.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-elegant p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-elegant-900 mb-2">
              Operaciones en Lote
            </h2>
            <p className="text-elegant-600">
              Selecciona múltiples productos para editar o eliminar en lote
            </p>
          </div>
          {selectedCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-elegant-700">
                {selectedCount} producto(s) seleccionado(s)
              </span>
              <button
                onClick={handleBulkEdit}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-elegant-300"
              >
                <Edit3 className="h-4 w-4" />
                <span>Editar</span>
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-elegant-300"
              >
                <Trash2 className="h-4 w-4" />
                <span>Eliminar</span>
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="all">Todas las categorías</option>
            <option value="collares">Collares</option>
            <option value="anillos">Anillos</option>
            <option value="pulseras">Pulseras</option>
            <option value="aretes">Aretes</option>
            <option value="conjuntos">Conjuntos</option>
            <option value="relojes">Relojes</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-elegant overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-16 w-16 text-elegant-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-elegant-700 mb-2">
              No se encontraron productos
            </h3>
            <p className="text-elegant-600">
              Intenta con otros filtros de búsqueda
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-elegant-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center space-x-2 hover:bg-elegant-100 p-1 rounded transition-colors"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="h-5 w-5 text-gold-600" />
                      ) : (
                        <Square className="h-5 w-5 text-elegant-400" />
                      )}
                      <span className="text-sm font-medium text-elegant-700">
                        Seleccionar todo
                      </span>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-elegant-700">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-elegant-700">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-elegant-700">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-elegant-700">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-elegant-700">
                    Destacado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-elegant-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-elegant-50">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSelectProduct(product.id)}
                        className="p-1 hover:bg-elegant-100 rounded transition-colors"
                      >
                        {selectedProducts.has(product.id) ? (
                          <CheckSquare className="h-5 w-5 text-gold-600" />
                        ) : (
                          <Square className="h-5 w-5 text-elegant-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5OL0E8L3RleHQ+Cjwvc3ZnPgo=';
                          }}
                        />
                        <div>
                          <div className="font-medium text-elegant-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-elegant-600">
                            {product.subcategory || 'Sin subcategoría'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-elegant-900">
                          ${product.price.toLocaleString()}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-elegant-500 line-through">
                            ${product.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-elegant-100 text-elegant-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.inStock 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.inStock ? 'En Stock' : 'Agotado'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {product.featured ? (
                        <Star className="h-5 w-5 text-gold-500 fill-current" />
                      ) : (
                        <Star className="h-5 w-5 text-elegant-300" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 flex items-center space-x-4">
            <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
            <span className="text-elegant-900">Procesando operación...</span>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        selectedCount={selectedCount}
        operation={modalOperation}
      />
    </div>
  );
};

export default BulkOperations;