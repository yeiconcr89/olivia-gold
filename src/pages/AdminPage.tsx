import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminDashboard from '../components/AdminDashboard';

const AdminPage: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Verificar si el usuario tiene rol de admin o manager
  const hasAdminAccess = user && (user.role === 'ADMIN' || user.role === 'MANAGER');

  if (!hasAdminAccess) {
    return <Navigate to="/login" replace />;
  }

  return <AdminDashboard />;
};

export default AdminPage;