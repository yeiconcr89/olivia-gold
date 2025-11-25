import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  Star,
  Eye,
  Heart,
  Globe
} from 'lucide-react';
import { Product } from '../types';

interface DashboardStatsProps {
  products: Product[];
  onQuickAction?: (action: string) => void;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ products, onQuickAction }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Asegurarnos de que products es un array
  const safeProducts = Array.isArray(products) ? products : [];
  
  const totalProducts = safeProducts.length;
  const inStockProducts = safeProducts.filter(p => p && p.inStock).length;
  const featuredProducts = safeProducts.filter(p => p && p.featured).length;
  const totalValue = safeProducts.reduce((sum, product) => {
    if (!product || typeof product.price !== 'number') return sum;
    return sum + product.price;
  }, 0);
  const averagePrice = totalProducts > 0 ? totalValue / totalProducts : 0;
  const averageRating = totalProducts > 0 
    ? safeProducts.reduce((sum, product) => {
        if (!product || typeof product.rating !== 'number') return sum;
        return sum + product.rating;
      }, 0) / totalProducts 
    : 0;

  const stats = [
    {
      title: 'Productos Totales',
      value: totalProducts.toString(),
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Valor Total Inventario',
      value: formatPrice(totalValue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+8.2%',
      changeType: 'positive'
    },
    {
      title: 'Productos en Stock',
      value: `${inStockProducts}/${totalProducts}`,
      icon: TrendingUp,
      color: 'text-gold-600',
      bgColor: 'bg-gold-100',
      change: `${Math.round((inStockProducts / totalProducts) * 100)}%`,
      changeType: 'neutral'
    },
    {
      title: 'Precio Promedio',
      value: formatPrice(averagePrice),
      icon: Star,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+5.4%',
      changeType: 'positive'
    },
    {
      title: 'Productos Destacados',
      value: featuredProducts.toString(),
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      change: '+2',
      changeType: 'positive'
    },
    {
      title: 'Calificación Promedio',
      value: averageRating.toFixed(1),
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: '+0.3',
      changeType: 'positive'
    }
  ];

  const recentActivity = [
    { action: 'Nuevo producto agregado', item: 'Collar Veneciano Premium', time: 'Hace 2 horas' },
    { action: 'Stock actualizado', item: 'Anillo Solitario Diamante', time: 'Hace 4 horas' },
    { action: 'Producto destacado', item: 'Pulsera Tenis Brillante', time: 'Hace 6 horas' },
    { action: 'Precio actualizado', item: 'Aretes Perla Clásicos', time: 'Hace 1 día' },
    { action: 'Nueva categoría', item: 'Relojes Elegantes', time: 'Hace 2 días' }
  ];

  // Filtrar productos con imágenes y rating válidos antes de ordenar
  const topProducts = safeProducts
    .filter(product => 
      product && 
      typeof product.rating === 'number' && 
      Array.isArray(product.images) &&
      product.images.length > 0
    )
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-elegant p-6 hover:shadow-gold transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="admin-label text-elegant-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl">
                  {stat.value}
                </p>
                <div className="flex items-center mt-2">
                  <span className={`admin-body ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-elegant-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="admin-body text-elegant-500 ml-1">
                    vs mes anterior
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-elegant p-6">
          <h3 className="text-lg admin-subheading mb-4">
            Actividad Reciente
          </h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.action} className="flex items-center space-x-3 p-3 bg-elegant-50 rounded-lg">
                <div className="w-2 h-2 bg-gold-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="admin-body text-elegant-900">
                    <span className="font-semibold">{activity.action}:</span> {activity.item}
                  </p>
                  <p className="text-xs text-elegant-500">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-elegant p-6">
          <h3 className="text-lg admin-subheading mb-4">
            Productos Mejor Valorados
          </h3>
          <div className="space-y-4">
            {topProducts.map((product) => (
              <div key={product.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <img
                    src={product.images && product.images.length > 0 
                      ? product.images[0] 
                      : '/placeholder-product.png'}
                    alt={product.name || 'Producto'}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="admin-body font-semibold text-elegant-900 truncate">
                    {product.name}
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.floor(product.rating) 
                              ? 'text-gold-500 fill-current' 
                              : 'text-elegant-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-elegant-600">
                      {product.rating} ({product.reviewCount})
                    </span>
                  </div>
                </div>
                <div className="admin-body font-semibold text-elegant-900">
                  {formatPrice(product.price)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions - ACTUALIZADO CON LOS NUEVOS BOTONES */}
      <div className="bg-white rounded-xl shadow-elegant p-6">
        <h3 className="text-lg admin-subheading mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button 
            onClick={() => onQuickAction?.('new-product')}
            className="flex flex-col items-center p-4 bg-elegant-50 rounded-lg hover:bg-gold-50 transition-colors group"
          >
            <div className="p-3 bg-gold-100 rounded-full group-hover:bg-gold-200 transition-colors mb-2">
              <Package className="h-6 w-6 text-gold-600" />
            </div>
            <span className="admin-label text-elegant-900 text-center">
              Nuevo Producto
            </span>
            <span className="text-xs admin-body text-elegant-600 text-center mt-1">
              Agregar al catálogo
            </span>
          </button>

          <button 
            onClick={() => onQuickAction?.('new-customer')}
            className="flex flex-col items-center p-4 bg-elegant-50 rounded-lg hover:bg-blue-50 transition-colors group"
          >
            <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors mb-2">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <span className="admin-label text-elegant-900 text-center">
              Nuevo Cliente
            </span>
            <span className="text-xs admin-body text-elegant-600 text-center mt-1">
              Agregar cliente
            </span>
          </button>

          <button 
            onClick={() => onQuickAction?.('new-seo-page')}
            className="flex flex-col items-center p-4 bg-elegant-50 rounded-lg hover:bg-purple-50 transition-colors group"
          >
            <div className="p-3 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors mb-2">
              <Globe className="h-6 w-6 text-purple-600" />
            </div>
            <span className="admin-label text-elegant-900 text-center">
              Nueva Página
            </span>
            <span className="text-xs admin-body text-elegant-600 text-center mt-1">
              Gestión SEO
            </span>
          </button>

          <button 
            onClick={() => onQuickAction?.('update-stock')}
            className="flex flex-col items-center p-4 bg-elegant-50 rounded-lg hover:bg-green-50 transition-colors group"
          >
            <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors mb-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <span className="admin-label text-elegant-900 text-center">
              Actualizar Stock
            </span>
            <span className="text-xs admin-body text-elegant-600 text-center mt-1">
              Gestionar inventario
            </span>
          </button>

          <button 
            onClick={() => onQuickAction?.('view-reports')}
            className="flex flex-col items-center p-4 bg-elegant-50 rounded-lg hover:bg-indigo-50 transition-colors group"
          >
            <div className="p-3 bg-indigo-100 rounded-full group-hover:bg-indigo-200 transition-colors mb-2">
              <Eye className="h-6 w-6 text-indigo-600" />
            </div>
            <span className="admin-label text-elegant-900 text-center">
              Ver Reportes
            </span>
            <span className="text-xs admin-body text-elegant-600 text-center mt-1">
              Analíticas y métricas
            </span>
          </button>

          <button 
            onClick={() => onQuickAction?.('manage-customers')}
            className="flex flex-col items-center p-4 bg-elegant-50 rounded-lg hover:bg-pink-50 transition-colors group"
          >
            <div className="p-3 bg-pink-100 rounded-full group-hover:bg-pink-200 transition-colors mb-2">
              <Users className="h-6 w-6 text-pink-600" />
            </div>
            <span className="admin-label text-elegant-900 text-center">
              Gestionar Clientes
            </span>
            <span className="text-xs admin-body text-elegant-600 text-center mt-1">
              Administrar base de clientes
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;