// Tipos para productos
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory?: string;
  images: string[];
  description: string;
  materials: string;
  dimensions: string;
  care: string;
  inStock: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Tipos para pedidos
export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
}

// Tipos para usuarios y autenticación
export interface UserProfile {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  preferences?: Record<string, any>;
}

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'CUSTOMER';
  profile?: UserProfile;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type AuthMethod = "email" | "google" | null;

// Props interfaces
export interface HeaderProps {
  onCategoryChange: (category: string) => void;
  onSearchChange: (search: string) => void;
  onWishlistClick: () => void;
  user: User | undefined;
  authMethod: AuthMethod;
  onLogin: () => void;
  onLogout: () => void;
}

export interface HomePageProps {
  user: User | undefined;
  authMethod: AuthMethod;
  onLogin: () => void;
  onLogout: () => void;
}

// Tipos para clientes
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  addresses: Address[];
  orders?: Order[];
  totalSpent: number;
  lastPurchase?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

// Tipos para reseñas
export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  response?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// Tipos para SEO
export interface SEOPage {
  id: string;
  path: string;
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos para autenticación
export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'CUSTOMER';
  profile?: UserProfile;
}

export interface UserProfile {
  name: string;
  avatar?: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Tipos para analíticas
export interface AnalyticsData {
  sales: {
    daily: DataPoint[];
    weekly: DataPoint[];
    monthly: DataPoint[];
  };
  topProducts: {
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }[];
  topCategories: {
    category: string;
    sales: number;
    revenue: number;
  }[];
  customerStats: {
    total: number;
    new: number;
    returning: number;
  };
}

export interface DataPoint {
  date: string;
  value: number;
}