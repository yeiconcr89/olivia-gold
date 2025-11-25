import React from 'react';
import { Truck, RefreshCw, Package, Clock, MapPin, ShieldCheck, ArrowRight } from 'lucide-react';

const ShippingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="relative bg-elegant-900 text-white py-24 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-elegant-900/60 to-elegant-900"></div>

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-gold-500/10 rounded-full mb-6 animate-fade-in">
                        <Truck className="w-6 h-6 text-gold-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-playfair font-bold text-white mb-6 animate-slide-in">
                        Envíos y <span className="text-gold-400 italic">Devoluciones</span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in delay-100">
                        Tu experiencia de compra es nuestra prioridad. Conoce todo sobre nuestros procesos de entrega segura y políticas de garantía.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 pb-20">

                {/* Shipping Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-gold transition-all duration-300 border-t-4 border-gold-400">
                        <div className="w-12 h-12 bg-gold-50 rounded-full flex items-center justify-center mb-6">
                            <Truck className="w-6 h-6 text-gold-600" />
                        </div>
                        <h3 className="text-xl font-playfair font-bold text-elegant-900 mb-3">Envío Gratis</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Disfruta de envío gratuito en todas las compras superiores a <span className="font-bold text-elegant-900">$200.000</span> a cualquier destino en Colombia.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-gold transition-all duration-300 border-t-4 border-gold-400">
                        <div className="w-12 h-12 bg-gold-50 rounded-full flex items-center justify-center mb-6">
                            <Clock className="w-6 h-6 text-gold-600" />
                        </div>
                        <h3 className="text-xl font-playfair font-bold text-elegant-900 mb-3">Tiempos de Entrega</h3>
                        <ul className="text-gray-600 space-y-2 text-sm">
                            <li className="flex justify-between"><span>Ciudades principales:</span> <span className="font-bold">2-5 días</span></li>
                            <li className="flex justify-between"><span>Municipios:</span> <span className="font-bold">5-8 días</span></li>
                            <li className="flex justify-between"><span>Zonas rurales:</span> <span className="font-bold">8-12 días</span></li>
                        </ul>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-gold transition-all duration-300 border-t-4 border-gold-400">
                        <div className="w-12 h-12 bg-gold-50 rounded-full flex items-center justify-center mb-6">
                            <MapPin className="w-6 h-6 text-gold-600" />
                        </div>
                        <h3 className="text-xl font-playfair font-bold text-elegant-900 mb-3">Cobertura Total</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Llegamos a cada rincón del país gracias a nuestras alianzas estratégicas con las transportadoras más confiables.
                        </p>
                    </div>
                </div>

                {/* Returns Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                    {/* Policy Details */}
                    <div className="bg-white rounded-3xl p-8 md:p-10 shadow-elegant">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-elegant-100 rounded-full">
                                <RefreshCw className="w-6 h-6 text-elegant-900" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-playfair font-bold text-elegant-900">
                                Política de Devoluciones
                            </h2>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-elegant-900 mb-2 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gold-500" /> Plazo de 30 Días
                                </h3>
                                <p className="text-gray-600 pl-6">
                                    Tienes hasta 30 días calendario desde que recibes tu joya para solicitar un cambio o devolución.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-elegant-900 mb-2 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-gold-500" /> Condiciones
                                </h3>
                                <ul className="text-gray-600 pl-6 space-y-2 list-disc list-inside">
                                    <li>El producto debe estar nuevo y sin uso.</li>
                                    <li>Debe conservar etiquetas y empaque original.</li>
                                    <li>No aplica para aretes (por higiene).</li>
                                </ul>
                            </div>

                            <div className="bg-gold-50 rounded-xl p-6 border border-gold-100">
                                <h4 className="font-bold text-gold-800 mb-2">Nota Importante</h4>
                                <p className="text-sm text-gold-700">
                                    Los costos de envío por devolución corren por cuenta del cliente, excepto en casos de garantía o error en el despacho.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Process Steps */}
                    <div className="bg-elegant-900 rounded-3xl p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
                                    <Package className="w-6 h-6 text-gold-400" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-playfair font-bold text-white">
                                    Proceso de Devolución
                                </h2>
                            </div>

                            <div className="space-y-8">
                                {[
                                    { step: '01', title: 'Contáctanos', desc: 'Escríbenos por WhatsApp con tu número de orden.' },
                                    { step: '02', title: 'Empaca', desc: 'Guarda la joya en su empaque original de forma segura.' },
                                    { step: '03', title: 'Envía', desc: 'Te daremos las instrucciones para realizar el envío.' },
                                    { step: '04', title: 'Reembolso', desc: 'Una vez recibido y verificado, procesamos tu dinero.' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-6 relative">
                                        {idx !== 3 && (
                                            <div className="absolute left-[19px] top-10 bottom-[-32px] w-[2px] bg-white/10"></div>
                                        )}
                                        <div className="w-10 h-10 rounded-full bg-gold-500 text-elegant-900 font-bold flex items-center justify-center flex-shrink-0 z-10">
                                            {item.step}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                                            <p className="text-gray-400 text-sm">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10 pt-8 border-t border-white/10 text-center">
                                <a
                                    href="https://api.whatsapp.com/send?phone=573153420703&text=Hola,%20quiero%20iniciar%20una%20devolución"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center bg-[#25D366] hover:bg-[#20BA5A] text-white px-8 py-3 rounded-full font-bold transition-all duration-300 w-full hover:shadow-lg hover:-translate-y-1"
                                >
                                    Iniciar Proceso <ArrowRight className="w-5 h-5 ml-2" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShippingPage;
