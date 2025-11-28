import React from 'react';
import { Heart, Star } from 'lucide-react';
import { Product } from '../types';
import { useWishlist } from '../context/WishlistContext';
import { ProductImage } from './OptimizedImage';
import AddToCartButton from './cart/AddToCartButton';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {

  const { toggleWishlist, isInWishlist } = useWishlist();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Removido handleAddToCart - ahora se maneja con AddToCartButton

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickView?.(product);
  };

  return (
    <div
      className="group relative bg-white rounded-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl border border-transparent hover:border-amber-300"
      onClick={handleQuickView}
    >
      {/* Image Container - Optimized aspect ratio */}
      <div className="relative overflow-hidden aspect-[4/5]">
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          width={300}
          height={375}
        />

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <span className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-bold shadow-lg">
              AGOTADO
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col items-start space-y-1.5">
          {product.featured && (
            <span className="bg-amber-400 text-black px-2 py-0.5 rounded-md text-xs font-bold shadow">
              PREMIUM
            </span>
          )}
          {discountPercentage > 0 && (
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-md text-xs font-bold shadow">
              -{discountPercentage}%
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-300 backdrop-blur-sm ${isInWishlist(product.id)
            ? 'bg-amber-500/90 text-white shadow-lg'
            : 'bg-white/90 text-gray-700 hover:bg-white'
            } hover:scale-110 shadow-md`}
          aria-label="Wishlist"
        >
          <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''
            }`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 pb-16">
        <h3 className="text-sm font-semibold text-gray-800 truncate mb-1">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 truncate mb-2">
          {product.category} • {product.subcategory}
        </p>

        {/* Rating */}
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-amber-400 fill-current' : 'text-gray-300'}`} />
            ))}
          </div>
          <span className="ml-1.5 text-xs text-gray-500">({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex flex-col items-start">
          <span className="text-base font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
              <span className="text-xs font-semibold text-green-600">
                Ahorra {discountPercentage}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Add to Cart Button (always visible for all products) */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-white/95 backdrop-blur-sm border-t border-gray-100">
        {/* Solo anillos y pulseras requieren selección de talla */}
        {/* Para anillos y pulseras, usamos el mismo estilo de botón pero abrimos el modal */}
        {(['anillos', 'pulseras'].includes(product.category.toLowerCase())) ? (
          <AddToCartButton
            productId={product.id}
            onClick={() => {
              // Llamamos a handleQuickView simulando un evento si es necesario, o adaptamos handleQuickView
              // Como handleQuickView espera un evento, creamos uno sintético o modificamos handleQuickView
              // Mejor opción: pasar una función vacía que llame a onQuickView directamente
              onQuickView?.(product);
            }}
            disabled={!product.inStock}
            variant="primary"
            size_button="sm"
          />
        ) : (
          <AddToCartButton
            productId={product.id}
            quantity={1}
            disabled={!product.inStock}
            variant="primary"
            size_button="sm"
          />
        )}
      </div>
    </div>
  );
};

export default ProductCard;