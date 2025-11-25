import React from 'react';
import { Lock, Eye, Database, Shield, Cookie } from 'lucide-react';

const PrivacyPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="relative bg-elegant-900 text-white py-20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-elegant-900/60 to-elegant-900"></div>

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-gold-500/10 rounded-full mb-6 animate-fade-in">
                        <Lock className="w-6 h-6 text-gold-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-playfair font-bold text-white mb-6 animate-slide-in">
                        Política de <span className="text-gold-400 italic">Privacidad</span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in delay-100">
                        Tu privacidad es sagrada para nosotros. Descubre cómo protegemos y gestionamos tus datos personales.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 pb-20">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-8 md:p-12">
                        <div className="prose prose-lg prose-gold max-w-none text-gray-600 font-lato">

                            <div className="flex items-center gap-3 mb-6">
                                <Shield className="w-6 h-6 text-gold-500" />
                                <h2 className="text-2xl font-playfair font-bold text-elegant-900 m-0">1. Protección de Datos</h2>
                            </div>
                            <p>
                                En Olivia Gold, nos tomamos muy en serio la privacidad de tus datos. Esta política describe cómo recopilamos, usamos y protegemos tu información personal cuando visitas nuestro sitio web o realizas una compra. Nos adherimos a la normativa colombiana de protección de datos personales (Ley 1581 de 2012).
                            </p>

                            <hr className="border-gray-100 my-8" />

                            <div className="flex items-center gap-3 mb-6">
                                <Eye className="w-6 h-6 text-gold-500" />
                                <h2 className="text-2xl font-playfair font-bold text-elegant-900 m-0">2. Información que Recopilamos</h2>
                            </div>
                            <p>
                                Para brindarte un mejor servicio, podemos recopilar la siguiente información:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-4">
                                <li><strong>Información de contacto:</strong> Nombre, dirección de correo electrónico, número de teléfono.</li>
                                <li><strong>Información de envío:</strong> Dirección física, ciudad, departamento.</li>
                                <li><strong>Información de pago:</strong> Procesada de forma segura y encriptada por pasarelas externas (no almacenamos datos sensibles de tarjetas).</li>
                            </ul>

                            <hr className="border-gray-100 my-8" />

                            <div className="flex items-center gap-3 mb-6">
                                <Database className="w-6 h-6 text-gold-500" />
                                <h2 className="text-2xl font-playfair font-bold text-elegant-900 m-0">3. Uso de la Información</h2>
                            </div>
                            <p>
                                Utilizamos tus datos exclusivamente para:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-4">
                                <li>Procesar, confirmar y enviar tus pedidos.</li>
                                <li>Comunicarnos contigo sobre el estado de tu compra o novedades importantes.</li>
                                <li>Enviarte promociones exclusivas (solo si te has suscrito voluntariamente a nuestro boletín).</li>
                                <li>Mejorar nuestra tienda y experiencia de usuario mediante análisis anónimos.</li>
                            </ul>

                            <hr className="border-gray-100 my-8" />

                            <div className="flex items-center gap-3 mb-6">
                                <Cookie className="w-6 h-6 text-gold-500" />
                                <h2 className="text-2xl font-playfair font-bold text-elegant-900 m-0">4. Cookies</h2>
                            </div>
                            <p>
                                Utilizamos cookies para mejorar tu experiencia de navegación, recordar tus preferencias (como el carrito de compras) y analizar el tráfico del sitio. Puedes desactivar las cookies en la configuración de tu navegador, aunque esto podría afectar algunas funcionalidades de la tienda.
                            </p>

                            <hr className="border-gray-100 my-8" />

                            <div className="bg-gold-50 p-6 rounded-xl border border-gold-100 mt-8">
                                <h3 className="text-lg font-playfair font-bold text-elegant-900 mb-2">Tus Derechos</h3>
                                <p className="text-sm text-gray-600 m-0">
                                    Tienes derecho a conocer, actualizar y rectificar tus datos personales. Para ejercer estos derechos, contáctanos en <a href="mailto:info@oliviagold.com" className="text-gold-600 font-bold hover:underline">info@oliviagold.com</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPage;
