import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductGrid from '../components/ProductGrid';

const ProductPage: React.FC = () => {
  const { products, loading, error, fetchProducts } = useProducts();
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Scroll hacia arriba cuando cambia la categoría
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">
          <h1 className="text-center mb-8">Cargando productos...</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">
          <h1 className="text-center mb-8">Error al cargar productos</h1>
          <div className="text-center">
            <p className="mb-4">{error}</p>
            <button
              onClick={() => fetchProducts()}
              className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">
          <h1 className="text-center mb-8">No hay productos disponibles</h1>
          <div className="text-center">
            <p className="text-gray-600">No se encontraron productos en el catálogo.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        {/* Grid de productos */}
        <ProductGrid
          products={products}
          category={selectedCategory}
          searchTerm={searchQuery}
          isLoading={loading}
        />
      </div>
    </div>
  );
};

export default ProductPage;