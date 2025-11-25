import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WishlistContextType {
  wishlist: string[];
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Cargar wishlist desde localStorage al inicializar
  useEffect(() => {
    const savedWishlist = localStorage.getItem('olivia-gold-wishlist');
    if (savedWishlist) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWishlist(JSON.parse(savedWishlist));
      } catch (error) {
        console.error('Error loading wishlist from localStorage:', error);
        setWishlist([]);
      }
    }
    setIsInitialized(true);
  }, []);

  // Guardar wishlist en localStorage cuando cambie (solo después de inicializar)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('olivia-gold-wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, isInitialized]);

  const addToWishlist = (productId: string) => {
    setWishlist(prev => {
      if (!prev.includes(productId)) {
        console.log('Producto agregado a favoritos');
        return [...prev, productId];
      }
      return prev;
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(prev => {
      const newWishlist = prev.filter(id => id !== productId);
      console.log('Producto removido de favoritos');
      return newWishlist;
    });
  };

  const toggleWishlist = (productId: string) => {
    if (wishlist.includes(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const value: WishlistContextType = {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};