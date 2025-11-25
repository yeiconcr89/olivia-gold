import React, { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { API_CONFIG, apiRequest, createAuthHeaders } from '../../config/api';

interface DashboardData {
  overview: {
    totalTransactions: number;
    approvedTransactions: number;
    failedTransactions: number;
    refundedTransactions: number;
    totalVolume: number;
    approvedVolume: number;
    refundedVolume: number;
    successRate: number;
    averageTransactionValue: number;
  };
  paymentMethods: Array<{
    method: string;
    count: number;
    volume: number;
    percentage: number;
  }>;
  gateways: Array<{
    gateway: string;
    count: number;
    averageAmount: number;
  }>;
  trends: Array<{
    date: string;
    transactions: number;
    approved: number;
    volume: number;
  }>;
}

interface PaymentsDashboardProps {
  className?: string;
}

const PaymentsDashboard: React.FC<PaymentsDashboardProps> = ({ className = '' }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const url = `${API_CONFIG.BASE_URL}/api/admin/payments/dashboard?${params.toString()}`;
      const result = await apiRequest<{ data: DashboardData }>(url, {
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
  }, [dateRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

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

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="w-5 h-5" />;
      case 'pse':
        return <div className="w-5 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">P</div>;
      case 'nequi':
        return <div className="w-5 h-5 bg-purple-600 rounded text-white text-xs flex items-center justify-center font-bold">N</div>;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
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

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar datos</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard de Pagos</h1>
            <p className="text-gray-600 mt-1">Monitoreo y analytics del sistema de pagos</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            {/* Date Range Filter */}
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
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className={`flex items-center space-x-2 bg-white border px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Transactions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transacciones</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.overview.totalTransactions)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">
              {formatNumber(data.overview.approvedTransactions)} aprobadas
            </span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.overview.successRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {data.overview.successRate >= 90 ? (
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm ${data.overview.successRate >= 90 ? 'text-green-600' : 'text-red-600'}`}>
              {data.overview.successRate >= 90 ? 'Excelente' : 'Necesita atención'}
            </span>
          </div>
        </div>

        {/* Total Volume */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Volumen Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.overview.approvedVolume)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">
              Promedio: {formatCurrency(data.overview.averageTransactionValue)}
            </span>
          </div>
        </div>

        {/* Failed Transactions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transacciones Fallidas</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.overview.failedTransactions)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">
              {data.overview.refundedTransactions} reembolsadas
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Métodos de Pago</h3>
          <div className="space-y-4">
            {data.paymentMethods.map((method) => (
              <div key={method.method} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getMethodIcon(method.method)}
                  <div>
                    <p className="font-medium text-gray-900">{getMethodName(method.method)}</p>
                    <p className="text-sm text-gray-600">
                      {formatNumber(method.count)} transacciones
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(method.volume)}</p>
                  <p className="text-sm text-gray-600">{method.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gateway Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance de Gateways</h3>
          <div className="space-y-4">
            {data.gateways.map((gateway) => (
              <div key={gateway.gateway} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {gateway.gateway.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{gateway.gateway}</p>
                    <p className="text-sm text-gray-600">
                      {formatNumber(gateway.count)} transacciones
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(gateway.averageAmount)}
                  </p>
                  <p className="text-sm text-gray-600">Promedio</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencias (Últimos 30 días)</h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {data.trends.slice(0, 15).reverse().map((trend, index) => {
            const maxTransactions = Math.max(...data.trends.map(t => t.transactions));
            const height = (trend.transactions / maxTransactions) * 100;
            const successRate = trend.transactions > 0 ? (trend.approved / trend.transactions) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-200 rounded-t relative" style={{ height: '200px' }}>
                  <div 
                    className="w-full bg-blue-500 rounded-t absolute bottom-0"
                    style={{ height: `${height}%` }}
                  ></div>
                  <div 
                    className="w-full bg-green-500 rounded-t absolute bottom-0"
                    style={{ height: `${(height * successRate) / 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 mt-2 text-center">
                  {new Date(trend.date).toLocaleDateString('es-CO', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-xs text-gray-500">
                  {trend.transactions}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600">Total</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Aprobadas</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsDashboard;