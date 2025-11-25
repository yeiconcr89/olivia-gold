import React, { useState } from 'react';
import { 
  Package, 
  User, 
  CreditCard, 
  Truck, 
  Edit,
  Check,
  X,
  MapPin
} from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  size?: string;
}

interface ShippingAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  itemsCount: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  shippingAddress?: ShippingAddress;
  orderDate: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderDetailsProps {
  order: Order;
  formatPrice: (price: number) => string;
  onUpdate: (orderId: string, updates: {
    status?: Order['status'];
    paymentStatus?: Order['paymentStatus'];
    trackingNumber?: string;
    estimatedDelivery?: string;
    notes?: string;
  }) => Promise<void>;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order, formatPrice, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    trackingNumber: order.trackingNumber || '',
    estimatedDelivery: order.estimatedDelivery || '',
    notes: order.notes || ''
  });

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-purple-100 text-purple-800',
      SHIPPED: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      PAID: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-orange-100 text-orange-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleSave = async () => {
    try {
      await onUpdate(order.id, editedData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating order:', error);
      // Here you could show an error toast
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-elegant divide-y divide-elegant-200">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="admin-heading text-xl">
            Pedido #{order.orderNumber}
          </h2>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>
        <p className="text-sm text-elegant-500">
          Creado el {new Date(order.createdAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      {/* Customer Information */}
      <div className="p-6">
        <div className="flex items-center mb-4">
          <User className="h-5 w-5 text-elegant-500 mr-2" />
          <h3 className="admin-subheading">Información del Cliente</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-elegant-500">Nombre</p>
            <p className="admin-body font-medium">{order.customerName}</p>
          </div>
          <div>
            <p className="text-sm text-elegant-500">Email</p>
            <p className="admin-body font-medium">{order.customerEmail}</p>
          </div>
          <div>
            <p className="text-sm text-elegant-500">Teléfono</p>
            <p className="admin-body font-medium">{order.customerPhone}</p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="p-6">
        <div className="flex items-center mb-4">
          <Package className="h-5 w-5 text-elegant-500 mr-2" />
          <h3 className="admin-subheading">Productos ({order.itemsCount})</h3>
        </div>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-elegant-50 rounded-lg">
              <div className="flex items-center">
                {item.productImage && (
                  <img 
                    src={item.productImage} 
                    alt={item.productName}
                    className="w-12 h-12 rounded-md object-cover mr-3"
                  />
                )}
                <div>
                  <p className="admin-body font-medium">{item.productName}</p>
                  <p className="text-sm text-elegant-500">
                    Cantidad: {item.quantity} {item.size && `• Talla: ${item.size}`}
                  </p>
                </div>
              </div>
              <p className="admin-body font-semibold">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between items-center pt-4 border-t border-elegant-200">
          <span className="admin-body text-elegant-600">Total</span>
          <span className="admin-body text-lg font-semibold text-gold-600">
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      {/* Payment Information */}
      <div className="p-6">
        <div className="flex items-center mb-4">
          <CreditCard className="h-5 w-5 text-elegant-500 mr-2" />
          <h3 className="admin-subheading">Información de Pago</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-elegant-500">Método</p>
            <p className="admin-body font-medium">{order.paymentMethod}</p>
          </div>
          <div>
            <p className="text-sm text-elegant-500">Estado</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.paymentStatus)}`}>
              {order.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Shipping Information */}
      {order.shippingAddress && (
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Truck className="h-5 w-5 text-elegant-500 mr-2" />
            <h3 className="admin-subheading">Información de Envío</h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="ml-auto text-sm text-gold-600 hover:text-gold-700 flex items-center"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </button>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-elegant-500 mb-1">
                  Número de seguimiento
                </label>
                <input
                  type="text"
                  value={editedData.trackingNumber}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    trackingNumber: e.target.value
                  })}
                  className="admin-input block w-full"
                  placeholder="Ingrese el número de seguimiento"
                />
              </div>
              <div>
                <label className="block text-sm text-elegant-500 mb-1">
                  Fecha estimada de entrega
                </label>
                <input
                  type="date"
                  value={editedData.estimatedDelivery?.split('T')[0] || ''}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    estimatedDelivery: e.target.value
                  })}
                  className="admin-input block w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-elegant-500 mb-1">
                  Notas de envío
                </label>
                <textarea
                  value={editedData.notes}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    notes: e.target.value
                  })}
                  className="admin-input block w-full"
                  rows={3}
                  placeholder="Ingrese notas adicionales"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedData({
                      trackingNumber: order.trackingNumber || '',
                      estimatedDelivery: order.estimatedDelivery || '',
                      notes: order.notes || ''
                    });
                  }}
                  className="flex items-center px-3 py-2 border border-elegant-300 rounded-lg hover:bg-elegant-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center px-3 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Guardar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-elegant-400 mr-2 mt-0.5" />
                <div>
                  <p className="admin-body">{order.shippingAddress.street}</p>
                  <p className="admin-body">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                  <p className="admin-body">{order.shippingAddress.zipCode}, {order.shippingAddress.country}</p>
                </div>
              </div>
              {order.trackingNumber && (
                <div>
                  <p className="text-sm text-elegant-500">Número de seguimiento</p>
                  <p className="admin-body font-medium">{order.trackingNumber}</p>
                </div>
              )}
              {order.estimatedDelivery && (
                <div>
                  <p className="text-sm text-elegant-500">Entrega estimada</p>
                  <p className="admin-body font-medium">
                    {new Date(order.estimatedDelivery).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
              {order.notes && (
                <div>
                  <p className="text-sm text-elegant-500">Notas</p>
                  <p className="admin-body whitespace-pre-wrap">{order.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const OrderDetailsSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-elegant divide-y divide-elegant-200 animate-pulse">
      <div className="p-6">
        <div className="h-6 w-32 bg-elegant-200 rounded mb-4" />
        <div className="h-4 w-48 bg-elegant-200 rounded" />
      </div>
      <div className="p-6 space-y-4">
        <div className="h-5 w-40 bg-elegant-200 rounded" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-elegant-200 rounded" />
              <div className="h-5 w-32 bg-elegant-200 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="h-5 w-40 bg-elegant-200 rounded" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-elegant-50 rounded-lg">
              <div className="h-12 w-12 bg-elegant-200 rounded" />
              <div className="flex-1 ml-3">
                <div className="h-5 w-48 bg-elegant-200 rounded mb-2" />
                <div className="h-4 w-32 bg-elegant-200 rounded" />
              </div>
              <div className="h-5 w-24 bg-elegant-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { OrderDetails, OrderDetailsSkeleton };