import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Download,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  revenue: {
    current: number;
    previous: number;
    growth: number;
  };
  orders: {
    current: number;
    previous: number;
    growth: number;
  };
  customers: {
    current: number;
    previous: number;
    growth: number;
  };
  products: {
    current: number;
    previous: number;
    growth: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  salesByCategory: Array<{
    category: string;
    sales: number;
    percentage: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');

  // Mock data - en producción vendría de tu API
  const analyticsData: AnalyticsData = {
    revenue: {
      current: 2450000,
      previous: 2100000,
      growth: 16.7
    },
    orders: {
      current: 156,
      previous: 134,
      growth: 16.4
    },
    customers: {
      current: 89,
      previous: 76,
      growth: 17.1
    },
    products: {
      current: 24,
      previous: 22,
      growth: 9.1
    },
    topProducts: [
      { id: '1', name: 'Collar Veneciano Premium', sales: 45, revenue: 4045500 },
      { id: '2', name: 'Anillo Solitario Diamante', sales: 32, revenue: 4796800 },
      { id: '3', name: 'Pulsera Tenis Brillante', sales: 28, revenue: 3357200 },
      { id: '4', name: 'Aretes Perla Clásicos', sales: 41, revenue: 2865900 },
      { id: '5', name: 'Conjunto Romántico Corazón', sales: 19, revenue: 3418100 }
    ],
    salesByCategory: [
      { category: 'Collares', sales: 45, percentage: 28.8 },
      { category: 'Anillos', sales: 38, percentage: 24.4 },
      { category: 'Pulseras', sales: 32, percentage: 20.5 },
      { category: 'Aretes', sales: 25, percentage: 16.0 },
      { category: 'Conjuntos', sales: 16, percentage: 10.3 }
    ],
    monthlyRevenue: [
      { month: 'Ene', revenue: 1800000, orders: 98 },
      { month: 'Feb', revenue: 2100000, orders: 112 },
      { month: 'Mar', revenue: 2450000, orders: 156 },
      { month: 'Abr', revenue: 2200000, orders: 134 },
      { month: 'May', revenue: 2650000, orders: 178 },
      { month: 'Jun', revenue: 2450000, orders: 156 }
    ]
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatGrowth = (growth: number) => {
    const isPositive = growth > 0;
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
        {Math.abs(growth).toFixed(1)}%
      </span>
    );
  };

  interface StatCardProps {
    title: string;
    current: number;
    growth: number;
    icon: React.ComponentType<{ className?: string }>;
    formatter?: (n: number) => string;
  }

  const StatCard = ({ title, current, growth, icon: Icon, formatter = (n: number) => n.toString() }: StatCardProps) => (
    <div className="bg-white rounded-xl shadow-elegant p-6 hover:shadow-gold transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-lato text-elegant-600 mb-1">{title}</p>
          <p className="text-2xl font-playfair font-bold text-elegant-900">
            {formatter(current)}
          </p>
          <div className="flex items-center mt-2">
            {formatGrowth(growth)}
            <span className="text-sm text-elegant-500 font-lato ml-2">
              vs período anterior
            </span>
          </div>
        </div>
        <div className="p-3 bg-gold-100 rounded-full">
          <Icon className="h-6 w-6 text-gold-600" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-elegant-900 mb-2">
            Analíticas y Reportes
          </h2>
          <p className="text-elegant-600 font-lato">
            Monitorea el rendimiento de tu joyería
          </p>
        </div>
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 font-lato"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 border border-elegant-300 rounded-lg hover:border-gold-500 transition-colors font-lato">
            <Download className="h-5 w-5" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ingresos"
          current={analyticsData.revenue.current}
          previous={analyticsData.revenue.previous}
          growth={analyticsData.revenue.growth}
          icon={DollarSign}
          formatter={formatPrice}
        />
        <StatCard
          title="Pedidos"
          current={analyticsData.orders.current}
          previous={analyticsData.orders.previous}
          growth={analyticsData.orders.growth}
          icon={ShoppingCart}
        />
        <StatCard
          title="Clientes"
          current={analyticsData.customers.current}
          previous={analyticsData.customers.previous}
          growth={analyticsData.customers.growth}
          icon={Users}
        />
        <StatCard
          title="Productos"
          current={analyticsData.products.current}
          previous={analyticsData.products.previous}
          growth={analyticsData.products.growth}
          icon={Package}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-playfair font-bold text-elegant-900">
              Ingresos Mensuales
            </h3>
            <BarChart3 className="h-5 w-5 text-gold-500" />
          </div>
          
          <div className="space-y-4">
            {analyticsData.monthlyRevenue.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 text-sm font-lato text-elegant-600">
                    {data.month}
                  </div>
                  <div className="flex-1 bg-elegant-200 rounded-full h-2 max-w-xs">
                    <div 
                      className="bg-gradient-gold h-2 rounded-full"
                      style={{ width: `${(data.revenue / Math.max(...analyticsData.monthlyRevenue.map(d => d.revenue))) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm font-lato font-semibold text-elegant-900">
                  {formatPrice(data.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Sales */}
        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-playfair font-bold text-elegant-900">
              Ventas por Categoría
            </h3>
            <PieChart className="h-5 w-5 text-gold-500" />
          </div>
          
          <div className="space-y-4">
            {analyticsData.salesByCategory.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                    index === 0 ? 'from-gold-400 to-gold-600' :
                    index === 1 ? 'from-blue-400 to-blue-600' :
                    index === 2 ? 'from-green-400 to-green-600' :
                    index === 3 ? 'from-purple-400 to-purple-600' :
                    'from-red-400 to-red-600'
                  }`}></div>
                  <span className="text-sm font-lato text-elegant-900">
                    {category.category}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-lato text-elegant-600">
                    {category.sales} ventas
                  </span>
                  <span className="text-sm font-lato font-semibold text-elegant-900">
                    {category.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl shadow-elegant p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-playfair font-bold text-elegant-900">
            Productos Más Vendidos
          </h3>
          <Activity className="h-5 w-5 text-gold-500" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-elegant-200">
                <th className="text-left py-3 px-4 font-lato font-semibold text-elegant-700">
                  Producto
                </th>
                <th className="text-left py-3 px-4 font-lato font-semibold text-elegant-700">
                  Ventas
                </th>
                <th className="text-left py-3 px-4 font-lato font-semibold text-elegant-700">
                  Ingresos
                </th>
                <th className="text-left py-3 px-4 font-lato font-semibold text-elegant-700">
                  Rendimiento
                </th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.topProducts.map((product, index) => (
                <tr key={product.id} className="border-b border-elegant-100 hover:bg-elegant-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-gold rounded-full flex items-center justify-center text-elegant-900 font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-playfair font-semibold text-elegant-900">
                        {product.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-lato text-elegant-900">
                    {product.sales} unidades
                  </td>
                  <td className="py-4 px-4 font-lato font-semibold text-elegant-900">
                    {formatPrice(product.revenue)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-elegant-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-gold h-2 rounded-full"
                          style={{ width: `${(product.sales / Math.max(...analyticsData.topProducts.map(p => p.sales))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-lato text-elegant-600">
                        {Math.round((product.sales / analyticsData.topProducts.reduce((sum, p) => sum + p.sales, 0)) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-gold-50 to-gold-100 rounded-xl p-6 border border-gold-200">
          <h3 className="text-lg font-playfair font-bold text-gold-900 mb-3">
            💡 Insights de Rendimiento
          </h3>
          <ul className="space-y-2 text-sm font-lato text-gold-800">
            <li>• Los collares representan el 28.8% de las ventas</li>
            <li>• Crecimiento del 16.7% en ingresos este mes</li>
            <li>• Los productos premium tienen mejor conversión</li>
            <li>• Pico de ventas los fines de semana</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-playfair font-bold text-blue-900 mb-3">
            📈 Recomendaciones
          </h3>
          <ul className="space-y-2 text-sm font-lato text-blue-800">
            <li>• Aumentar inventario de collares premium</li>
            <li>• Promocionar conjuntos para incrementar ticket promedio</li>
            <li>• Implementar programa de fidelización VIP</li>
            <li>• Optimizar campañas para fines de semana</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Analytics;