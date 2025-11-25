import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    // Si no está autenticado, redirigir a la página principal
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    // Si no es admin ni manager, redirigir a la página principal
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;