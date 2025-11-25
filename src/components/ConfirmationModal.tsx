import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'warning'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-600',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          background: 'bg-red-50 border-red-200'
        };
      case 'warning':
        return {
          icon: 'text-yellow-600',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          background: 'bg-yellow-50 border-yellow-200'
        };
      default:
        return {
          icon: 'text-blue-600',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          background: 'bg-blue-50 border-blue-200'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onCancel} />
      
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
          {/* Header */}
          <div className={`p-6 border-b border-elegant-200 ${styles.background}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full bg-white ${styles.icon}`}>
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-lg admin-heading">
                  {title}
                </h3>
              </div>
              <button
                onClick={onCancel}
                className="p-1 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-elegant-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="admin-body text-elegant-700 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-elegant-200 bg-elegant-50">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-elegant-300 text-elegant-700 rounded-lg admin-button hover:bg-elegant-100 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg admin-button transition-all ${styles.confirmButton}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;