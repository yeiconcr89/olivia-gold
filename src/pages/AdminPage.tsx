import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminDashboard from '../components/AdminDashboard';

const AdminPage: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Debug logging
  console.log('📊 AdminPage - User:', user);
  console.log('📊 AdminPage - isLoading:', isLoading);
  console.log('📊 AdminPage - User role:', user?.role);

  if (isLoading) {
    console.log('📊 AdminPage - Still loading');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Verificar si el usuario tiene rol de admin o manager
  const hasAdminAccess = user && (user.role === 'ADMIN' || user.role === 'MANAGER');
  console.log('📊 AdminPage - hasAdminAccess:', hasAdminAccess);

  if (!hasAdminAccess) {
    console.log('📊 AdminPage - No admin access, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('📊 AdminPage - Rendering AdminDashboard');

  return <AdminDashboard />;
};

export default AdminPage;