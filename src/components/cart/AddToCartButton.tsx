import React, { useState, useRef } from 'react';
import { ShoppingCart, Check, AlertCircle } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useToast } from '../../hooks/useToast';

interface AddToCartButtonProps {
  productId: string;
  quantity?: number;
  size?: string;
  customization?: Record<string, unknown>;
  variant?: 'primary' | 'secondary' | 'outline';
  size_button?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children?: React.ReactNode;
  onClick?: () => void; // Override del onClick por defecto
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  productId,
  quantity = 1,
  size,
  customization,
  variant = 'primary',
  size_button = 'md',
  disabled = false,
  children,
  onClick
}) => {
  const { addToCart, loading } = useCart();
  const { error: showError } = useToast();
  const [success, setSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Ref para prevenir double execution en React StrictMode
  const isExecutingRef = useRef(false);
  const lastExecutionRef = useRef(0);

  const handleAddToCart = async (event?: React.MouseEvent) => {
    // Prevenir propagación del evento
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Si hay onClick personalizado, usarlo en lugar del comportamiento por defecto
    if (onClick) {
      onClick();
      return;
    }

    const now = Date.now();

    // Prevenir clicks dobles y double execution de React StrictMode
    // Aumentar el tiempo de protección a 2 segundos
    if (isProcessing || loading || isExecutingRef.current || (now - lastExecutionRef.current < 2000)) {
      console.log('⚠️ AddToCartButton: Ignorando ejecución duplicada para productId:', productId, 'isProcessing:', isProcessing, 'loading:', loading, 'isExecuting:', isExecutingRef.current, 'timeDiff:', now - lastExecutionRef.current);
      return;
    }

    isExecutingRef.current = true;
    lastExecutionRef.current = now;

    console.log('🔥 AddToCartButton: handleAddToCart EJECUTANDO para productId:', productId, 'quantity:', quantity, 'timestamp:', now);
    setIsProcessing(true);

    try {
      await addToCart({
        productId,
        quantity,
        size,
        customization
      });

      // Mostrar estado de éxito
      setSuccess(true);
      setLocalError(null);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);

      // Mostrar error al usuario con toast
      const errorMessage = error instanceof Error ? error.message : 'Error al agregar al carrito';
      setLocalError(errorMessage);

      // Mostrar toast con mensaje específico
      if (errorMessage.includes('0 unidades disponibles')) {
        showError(
          'Producto sin stock',
          'Este producto está agotado. Por favor, contacta al administrador o elige otro producto.',
          7000
        );
      } else if (errorMessage.includes('unidades disponibles')) {
        // Extraer número de unidades del mensaje si es posible
        showError(
          'Stock limitado',
          errorMessage,
          7000
        );
      } else {
        showError(
          'Error al agregar',
          errorMessage,
          5000
        );
      }

      // Limpiar error local después de un tiempo
      setTimeout(() => setLocalError(null), 3000);
    } finally {
      setIsProcessing(false);
      // Reset el flag después de un delay más largo para prevenir duplicados
      setTimeout(() => {
        isExecutingRef.current = false;
      }, 2500);
    }
  };

  const getButtonClasses = () => {
    const baseClasses = 'w-full flex items-center justify-center space-x-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    const variantClasses = {
      primary: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
      outline: 'border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white focus:ring-2 focus:ring-amber-500 focus:ring-offset-2'
    };

    return `${baseClasses} ${sizeClasses[size_button]} ${variantClasses[variant]}`;
  };

  const isDisabled = disabled || loading || isProcessing;

  return (
    <button
      onClick={(e) => handleAddToCart(e)}
      disabled={isDisabled}
      className={getButtonClasses()}
    >
      {(loading || isProcessing) ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Agregando...</span>
        </>
      ) : success ? (
        <>
          <Check className="w-4 h-4" />
          <span>¡Agregado!</span>
        </>
      ) : localError ? (
        <>
          <AlertCircle className="w-4 h-4" />
          <span className="truncate">Sin stock</span>
        </>
      ) : (
        <>
          {children ? (
            children
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              <span>Agregar al Carrito</span>
            </>
          )}
        </>
      )}
    </button>
  );
};

export default AddToCartButton;