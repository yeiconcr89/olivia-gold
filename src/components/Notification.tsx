import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  duration?: number;
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ 
  message, 
  type, 
  duration = 3000, 
  onClose 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`
      fixed bottom-4 right-4 flex items-center p-4 rounded-lg shadow-lg
      ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white
      transform transition-transform duration-300 ease-in-out
    `}>
      <div className="flex items-center">
        {type === 'success' ? (
          <Check className="w-5 h-5 mr-2" />
        ) : (
          <X className="w-5 h-5 mr-2" />
        )}
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200 focus:outline-none"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Notification;
