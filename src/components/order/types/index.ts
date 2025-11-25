export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  size?: string;
}

export interface ShippingAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CustomerInfo {
  id: string;
  name: string;
  status: string;
}

export interface OrderTimelineEvent {
  id: string;
  orderId: string;
  status: Order['status'];
  description: string;
  timestamp: string;
  createdBy?: string;
}

export interface OrderNote {
  id: string;
  orderId: string;
  content: string;
  createdAt: string;
  createdBy: string;
  isInternal: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerInfo?: CustomerInfo;
  items: OrderItem[];
  itemsCount: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  shippingAddress?: ShippingAddress;
  orderDate: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  notes?: OrderNote[];
  timeline?: OrderTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  todayOrders: number;
  todayRevenue: number;
}