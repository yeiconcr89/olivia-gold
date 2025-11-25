import React, { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Flag, Reply, Search } from 'lucide-react';

interface Review {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
  helpful: number;
  notHelpful: number;
  status: 'pending' | 'approved' | 'rejected';
  response?: {
    text: string;
    date: string;
    author: string;
  };
}

interface ReviewSystemProps {
  reviews: Review[];
  onUpdateReview: (reviewId: string, updates: Partial<Review>) => void;
  onDeleteReview: (reviewId: string) => void;
  onRespondToReview: (reviewId: string, response: string) => void;
}

const ReviewSystem: React.FC<ReviewSystemProps> = ({
  reviews,
  onUpdateReview,
  onDeleteReview,
  onRespondToReview
}) => {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReviews = reviews.filter(review => {
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter;
    const matchesSearch = review.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesRating && matchesSearch;
  });

  const reviewStats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
    averageRating: reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0
  };

  const handleResponse = (reviewId: string) => {
    if (responseText.trim()) {
      onRespondToReview(reviewId, responseText);
      setResponseText('');
      setSelectedReview(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`${starSize} ${
              i < rating ? 'text-gold-500 fill-current' : 'text-elegant-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-lato text-elegant-600">Total Reseñas</p>
              <p className="text-2xl font-playfair font-bold text-elegant-900">
                {reviewStats.total}
              </p>
            </div>
            <Star className="h-8 w-8 text-gold-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-lato text-elegant-600">Pendientes</p>
              <p className="text-2xl font-playfair font-bold text-yellow-600">
                {reviewStats.pending}
              </p>
            </div>
            <Flag className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-lato text-elegant-600">Aprobadas</p>
              <p className="text-2xl font-playfair font-bold text-green-600">
                {reviewStats.approved}
              </p>
            </div>
            <ThumbsUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-elegant p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-lato text-elegant-600">Calificación Promedio</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-playfair font-bold text-elegant-900">
                  {reviewStats.averageRating.toFixed(1)}
                </p>
                {renderStars(Math.round(reviewStats.averageRating))}
              </div>
            </div>
            <Star className="h-8 w-8 text-gold-500 fill-current" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-elegant p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-elegant-400" />
              <input
                type="text"
                placeholder="Buscar reseñas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 font-lato"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 font-lato"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobadas</option>
              <option value="rejected">Rechazadas</option>
            </select>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-4 py-2 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 font-lato"
            >
              <option value="all">Todas las calificaciones</option>
              <option value="5">5 estrellas</option>
              <option value="4">4 estrellas</option>
              <option value="3">3 estrellas</option>
              <option value="2">2 estrellas</option>
              <option value="1">1 estrella</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <div key={review.id} className="bg-white rounded-xl shadow-elegant p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-playfair font-semibold text-elegant-900">
                    {review.title}
                  </h3>
                  {review.verified && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                      Verificado
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(review.status)}`}>
                    {review.status === 'pending' ? 'Pendiente' :
                     review.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 mb-3">
                  {renderStars(review.rating)}
                  <span className="text-sm font-lato text-elegant-600">
                    por {review.customerName}
                  </span>
                  <span className="text-sm font-lato text-elegant-500">
                    {new Date(review.date).toLocaleDateString('es-ES')}
                  </span>
                </div>
                
                <p className="text-sm font-lato text-elegant-600 mb-2">
                  Producto: <span className="font-semibold">{review.productName}</span>
                </p>
                
                <p className="text-elegant-700 font-lato mb-4">
                  {review.comment}
                </p>

                {review.response && (
                  <div className="bg-elegant-50 p-4 rounded-lg mt-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Reply className="h-4 w-4 text-gold-500" />
                      <span className="text-sm font-lato font-semibold text-elegant-900">
                        Respuesta de {review.response.author}
                      </span>
                      <span className="text-sm font-lato text-elegant-500">
                        {new Date(review.response.date).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <p className="text-elegant-700 font-lato">
                      {review.response.text}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                {review.status === 'pending' && (
                  <>
                    <button
                      onClick={() => onUpdateReview(review.id, { status: 'approved' })}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm font-lato hover:bg-green-600 transition-colors"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => onUpdateReview(review.id, { status: 'rejected' })}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm font-lato hover:bg-red-600 transition-colors"
                    >
                      Rechazar
                    </button>
                  </>
                )}
                
                {!review.response && review.status === 'approved' && (
                  <button
                    onClick={() => setSelectedReview(review)}
                    className="px-3 py-1 bg-gold-500 text-white rounded text-sm font-lato hover:bg-gold-600 transition-colors"
                  >
                    Responder
                  </button>
                )}
                
                <button
                  onClick={() => onDeleteReview(review.id)}
                  className="px-3 py-1 bg-elegant-500 text-white rounded text-sm font-lato hover:bg-elegant-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm font-lato text-elegant-600">
              <div className="flex items-center space-x-1">
                <ThumbsUp className="h-4 w-4" />
                <span>{review.helpful} útiles</span>
              </div>
              <div className="flex items-center space-x-1">
                <ThumbsDown className="h-4 w-4" />
                <span>{review.notHelpful} no útiles</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Response Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedReview(null)} />
          
          <div className="absolute inset-4 md:inset-8 lg:inset-16 bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-playfair font-bold text-elegant-900">
                  Responder Reseña
                </h2>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="p-2 hover:bg-elegant-100 rounded-full transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="mb-6 p-4 bg-elegant-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  {renderStars(selectedReview.rating)}
                  <span className="font-playfair font-semibold">{selectedReview.title}</span>
                </div>
                <p className="text-elegant-700 font-lato">
                  {selectedReview.comment}
                </p>
                <p className="text-sm text-elegant-600 font-lato mt-2">
                  - {selectedReview.customerName} sobre {selectedReview.productName}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-elegant-700 mb-2 font-lato">
                    Tu Respuesta
                  </label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-elegant-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 font-lato"
                    placeholder="Escribe una respuesta profesional y útil..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="px-6 py-2 border border-elegant-300 text-elegant-700 rounded-lg font-lato font-semibold hover:bg-elegant-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleResponse(selectedReview.id)}
                    className="px-6 py-2 bg-gradient-gold text-elegant-900 rounded-lg font-lato font-bold hover:shadow-gold transition-all"
                  >
                    Enviar Respuesta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSystem;