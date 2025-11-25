import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  // Debug logging
  console.log('🔐 AdminRoute - User state:', { user, isLoading });
  console.log('🔐 AdminRoute - User role:', user?.role);
  console.log('🔐 AdminRoute - Full user object:', JSON.stringify(user, null, 2));

  if (isLoading) {
    console.log('🔐 AdminRoute - Still loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    // Si no está autenticado, redirigir a la página principal
    console.log('🔐 AdminRoute - No user found, redirecting to home');
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    // Si no es admin ni manager, redirigir a la página principal
    console.log('🔐 AdminRoute - User is not admin/manager, redirecting to home. Role:', user.role);
    return <Navigate to="/" replace />;
  }

  console.log('🔐 AdminRoute - Access granted! Rendering admin content');
  console.log('🔐 AdminRoute - User role confirmed as:', user.role);

  return <>{children}</>;
};

export default AdminRoute;