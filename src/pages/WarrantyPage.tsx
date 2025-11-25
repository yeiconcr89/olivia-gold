import React from 'react';
import { ShieldCheck, CheckCircle, XCircle, FileText } from 'lucide-react';

const WarrantyPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="relative bg-elegant-900 text-white py-20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1626784215021-2e39ccf971cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-elegant-900/60 to-elegant-900"></div>

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-gold-500/10 rounded-full mb-6 animate-fade-in">
                        <ShieldCheck className="w-6 h-6 text-gold-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-playfair font-bold text-white mb-6 animate-slide-in">
                        Garantía de <span className="text-gold-400 italic">Calidad</span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in delay-100">
                        Tu confianza es lo más importante. Conoce los detalles de nuestra garantía y cómo respaldamos cada pieza que creamos.
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 pb-20">

                {/* Main Warranty Card */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-12">
                    <div className="bg-gold-50 p-8 border-b border-gold-100 text-center">
                        <h2 className="text-3xl font-playfair font-bold text-elegant-900 mb-2">Garantía de 30 Días</h2>
                        <p className="text-gold-700 font-medium">Cobertura total contra defectos de fabricación</p>
                    </div>

                    <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-xl font-bold text-elegant-900 mb-6 flex items-center gap-2">
                                <CheckCircle className="w-6 h-6 text-green-500" />
                                Lo que CUBRE la garantía
                            </h3>
                            <ul className="space-y-4 text-gray-600">
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                                    <span>Defectos en el laminado (descascarado prematuro).</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                                    <span>Problemas con broches o cierres defectuosos de fábrica.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                                    <span>Piedras sueltas o caídas al recibir el producto.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                                    <span>Errores de ensamblaje evidentes.</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-elegant-900 mb-6 flex items-center gap-2">
                                <XCircle className="w-6 h-6 text-red-500" />
                                Lo que NO CUBRE
                            </h3>
                            <ul className="space-y-4 text-gray-600">
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                                    <span>Desgaste natural por uso continuo.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                                    <span>Daños por exposición a químicos (perfumes, cloro).</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                                    <span>Ruptura de cadenas por tirones o fuerza excesiva.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                                    <span>Pérdida o robo de la joya.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Claim Process */}
                <div className="bg-elegant-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
                            <FileText className="w-6 h-6 text-gold-400" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-playfair font-bold text-white">
                            ¿Cómo solicitar una garantía?
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                            <div className="text-gold-400 font-bold text-xl mb-2">01.</div>
                            <h4 className="font-bold mb-2">Contáctanos</h4>
                            <p className="text-gray-400 text-sm">Escríbenos a WhatsApp con tu número de pedido y fotos claras del defecto.</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                            <div className="text-gold-400 font-bold text-xl mb-2">02.</div>
                            <h4 className="font-bold mb-2">Evaluación</h4>
                            <p className="text-gray-400 text-sm">Nuestro equipo técnico evaluará el caso en un plazo máximo de 48 horas.</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                            <div className="text-gold-400 font-bold text-xl mb-2">03.</div>
                            <h4 className="font-bold mb-2">Solución</h4>
                            <p className="text-gray-400 text-sm">Si procede, coordinaremos el cambio o reparación sin costo adicional.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WarrantyPage;
