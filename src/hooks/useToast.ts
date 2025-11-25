import { useState, useCallback } from 'react';
import { ToastData, ToastType } from '../components/ToastContainer';

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    duration?: number
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastData = {
      id,
      type,
      title,
      message,
      duration
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string, duration?: number) => {
    return addToast('success', title, message, duration);
  }, [addToast]);

  const error = useCallback((title: string, message?: string, duration?: number) => {
    return addToast('error', title, message, duration || 7000); // Errores duran más
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    return addToast('warning', title, message, duration);
  }, [addToast]);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    return addToast('info', title, message, duration);
  }, [addToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll
  };
};