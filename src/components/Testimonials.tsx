import React from 'react';
import { Star, Quote } from 'lucide-react';
import { useTestimonials } from '../hooks/useTestimonials';

const Testimonials: React.FC = () => {
  const { testimonials, loading, error } = useTestimonials(3);

  if (loading) {
    return (
      <section className="py-4 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-elegant-900 mb-4">
              Lo que dicen nuestros clientes
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-48"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return null; // Silently fail without showing error to users
  }

  if (testimonials.length === 0) {
    return null; // Don't show section if no testimonials
  }

  return (
    <section className="py-4 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-elegant-900 mb-4">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-lg text-elegant-600 font-lato max-w-2xl mx-auto">
            La satisfacción de nuestros clientes es nuestra mayor recompensa en Olivia Gold
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white p-8 rounded-xl relative hover:shadow-elegant transition-all duration-300 border border-gray-100 group hover:-translate-y-1"
            >
              <Quote className="h-8 w-8 text-gold-400 mb-4 group-hover:text-gold-500 transition-colors" />

              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < testimonial.rating
                        ? 'text-gold-500 fill-current'
                        : 'text-gray-300'
                      }`}
                  />
                ))}
              </div>

              <p className="text-elegant-700 font-lato mb-6 italic leading-relaxed">
                "{testimonial.comment}"
              </p>

              <div className="flex items-center">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-gold-200"
                />
                <div>
                  <h4 className="font-playfair font-semibold text-elegant-900">
                    {testimonial.name}
                  </h4>
                  <p className="text-elegant-600 text-sm font-lato">
                    Cliente Olivia Gold
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;