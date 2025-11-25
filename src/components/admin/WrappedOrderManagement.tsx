import React from 'react';
import { useOrders } from '../../hooks/useOrders';
import OrderManagement from '../OrderManagement';

const WrappedOrderManagement: React.FC = () => {
  const { orders, loading, error, updateOrder } = useOrders();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <OrderManagement 
        orders={orders || []}
        onUpdateOrder={updateOrder}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default WrappedOrderManagement;