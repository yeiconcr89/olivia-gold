import React, { useState } from 'react';
import { Mail, Gift } from 'lucide-react';
import { API_CONFIG } from '../config/api';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubscribed(true);
        setEmail('');
      } else {
        setErrorMessage(data.message || 'Error al suscribirse');
      }
    } catch (error) {
      console.error('Error al suscribirse:', error);
      setErrorMessage('Error de conexión. Intenta nuevamente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-6 bg-elegant-900 relative overflow-hidden">
      {/* Patrón de fondo sutil */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, gold 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="flex items-center justify-center mb-6">
          <Gift className="h-8 w-8 text-gold-400 mr-3" />
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-white">
            Únete a la familia Olivia Gold
          </h2>
        </div>

        <p className="text-xl text-gray-200 font-lato mb-8 max-w-2xl mx-auto leading-relaxed">
          Suscríbete y recibe un <span className="text-gold-400 font-bold bg-gold-400/20 px-2 py-1 rounded">15% de descuento</span> en tu primera compra,
          además de ofertas exclusivas y novedades de nuestras colecciones.
        </p>

        {isSubscribed ? (
          <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-6 max-w-md mx-auto backdrop-blur-sm">
            <h3 className="text-xl font-playfair font-bold text-green-300 mb-2">
              ¡Bienvenido/a a Olivia Gold!
            </h3>
            <p className="text-green-200 font-lato">
              Te hemos enviado tu código de descuento por email.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {errorMessage && (
              <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 max-w-md mx-auto backdrop-blur-sm">
                <p className="text-red-200 font-lato text-center">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-elegant-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Tu email aquí..."
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/95 text-elegant-900 font-lato focus:outline-none focus:ring-2 focus:ring-gold-400 focus:bg-white transition-all shadow-lg disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-gold text-elegant-900 px-8 py-3 rounded-lg font-lato font-bold hover:shadow-gold transition-all duration-300 transform hover:scale-105 whitespace-nowrap shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? 'Procesando...' : 'Obtener Descuento'}
              </button>
            </form>
          </div>
        )}

        <p className="text-sm text-gray-400 font-lato mt-6">
          No enviamos spam. Puedes cancelar la suscripción en cualquier momento.
        </p>
      </div>
    </section>
  );
};

export default Newsletter;