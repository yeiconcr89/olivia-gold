import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Package, Calendar, MapPin } from 'lucide-react';
import { API_CONFIG, apiRequest } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';

const OrdersPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await apiRequest<Order[]>(API_CONFIG.ENDPOINTS.ORDERS.MY_ORDERS);
                setOrders(data);
            } catch (err) {
                console.error('Error fetching orders:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchOrders();
        } else {
            setLoading(false);
        }
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen pt-32 pb-12 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen pt-32 pb-12 container mx-auto px-4 text-center">
                <h2 className="text-2xl font-bold mb-4">Inicia sesión para ver tus pedidos</h2>
                <button
                    onClick={() => navigate('/')}
                    className="bg-amber-500 text-white px-6 py-2 rounded-full font-medium hover:bg-amber-600 transition-colors"
                >
                    Volver al inicio
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 pb-12 bg-gray-50">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8 flex items-center gap-3">
                    <ShoppingBag className="h-8 w-8 text-amber-500" />
                    Mis Pedidos
                </h1>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Package className="h-10 w-10 text-amber-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Aún no tienes pedidos</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            Explora nuestra colección de joyas exclusivas y encuentra la pieza perfecta para ti.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-amber-500 text-white px-8 py-3 rounded-full font-medium hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
                        >
                            Explorar Colección
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-lg font-bold text-gray-900">Pedido #{order.orderNumber}</span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                                                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {order.status === 'PENDING' ? 'Pendiente' :
                                                        order.status === 'CONFIRMED' ? 'Confirmado' :
                                                            order.status === 'PROCESSING' ? 'En Proceso' :
                                                                order.status === 'SHIPPED' ? 'Enviado' :
                                                                    order.status === 'DELIVERED' ? 'Entregado' :
                                                                        'Cancelado'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(order.orderDate).toLocaleDateString()}
                                                </span>
                                                <span className="font-medium text-gray-900">
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(order.total)}
                                                </span>
                                            </div>
                                        </div>
                                        {order.trackingNumber && (
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 mb-1">Guía de rastreo</p>
                                                <p className="font-mono font-medium text-gray-900">{order.trackingNumber}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-gray-100 pt-6">
                                        <div className="space-y-4">
                                            {order.items.map((item) => (
                                                <div key={item.id} className="flex items-center gap-4">
                                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                                        {item.productImage ? (
                                                            <img
                                                                src={item.productImage}
                                                                alt={item.productName}
                                                                className="h-full w-full object-cover object-center"
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                                                                <Package className="h-6 w-6 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-medium text-gray-900 truncate">{item.productName}</h4>
                                                        <p className="text-sm text-gray-500">Cant: {item.quantity}</p>
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.price)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {order.shippingAddress && (
                                        <div className="mt-6 pt-4 border-t border-gray-100 flex items-start gap-2 text-sm text-gray-500">
                                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <p>
                                                Enviado a: {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersPage;
