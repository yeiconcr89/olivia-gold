import React, { useEffect, useState } from 'react';
import { useProducts } from '../hooks/useProducts';

const ProductDebug: React.FC = () => {
  const { products, loading, error, fetchProducts } = useProducts();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const loadProducts = async () => {
      console.log('🔄 Iniciando carga de productos...');
      await fetchProducts();
      console.log('✅ Carga de productos completada');
    };
    
    loadProducts();
  }, [fetchProducts]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDebugInfo({
      productsCount: products?.length || 0,
      loading,
      error,
    });
  }, [products, loading, error]);

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Debug de Productos</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="text-lg font-semibold mb-2">Estado Actual:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {loading && (
        <div className="bg-blue-100 p-4 rounded-lg mb-4">
          <p className="text-blue-800">⏳ Cargando productos...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 p-4 rounded-lg mb-4">
          <p className="text-red-800">❌ Error: {error}</p>
        </div>
      )}

      {products && products.length > 0 && (
        <div className="bg-green-100 p-4 rounded-lg">
          <p className="text-green-800">✅ Se encontraron {products.length} productos</p>
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Primeros productos:</h3>
            {products.slice(0, 3).map((product) => (
              <div key={product.id} className="bg-white p-2 rounded mb-2">
                <p><strong>Nombre:</strong> {product.name}</p>
                <p><strong>Precio:</strong> ${product.price}</p>
                <p><strong>Categoría:</strong> {product.category}</p>
                <p><strong>Stock:</strong> {product.inStock ? 'Disponible' : 'No disponible'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && (!products || products.length === 0) && (
        <div className="bg-yellow-100 p-4 rounded-lg">
          <p className="text-yellow-800">⚠️ No se encontraron productos</p>
        </div>
      )}
    </div>
  );
};

export default ProductDebug;