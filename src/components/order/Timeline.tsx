import React from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck,
  Plus
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  description: string;
  timestamp: string;
  createdBy?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  onAddEvent?: (event: Omit<TimelineEvent, 'id'>) => Promise<void>;
}

const Timeline: React.FC<TimelineProps> = ({ events, onAddEvent }) => {
  const getStatusIcon = (status: string) => {
    const icons = {
      PENDING: Clock,
      CONFIRMED: CheckCircle,
      PROCESSING: Package,
      SHIPPED: Truck,
      DELIVERED: CheckCircle,
      CANCELLED: XCircle
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return <Icon className="h-5 w-5" />;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
      PROCESSING: 'bg-purple-100 text-purple-800 border-purple-300',
      SHIPPED: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      DELIVERED: 'bg-green-100 text-green-800 border-green-300',
      CANCELLED: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="bg-white rounded-xl shadow-elegant p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="admin-subheading">Seguimiento del Pedido</h3>
        {onAddEvent && (
          <button
            onClick={() => {
              // Open a modal or form to add new event
              // This is a placeholder implementation
              const newEvent = {
                status: 'PROCESSING' as const,
                description: 'Nuevo estado',
                timestamp: new Date().toISOString(),
              };
              onAddEvent(newEvent);
            }}
            className="text-sm flex items-center text-gold-600 hover:text-gold-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar evento
          </button>
        )}
      </div>

      <div className="relative">
        {events.length === 0 ? (
          <div className="text-center py-6 text-elegant-500">
            <Clock className="h-8 w-8 mx-auto mb-2" />
            <p>No hay eventos de seguimiento</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="relative">
                {/* Vertical line */}
                {index !== events.length - 1 && (
                  <div 
                    className="absolute top-8 left-4 bottom-0 w-0.5 bg-elegant-200"
                    style={{ transform: 'translateX(-50%)' }}
                  />
                )}
                
                {/* Event content */}
                <div className="flex items-start">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(event.status)}`}>
                    {getStatusIcon(event.status)}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                      {event.status}
                    </div>
                    <p className="mt-1 text-sm text-elegant-900">{event.description}</p>
                    <div className="mt-1 flex items-center space-x-2 text-xs text-elegant-500">
                      <time dateTime={event.timestamp}>
                        {new Date(event.timestamp).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </time>
                      {event.createdBy && (
                        <>
                          <span>•</span>
                          <span>{event.createdBy}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TimelineSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-elegant p-6 animate-pulse">
      <div className="h-6 w-40 bg-elegant-200 rounded mb-4" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start">
            <div className="w-8 h-8 bg-elegant-200 rounded-full" />
            <div className="ml-4 flex-1">
              <div className="h-5 w-20 bg-elegant-200 rounded" />
              <div className="mt-2 h-4 w-full bg-elegant-200 rounded" />
              <div className="mt-2 h-3 w-32 bg-elegant-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { Timeline, TimelineSkeleton };