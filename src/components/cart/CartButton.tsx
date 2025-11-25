import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

interface CartButtonProps {
  onClick: () => void;
  className?: string;
}

const CartButton: React.FC<CartButtonProps> = ({ onClick, className = '' }) => {
  const { getTotalItems } = useCart();
  const itemCount = getTotalItems();

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-600 hover:text-amber-600 transition-colors ${className}`}
    >
      <ShoppingCart className="w-6 h-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  );
};

export default CartButton;