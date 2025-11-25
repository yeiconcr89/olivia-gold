import React from 'react';
import { Sparkles, Droplets, Sun, Box, AlertTriangle } from 'lucide-react';
import OptimizedImage from '../components/OptimizedImage';

const JewelryCarePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="relative bg-elegant-900 text-white py-20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-elegant-900/60 to-elegant-900"></div>

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-gold-500/10 rounded-full mb-6 animate-fade-in">
                        <Sparkles className="w-6 h-6 text-gold-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-playfair font-bold text-white mb-6 animate-slide-in">
                        Cuidado de tus <span className="text-gold-400 italic">Joyas</span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in delay-100">
                        Nuestras piezas de oro laminado están diseñadas para durar. Sigue estos simples consejos para mantener su brillo y belleza por años.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            icon: <Droplets className="w-8 h-8 text-blue-400" />,
                            title: "Evita la Humedad",
                            desc: "Quítate las joyas antes de bañarte, nadar o hacer ejercicio intenso. El agua y el sudor pueden afectar el brillo."
                        },
                        {
                            icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
                            title: "Cero Químicos",
                            desc: "Aplica perfumes, cremas y lacas antes de ponerte tus joyas. Los químicos son el enemigo #1 del oro laminado."
                        },
                        {
                            icon: <Box className="w-8 h-8 text-gold-500" />,
                            title: "Almacenamiento",
                            desc: "Guarda cada pieza por separado en su bolsa o estuche original para evitar rayones y enredos."
                        },
                        {
                            icon: <Sun className="w-8 h-8 text-orange-400" />,
                            title: "Limpieza Suave",
                            desc: "Limpia tus joyas suavemente con un paño seco de microfibra después de cada uso para remover aceites naturales."
                        }
                    ].map((tip, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-gold transition-all duration-300 group">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                {tip.icon}
                            </div>
                            <h3 className="text-xl font-playfair font-bold text-elegant-900 mb-3">{tip.title}</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                {tip.desc}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-16 bg-white rounded-3xl p-8 md:p-12 shadow-elegant flex flex-col md:flex-row gap-12 items-center">
                    <div className="flex-1">
                        <h2 className="text-3xl font-playfair font-bold text-elegant-900 mb-6">
                            ¿Cómo limpiar tus joyas?
                        </h2>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gold-100 text-gold-700 font-bold flex items-center justify-center">1</span>
                                <p className="text-gray-600 pt-1">Mezcla agua tibia con un poco de jabón neutro suave.</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gold-100 text-gold-700 font-bold flex items-center justify-center">2</span>
                                <p className="text-gray-600 pt-1">Sumerge la joya por unos minutos (máximo 5 min).</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gold-100 text-gold-700 font-bold flex items-center justify-center">3</span>
                                <p className="text-gray-600 pt-1">Enjuaga con agua limpia y seca inmediatamente con un paño suave dando toques delicados.</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 relative min-h-[300px]">
                        <div className="absolute inset-0 bg-gold-100 rounded-2xl transform translate-x-4 translate-y-4"></div>
                        <OptimizedImage
                            src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dflhmlbrz'}/image/upload/v1/pages/jewelry-care/cleaning-guide`}
                            alt="Cuidado y limpieza de joyas"
                            className="relative rounded-2xl shadow-lg w-full h-full object-cover bg-gray-100"
                            width={800}
                            height={600}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JewelryCarePage;
