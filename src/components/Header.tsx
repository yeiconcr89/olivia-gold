import React, { useState, useEffect, useMemo } from 'react';
import { Search, Heart, ShoppingBag, Menu, X, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { getAllCategories } from '../config/categories';
import Logo from './Logo';
import UserDropdown from './UserDropdown';
import ShoppingCart from './cart/ShoppingCart';
import DevRoleSwitch from './DevRoleSwitch';
import type { User } from '../types';

interface HeaderProps {
  onCategoryChange: (category: string) => void;
  onSearchChange: (search: string) => void;
  onWishlistClick?: () => void; // Nueva prop
  user?: User;
  authMethod?: 'email' | 'google' | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onCategoryChange,
  onSearchChange,
  onWishlistClick, // Nueva prop
  user,
  authMethod,
  onLogin,
  onLogout
}) => {
  const navigate = useNavigate();
  const { getTotalItems } = useCart();
  const { wishlist } = useWishlist();
  const { user: authUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const categories = useMemo(() => getAllCategories(), []);

  const totalItems = getTotalItems();

  const bannerMessages = useMemo(() => [
    "💬 Contáctanos por WhatsApp para asesoría personalizada",
    "🚚 ENVÍO GRATIS en compras superiores a $200.000 💎",
    "⭐ Oro laminado 18k certificado - Calidad garantizada"
  ], []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [bannerMessages.length]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setShowSuggestions(value.length > 0);
    // NO llamamos a onSearchChange aquí - solo actualizamos el input
  };

  const executeSearch = () => {
    if (searchTerm.trim()) {
      setShowSuggestions(false);
      navigate(`/productos?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId); // 2. Actualizar el estado
    onCategoryChange(categoryId); // Llamar a la función original

    // Actualizar la URL sin recargar la página
    if (categoryId === 'all') {
      navigate('/');
    } else {
      navigate(`/productos?category=${categoryId}`);
    }
  };

  const handleCartClick = () => {
    setIsCartOpen(true);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-none">
      {/* 1. Top Banner - Sutil y limpio */}
      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black py-2 px-4">
        <p className="text-center text-sm font-medium">
          {bannerMessages[currentBanner]}
        </p>
      </div>

      {/* 2. Main Header - Estructura de 3 columnas como la imagen */}
      <div className="bg-white">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Columna Izquierda: Logo */}
            <div className="flex-shrink-0">
              <Logo size="lg" variant="dark" withText={true} />
            </div>

            {/* Columna Central: Barra de Búsqueda Prominente (Desktop) */}
            <div className="hidden md:flex flex-1 justify-center px-8">
              <div className="w-full max-w-lg">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar productos, marcas y más..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        executeSearch();
                      }
                    }}
                    onFocus={() => searchTerm && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full pl-12 pr-24 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base bg-white transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={executeSearch}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors text-sm font-medium shadow-sm"
                    >
                      Buscar
                    </button>
                  )}

                  {/* Dropdown de sugerencias tipo Mercado Libre */}
                  {showSuggestions && searchTerm && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-sm text-gray-500">Presiona Enter o haz click en "Buscar" para ver resultados</p>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={executeSearch}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3"
                        >
                          <Search className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">{searchTerm}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Columna Derecha: Acciones de Usuario */}
            <div className="flex items-center justify-end space-x-4">
              {/* DevRoleSwitch integrado en el header - Solo en desarrollo */}
              {!import.meta.env.PROD && (
                <DevRoleSwitch
                  currentRole={authUser?.role === 'ADMIN' || authUser?.role === 'MANAGER' ? 'admin' : 'client'}
                  userName={authUser?.profile?.name || authUser?.email}
                />
              )}

              {user ? (
                <UserDropdown
                  user={user}
                  authMethod={authMethod}
                  onLogout={() => onLogout && onLogout()}
                />
              ) : (
                <button
                  onClick={() => onLogin && onLogin()}
                  className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors"
                  title="Iniciar sesión"
                >
                  <UserIcon className="h-6 w-6" />
                </button>
              )}

              <button
                onClick={onWishlistClick}
                className="text-gray-600 hover:text-amber-600 transition-colors relative"
                title="Lista de deseos"
              >
                <Heart className="h-6 w-6" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-amber-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-semibold">
                    {wishlist.length}
                  </span>
                )}
              </button>

              <button onClick={handleCartClick} className="text-gray-600 hover:text-amber-600 transition-colors relative" title="Carrito de compras">
                <ShoppingBag className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-amber-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-semibold">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Botón de Menú Móvil */}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-gray-600">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* 3. Barra de Navegación (Desktop) */}
      <nav className="hidden md:flex bg-white">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-start space-x-8 h-12">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)} // 3. Usar el nuevo manejador
                className={`font-medium transition-colors duration-200 text-sm relative pb-1 \
                  ${activeCategory === category.id
                    ? 'text-black'
                    : 'text-gray-500 hover:text-black'}`
                }
              >
                {category.name}
                {/* 4. Indicador visual para la categoría activa */}
                {activeCategory === category.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-full"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Menú y Búsqueda Móvil */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          {/* Búsqueda Móvil */}
          <div className="px-4 py-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 text-base bg-gray-50"
              />
            </div>
          </div>
          {/* Navegación Móvil */}
          <nav className="px-2 py-2 space-y-1">
            {!user && (
              <button
                onClick={() => {
                  onLogin?.();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium rounded-md transition-colors bg-amber-50 text-amber-800 mb-2"
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Iniciar Sesión
                </div>
              </button>
            )}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  handleCategoryClick(category.id);
                  setIsMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 text-base font-medium rounded-md transition-colors \
                  ${activeCategory === category.id
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-black'}`
                }
              >
                {category.name}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Nuevo componente de carrito */}
      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          navigate('/checkout');
        }}
      />
    </header>
  );
};

export default Header;
