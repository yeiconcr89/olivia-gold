import React from 'react';
import { FileText, Scale, Truck, ShieldCheck, RefreshCw } from 'lucide-react';

const TermsPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="relative bg-elegant-900 text-white py-20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-elegant-900/60 to-elegant-900"></div>

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-gold-500/10 rounded-full mb-6 animate-fade-in">
                        <Scale className="w-6 h-6 text-gold-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-playfair font-bold text-white mb-6 animate-slide-in">
                        Términos y <span className="text-gold-400 italic">Condiciones</span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in delay-100">
                        Transparencia y claridad en cada transacción. Conoce las reglas que rigen nuestra relación comercial.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 pb-20">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-8 md:p-12">
                        <div className="prose prose-lg prose-gold max-w-none text-gray-600 font-lato">
                            <div className="flex items-center gap-3 mb-6">
                                <FileText className="w-6 h-6 text-gold-500" />
                                <h2 className="text-2xl font-playfair font-bold text-elegant-900 m-0">1. Introducción</h2>
                            </div>
                            <p>
                                Bienvenido a Olivia Gold. Al acceder y utilizar nuestro sitio web, aceptas cumplir con los siguientes términos y condiciones. Te recomendamos leerlos detenidamente antes de realizar cualquier compra. Estos términos aplican a todos los visitantes, usuarios y otras personas que accedan o utilicen el servicio.
                            </p>

                            <hr className="border-gray-100 my-8" />

                            <div className="flex items-center gap-3 mb-6">
                                <ShieldCheck className="w-6 h-6 text-gold-500" />
                                <h2 className="text-2xl font-playfair font-bold text-elegant-900 m-0">2. Productos y Precios</h2>
                            </div>
                            <p>
                                Nos esforzamos por mostrar con la mayor precisión posible los colores e imágenes de nuestros productos. Sin embargo, no podemos garantizar que la visualización en tu monitor sea exacta.
                            </p>
                            <p>
                                Todos los precios están en Pesos Colombianos (COP) e incluyen impuestos aplicables. Nos reservamos el derecho de modificar los precios sin previo aviso, aunque esto no afectará a los pedidos ya confirmados y pagados.
                            </p>

                            <hr className="border-gray-100 my-8" />

                            <div className="flex items-center gap-3 mb-6">
                                <Truck className="w-6 h-6 text-gold-500" />
                                <h2 className="text-2xl font-playfair font-bold text-elegant-900 m-0">3. Envíos y Entregas</h2>
                            </div>
                            <p>
                                Realizamos envíos a todo el territorio colombiano. Los tiempos de entrega son estimados y pueden variar por factores externos.
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-4">
                                <li>Ciudades principales: 2-4 días hábiles.</li>
                                <li>Otras poblaciones: 4-8 días hábiles.</li>
                            </ul>
                            <p className="mt-4">
                                Olivia Gold no se hace responsable por retrasos causados por la transportadora, aunque brindaremos todo el soporte necesario para rastrear tu pedido.
                            </p>

                            <hr className="border-gray-100 my-8" />

                            <div className="flex items-center gap-3 mb-6">
                                <RefreshCw className="w-6 h-6 text-gold-500" />
                                <h2 className="text-2xl font-playfair font-bold text-elegant-900 m-0">4. Cambios y Devoluciones</h2>
                            </div>
                            <p>
                                Aceptamos cambios dentro de los 30 días siguientes a la compra, siempre que el producto esté en perfectas condiciones y en su empaque original. Los costos de envío por cambios (no relacionados con garantía) corren por cuenta del cliente.
                            </p>

                            <hr className="border-gray-100 my-8" />

                            <div className="bg-gold-50 p-6 rounded-xl border border-gold-100 mt-8">
                                <h3 className="text-lg font-playfair font-bold text-elegant-900 mb-2">¿Tienes dudas?</h3>
                                <p className="text-sm text-gray-600 m-0">
                                    Si tienes alguna pregunta sobre estos términos, por favor contáctanos a <a href="mailto:info@oliviagold.com" className="text-gold-600 font-bold hover:underline">info@oliviagold.com</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsPage;
