import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Building2,
  Smartphone,
  Banknote,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { API_CONFIG, apiRequest, createAuthHeaders } from '../../config/api';

interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FAILED' | 'REFUNDED';
  method: 'card' | 'pse' | 'nequi' | 'cash';
  gateway: string;
  gatewayTransactionId: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    name: string;
    email: string;
  };
  refunds: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  hasRefunds: boolean;
  totalRefunded: number;
}

interface TransactionsListProps {
  className?: string;
}

const TransactionsList: React.FC<TransactionsListProps> = ({ className = '' }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    gateway: '',
    method: '',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== '')
        ),
      });

      const url = `${API_CONFIG.BASE_URL}/api/admin/payments/transactions?${params.toString()}`;
      const result = await apiRequest<{ data: { transactions: Transaction[]; pagination: typeof pagination } }>(url, {
        method: 'GET',
        headers: createAuthHeaders(),
        timeout: 8000,
      });

      setTransactions(result.data.transactions);
      setPagination(result.data.pagination as typeof pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'REJECTED':
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'REFUNDED':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REFUNDED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      case 'pse':
        return <Building2 className="w-4 h-4" />;
      case 'nequi':
        return <Smartphone className="w-4 h-4" />;
      case 'cash':
        return <Banknote className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getMethodName = (method: string) => {
    switch (method) {
      case 'card':
        return 'Tarjeta';
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

  const filteredTransactions = transactions.filter(transaction =>
    searchTerm === '' ||
    transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.customer?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Transacciones</h2>
            <p className="text-gray-600 mt-1">
              {pagination.totalCount} transacciones encontradas
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar transacciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
            </button>
            
            {/* Refresh */}
            <button
              onClick={fetchTransactions}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="PENDING">Pendiente</option>
                  <option value="APPROVED">Aprobado</option>
                  <option value="REJECTED">Rechazado</option>
                  <option value="FAILED">Fallido</option>
                  <option value="REFUNDED">Reembolsado</option>
                </select>
              </div>

              {/* Method Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método
                </label>
                <select
                  value={filters.method}
                  onChange={(e) => handleFilterChange('method', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="card">Tarjeta</option>
                  <option value="pse">PSE</option>
                  <option value="nequi">Nequi</option>
                  <option value="cash">Efectivo</option>
                </select>
              </div>

              {/* Gateway Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gateway
                </label>
                <select
                  value={filters.gateway}
                  onChange={(e) => handleFilterChange('gateway', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="wompi">Wompi</option>
                  <option value="payu">PayU</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-6 border-b border-gray-200">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transacción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Método
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.id.slice(0, 8)}...
                    </div>
                    <div className="text-sm text-gray-500">
                      Orden: {transaction.orderId.slice(0, 8)}...
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.customer?.name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.customer?.email || 'N/A'}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getMethodIcon(transaction.method)}
                    <span className="text-sm text-gray-900">
                      {getMethodName(transaction.method)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {transaction.gateway}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(transaction.amount)}
                  </div>
                  {transaction.hasRefunds && (
                    <div className="text-sm text-orange-600">
                      -{formatCurrency(transaction.totalRefunded)} reembolsado
                    </div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(transaction.status)}
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(transaction.createdAt)}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {/* TODO: Open transaction details modal */}}
                    className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ver</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredTransactions.length === 0 && !loading && (
        <div className="p-12 text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron transacciones
          </h3>
          <p className="text-gray-600">
            Intenta ajustar los filtros o el término de búsqueda
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} de{' '}
            {pagination.totalCount} resultados
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </button>
            
            <span className="text-sm text-gray-700">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;