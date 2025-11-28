import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../hooks/useCart';

const WishlistPage: React.FC = () => {
    const navigate = useNavigate();
    const { wishlist, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();

    const handleAddToCart = (product: any) => {
        addToCart({ productId: product.id, quantity: 1 });
        removeFromWishlist(product.id);
    };

    return (
        <div className="min-h-screen pt-32 pb-12 bg-gray-50">
            <div className="container mx-auto px-4 max-w-6xl">
                <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8 flex items-center gap-3">
                    <Heart className="h-8 w-8 text-amber-500 fill-amber-500" />
                    Mi Lista de Deseos
                </h1>

                {wishlist.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Heart className="h-10 w-10 text-amber-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Tu lista de deseos está vacía</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            Guarda los artículos que más te gusten para no perderlos de vista.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-amber-500 text-white px-8 py-3 rounded-full font-medium hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
                        >
                            Descubrir Joyas
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlist.map((product) => (
                            <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 group hover:shadow-md transition-all">
                                <div className="relative aspect-square overflow-hidden">
                                    <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <button
                                        onClick={() => removeFromWishlist(product.id)}
                                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm"
                                        title="Eliminar de la lista"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="p-5">
                                    <h3 className="text-lg font-medium text-gray-900 mb-2 truncate">{product.name}</h3>
                                    <p className="text-amber-600 font-bold text-lg mb-4">
                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(product.price)}
                                    </p>

                                    <button
                                        onClick={() => handleAddToCart(product)}
                                        className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-lg hover:bg-amber-500 transition-colors"
                                    >
                                        <ShoppingBag className="h-4 w-4" />
                                        Agregar al Carrito
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WishlistPage;
