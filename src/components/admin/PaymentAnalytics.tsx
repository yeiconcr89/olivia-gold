import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  DollarSign,
  CreditCard,
  Users,
  Clock
} from 'lucide-react';
import { API_CONFIG, apiRequest, createAuthHeaders } from '../../config/api';

interface AnalyticsData {
  revenue: Array<{
    date: string;
    total_transactions: number;
    successful_transactions: number;
    revenue: number;
    avg_transaction_value: number;
    failed_transactions: number;
  }>;
  paymentMethods: Array<{
    method: string;
    total_attempts: number;
    successful: number;
    failed: number;
    total_volume: number;
    avg_amount: number;
    success_rate: number;
  }>;
  gateways: Array<{
    gateway: string;
    total_requests: number;
    successful: number;
    avg_processing_time: number;
    success_rate: number;
  }>;
  errors: Array<{
    reason: string;
    count: number;
  }>;
  customers: {
    unique_customers: number;
    total_transactions: number;
    avg_transactions_per_customer: number;
    avg_customer_value: number;
  };
}

interface PaymentAnalyticsProps {
  className?: string;
}

const PaymentAnalytics: React.FC<PaymentAnalyticsProps> = ({ className = '' }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [activeTab, setActiveTab] = useState<'revenue' | 'methods' | 'gateways' | 'errors'>('revenue');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const url = `${API_CONFIG.BASE_URL}/api/admin/payments/analytics?${params.toString()}`;
      const result = await apiRequest<{ data: AnalyticsData }>(url, {
        method: 'GET',
        headers: createAuthHeaders(),
        timeout: 8000,
      });

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, fetchAnalytics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-CO').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getMethodName = (method: string) => {
    switch (method) {
      case 'card':
        return 'Tarjetas';
      case 'pse':
        return 'PSE';
      case 'nequi':
        return 'Nequi';
      case 'cash':
        return 'Efectivo';
      default:
        return method.toUpperCase();
    }
  };

  const exportData = () => {
    if (!data) return;

    const csvContent = [
      ['Fecha', 'Transacciones', 'Exitosas', 'Ingresos', 'Promedio'],
      ...data.revenue.map(row => [
        row.date,
        row.total_transactions,
        row.successful_transactions,
        row.revenue,
        row.avg_transaction_value
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const totalRevenue = data.revenue.reduce((sum, day) => sum + day.revenue, 0);
  const totalTransactions = data.revenue.reduce((sum, day) => sum + day.total_transactions, 0);
  const avgDailyRevenue = data.revenue.length > 0 ? totalRevenue / data.revenue.length : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics de Pagos</h1>
            <p className="text-gray-600 mt-1">Análisis detallado del rendimiento de pagos</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            {/* Date Range */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              />
            </div>
            
            {/* Export */}
            <button
              onClick={exportData}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
            
            {/* Refresh */}
            <button
              onClick={fetchAnalytics}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">
              Promedio diario: {formatCurrency(avgDailyRevenue)}
            </span>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transacciones</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(totalTransactions)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">
              Promedio diario: {formatNumber(Math.round(totalTransactions / (data.revenue.length || 1)))}
            </span>
          </div>
        </div>

        {/* Unique Customers */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes Únicos</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.customers.unique_customers)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">
              {data.customers.avg_transactions_per_customer.toFixed(1)} transacciones/cliente
            </span>
          </div>
        </div>

        {/* Avg Processing Time */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.gateways.length > 0 
                  ? `${Math.round(data.gateways.reduce((sum, g) => sum + g.avg_processing_time, 0) / data.gateways.length)}s`
                  : 'N/A'
                }
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">
              Procesamiento de pagos
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'revenue', label: 'Ingresos', icon: BarChart3 },
              { id: 'methods', label: 'Métodos', icon: CreditCard },
              { id: 'gateways', label: 'Gateways', icon: PieChart },
              { id: 'errors', label: 'Errores', icon: AlertCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'revenue' | 'methods' | 'gateways' | 'errors')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Revenue Tab */}
          {activeTab === 'revenue' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Tendencia de Ingresos
              </h3>
              <div className="h-64 flex items-end justify-between space-x-2">
                {data.revenue.slice(-14).map((day, index) => {
                  const maxRevenue = Math.max(...data.revenue.map(d => d.revenue));
                  const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-gray-200 rounded-t relative" style={{ height: '200px' }}>
                        <div 
                          className="w-full bg-blue-500 rounded-t absolute bottom-0 hover:bg-blue-600 transition-colors cursor-pointer"
                          style={{ height: `${height}%` }}
                          title={`${formatDate(day.date)}: ${formatCurrency(day.revenue)}`}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2 text-center">
                        {formatDate(day.date)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(day.revenue)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'methods' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Rendimiento por Método de Pago
              </h3>
              <div className="space-y-4">
                {data.paymentMethods.map((method) => (
                  <div key={method.method} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        {getMethodName(method.method)}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        method.success_rate >= 90 
                          ? 'bg-green-100 text-green-800'
                          : method.success_rate >= 70
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {method.success_rate.toFixed(1)}% éxito
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total Intentos</p>
                        <p className="font-semibold">{formatNumber(method.total_attempts)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Exitosos</p>
                        <p className="font-semibold text-green-600">{formatNumber(method.successful)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Volumen</p>
                        <p className="font-semibold">{formatCurrency(method.total_volume)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Promedio</p>
                        <p className="font-semibold">{formatCurrency(method.avg_amount)}</p>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${method.success_rate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gateways Tab */}
          {activeTab === 'gateways' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Rendimiento de Gateways
              </h3>
              <div className="space-y-4">
                {data.gateways.map((gateway) => (
                  <div key={gateway.gateway} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {gateway.gateway}
                      </h4>
                      <div className="flex items-center space-x-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          gateway.success_rate >= 95 
                            ? 'bg-green-100 text-green-800'
                            : gateway.success_rate >= 85
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {gateway.success_rate.toFixed(1)}% éxito
                        </span>
                        <span className="text-sm text-gray-600">
                          {gateway.avg_processing_time.toFixed(1)}s promedio
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total Requests</p>
                        <p className="font-semibold">{formatNumber(gateway.total_requests)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Exitosos</p>
                        <p className="font-semibold text-green-600">{formatNumber(gateway.successful)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tiempo Procesamiento</p>
                        <p className="font-semibold">{gateway.avg_processing_time.toFixed(1)}s</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors Tab */}
          {activeTab === 'errors' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Análisis de Errores
              </h3>
              {data.errors.length > 0 ? (
                <div className="space-y-3">
                  {data.errors.map((error, index) => {
                    const totalErrors = data.errors.reduce((sum, e) => sum + e.count, 0);
                    const percentage = totalErrors > 0 ? (error.count / totalErrors) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{error.reason}</p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="font-semibold text-gray-900">{formatNumber(error.count)}</p>
                          <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No se encontraron errores en el período seleccionado</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentAnalytics;