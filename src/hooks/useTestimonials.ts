import { useState, useEffect } from 'react';

interface Testimonial {
    id: string;
    name: string;
    rating: number;
    comment: string;
    image: string;
}

interface UseTestimonialsReturn {
    testimonials: Testimonial[];
    loading: boolean;
    error: string | null;
}

export const useTestimonials = (limit: number = 6): UseTestimonialsReturn => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`http://localhost:3001/api/reviews/approved?limit=${limit}`);

                if (!response.ok) {
                    throw new Error('Error al cargar testimonios');
                }

                const data = await response.json();

                if (data.success && data.data.reviews) {
                    setTestimonials(data.data.reviews);
                } else {
                    setTestimonials([]);
                }
            } catch (err) {
                console.error('Error fetching testimonials:', err);
                setError(err instanceof Error ? err.message : 'Error desconocido');
                setTestimonials([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTestimonials();
    }, [limit]);

    return { testimonials, loading, error };
};

export default useTestimonials;
