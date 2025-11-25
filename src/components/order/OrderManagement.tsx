import React, { useState } from 'react';
import { 
  Package, 
  XCircle, 
  Clock, 
  Truck, 
  Eye,
  Search,
  Download,
  CreditCard
} from 'lucide-react';
import { Timeline } from './Timeline';
import type { Order } from './types';

// Status color utility
const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'DELIVERED':
      return 'bg-green-100 text-green-800';
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'SHIPPED':
      return 'bg-indigo-100 text-indigo-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

interface OrderManagementProps {
  orders: Order[];
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => Promise<void>;
  onAddNote?: (orderId: string, note: { content: string; isInternal: boolean }) => Promise<void>;
  onUpdateTimeline?: (orderId: string, event: { status: Order['status']; description: string }) => Promise<void>;
  onExportData?: () => void;
  loading?: boolean;
  error?: string | null;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ 
  orders = [], 
  onUpdateOrder,
  onAddNote,
  onUpdateTimeline,
  onExportData,
  loading = false,
  error = null
}) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');

  // Format price utility function
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Si está cargando, muestra los esqueletos
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  // Si hay un error, muestra el mensaje de error
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 text-red-600">
          <XCircle className="h-12 w-12 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error al cargar los pedidos</h3>
          <p className="text-center text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  // Si no hay pedidos, muestra un mensaje amigable con opciones
  if (!orders || orders.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Package className="h-16 w-16 mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No hay pedidos disponibles</h3>
          <p className="text-center text-gray-600 max-w-md mb-6">
            Cuando los clientes realicen pedidos, aparecerán aquí. Podrás gestionarlos, ver su estado y hacer seguimiento.
          </p>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = !searchTerm || 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-elegant-600">Total Pedidos</p>
              <p className="text-2xl font-semibold">{orders.length}</p>
            </div>
            <Package className="h-8 w-8 text-gold-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-elegant-600">Pendientes</p>
              <p className="text-2xl font-semibold text-yellow-600">
                {orders.filter(o => o.status === 'PENDING').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-elegant-600">En Proceso</p>
              <p className="text-2xl font-semibold text-blue-600">
                {orders.filter(o => o.status === 'PROCESSING').length}
              </p>
            </div>
            <Truck className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-elegant-600">Ingresos</p>
              <p className="text-2xl font-semibold text-green-600">
                {formatPrice(
                  orders.reduce((sum, o) => sum + o.total, 0)
                )}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-elegant p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1 flex gap-4 w-full sm:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-elegant-400" />
              <input
                type="text"
                placeholder="Buscar pedidos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-elegant-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Order['status'] | 'all')}
              className="min-w-[150px] px-4 py-2 border border-elegant-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            >
              <option value="all">Todos</option>
              <option value="PENDING">Pendientes</option>
              <option value="PROCESSING">En proceso</option>
              <option value="SHIPPED">Enviados</option>
              <option value="DELIVERED">Entregados</option>
              <option value="CANCELLED">Cancelados</option>
            </select>
          </div>
          <button
            onClick={onExportData}
            className="inline-flex items-center px-4 py-2 border border-elegant-300 rounded-lg hover:bg-elegant-50"
          >
            <Download className="h-5 w-5 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-elegant overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="bg-elegant-50 border-b border-elegant-200">
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-elegant-500 uppercase tracking-wider">
                    Pedido
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-elegant-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-elegant-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-elegant-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-elegant-500 uppercase tracking-wider">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-elegant-200">
                {filteredOrders.map(order => (
                  <tr 
                    key={order.id}
                    className={`hover:bg-elegant-50 cursor-pointer ${
                      selectedOrder?.id === order.id ? 'bg-elegant-100' : ''
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium">{order.orderNumber}</div>
                        <div className="text-sm text-elegant-500">{order.itemsCount} items</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-sm text-elegant-500">{order.customerEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-elegant-500">
                      {new Date(order.orderDate).toLocaleDateString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details */}
        <div className="lg:col-span-1">
          {selectedOrder ? (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-elegant p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Detalles del Pedido</h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-elegant-400 hover:text-elegant-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm text-elegant-500">Cliente</dt>
                    <dd className="mt-1">
                      <div className="font-medium">{selectedOrder.customerName}</div>
                      <div className="text-sm text-elegant-600">{selectedOrder.customerEmail}</div>
                      <div className="text-sm text-elegant-600">{selectedOrder.customerPhone}</div>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-elegant-500">Estado</dt>
                    <dd className="mt-1">
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => onUpdateOrder(selectedOrder.id, { 
                          status: e.target.value as Order['status'] 
                        })}
                        className="w-full p-2 border border-elegant-300 rounded-md focus:ring-2 focus:ring-gold-500"
                      >
                        <option value="PENDING">Pendiente</option>
                        <option value="CONFIRMED">Confirmado</option>
                        <option value="PROCESSING">En proceso</option>
                        <option value="SHIPPED">Enviado</option>
                        <option value="DELIVERED">Entregado</option>
                        <option value="CANCELLED">Cancelado</option>
                      </select>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-elegant-500">Productos</dt>
                    <dd className="mt-1">
                      <ul className="divide-y divide-elegant-200">
                        {selectedOrder.items.map(item => (
                          <li key={item.id} className="py-2">
                            <div className="flex justify-between">
                              <div className="flex-1">
                                <p className="font-medium">{item.productName}</p>
                                <p className="text-sm text-elegant-500">
                                  {item.quantity} x {formatPrice(item.price)}
                                </p>
                              </div>
                              <p className="font-medium">
                                {formatPrice(item.quantity * item.price)}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>

                  <div className="pt-4 border-t border-elegant-200">
                    <div className="flex justify-between items-center">
                      <dt className="font-medium">Total</dt>
                      <dd className="text-xl font-semibold text-gold-600">
                        {formatPrice(selectedOrder.total)}
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>

              {/* Timeline */}
              {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                <div className="bg-white rounded-xl shadow-elegant p-6">
                  <h3 className="text-lg font-medium mb-4">Historial</h3>
                  <Timeline 
                    events={selectedOrder.timeline} 
                    onAddEvent={onUpdateTimeline ? 
                      event => onUpdateTimeline(selectedOrder.id, event) : 
                      undefined}
                  />
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="bg-white rounded-xl shadow-elegant p-6">
                  <h3 className="text-lg font-medium mb-4">Notas</h3>
                  <div className="space-y-4">
                    {selectedOrder.notes.map(note => (
                      <div key={note.id} className={`p-3 rounded-lg ${
                        note.isInternal ? 'bg-elegant-50' : 'bg-gold-50'
                      }`}>
                        <p className="text-sm text-elegant-600">{note.content}</p>
                        <div className="mt-2 text-xs text-elegant-500 flex justify-between">
                          <span>{note.createdBy}</span>
                          <span>{new Date(note.createdAt).toLocaleString('es-CO')}</span>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          const content = window.prompt('Añadir nota:');
                          if (content && onAddNote) {
                            onAddNote(selectedOrder.id, {
                              content,
                              isInternal: true
                            });
                          }
                        }}
                        className="inline-flex items-center px-4 py-2 border border-elegant-300 rounded-lg hover:bg-elegant-50"
                      >
                        Añadir nota
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-elegant p-6 text-center">
              <Eye className="h-12 w-12 mx-auto mb-4 text-elegant-400" />
              <h3 className="text-lg font-medium mb-2">
                Selecciona un pedido para ver sus detalles
              </h3>
              <p className="text-sm text-elegant-500">
                Aquí podrás ver toda la información y gestionar el pedido
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;