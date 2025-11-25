import React, { useState, useMemo } from 'react';
import { Filter, SlidersHorizontal, Grid3X3, List } from 'lucide-react';
import ProductCard from './ProductCard';
import ProductSkeleton from './ProductSkeleton';
import ProductModal from './ProductModal';
import Breadcrumbs from './Breadcrumbs';
import { Product } from '../types';
import { useProducts } from '../hooks/useProducts';

interface ProductGridProps {
  products?: Product[];
  category?: string;
  searchTerm?: string;
  isLoading?: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products: productsProp, category = 'all', searchTerm = '', isLoading: isLoadingProp = false }) => {
  // Si no se pasan productos como prop, usar el hook para obtenerlos
  const { products: productsFromHook, loading: loadingFromHook } = useProducts();
  
  // Usar productos de props si están disponibles, sino usar los del hook
  const products = productsProp || productsFromHook;
  const isLoading = isLoadingProp || loadingFromHook;
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredAndSortedProducts = useMemo(() => {
    // Asegurarnos de que products es un array
    if (!Array.isArray(products)) {
      return [];
    }
    
    let filtered = [...products];

    // Filter by category
    if (category !== 'all') {
      filtered = filtered.filter(product => product.category === category);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(product.tags) && product.tags.some(tag => 
          typeof tag === 'string' && tag.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
    }

    // Filter by price range
    filtered = filtered.filter(product =>
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Sort products
    switch (sortBy) {
      case 'price-low':
        return filtered.sort((a, b) => a.price - b.price);
      case 'price-high':
        return filtered.sort((a, b) => b.price - a.price);
      case 'rating':
        return filtered.sort((a, b) => b.rating - a.rating);
      case 'newest':
        return filtered.sort((a, b) => b.id.localeCompare(a.id));
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'featured':
      default:
        return filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
  }, [products, category, searchTerm, sortBy, priceRange]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const breadcrumbItems = [
    { label: 'Catálogo' },
    ...(category && category !== 'all' ? [{ label: category.charAt(0).toUpperCase() + category.slice(1) }] : [])
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[...Array(10)].map((_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-playfair font-bold text-elegant-900 mb-2">
            {!category || category === 'all' ? 'Todas las Joyas' :
             category.charAt(0).toUpperCase() + category.slice(1)}
          </h2>
          <p className="text-elegant-600 font-lato">
            {filteredAndSortedProducts.length} productos encontrados
            {searchTerm && ` para "${searchTerm}"`}
          </p>
        </div>

        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-elegant-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-gold-500 text-white' 
                  : 'text-elegant-600 hover:bg-elegant-100'
              }`}
            >
              <Grid3X3 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list' 
                  ? 'bg-gold-500 text-white' 
                  : 'text-elegant-600 hover:bg-elegant-100'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-elegant-300 rounded-lg hover:border-gold-500 transition-colors font-lato"
          >
            <SlidersHorizontal className="h-5 w-5" />
            <span>Filtros</span>
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 font-lato"
          >
            <option value="featured">Destacados</option>
            <option value="price-low">Precio: Menor a Mayor</option>
            <option value="price-high">Precio: Mayor a Menor</option>
            <option value="rating">Mejor Valorados</option>
            <option value="newest">Más Recientes</option>
            <option value="name">Nombre A-Z</option>
          </select>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-elegant p-6 mb-8 border border-elegant-200">
          <h3 className="text-lg font-playfair font-semibold text-elegant-900 mb-4">
            Filtros Avanzados
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-semibold text-elegant-700 mb-3 font-lato">
                Rango de Precio
              </label>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="10000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full accent-gold-500"
                />
                <div className="flex justify-between text-sm text-elegant-600 font-lato">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
              </div>
            </div>

            {/* Stock Filter */}
            <div>
              <label className="block text-sm font-semibold text-elegant-700 mb-3 font-lato">
                Disponibilidad
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2 accent-gold-500" defaultChecked />
                  <span className="text-sm font-lato">En Stock</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2 accent-gold-500" />
                  <span className="text-sm font-lato">Agotado</span>
                </label>
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-semibold text-elegant-700 mb-3 font-lato">
                Calificación Mínima
              </label>
              <select className="w-full px-3 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 font-lato">
                <option value="">Todas</option>
                <option value="4">4+ estrellas</option>
                <option value="4.5">4.5+ estrellas</option>
                <option value="5">5 estrellas</option>
              </select>
            </div>

            {/* Material Filter */}
            <div>
              <label className="block text-sm font-semibold text-elegant-700 mb-3 font-lato">
                Material
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2 accent-gold-500" />
                  <span className="text-sm font-lato">Oro 18k</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2 accent-gold-500" />
                  <span className="text-sm font-lato">Oro 14k</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2 accent-gold-500" />
                  <span className="text-sm font-lato">Con Zirconia</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6 space-x-3">
            <button
              onClick={() => {
                setPriceRange([0, 500000]);
                // Reset other filters
              }}
              className="px-4 py-2 text-elegant-600 hover:text-elegant-800 font-lato transition-colors"
            >
              Limpiar Filtros
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="px-6 py-2 bg-gradient-gold text-elegant-900 rounded-lg font-lato font-semibold hover:shadow-gold transition-all"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Products Grid/List */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-16">
          <Filter className="h-16 w-16 text-elegant-300 mx-auto mb-4" />
          <h3 className="text-xl font-playfair font-semibold text-elegant-900 mb-2">
            No se encontraron productos
          </h3>
          <p className="text-elegant-600 font-lato mb-6">
            Intenta ajustar los filtros o términos de búsqueda
          </p>
          <button
            onClick={() => {
              setPriceRange([0, 500000]);
              setShowFilters(false);
            }}
            className="bg-gradient-gold text-elegant-900 px-6 py-3 rounded-lg font-lato font-semibold hover:shadow-gold transition-all"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : (
        <div className={`${
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-6'
        }`}>
          {filteredAndSortedProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onQuickView={handleQuickView}
            />
          ))}
        </div>
      )}

      {/* Product Modal */}
      <ProductModal
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

export default ProductGrid;