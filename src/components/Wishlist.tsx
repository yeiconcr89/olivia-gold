import React from 'react';
import { X, Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { Product } from '../types';

interface WishlistProps {
  isOpen: boolean;
  onClose: () => void;
}

const Wishlist: React.FC<WishlistProps> = ({ isOpen, onClose }) => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { products } = useProducts();
  const { addToCart } = useCart();

  // Asegurarnos de que products es un array antes de usar filter
  const wishlistProducts = Array.isArray(products)
    ? products.filter(product => wishlist.includes(product.id))
    : [];

  const handleAddToCart = async (product: Product) => {
    try {
      console.log('🛒 Wishlist: Agregando al carrito:', { productId: product.id, quantity: 1 });
      await addToCart({
        productId: product.id,
        quantity: 1
      });
      removeFromWishlist(product.id);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Lista de Deseos ({wishlist.length})
            </h2>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {wishlistProducts.length === 0 ? (
              <div className="text-center">
                <Heart className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-gray-500">Tu lista de deseos está vacía</p>
              </div>
            ) : (
              <div className="space-y-4">
                {wishlistProducts.map((product) => (
                  <div key={product.id} className="flex items-center space-x-4 border-b border-gray-100 pb-4">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-16 w-16 rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        ${product.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex items-center space-x-1 rounded-md bg-amber-500 px-3 py-1 text-xs text-white hover:bg-amber-600"
                      >
                        <ShoppingBag className="h-3 w-3" />
                        <span>Agregar</span>
                      </button>
                      <button
                        onClick={() => removeFromWishlist(product.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;