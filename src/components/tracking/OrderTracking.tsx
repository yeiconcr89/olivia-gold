import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdvancedOrders } from '../../hooks/useAdvancedOrders';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Calendar,
  Phone,
  Mail,
  ArrowLeft,
  ExternalLink 
} from 'lucide-react';

interface OrderTrackingProps {
  orderId?: string;
}

interface OrderDetails {
  orderNumber: string;
  orderDate: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: OrderItem[];
  total: number;
  itemCount: number;
  estimatedDelivery?: string;
  trackingNumber?: string;
  timeline?: TimelineEvent[];
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface TimelineEvent {
  status: string;
  timestamp: string;
  description: string;
  location?: string;
  estimatedArrival?: string;
}


const OrderTracking: React.FC<OrderTrackingProps> = ({ orderId: propOrderId }) => {
  const { orderId: paramOrderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { getOrderDetails, getOrderTracking, loading } = useAdvancedOrders();
  
  const orderId = propOrderId || paramOrderId;
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrderData = async () => {
    if (!orderId) return;

    try {
      setError(null);
      const [details] = await Promise.all([
        getOrderDetails(orderId),
        getOrderTracking(orderId)
      ]);
      
      setOrderDetails(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar información del pedido');
    }
  };

  useEffect(() => {
    if (orderId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadOrderData();
    }
  }, [orderId]);

  // Status icons mapping
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'paid':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'confirmed':
      case 'processing':
      case 'preparing':
        return <Package className="w-6 h-6 text-blue-500" />;
      case 'shipped':
      case 'in_transit':
      case 'out_for_delivery':
        return <Truck className="w-6 h-6 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
      case 'processing':
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
      case 'in_transit':
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Status description mapping
  const getStatusDescription = (status: string) => {
    const descriptions: Record<string, string> = {
      'pending': 'Pedido creado y en espera de pago',
      'paid': 'Pago recibido correctamente',
      'confirmed': 'Pedido confirmado y en proceso',
      'processing': 'Preparando tu pedido',
      'preparing': 'Empacando productos',
      'shipped': 'Pedido enviado',
      'in_transit': 'En camino a tu dirección',
      'out_for_delivery': 'En reparto, llegará hoy',
      'delivered': 'Entregado exitosamente',
      'cancelled': 'Pedido cancelado',
    };
    return descriptions[status.toLowerCase()] || status;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Pedido no encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            No pudimos encontrar información sobre este pedido
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-amber-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Pedido #{orderDetails.orderNumber}
            </h1>
            <p className="text-gray-600">
              Realizado el {new Date(orderDetails.orderDate).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(orderDetails.status)}`}>
              {getStatusDescription(orderDetails.status)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Timeline de Seguimiento */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-6">Seguimiento del Pedido</h2>
            
            <div className="space-y-4">
              {orderDetails.timeline && orderDetails.timeline.length > 0 ? (
                orderDetails.timeline.map((event: TimelineEvent, index: number) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(event.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          {getStatusDescription(event.status)}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleDateString('es-ES', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {event.description}
                      </p>
                      
                      {event.location && (
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <MapPin className="w-4 h-4 mr-1" />
                          {event.location}
                        </div>
                      )}
                      
                      {event.estimatedArrival && (
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          Llegada estimada: {new Date(event.estimatedArrival).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Información de seguimiento no disponible</p>
                </div>
              )}
            </div>
          </div>

          {/* Información de Envío */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-6">Información de Envío</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Dirección de Entrega</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>{orderDetails.customerName}</div>
                  <div>{orderDetails.shippingAddress.street}</div>
                  <div>{orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state}</div>
                  <div>{orderDetails.shippingAddress.zipCode}</div>
                  <div>{orderDetails.shippingAddress.country}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Información de Contacto</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {orderDetails.customerEmail}
                  </div>
                  {/* Si hay información de teléfono */}
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    Contacto disponible
                  </div>
                </div>
              </div>
            </div>

            {orderDetails.trackingNumber && (
              <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-amber-900">Número de Seguimiento</h4>
                    <p className="text-amber-700 font-mono">{orderDetails.trackingNumber}</p>
                  </div>
                  <button className="flex items-center text-amber-600 hover:text-amber-700">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Seguir en Transportadora
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Productos */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-6">Productos Ordenados</h2>
            
            <div className="space-y-4">
              {orderDetails.items.map((item: OrderItem) => (
                <div key={item.id} className="flex space-x-4 py-4 border-b last:border-b-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0"></div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900">{item.productName}</h4>
                    <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                    <p className="text-sm text-gray-500">Precio unitario: ${item.price.toLocaleString()}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ${item.subtotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h3 className="text-lg font-semibold mb-4">Resumen del Pedido</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Número de Pedido</span>
                <span className="font-medium">{orderDetails.orderNumber}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Estado del Pedido</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(orderDetails.status)}`}>
                  {orderDetails.status}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Estado del Pago</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(orderDetails.paymentStatus)}`}>
                  {orderDetails.paymentStatus}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Total de Items</span>
                <span className="font-medium">{orderDetails.itemCount}</span>
              </div>
              
              {orderDetails.estimatedDelivery && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Entrega Estimada</span>
                  <span className="font-medium">
                    {new Date(orderDetails.estimatedDelivery).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${orderDetails.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => window.print()}
                className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
              >
                Imprimir Pedido
              </button>
              
              <button
                onClick={() => navigate('/contact')}
                className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700"
              >
                Contactar Soporte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;