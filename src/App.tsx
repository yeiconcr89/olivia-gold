import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { CsrfProvider } from './context/CsrfContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProductPage from './pages/ProductPage';
import AboutPage from './pages/AboutPage';
import FAQPage from './pages/FAQPage';
import ShippingPage from './pages/ShippingPage';
import SizeGuidePage from './pages/SizeGuidePage';
import JewelryCarePage from './pages/JewelryCarePage';
import WarrantyPage from './pages/WarrantyPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import AdminPage from './pages/AdminPage';
import ProductDebug from './pages/ProductDebug';
import OrdersPage from './pages/OrdersPage';
import WishlistPage from './pages/WishlistPage';
import ProfilePage from './pages/ProfilePage';

// Componentes principales
import Header from './components/Header';
import HeroSlider from './components/HeroSlider';
import ProductGrid from './components/ProductGrid';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import ToastContainer from './components/ToastContainer';

import ScrollToTop from './components/ScrollToTop';

const App: React.FC = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const addToast = (toast: any) => {
    setToasts(prev => [...prev, { ...toast, id: Date.now().toString() }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleLoginSuccess = () => {
    setIsLoginOpen(false);
    addToast({
      type: 'success',
      message: '¡Bienvenido a Olivia Gold!'
    });
  };

  return (
    <AuthProvider>
      <CsrfProvider>
        <WishlistProvider>
          <Router>
            <ScrollToTop />
            <div className="min-h-screen bg-gray-50">
              <ErrorBoundary>
                <Header
                  onLogin={() => setIsLoginOpen(true)}
                  onCategoryChange={setSelectedCategory}
                  onSearchChange={setSearchTerm}
                />
              </ErrorBoundary>

              <main className="pt-32">
                <Routes>
                  <Route path="/" element={
                    <ErrorBoundary>
                      <div>
                        {/* Hero Section */}
                        <section className="hero-section">
                          <HeroSlider />
                        </section>

                        {/* Products Section */}
                        <section className="products-section py-8">
                          <ProductGrid
                            category={selectedCategory}
                            searchTerm={searchTerm}
                          />
                        </section>

                        {/* Features Section */}
                        <Features />

                        {/* Testimonials Section */}
                        <Testimonials />

                        {/* Newsletter Section */}
                        <Newsletter />
                      </div>
                    </ErrorBoundary>
                  } />

                  <Route path="/productos" element={
                    <ErrorBoundary>
                      <ProductPage />
                    </ErrorBoundary>
                  } />

                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin/*" element={<AdminPage />} />
                  <Route path="/debug/products" element={<ProductDebug />} />

                  {/* Content Pages */}
                  <Route path="/sobre-nosotros" element={<AboutPage />} />
                  <Route path="/preguntas-frecuentes" element={<FAQPage />} />
                  <Route path="/envios-devoluciones" element={<ShippingPage />} />
                  <Route path="/guia-tallas" element={<SizeGuidePage />} />
                  <Route path="/cuidado-joyas" element={<JewelryCarePage />} />
                  <Route path="/garantia" element={<WarrantyPage />} />
                  <Route path="/terminos-condiciones" element={<TermsPage />} />
                  <Route path="/terminos-condiciones" element={<TermsPage />} />
                  <Route path="/politica-privacidad" element={<PrivacyPage />} />

                  {/* User Pages */}
                  <Route path="/orders" element={
                    <ErrorBoundary>
                      <OrdersPage />
                    </ErrorBoundary>
                  } />
                  <Route path="/wishlist" element={
                    <ErrorBoundary>
                      <WishlistPage />
                    </ErrorBoundary>
                  } />
                  <Route path="/profile" element={
                    <ErrorBoundary>
                      <ProfilePage />
                    </ErrorBoundary>
                  } />

                  <Route path="*" element={
                    <div className="container py-16 text-center">
                      <h1>Página no encontrada</h1>
                      <p>La página que buscas no existe.</p>
                    </div>
                  } />
                </Routes>
              </main>

              <ErrorBoundary>
                <Footer />
              </ErrorBoundary>

              {/* Modales */}
              <ErrorBoundary>
                <LoginModal
                  isOpen={isLoginOpen}
                  onClose={() => setIsLoginOpen(false)}
                  onSuccess={handleLoginSuccess}
                />
              </ErrorBoundary>

              {/* Toast Notifications */}
              <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
            </div>
          </Router>
        </WishlistProvider>
      </CsrfProvider>
    </AuthProvider>
  );
};

export default App;