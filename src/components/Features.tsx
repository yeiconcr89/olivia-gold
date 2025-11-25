import React from 'react';
import { Shield, Truck, CreditCard, Headphones, Award, RefreshCw } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: Shield,
      title: 'Oro Laminado 18k',
      description: 'Certificación de calidad y durabilidad garantizada'
    },
    {
      icon: Truck,
      title: 'Envío GRATIS',
      description: 'En compras superiores a $200.000 en toda Colombia',
      highlight: true, // Nueva propiedad
      badge: 'POPULAR'
    },
    {
      icon: CreditCard,
      title: 'Pago Seguro',
      description: 'Múltiples métodos de pago y financiación disponible'
    },
    {
      icon: Headphones,
      title: 'Atención Personalizada',
      description: 'Asesoría especializada de lunes a viernes'
    },
    {
      icon: Award,
      title: 'Calidad Premium',
      description: 'Materiales de la más alta calidad y acabados perfectos'
    },
    {
      icon: RefreshCw,
      title: 'Garantía Total',
      description: '30 días para cambios y garantía en todos nuestros productos'
    }
  ];

  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-elegant-900 mb-4">
            ¿Por qué elegir Olivia Gold?
          </h2>
          <p className="text-lg text-elegant-600 font-lato max-w-2xl mx-auto">
            Nos comprometemos a ofrecerte la mejor experiencia en joyería de oro laminado de alta calidad
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-elegant hover:shadow-gold transition-all duration-300 transform hover:-translate-y-1 text-center group border border-gray-100"
            >
              <div className="w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <feature.icon className="h-8 w-8 text-elegant-900" />
              </div>
              
              <h3 className="text-xl font-playfair font-bold text-elegant-900 mb-3">
                {feature.title}
              </h3>
              
              <p className="text-elegant-600 font-lato leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;