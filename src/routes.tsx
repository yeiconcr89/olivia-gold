import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const CustomerService = lazy(() => import('./components/customer-service/CustomerService'));
const SizeGuide = lazy(() => import('./components/customer-service/SizeGuide'));
const JewelryCare = lazy(() => import('./components/customer-service/JewelryCare'));
const ShippingReturns = lazy(() => import('./components/customer-service/ShippingReturns'));
const Warranty = lazy(() => import('./components/customer-service/Warranty'));
const Contact = lazy(() => import('./components/customer-service/Contact'));

// ... otros imports

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas existentes */}
      
      {/* Rutas de Servicio al Cliente */}
      <Route path="/servicio-cliente" element={<CustomerService />} />
      <Route path="/guia-tallas" element={<SizeGuide />} />
      <Route path="/cuidado-joyas" element={<JewelryCare />} />
      <Route path="/envios-devoluciones" element={<ShippingReturns />} />
      <Route path="/garantia" element={<Warranty />} />
      <Route path="/contacto" element={<Contact />} />
    </Routes>
  );
};
