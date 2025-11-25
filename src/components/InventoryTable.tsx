import React, { useState } from 'react';
import { 
  Package, 
  Edit, 
  AlertTriangle, 
  TrendingUp, 
  Search,
  Eye,
  Save,
  X,
  BarChart3,
  DollarSign,
  Archive,
  Plus,
  Minus
} from 'lucide-react';
import { InventoryItem } from '../hooks/useInventory';


interface InventoryTableProps {
  inventory: InventoryItem[];
  onUpdateStock: (productId: string, newQuantity: number) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

interface ProductDetailsModalProps {
  product: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, isOpen, onClose }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-elegant-900">Detalles del Producto</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-elegant-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img
                src={product.product.images[0]}
                alt={product.product.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-elegant-900 mb-2">{product.product.name}</h4>
                <p className="text-elegant-600 text-sm">{product.product.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-elegant-600">Precio</span>
                  <p className="text-lg font-bold text-elegant-900">${product.product.price.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-elegant-600">Categoría</span>
                  <p className="text-elegant-900">{product.product.category}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-elegant-600">Stock</span>
                  <p className="text-lg font-bold text-elegant-900">{product.quantity} unidades</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-elegant-600">Reservado</span>
                  <p className="text-elegant-900">{product.reservedQuantity} unidades</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-elegant-600">Estado</span>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                    product.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.quantity > 0 ? 'En Stock' : 'Agotado'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-elegant-600">Rating</span>
                  <p className="text-elegant-900">{product.product.rating || 'N/A'} ⭐</p>
                </div>
              </div>
              
              {product.product.materials && (
                <div>
                  <span className="text-sm font-medium text-elegant-600">Materiales</span>
                  <p className="text-elegant-900">{product.product.materials}</p>
                </div>
              )}
              
              {product.product.dimensions && (
                <div>
                  <span className="text-sm font-medium text-elegant-600">Dimensiones</span>
                  <p className="text-elegant-900">{product.product.dimensions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InventoryTable: React.FC<InventoryTableProps> = ({ inventory, onUpdateStock }) => {
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockValues, setStockValues] = useState<{ [key: string]: number }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'inStock' | 'outStock'>('all');
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Función para validar y limpiar entrada numérica
  const validateAndFormatNumber = (input: string): number => {
    // Remover caracteres no numéricos excepto el primer carácter si es '-'
    let cleaned = input.replace(/[^\d]/g, '');
    
    // Si está vacío, retornar 0
    if (!cleaned) return 0;
    
    // Remover ceros leading (excepto si el número es exactamente "0")
    cleaned = cleaned.replace(/^0+/, '') || '0';
    
    // Convertir a número y validar rango
    const num = parseInt(cleaned, 10);
    
    // Límite máximo razonable para inventario (999,999)
    if (num > 999999) return 999999;
    if (num < 0) return 0;
    
    return num;
  };

  // Manejar cambio en input de stock con validación
  const handleStockInputChange = (productId: string, inputValue: string) => {
    const validatedNumber = validateAndFormatNumber(inputValue);
    setStockValues({
      ...stockValues,
      [productId]: validatedNumber
    });
  };

  const handleStockEdit = (productId: string, currentStock: number) => {
    setEditingStock(productId);
    setStockValues({ ...stockValues, [productId]: currentStock || 0 });
  };

  const handleStockSave = async (productId: string) => {
    const newStock = stockValues[productId] || 0;
    await onUpdateStock(productId, newStock);
    setEditingStock(null);
  };

  const handleStockCancel = () => {
    setEditingStock(null);
    setStockValues({});
  };

  const handleViewDetails = (item: InventoryItem) => {
    setSelectedProduct(item);
    setIsModalOpen(true);
  };

  const adjustStock = (productId: string, adjustment: number) => {
    const currentValue = stockValues[productId] || 0;
    let newValue = currentValue + adjustment;
    
    // Aplicar límites
    if (newValue < 0) newValue = 0;
    if (newValue > 999999) newValue = 999999;
    
    setStockValues({ ...stockValues, [productId]: newValue });
  };

  // Asegurarse de que inventory es array
  const safeInventory = Array.isArray(inventory) ? inventory : [];
  
  // Filtros
  const filteredInventory = safeInventory.filter(item => {
    const matchesSearch = item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'inStock' && item.product.inStock) ||
                         (filterStatus === 'outStock' && !item.product.inStock);
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: safeInventory.length,
    inStock: safeInventory.filter(p => p.product.inStock).length,
    outStock: safeInventory.filter(p => !p.product.inStock).length,
    totalValue: safeInventory.reduce((sum, item) => sum + (item.product.price || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-elegant-600">Total Productos</p>
              <p className="text-2xl font-bold text-elegant-900">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-gold-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-elegant-600">En Stock</p>
              <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-elegant-600">Agotados</p>
              <p className="text-2xl font-bold text-red-600">{stats.outStock}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-elegant-600">Valor Total</p>
              <p className="text-2xl font-bold text-elegant-900">{formatPrice(stats.totalValue)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-gold-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-elegant p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-elegant-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'inStock' | 'outStock')}
            className="px-4 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="all">Todos los estados</option>
            <option value="inStock">En Stock</option>
            <option value="outStock">Agotados</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-elegant overflow-hidden">
        <div className="px-6 py-4 border-b border-elegant-200">
          <h2 className="text-xl font-bold text-elegant-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Inventario de Productos ({filteredInventory.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-elegant-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-elegant-700 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-elegant-700 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-elegant-700 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-elegant-700 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-elegant-700 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-elegant-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-elegant-200">
              {filteredInventory.map((item) => (
                <tr key={item.productId} className="hover:bg-elegant-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="h-12 w-12 rounded-lg object-cover mr-4"
                      />
                      <div>
                        <div className="text-sm font-medium text-elegant-900">{item.product.name}</div>
                        <div className="text-sm text-elegant-500 truncate max-w-xs">
                          {item.product.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-elegant-900">{item.product.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-elegant-900">
                      {formatPrice(item.product.price)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                      item.product.inStock
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.product.inStock ? 'En Stock' : 'Agotado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingStock === item.productId ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => adjustStock(item.productId, -1)}
                          className="p-1 hover:bg-elegant-100 rounded"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          min="0"
                          max="999999"
                          value={stockValues[item.productId] ?? item.quantity}
                          onChange={(e) => handleStockInputChange(item.productId, e.target.value)}
                          onBlur={(e) => {
                            // Re-validar y formatear cuando se pierde el foco
                            const formatted = validateAndFormatNumber(e.target.value);
                            setStockValues({
                              ...stockValues,
                              [item.productId]: formatted
                            });
                          }}
                          placeholder="0"
                          className="w-20 px-2 py-1 border border-elegant-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => adjustStock(item.productId, 1)}
                          className="p-1 hover:bg-elegant-100 rounded"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-elegant-900">
                        {item.quantity} unidades
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {editingStock === item.productId ? (
                        <>
                          <button
                            onClick={() => handleStockSave(item.productId)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                            title="Guardar"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleStockCancel}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                            title="Cancelar"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleViewDetails(item)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStockEdit(item.productId, item.quantity)}
                            className="p-2 text-gold-600 hover:bg-gold-100 rounded-full transition-colors"
                            title="Editar stock"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <Archive className="h-12 w-12 text-elegant-400 mx-auto mb-4" />
            <p className="text-elegant-600">No se encontraron productos que coincidan con los filtros</p>
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
};

export default InventoryTable;