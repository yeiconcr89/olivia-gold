import React, { useState } from 'react';
import { Ruler, HelpCircle, Check } from 'lucide-react';

const SizeGuidePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'rings' | 'bracelets' | 'necklaces'>('rings');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="relative bg-elegant-900 text-white py-24 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1611591437281-460bfbe1220a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-elegant-900/50 to-elegant-900"></div>

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-gold-500/10 rounded-full mb-6 animate-fade-in">
                        <Ruler className="w-6 h-6 text-gold-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-playfair font-bold text-white mb-6 animate-slide-in">
                        Guía de <span className="text-gold-400 italic">Tallas</span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in delay-100">
                        Encuentra el ajuste perfecto para tu joya. Sigue nuestras sencillas instrucciones para medir tu talla desde casa.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 pb-20">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() => setActiveTab('rings')}
                            className={`flex-1 py-6 text-center font-playfair font-bold text-lg transition-colors relative ${activeTab === 'rings' ? 'text-elegant-900' : 'text-gray-400 hover:text-elegant-700'}`}
                        >
                            Anillos
                            {activeTab === 'rings' && <div className="absolute bottom-0 left-0 w-full h-1 bg-gold-500"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('bracelets')}
                            className={`flex-1 py-6 text-center font-playfair font-bold text-lg transition-colors relative ${activeTab === 'bracelets' ? 'text-elegant-900' : 'text-gray-400 hover:text-elegant-700'}`}
                        >
                            Pulseras
                            {activeTab === 'bracelets' && <div className="absolute bottom-0 left-0 w-full h-1 bg-gold-500"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('necklaces')}
                            className={`flex-1 py-6 text-center font-playfair font-bold text-lg transition-colors relative ${activeTab === 'necklaces' ? 'text-elegant-900' : 'text-gray-400 hover:text-elegant-700'}`}
                        >
                            Cadenas
                            {activeTab === 'necklaces' && <div className="absolute bottom-0 left-0 w-full h-1 bg-gold-500"></div>}
                        </button>
                    </div>

                    <div className="p-8 md:p-12">
                        {/* Rings Content */}
                        {activeTab === 'rings' && (
                            <div className="space-y-12 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                    <div>
                                        <h3 className="text-2xl font-playfair font-bold text-elegant-900 mb-6">Cómo medir tu anillo</h3>
                                        <ol className="space-y-4 font-lato text-gray-600">
                                            <li className="flex gap-4">
                                                <span className="flex-shrink-0 w-8 h-8 bg-gold-100 text-gold-700 rounded-full flex items-center justify-center font-bold">1</span>
                                                <p>Toma un anillo que te quede bien en el dedo que deseas medir.</p>
                                            </li>
                                            <li className="flex gap-4">
                                                <span className="flex-shrink-0 w-8 h-8 bg-gold-100 text-gold-700 rounded-full flex items-center justify-center font-bold">2</span>
                                                <p>Mide el <strong className="text-elegant-900">diámetro interno</strong> del anillo con una regla (en milímetros).</p>
                                            </li>
                                            <li className="flex gap-4">
                                                <span className="flex-shrink-0 w-8 h-8 bg-gold-100 text-gold-700 rounded-full flex items-center justify-center font-bold">3</span>
                                                <p>Compara la medida con nuestra tabla para encontrar tu talla.</p>
                                            </li>
                                        </ol>
                                    </div>
                                    <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 text-center">
                                        <div className="w-32 h-32 rounded-full border-4 border-gold-300 mx-auto mb-4 flex items-center justify-center relative">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-full h-0.5 bg-elegant-900 w-4/5"></div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium">Mide solo el interior</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-playfair font-bold text-elegant-900 mb-6 text-center">Tabla de Tallas de Anillos</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-center border-collapse">
                                            <thead>
                                                <tr>
                                                    <th className="py-4 px-6 bg-elegant-900 text-white font-playfair rounded-tl-xl">Talla</th>
                                                    <th className="py-4 px-6 bg-elegant-900 text-white font-playfair rounded-tr-xl">Diámetro (mm)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="font-lato text-gray-600">
                                                {[
                                                    { size: '5', mm: '15.7 mm' },
                                                    { size: '6', mm: '16.5 mm' },
                                                    { size: '7', mm: '17.3 mm' },
                                                    { size: '8', mm: '18.1 mm' },
                                                    { size: '9', mm: '18.9 mm' },
                                                    { size: '10', mm: '19.8 mm' },
                                                ].map((row, i) => (
                                                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                                        <td className="py-4 px-6 font-bold text-elegant-900">{row.size}</td>
                                                        <td className="py-4 px-6">{row.mm}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bracelets Content */}
                        {activeTab === 'bracelets' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="bg-gold-50 p-8 rounded-2xl border border-gold-100">
                                    <h3 className="text-2xl font-playfair font-bold text-elegant-900 mb-4">Medida Estándar</h3>
                                    <p className="text-gray-700 font-lato leading-relaxed">
                                        La mayoría de nuestras pulseras tienen una medida estándar de <strong className="text-elegant-900">18 cm a 20 cm</strong>, que se ajusta a la mayoría de las muñecas. Algunas referencias incluyen una cadena de extensión para mayor comodidad.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-elegant-900 mb-4 font-playfair">Cómo medir tu muñeca:</h4>
                                    <ul className="space-y-3 font-lato text-gray-600">
                                        <li className="flex items-start gap-3">
                                            <Check className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
                                            <span>Usa una cinta métrica flexible y envuélvela alrededor de tu muñeca.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <Check className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
                                            <span>Si no tienes cinta, usa una tira de papel, marca el punto de encuentro y mídela con una regla.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <Check className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" />
                                            <span>Añade 1-2 cm a tu medida para un ajuste cómodo.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Necklaces Content */}
                        {activeTab === 'necklaces' && (
                            <div className="animate-fade-in text-center">
                                <h3 className="text-2xl font-playfair font-bold text-elegant-900 mb-8">Largo de Cadenas</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {[
                                        { len: '40 cm', desc: 'Gargantilla' },
                                        { len: '45 cm', desc: 'Princesa (Estándar)' },
                                        { len: '50 cm', desc: 'Matiné' },
                                        { len: '60 cm', desc: 'Ópera' },
                                    ].map((item, i) => (
                                        <div key={i} className="bg-gray-50 p-6 rounded-xl border border-gray-100 hover:border-gold-200 transition-colors">
                                            <div className="text-3xl font-bold text-gold-500 mb-2 font-playfair">{item.len}</div>
                                            <div className="text-gray-600 font-medium">{item.desc}</div>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-8 text-gray-500 font-lato text-sm">
                                    * La caída puede variar según la contextura de cada persona.
                                </p>
                            </div>
                        )}

                        {/* Help CTA */}
                        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
                            <h4 className="text-lg font-playfair font-bold text-elegant-900 mb-2">¿Aún tienes dudas?</h4>
                            <p className="text-gray-600 mb-6">Nuestro equipo te ayuda a elegir la talla correcta.</p>
                            <a
                                href="https://api.whatsapp.com/send?phone=573153420703&text=Hola,%20necesito%20ayuda%20con%20mi%20talla"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-8 py-3 bg-gold-500 text-white font-bold rounded-full hover:bg-gold-600 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <HelpCircle className="w-5 h-5 mr-2" />
                                Consultar por WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SizeGuidePage;
