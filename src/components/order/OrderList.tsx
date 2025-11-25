import React from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Eye,
  User,
  CreditCard
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

interface OrderListProps {
  orders: Order[];
  viewMode: 'list' | 'grid';
  selectedOrder: Order | null;
  onSelect: (order: Order) => void;
}

const OrderList: React.FC<OrderListProps> = ({ orders, viewMode, selectedOrder, onSelect }) => {
  const getStatusIcon = (status: string) => {
    const icons = {
      PENDING: Clock,
      CONFIRMED: CheckCircle,
      PROCESSING: Package,
      SHIPPED: Truck,
      DELIVERED: CheckCircle,
      CANCELLED: XCircle
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-purple-100 text-purple-800',
      SHIPPED: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orders.map((order) => (
          <button
            key={order.id}
            onClick={() => onSelect(order)}
            className={`block text-left w-full bg-white rounded-xl shadow-elegant p-4 hover:border-gold-200 transition-all ${
              selectedOrder?.id === order.id ? 'ring-2 ring-gold-500' : 'border border-elegant-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold">#{order.orderNumber}</p>
                <p className="text-sm text-elegant-500">
                  {new Date(order.orderDate).toLocaleDateString('es-ES')}
                </p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="ml-1">{order.status}</span>
              </span>
            </div>

            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{order.customerName}</p>
                <p className="text-xs text-elegant-500">{order.customerEmail}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-elegant-500">
                {order.items.length} productos
              </span>
              <span className="font-semibold">
                {formatPrice(order.total)}
              </span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-elegant overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-elegant-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-elegant-500 uppercase tracking-wider">
                Pedido
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-elegant-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-elegant-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-elegant-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-elegant-500 uppercase tracking-wider">
                Pago
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-elegant-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-elegant-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-elegant-200">
            {orders.map((order) => (
              <tr 
                key={order.id}
                onClick={() => onSelect(order)}
                className={`cursor-pointer transition-colors ${
                  selectedOrder?.id === order.id ? 'bg-gold-50' : 'hover:bg-elegant-50'
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <p className="font-medium text-elegant-900">
                      #{order.orderNumber}
                    </p>
                    <p className="text-elegant-500">
                      {order.items.length} productos
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-r from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-elegant-900">
                        {order.customerName}
                      </p>
                      <p className="text-sm text-elegant-500">
                        {order.customerEmail}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-elegant-900">
                    {formatPrice(order.total)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{order.status}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                    order.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    order.paymentStatus === 'REFUNDED' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    <CreditCard className="h-3 w-3 mr-1" />
                    {order.paymentStatus}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-elegant-500">
                  {new Date(order.orderDate).toLocaleDateString('es-ES')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(order);
                    }}
                    className="text-gold-600 hover:text-gold-900"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const OrderListSkeleton: React.FC<{ viewMode: 'list' | 'grid' }> = ({ viewMode }) => {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-elegant p-4 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="h-5 w-24 bg-elegant-200 rounded mb-1" />
                <div className="h-4 w-32 bg-elegant-200 rounded" />
              </div>
              <div className="h-6 w-20 bg-elegant-200 rounded-full" />
            </div>
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-elegant-200 rounded-full" />
              <div className="ml-3">
                <div className="h-4 w-32 bg-elegant-200 rounded mb-1" />
                <div className="h-3 w-48 bg-elegant-200 rounded" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-elegant-200 rounded" />
              <div className="h-4 w-20 bg-elegant-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-elegant overflow-hidden animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-elegant-50">
            <tr>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 w-24 bg-elegant-200 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-elegant-200">
            {[1, 2, 3].map((row) => (
              <tr key={row}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-5 w-24 bg-elegant-200 rounded mb-1" />
                  <div className="h-4 w-16 bg-elegant-200 rounded" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-elegant-200 rounded-full" />
                    <div className="ml-3">
                      <div className="h-4 w-32 bg-elegant-200 rounded mb-1" />
                      <div className="h-3 w-48 bg-elegant-200 rounded" />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 w-20 bg-elegant-200 rounded" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-6 w-24 bg-elegant-200 rounded-full" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-6 w-24 bg-elegant-200 rounded-full" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 w-24 bg-elegant-200 rounded" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="h-5 w-5 bg-elegant-200 rounded ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { OrderList, OrderListSkeleton };