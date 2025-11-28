import React, { useState } from 'react';
import { X, Heart, ShoppingBag, Star, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../context/WishlistContext';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  if (!isOpen || !product) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleAddToCart = async () => {
    // Prevenir dobles ejecuciones
    if (isAddingToCart) {
      console.log('⚠️ ProductModal: Ignorando doble ejecución de addToCart');
      return;
    }

    // Productos que requieren talla
    const requiresSizeCategories = ['anillos', 'pulseras'];

    if (requiresSizeCategories.includes(product.category) && !selectedSize) {
      alert('Por favor selecciona una talla');
      return;
    }

    setIsAddingToCart(true);

    try {
      // Solo enviar size si el producto realmente la requiere
      const requiresSizeCategories = ['anillos', 'pulseras'];
      const shouldIncludeSize = requiresSizeCategories.includes(product.category);

      console.log('🛒 ProductModal: Agregando al carrito:', {
        productId: product.id,
        quantity,
        size: shouldIncludeSize ? (selectedSize || undefined) : undefined
      });

      // Solo enviar los datos mínimos necesarios
      const cartPayload = {
        productId: product.id,
        quantity: Number(quantity) // Asegurarnos que es un número
      };

      console.log('Enviando al carrito:', cartPayload);
      await addToCart(cartPayload);
      onClose();
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const sizes = ['6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl h-[90vh] md:h-[800px] max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row h-full">
          {/* Image Section */}
          <div className="flex-1 relative bg-elegant-50 min-h-[300px] md:min-h-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full transition-all md:hidden"
            >
              <X className="h-6 w-6 text-elegant-700" />
            </button>

            <div className="relative h-full flex items-center justify-center p-8">
              <div className="relative max-w-lg max-h-full">
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.name}
                  className={`w-full h-full object-contain transition-transform duration-300 cursor-zoom-in ${isZoomed ? 'scale-150' : 'scale-100'
                    }`}
                  onClick={() => setIsZoomed(!isZoomed)}
                />

                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition-all"
                    >
                      <ChevronLeft className="h-5 w-5 text-elegant-700" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition-all"
                    >
                      <ChevronRight className="h-5 w-5 text-elegant-700" />
                    </button>
                  </>
                )}

                <button
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="absolute bottom-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition-all hidden md:block"
                >
                  <ZoomIn className="h-5 w-5 text-elegant-700" />
                </button>
              </div>
            </div>

            {/* Thumbnail Navigation */}
            {product.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${index === currentImageIndex ? 'bg-gold-500' : 'bg-white bg-opacity-50'
                      }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="w-full md:w-[450px] p-6 md:p-8 overflow-y-auto bg-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors hidden md:block"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-2xl font-playfair font-bold text-elegant-900 mb-2">
                  {product.name}
                </h1>
                <p className="text-elegant-600 font-lato">
                  {product.category} • {product.subcategory}
                </p>
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < Math.floor(product.rating)
                        ? 'text-gold-500 fill-current'
                        : 'text-elegant-300'
                        }`}
                    />
                  ))}
                </div>
                <span className="text-elegant-600 font-lato">
                  {product.rating} ({product.reviewCount} reseñas)
                </span>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-bold text-elegant-900 font-lato">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-lg text-elegant-500 line-through font-lato">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
                {product.originalPrice && (
                  <div className="text-green-600 font-lato font-semibold">
                    Ahorras {formatPrice(product.originalPrice - product.price)}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="font-playfair font-semibold text-elegant-900 mb-2">Descripción</h3>
                <p className="text-elegant-700 font-lato leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Size Selection for Rings and Bracelets */}
              {(['anillos', 'pulseras'].includes(product.category)) && (
                <div>
                  <h3 className="font-playfair font-semibold text-elegant-900 mb-3">Talla</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-2 px-3 border rounded-lg font-lato font-semibold transition-all ${selectedSize === size
                          ? 'border-gold-500 bg-gold-50 text-gold-700'
                          : 'border-elegant-300 hover:border-gold-300'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <h3 className="font-playfair font-semibold text-elegant-900 mb-3">Cantidad</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-elegant-300 rounded-lg flex items-center justify-center hover:border-gold-500 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-lato font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border border-elegant-300 rounded-lg flex items-center justify-center hover:border-gold-500 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock || isAddingToCart}
                  className={`w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-lg font-lato font-bold transition-all ${product.inStock && !isAddingToCart
                    ? 'bg-gradient-gold text-elegant-900 hover:shadow-gold transform hover:scale-105'
                    : 'bg-elegant-200 text-elegant-500 cursor-not-allowed'
                    }`}
                >
                  {isAddingToCart ? (
                    <>
                      <div className="w-5 h-5 border-2 border-elegant-900 border-t-transparent rounded-full animate-spin" />
                      <span>Agregando...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-5 w-5" />
                      <span>{product.inStock ? 'Agregar al Carrito' : 'No Disponible'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => toggleWishlist(product)}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-6 border-2 rounded-lg font-lato font-semibold transition-all ${isInWishlist(product.id)
                    ? 'border-gold-500 bg-gold-50 text-gold-700'
                    : 'border-elegant-300 text-elegant-700 hover:border-gold-500'
                    }`}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                  <span>{isInWishlist(product.id) ? 'En Favoritos' : 'Agregar a Favoritos'}</span>
                </button>
              </div>

              {/* Product Details */}
              <div className="space-y-4 pt-4 border-t border-elegant-200">
                <div>
                  <h4 className="font-playfair font-semibold text-elegant-900 mb-1">Materiales</h4>
                  <p className="text-elegant-700 font-lato text-sm">{product.materials}</p>
                </div>
                <div>
                  <h4 className="font-playfair font-semibold text-elegant-900 mb-1">Dimensiones</h4>
                  <p className="text-elegant-700 font-lato text-sm">{product.dimensions}</p>
                </div>
                <div>
                  <h4 className="font-playfair font-semibold text-elegant-900 mb-1">Cuidados</h4>
                  <p className="text-elegant-700 font-lato text-sm">{product.care}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;