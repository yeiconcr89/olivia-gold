import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, XCircle } from 'lucide-react';
import PaymentSummary from './PaymentSummary';
import WompiCheckout from './WompiCheckout';
import { useCart } from '../../hooks/useCart';
import { API_CONFIG, apiRequest } from '../../config/api';

interface CheckoutPageProps {
  orderId?: string;
  className?: string;
}

interface OrderData {
  id: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
    size?: string;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({
  orderId,
  className = ''
}) => {
  const navigate = useNavigate();
  const { cart, loading: cartLoading, isEmpty: isCartEmpty } = useCart();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderData();
    } else {
      // Usar datos reales del carrito en lugar de mock data
      if (cart && !cartLoading) {
        const realOrderData = {
          id: cart.id || 'cart-order',
          items: cart.items.map(item => ({
            id: item.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            image: item.product.images[0] || '/placeholder-product.jpg',
            size: item.size
          })),
          subtotal: cart.subtotal,
          shipping: cart.shippingAmount,
          tax: cart.taxAmount,
          discount: cart.discountAmount,
          total: cart.total
        };
        
        setOrderData(realOrderData);
        setLoading(false);
      } else if (!cartLoading && isCartEmpty()) {
        // Si el carrito está vacío, redirigir al carrito
        navigate('/');
      } else {
        setLoading(cartLoading);
      }
    }
  }, [orderId, cart, cartLoading, isCartEmpty, navigate]);

  const fetchOrderData = async () => {
    try {
      const url = API_CONFIG.ENDPOINTS.ORDERS.GET(orderId!);
      const data = await apiRequest<OrderData>(url, { method: 'GET', timeout: 8000 });
      setOrderData(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      setPageError('Error al cargar la información del pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToShop = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isCartEmpty() ? 'Carrito vacío' : 'Pedido no encontrado'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isCartEmpty() 
              ? 'Agrega productos a tu carrito antes de continuar' 
              : 'No se pudo cargar la información del pedido'
            }
          </p>
          <button
            onClick={handleBackToShop}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver a la tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <WompiCheckout orderId={orderData.id} amount={orderData.total} />

            {pageError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{pageError}</p>
              </div>
            )}
          </div>

          <div>
            <PaymentSummary
              items={orderData.items}
              subtotal={orderData.subtotal}
              shipping={orderData.shipping}
              tax={orderData.tax}
              discount={orderData.discount}
              total={orderData.total}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;