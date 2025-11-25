import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const GoogleCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const userString = urlParams.get('user');
    const error = urlParams.get('error');

    if (error) {
      console.error('Error en autenticación Google:', error);
      navigate('/login?error=' + error);
      return;
    }

    if (token && userString) {
      try {
        const user = JSON.parse(decodeURIComponent(userString));
        login(user, token);
        navigate('/');
      } catch (error) {
        console.error('Error procesando callback de Google:', error);
        navigate('/login?error=invalid_callback');
      }
    } else {
      navigate('/login?error=missing_data');
    }
  }, [location, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Procesando autenticación con Google...</p>
      </div>
    </div>
  );
};

export default GoogleCallback;