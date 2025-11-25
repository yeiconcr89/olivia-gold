import { useState, useEffect } from 'react';

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

// Mock data para demostración
const mockReviews: Review[] = [
  {
    id: 'REV-001',
    productId: '1',
    productName: 'Collar Veneciano Premium',
    customerName: 'María González',
    customerEmail: 'maria@email.com',
    rating: 5,
    title: 'Excelente calidad',
    comment: 'El collar es hermoso, la calidad del oro laminado es excepcional. Llegó muy bien empaquetado.',
    date: '2024-01-15T00:00:00Z',
    verified: true,
    helpful: 12,
    notHelpful: 0,
    status: 'approved'
  },
  {
    id: 'REV-002',
    productId: '2',
    productName: 'Anillo Solitario Diamante',
    customerName: 'Carlos Rodríguez',
    customerEmail: 'carlos@email.com',
    rating: 4,
    title: 'Muy bonito pero tardó en llegar',
    comment: 'El anillo es precioso, mi novia quedó encantada. Solo que el envío tardó más de lo esperado.',
    date: '2024-01-14T00:00:00Z',
    verified: true,
    helpful: 8,
    notHelpful: 1,
    status: 'pending'
  }
];

export const useReviews = () => {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);

  useEffect(() => {
    const savedReviews = localStorage.getItem('reviews');
    if (savedReviews) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReviews(JSON.parse(savedReviews));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('reviews', JSON.stringify(reviews));
  }, [reviews]);

  const updateReview = (reviewId: string, updates: Partial<Review>) => {
    setReviews(prev => prev.map(review => 
      review.id === reviewId ? { ...review, ...updates } : review
    ));
  };

  const deleteReview = (reviewId: string) => {
    setReviews(prev => prev.filter(review => review.id !== reviewId));
  };

  const respondToReview = (reviewId: string, responseText: string) => {
    setReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? { 
            ...review, 
            response: {
              text: responseText,
              date: new Date().toISOString(),
              author: 'Joyería Elegante'
            }
          } 
        : review
    ));
  };

  return {
    reviews,
    updateReview,
    deleteReview,
    respondToReview
  };
};