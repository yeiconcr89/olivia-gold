

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Upload,
  BarChart3,
  Users,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Search,
  Download,
  MessageSquare,
  Globe,
  AlertCircle,
  LogOut,
  Loader2,
  FileSpreadsheet,
  CheckSquare,
  X,
  Image
} from 'lucide-react';
import { Product, Customer } from '../types';
import ProductForm from './ProductForm';

import InventoryTable from './InventoryTable';
import DashboardStats from './DashboardStats';
import OrderManagement from './OrderManagement';
import CustomerManagement from './CustomerManagement';
import Analytics from './Analytics';
import ReviewSystem from './ReviewSystem';
import SEOManager from './SEOManager';
import CloudinarySettings from './CloudinarySettings';
import ConfirmationModal from './ConfirmationModal';
import CustomerForm from './CustomerForm';
import BulkImport from './BulkImport';
import BulkOperations from './BulkOperations';
import ToastContainer from './ToastContainer';
import HeroSlideManager from './HeroSlideManager';
import StaticContentManager from './StaticContentManager';
import AdminPaymentsPage from './admin/AdminPaymentsPage';
import { useProducts } from '../hooks/useProducts';
import { useOrders } from '../hooks/useOrders';
import { useToast } from '../hooks/useToast';
import { useCustomers } from '../hooks/useCustomers';
import { useReviews } from '../hooks/useReviews';
import { useSEO } from '../hooks/useSEO';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../hooks/useInventory';
import DevRoleSwitch from './DevRoleSwitch';
import { API_CONFIG, apiRequest, createAuthHeaders } from '../config/api';


interface AdminDashboardProps {
  // Props for admin dashboard component
  className?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  // Lista de tabs válidos
  const validTabs = useMemo(() => [
    'dashboard', 'products', 'bulk-import', 'bulk-operations',
    'inventory', 'orders', 'customers', 'reviews',
    'analytics', 'seo', 'cloudinary', 'hero-slider', 'payments', 'order-management', 'content'
  ], []);

  // Extraer el tab de la URL, defaulteando a 'dashboard'
  const getTabFromPath = useCallback((pathname: string) => {
    const pathParts = pathname.split('/');
    if (pathParts.length >= 3 && pathParts[1] === 'admin') {
      const requestedTab = pathParts[2] || 'dashboard';
      // Validar que el tab existe
      return validTabs.includes(requestedTab) ? requestedTab : 'dashboard';
    }
    return 'dashboard';
  }, [validTabs]);

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id?: string; name?: string; email?: string; phone?: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  // Hooks para gestión de datos
  const { products, loading: productsLoading, error: productsError, addProduct, updateProduct, deleteProduct, fetchProducts } = useProducts();
  const { orders, updateOrder, loading: ordersLoading, error: ordersError } = useOrders();
  const { customers, updateCustomer, addCustomer, deleteCustomer } = useCustomers();
  const { success, error, toasts, removeToast } = useToast();
  const { reviews, updateReview, deleteReview, respondToReview } = useReviews();
  const { seoPages, updateSEOPage, addSEOPage, deleteSEOPage } = useSEO();

  const {
    inventory,
    loading: inventoryLoading,
    error: inventoryError,
    updateInventory,
    fetchInventory
  } = useInventory();

  // Sincronizar activeTab con la URL cuando cambie la ruta
  useEffect(() => {
    const currentTab = getTabFromPath(location.pathname);
    setActiveTab(currentTab);
  }, [location.pathname, getTabFromPath]);

  // Función para cambiar de tab y actualizar la URL
  const handleTabChange = (tabId: string) => {
    const newPath = tabId === 'dashboard' ? '/admin' : `/admin/${tabId}`;
    navigate(newPath);
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'products', name: 'Productos', icon: Package },
    { id: 'content', name: 'Contenido', icon: Image },
    { id: 'bulk-import', name: 'Importar CSV', icon: FileSpreadsheet },
    { id: 'bulk-operations', name: 'Edición en Lote', icon: CheckSquare },
    { id: 'inventory', name: 'Inventario', icon: Package },
    { id: 'orders', name: 'Pedidos', icon: ShoppingCart },
    { id: 'customers', name: 'Clientes', icon: Users },
    { id: 'reviews', name: 'Reseñas', icon: MessageSquare },
    { id: 'analytics', name: 'Analíticas', icon: TrendingUp },
    { id: 'payments', name: 'Pagos', icon: CreditCard },
    { id: 'seo', name: 'SEO', icon: Globe },
    { id: 'cloudinary', name: 'Cloudinary', icon: Upload },
    { id: 'hero-slider', name: 'Hero Slider', icon: Image }
  ];

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    const product = Array.isArray(products) ? products.find(p => p.id === productId) : undefined;
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Producto',
      message: `¿Estás seguro de que deseas eliminar "${product?.name || 'este producto'}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          const result = await deleteProduct(productId);
          if (result) {
            success(
              '¡Producto eliminado!',
              `${product?.name || 'El producto'} ha sido eliminado exitosamente.`
            );
          } else {
            error(
              'Error al eliminar',
              'No se pudo eliminar el producto. Inténtalo de nuevo.'
            );
          }
          setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (err) {
          console.error('Error eliminando producto:', err);
          error(
            'Error inesperado',
            'Ocurrió un error al eliminar el producto.'
          );
        }
      },
      type: 'danger'
    });
  };

  const handleFormSubmit = async (productData: Omit<Product, 'id'>) => {
    try {
      if (selectedProduct) {
        // Actualizar producto existente
        const result = await updateProduct(selectedProduct.id, productData);
        if (result) {
          success(
            '¡Producto actualizado!',
            `${productData.name} ha sido actualizado exitosamente.`
          );
          // Forzar re-fetch para asegurar que se actualice la UI
          await fetchProducts();
          // Cambiar a la pestaña de productos para mostrar el producto actualizado
          setTimeout(() => {
            setActiveTab('products');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 500);
        } else {
          error(
            'Error al actualizar',
            'No se pudo actualizar el producto. Inténtalo de nuevo.'
          );
        }
      } else {
        // Crear nuevo producto
        const result = await addProduct(productData);
        if (result) {
          success(
            '¡Producto creado!',
            `${productData.name} ha sido creado exitosamente.`
          );
          // Cambiar a la pestaña de productos para mostrar el nuevo producto
          setTimeout(() => {
            setActiveTab('products');
            // Scroll suave hacia arriba para ver la lista de productos
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 500); // Pequeño delay para que se procese la actualización del estado
        } else {
          error(
            'Error al crear producto',
            'No se pudo crear el producto. Verifica los datos e inténtalo de nuevo.'
          );
        }
      }
    } catch (err) {
      console.error('Error en handleFormSubmit:', err);
      error(
        'Error inesperado',
        selectedProduct
          ? 'Ocurrió un error al actualizar el producto.'
          : 'Ocurrió un error al crear el producto.'
      );
    } finally {
      setIsFormOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleExportData = (type: string) => {
    let data: unknown[] = [];
    let filename = '';
    let csvContent = '';

    switch (type) {
      case 'products': {
        data = Array.isArray(products) ? products : [];
        filename = 'productos_olivia_gold.csv';

        // Crear headers para Excel
        const headers = [
          'ID',
          'Nombre',
          'Precio',
          'Precio Original',
          'Categoría',
          'Subcategoría',
          'Descripción',
          'Materiales',
          'Dimensiones',
          'Cuidados',
          'En Stock',
          'Destacado',
          'Rating',
          'Reseñas',
          'Cantidad Imágenes',
          'Imágenes',
          'Etiquetas',
          'Fecha Creación',
          'Última Actualización'
        ];

        // Crear filas de datos
        const rows = (data as Product[]).map(product => [
          product.id || '',
          product.name || '',
          product.price || 0,
          product.originalPrice || '',
          product.category || '',
          product.subcategory || '',
          product.description || '',
          product.materials || '',
          product.dimensions || '',
          product.care || '',
          product.inStock ? 'SÍ' : 'NO',
          product.featured ? 'SÍ' : 'NO',
          product.rating || 0,
          product.reviewCount || 0,
          Array.isArray(product.images) ? product.images.length : 0,
          Array.isArray(product.images) ? product.images.join(', ') : '',
          Array.isArray(product.tags) ? product.tags.join('; ') : '',
          product.createdAt ? new Date(product.createdAt).toLocaleDateString('es-ES') : '',
          product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('es-ES') : ''
        ]);

        // Crear CSV compatible con Excel
        csvContent = [headers, ...rows]
          .map(row => row.map(cell => {
            // Escapar comillas y manejar comas
            const cellStr = String(cell).replace(/"/g, '""');
            return `"${cellStr}"`;
          }).join(','))
          .join('\n');

        break;
      }
      case 'orders': {
        data = orders;
        filename = 'pedidos.csv';
        csvContent = JSON.stringify(data, null, 2);
        break;
      }
      case 'customers': {
        data = customers;
        filename = 'clientes.csv';
        csvContent = JSON.stringify(data, null, 2);
        break;
      }
      default:
        return;
    }

    // Crear archivo CSV compatible con Excel (BOM para caracteres especiales)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Feedback de éxito
    success(
      'Exportación exitosa',
      `Archivo ${filename} descargado correctamente. Ábrelo con Excel o Google Sheets.`
    );
  };

  // FUNCIÓN CORREGIDA PARA NUEVO CLIENTE
  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsCustomerFormOpen(true);
  };

  // Nueva función para manejar agregar página SEO
  const handleAddSEOPage = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Nueva Página SEO',
      message: 'Esta funcionalidad abrirá un formulario para agregar una nueva página al sistema de SEO. ¿Deseas continuar?',
      onConfirm: () => {
        console.log('Abrir formulario de nueva página SEO');
        setConfirmModal({ ...confirmModal, isOpen: false });
        alert('Funcionalidad de nueva página SEO implementada correctamente');
      },
      type: 'info'
    });
  };

  // Tipos locales para compatibilidad con formularios/componentes
  type NewCustomerFormData = {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    status: 'active' | 'inactive' | 'vip';
    notes?: string;
    birthDate?: string;
    preferences: string[];
  };

  type ImportedProduct = {
    name: string;
    price: number;
    originalPrice?: number;
    category: string;
    subcategory: string;
    description: string;
    materials: string;
    dimensions: string;
    care: string;
    inStock: boolean;
    featured: boolean;
    images: string[];
    tags: string[];
  };

  // FUNCIÓN PARA MANEJAR ENVÍO DEL FORMULARIO DE CLIENTE
  const handleCustomerFormSubmit = (customerData: NewCustomerFormData) => {
    // Adaptar datos al tipo requerido por useCustomers.addCustomer
    const newCustomer = {
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      addresses: [{
        street: customerData.address.street,
        city: customerData.address.city,
        state: customerData.address.state,
        postalCode: customerData.address.zipCode,
        country: customerData.address.country,
        isDefault: true
      }],
      registrationDate: new Date().toISOString(),
      lastPurchase: undefined,
      totalOrders: 0,
      totalSpent: 0,
      wishlistItems: 0,
      status: customerData.status,
      preferences: customerData.preferences,
      notes: customerData.notes,
      birthDate: customerData.birthDate,
    };
    // addCustomer espera Omit<Customer, 'id'> (del hook useCustomers), que coincide estructuralmente con newCustomer
    addCustomer(newCustomer as Omit<Customer, 'id'>);
    setIsCustomerFormOpen(false);
    setSelectedCustomer(null);
  };

  // Funciones para operaciones masivas
  const handleBulkImport = async (products: ImportedProduct[]): Promise<void> => {
    try {
      const url = `${API_CONFIG.BASE_URL}/api/bulk/import`;
      await apiRequest<{ success: boolean; imported: number; errors?: string[] }>(url, {
        method: 'POST',
        headers: createAuthHeaders(token || undefined),
        body: JSON.stringify({ products }),
        timeout: 15000,
      });
      console.log('Importación exitosa');

      // Recargar productos después de la importación usando el hook disponible
      await fetchProducts();
    } catch (error) {
      console.error('Error en importación masiva:', error);
      throw error;
    }
  };

  const handleBulkUpdate = async (productIds: string[], updates: Partial<Product>) => {
    try {
      const url = `${API_CONFIG.BASE_URL}/api/bulk/update`;
      const result = await apiRequest<{ success: boolean; updated: number; errors?: string[] }>(url, {
        method: 'PATCH',
        headers: createAuthHeaders(token || undefined),
        body: JSON.stringify({ productIds, updates }),
        timeout: 15000,
      });
      console.log('Actualización masiva exitosa:', result);

      // Recargar productos después de la actualización
      await fetchProducts();

      return result;
    } catch (error) {
      console.error('Error en actualización masiva:', error);
      throw error;
    }
  };

  const handleBulkDelete = async (productIds: string[]) => {
    try {
      const url = `${API_CONFIG.BASE_URL}/api/bulk/delete`;
      const result = await apiRequest<{ success: boolean; deleted: number; errors?: string[] }>(url, {
        method: 'DELETE',
        headers: createAuthHeaders(token || undefined),
        body: JSON.stringify({ productIds }),
        timeout: 15000,
      });
      console.log('Eliminación masiva exitosa:', result);

      // Recargar productos después de la eliminación
      await fetchProducts();

      return result;
    } catch (error) {
      console.error('Error en eliminación masiva:', error);
      throw error;
    }
  };

  // Manejar acciones rápidas del dashboard - ACTUALIZADO CON NUEVAS FUNCIONES
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new-product':
        handleAddProduct();
        break;
      case 'new-customer':
        handleAddCustomer();
        break;
      case 'new-seo-page':
        handleAddSEOPage();
        break;
      case 'update-stock':
        setActiveTab('inventory');
        break;
      case 'view-reports':
        setActiveTab('analytics');
        break;
      case 'manage-customers':
        setActiveTab('customers');
        break;
      default:
        break;
    }
  };

  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    if (!product || !product.name || !product.description) return false;

    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  }) : [];

  return (
    <div className="min-h-screen bg-elegant-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-elegant z-40">
        <div className="max-w-7xl xl:max-w-full mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img
                src="/images/logo.png"
                alt="Olivia Gold"
                className="h-8 w-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE2IDJMMTcuODU4IDYuODU4TDIzIDEwTDE3Ljg1OCAxMy4xNDJMMTYgMThMMTQuMTQyIDEzLjE0Mkw5IDEwTDE0LjE0MiA2Ljg1OEwxNiAyWiIgZmlsbD0iI0Q0QUY0RiIvPgo8cGF0aCBkPSJNMTYgMjJMMTcuODU4IDE2LjE0MkwyMyAxM0wxNy44NTggOS44NTgyTDE2IDRMMTQuMTQyIDkuODU4Mkw5IDEzTDE0LjE0MiAxNi4xNDJMMTYgMjJaIiBmaWxsPSIjRDRBRjRGIi8+Cjwvc3ZnPgo=';
                }}
              />
              <h1 className="text-xl font-bold text-elegant-900">Panel de Administración</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="hidden md:block text-sm text-elegant-600 truncate max-w-32 lg:max-w-none">
                {user?.profile?.name || user?.email}
              </span>

              {/* DevRoleSwitch integrado en el header del admin - Solo en desarrollo */}
              {!import.meta.env.PROD && (
                <DevRoleSwitch
                  currentRole={user?.role === 'ADMIN' || user?.role === 'MANAGER' ? 'admin' : 'client'}
                />
              )}

              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                    logout();
                  }
                }}
                className="inline-flex items-center px-2 py-1.5 sm:px-3 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer div for fixed header */}
      <div className="h-16"></div>

      {/* Main Content */}
      <div className="max-w-7xl xl:max-w-full mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-72 lg:flex-shrink-0 bg-white rounded-xl shadow-elegant p-3 sm:p-4 lg:p-6">
            <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 lg:space-y-1 lg:gap-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center justify-center lg:justify-start space-x-1 lg:space-x-3 px-2 sm:px-3 lg:px-4 py-2 lg:py-3 rounded-lg admin-button transition-all text-center lg:text-left ${activeTab === tab.id
                    ? 'bg-gradient-gold text-elegant-900'
                    : 'text-elegant-600 hover:bg-elegant-100'
                    }`}
                >
                  <tab.icon className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm lg:text-sm font-medium truncate">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 overflow-y-auto">
            {activeTab === 'dashboard' && (
              <DashboardStats products={Array.isArray(products) ? products : []} onQuickAction={handleQuickAction} />
            )}

            {activeTab === 'products' && (
              <div className="space-y-6">
                {/* Search and Filters */}
                <div className="bg-white rounded-xl shadow-elegant p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-elegant-400" />
                        <input
                          type="text"
                          placeholder="Buscar productos..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 sm:pl-10 pr-10 py-2.5 sm:py-3 w-full border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input text-sm"
                        />
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-elegant-100 rounded-full transition-colors"
                            title="Limpiar búsqueda"
                          >
                            <X className="h-4 w-4 text-elegant-500 hover:text-elegant-700" />
                          </button>
                        )}
                      </div>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 sm:px-4 py-2.5 sm:py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 admin-input text-sm w-full sm:w-auto sm:min-w-[180px]"
                      >
                        <option value="all">Todas las categorías</option>
                        <option value="collares">Collares</option>
                        <option value="anillos">Anillos</option>
                        <option value="pulseras">Pulseras</option>
                        <option value="aretes">Aretes</option>
                        <option value="conjuntos">Conjuntos</option>
                        <option value="relojes">Relojes</option>
                      </select>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => handleExportData('products')}
                        className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 border-2 border-elegant-300 text-elegant-700 rounded-xl hover:border-gold-500 hover:bg-gold-50 hover:text-gold-700 transition-all admin-button text-sm font-medium shadow-sm hover:shadow-md"
                        title="Exportar productos a CSV (compatible con Excel)"
                      >
                        <Download className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Exportar CSV</span>
                      </button>
                      <button
                        onClick={handleAddProduct}
                        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-gold text-elegant-900 rounded-xl hover:shadow-lg hover:scale-105 transition-all admin-button font-semibold text-sm shadow-md"
                      >
                        <Plus className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Nuevo Producto</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Estado de carga y errores */}
                {productsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-elegant">
                    <Loader2 className="h-12 w-12 text-gold-500 animate-spin mb-4" />
                    <p className="text-elegant-600">Cargando productos...</p>
                  </div>
                ) : productsError ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-red-800 mb-2">Error al cargar productos</h3>
                    <p className="text-red-600">{productsError}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="bg-elegant-50 border border-elegant-200 rounded-xl p-12 text-center">
                    <Package className="h-16 w-16 text-elegant-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-elegant-700 mb-2">No se encontraron productos</h3>
                    <p className="text-elegant-600 mb-6">
                      {searchTerm || filterCategory !== 'all'
                        ? 'Intenta con otros filtros de búsqueda'
                        : 'Comienza agregando tu primer producto'}
                    </p>
                    <button
                      onClick={handleAddProduct}
                      className="px-6 py-3 bg-gradient-gold text-elegant-900 rounded-lg hover:shadow-lg transition-all admin-button font-medium"
                    >
                      <Plus className="h-5 w-5 mr-2 inline-block" />
                      Agregar Producto
                    </button>
                  </div>
                ) : (
                  /* Products Grid */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="bg-white rounded-xl shadow-elegant overflow-hidden">
                        <div className="aspect-square relative">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                            }}
                          />
                          <div className="absolute top-2 right-2 flex space-x-1">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="bg-white bg-opacity-90 p-1.5 rounded-full hover:bg-opacity-100 transition-all"
                            >
                              <Edit className="h-3 w-3 text-elegant-700" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="bg-white bg-opacity-90 p-1.5 rounded-full hover:bg-opacity-100 transition-all"
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </button>
                          </div>
                          {!product.inStock && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                AGOTADO
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="admin-subheading text-sm mb-1 truncate">
                            {product.name}
                          </h3>
                          <p className="admin-body text-xs mb-2 text-elegant-600">
                            {product.category}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-elegant-900">
                              ${product.price.toLocaleString()}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.inStock
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {product.inStock ? 'En Stock' : 'Agotado'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'inventory' && (
              <InventoryTable
                inventory={inventory}
                onUpdateStock={async (productId, newQuantity) => {
                  try {
                    await updateInventory(productId, {
                      quantity: newQuantity,
                      reason: 'Ajuste manual desde el panel', // Esto se puede mejorar pidiendo input al usuario
                      type: 'ADJUSTMENT'
                    });
                    success('Inventario actualizado', 'El stock fue ajustado exitosamente.');
                    await fetchInventory();
                  } catch (err) {
                    error('Error al actualizar inventario', err instanceof Error ? err.message : 'Ocurrió un error');
                  }
                }}
                loading={inventoryLoading}
                error={inventoryError}
              />
            )}

            {activeTab === 'orders' && (
              <OrderManagement
                orders={orders as any}
                onUpdateOrder={updateOrder as any}
                onExportData={() => handleExportData('orders')}
                loading={ordersLoading}
                error={ordersError}
              />
            )}


            {activeTab === 'customers' && (
              <CustomerManagement
                customers={customers}
                onUpdateCustomer={updateCustomer}
                onDeleteCustomer={deleteCustomer}
                onAddCustomer={addCustomer}
                onExportData={() => handleExportData('customers')}
              />
            )}

            {activeTab === 'reviews' && (
              <ReviewSystem
                reviews={reviews}
                onUpdateReview={updateReview}
                onDeleteReview={deleteReview}
                onRespondToReview={respondToReview}
              />
            )}

            {activeTab === 'analytics' && (
              <Analytics />
            )}

            {activeTab === 'seo' && (
              <SEOManager
                pages={seoPages}
                onUpdatePage={updateSEOPage}
                onDeletePage={deleteSEOPage}
                onAddPage={addSEOPage}
              />
            )}

            {activeTab === 'content' && (
              <StaticContentManager />
            )}

            {activeTab === 'bulk-import' && (
              <BulkImport
                onImport={handleBulkImport}
              />
            )}

            {activeTab === 'bulk-operations' && (
              <BulkOperations
                products={Array.isArray(products) ? products : []}
                onUpdateProducts={async (productIds, updates) => {
                  await handleBulkUpdate(productIds, updates);
                }}
                onDeleteProducts={async (productIds) => {
                  await handleBulkDelete(productIds);
                }}
              />
            )}

            {activeTab === 'cloudinary' && (
              <CloudinarySettings />
            )}

            {activeTab === 'hero-slider' && (
              <HeroSlideManager
                toastActions={{
                  success: success,
                  error: error
                }}
              />
            )}

            {activeTab === 'payments' && (
              <AdminPaymentsPage />
            )}
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      {isFormOpen && (
        <ProductForm
          product={selectedProduct}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Customer Form Modal - NUEVO */}
      {isCustomerFormOpen && (
        <CustomerForm
          customer={null}
          onSubmit={handleCustomerFormSubmit}
          onClose={() => {
            setIsCustomerFormOpen(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        type={confirmModal.type}
        confirmText={confirmModal.type === 'danger' ? 'Eliminar' : 'Confirmar'}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default AdminDashboard;