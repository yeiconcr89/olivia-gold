import React, { ReactNode, useEffect } from 'react';
import Header from '../Header';
import Footer from '../Footer';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { getAllCategories } from '../../config/categories';
import { User } from '../../types';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title = 'Olivia Gold - Joyería de Calidad',
  description = 'Descubre nuestra exclusiva colección de joyas de alta calidad',
  className = '',
}) => {
  // These are kept for potential future use
  const [_, setSearchTerm] = React.useState('');
  const { getTotalItems: _getTotalItems } = useCart();
  const { wishlist: _wishlist } = useWishlist();
  const { user } = useAuth();
  const categories = getAllCategories();
  const [activeCategory, setActiveCategory] = React.useState('all');

  // Set document title and meta description
  useEffect(() => {
    document.title = title;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }
  }, [title, description]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    // Aquí podrías añadir lógica adicional cuando cambia la categoría
    console.log('Category changed to:', category);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    // Aquí podrías añadir lógica de búsqueda
    console.log('Search term:', term);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onCategoryChange={handleCategoryChange}
        onSearchChange={handleSearchChange}
        user={user}
        authMethod={user?.role === 'ADMIN' ? 'email' : 'google'}
      />
      
      <main className={`flex-grow ${className}`}>
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default PageLayout;
