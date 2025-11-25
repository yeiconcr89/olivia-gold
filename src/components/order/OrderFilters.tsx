import React, { useEffect, useRef, useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Grid, 
  List,
  Calendar,
  X,
  Check
} from 'lucide-react';

interface OrderFiltersProps {
  filters: {
    status: string;
    dateRange: string;
    paymentStatus: string;
    searchTerm: string;
  };
  onFilterChange: (filters: OrderFiltersProps['filters']) => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  showFilters: boolean;
  onShowFiltersChange: (show: boolean) => void;
  onExport?: () => void;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  showFilters,
  onShowFiltersChange,
  onExport
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        onShowFiltersChange(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters, onShowFiltersChange]);

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    onShowFiltersChange(false);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      status: 'all',
      dateRange: 'all',
      paymentStatus: 'all',
      searchTerm: ''
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
    onShowFiltersChange(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-elegant p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        {/* Search and Basic Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-elegant-400" />
            <input
              type="text"
              placeholder="Buscar pedidos..."
              value={filters.searchTerm}
              onChange={(e) => onFilterChange({ ...filters, searchTerm: e.target.value })}
              className="pl-10 pr-4 py-2 w-full md:w-64 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input"
            />
          </div>
          <button
            onClick={() => onShowFiltersChange(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters 
                ? 'bg-gold-50 text-gold-600 border border-gold-200'
                : 'border border-elegant-300 hover:border-gold-500'
            }`}
          >
            <Filter className="h-5 w-5" />
            <span className="hidden md:inline">Filtros</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {onExport && (
            <button 
              onClick={onExport}
              className="flex items-center space-x-2 px-4 py-2 border border-elegant-300 rounded-lg hover:border-gold-500 transition-colors"
            >
              <Download className="h-5 w-5" />
              <span className="hidden md:inline">Exportar</span>
            </button>
          )}
          <div className="border border-elegant-300 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-elegant-100' : 'hover:bg-elegant-50'}`}
              title="Vista de cuadrícula"
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-elegant-100' : 'hover:bg-elegant-50'}`}
              title="Vista de lista"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div 
          ref={filterRef}
          className="absolute z-10 mt-2 p-6 bg-white rounded-xl shadow-xl border border-elegant-200 w-full max-w-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="admin-subheading">Filtros avanzados</h3>
            <button
              onClick={() => onShowFiltersChange(false)}
              className="text-elegant-500 hover:text-elegant-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Filter */}
            <div>
              <label className="block text-sm text-elegant-600 mb-2">
                Estado del pedido
              </label>
              <select
                value={localFilters.status}
                onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
                className="w-full admin-input"
              >
                <option value="all">Todos los estados</option>
                <option value="PENDING">Pendientes</option>
                <option value="CONFIRMED">Confirmados</option>
                <option value="PROCESSING">En proceso</option>
                <option value="SHIPPED">Enviados</option>
                <option value="DELIVERED">Entregados</option>
                <option value="CANCELLED">Cancelados</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="block text-sm text-elegant-600 mb-2">
                Estado del pago
              </label>
              <select
                value={localFilters.paymentStatus}
                onChange={(e) => setLocalFilters({ ...localFilters, paymentStatus: e.target.value })}
                className="w-full admin-input"
              >
                <option value="all">Todos los estados</option>
                <option value="PENDING">Pendiente</option>
                <option value="PAID">Pagado</option>
                <option value="FAILED">Fallido</option>
                <option value="REFUNDED">Reembolsado</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm text-elegant-600 mb-2">
                Rango de fechas
              </label>
              <select
                value={localFilters.dateRange}
                onChange={(e) => setLocalFilters({ ...localFilters, dateRange: e.target.value })}
                className="w-full admin-input"
              >
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="year">Último año</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 mt-6 pt-6 border-t border-elegant-200">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 border border-elegant-300 rounded-lg hover:bg-elegant-50"
            >
              Restablecer
            </button>
            <button
              onClick={handleApplyFilters}
              className="flex items-center px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Aplicar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export { OrderFilters };