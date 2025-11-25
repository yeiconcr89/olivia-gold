import { useState, useEffect } from 'react';

interface Customer {
  id: string;
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
  registrationDate: string;
  lastPurchase?: string;
  totalOrders: number;
  totalSpent: number;
  wishlistItems: number;
  status: 'active' | 'inactive' | 'vip';
  notes?: string;
  birthDate?: string;
  preferences: string[];
}

// Mock data para demostración
const mockCustomers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'María González',
    email: 'maria@email.com',
    phone: '+57 300 123 4567',
    address: {
      street: 'Calle 123 #45-67',
      city: 'Bogotá',
      state: 'Cundinamarca',
      zipCode: '110111',
      country: 'Colombia'
    },
    registrationDate: '2023-06-15T00:00:00Z',
    lastPurchase: '2024-01-15T00:00:00Z',
    totalOrders: 5,
    totalSpent: 450000,
    wishlistItems: 3,
    status: 'vip',
    preferences: ['collares', 'anillos']
  },
  {
    id: 'CUST-002',
    name: 'Carlos Rodríguez',
    email: 'carlos@email.com',
    phone: '+57 301 234 5678',
    address: {
      street: 'Carrera 45 #67-89',
      city: 'Medellín',
      state: 'Antioquia',
      zipCode: '050001',
      country: 'Colombia'
    },
    registrationDate: '2023-08-20T00:00:00Z',
    lastPurchase: '2024-01-14T00:00:00Z',
    totalOrders: 2,
    totalSpent: 299800,
    wishlistItems: 1,
    status: 'active',
    preferences: ['anillos']
  }
];

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCustomers(JSON.parse(savedCustomers));
      } catch (error) {
        console.error('Error parsing saved customers:', error);
        setCustomers(mockCustomers);
      }
    }
  }, []);

  // Guardar cambios solo después de inicializar
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('customers', JSON.stringify(customers));
    }
  }, [customers, isInitialized]);

  const updateCustomer = (customerId: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === customerId ? { ...customer, ...updates } : customer
    ));
  };

  const addCustomer = (customerData: Omit<Customer, 'id'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: `CUST-${Date.now()}`
    };
    setCustomers(prev => [newCustomer, ...prev]);
  };

  const deleteCustomer = (customerId: string) => {
    setCustomers(prev => prev.filter(customer => customer.id !== customerId));
  };

  return {
    customers,
    updateCustomer,
    addCustomer,
    deleteCustomer
  };
};