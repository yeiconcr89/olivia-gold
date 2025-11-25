import React from 'react';
import { Award, Heart, Sparkles, Shield, ArrowRight } from 'lucide-react';

const AboutPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="relative bg-elegant-900 text-white py-24 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573408301185-9146fe634ad0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-elegant-900/50 to-elegant-900"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <span className="inline-block py-1 px-3 rounded-full bg-gold-500/20 text-gold-300 text-sm font-semibold tracking-wider mb-6 border border-gold-500/30 backdrop-blur-sm animate-fade-in">
                        EST. 2020
                    </span>
                    <h1 className="text-4xl md:text-6xl font-playfair font-bold text-white mb-6 leading-tight animate-slide-in">
                        El Arte de la <span className="text-gold-400 italic">Elegancia</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in delay-100">
                        Especialistas en joyería de oro laminado de alta calidad, donde cada pieza cuenta una historia de sofisticación y belleza atemporal.
                    </p>
                </div>
            </div>

            {/* Our Story */}
            <section className="py-20 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-gold-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="relative">
                            <div className="relative z-10 rounded-2xl overflow-hidden shadow-elegant-lg transform hover:scale-[1.02] transition-transform duration-500">
                                <img
                                    src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                                    alt="Joyería artesanal"
                                    className="w-full h-auto object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-gold-50 rounded-full -z-0"></div>
                            <div className="absolute -top-6 -left-6 w-32 h-32 border-2 border-gold-200 rounded-full -z-0"></div>
                        </div>

                        <div>
                            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-elegant-900 mb-8">
                                Nuestra Historia
                            </h2>
                            <div className="space-y-6 text-gray-600 font-lato text-lg leading-relaxed">
                                <p>
                                    Olivia Gold nace del sueño de democratizar el lujo. Fundada en 2020, nuestra misión fue clara desde el primer día: hacer accesible la elegancia y sofisticación de la alta joyería sin comprometer la calidad.
                                </p>
                                <p>
                                    Nos especializamos en <span className="text-elegant-900 font-semibold">oro laminado 18k</span>, una técnica que nos permite ofrecer piezas con el brillo, la textura y la durabilidad del oro macizo, pero a un precio justo.
                                </p>
                                <p>
                                    Cada colección es curada meticulosamente, fusionando tendencias contemporáneas con diseños clásicos que nunca pasan de moda. No solo vendemos joyas; entregamos confianza, estilo y momentos inolvidables.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 bg-elegant-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-playfair font-bold text-elegant-900 mb-4">
                            Nuestros Valores
                        </h2>
                        <div className="w-24 h-1 bg-gold-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: <Award className="w-8 h-8 text-gold-600" />,
                                title: "Calidad Premium",
                                description: "Oro laminado 18k certificado con acabados impecables y duraderos."
                            },
                            {
                                icon: <Heart className="w-8 h-8 text-gold-600" />,
                                title: "Pasión por el Detalle",
                                description: "Cada pieza es seleccionada con amor y atención minuciosa."
                            },
                            {
                                icon: <Sparkles className="w-8 h-8 text-gold-600" />,
                                title: "Diseño Exclusivo",
                                description: "Colecciones únicas que reflejan personalidad y estilo propio."
                            },
                            {
                                icon: <Shield className="w-8 h-8 text-gold-600" />,
                                title: "Confianza Total",
                                description: "Garantía de satisfacción y soporte dedicado en cada compra."
                            }
                        ].map((value, index) => (
                            <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-gold transition-all duration-300 group border border-transparent hover:border-gold-100">
                                <div className="w-16 h-16 bg-gold-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-gold-100 transition-colors">
                                    {value.icon}
                                </div>
                                <h3 className="text-xl font-bold text-elegant-900 mb-3 font-playfair">
                                    {value.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {value.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Quality Commitment */}
            <section className="py-20 bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-br from-elegant-900 to-elegant-800 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>

                        <div className="relative z-10 text-center">
                            <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-6 text-gold-100">
                                Compromiso con la Excelencia
                            </h2>
                            <p className="text-lg text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                                En Olivia Gold, la calidad no es negociable. Todas nuestras joyas cuentan con certificación de autenticidad y una garantía de 30 días. Nos aseguramos de que cada cliente reciba una pieza que perdure en el tiempo, manteniendo su brillo y belleza con los cuidados adecuados.
                            </p>
                            <div className="inline-flex items-center justify-center space-x-2 text-gold-400 font-semibold tracking-wide uppercase text-sm border border-gold-500/30 rounded-full px-6 py-2 bg-gold-500/10">
                                <Sparkles className="w-4 h-4" />
                                <span>Garantía de Satisfacción</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact CTA */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-playfair font-bold text-elegant-900 mb-6">
                        ¿Tienes alguna pregunta?
                    </h2>
                    <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
                        Estamos aquí para asesorarte. Contáctanos directamente y recibe una atención personalizada para encontrar tu joya perfecta.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <a
                            href="https://api.whatsapp.com/send?phone=573153420703&text=Hola%20Olivia%20Gold"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-[#25D366] font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366] hover:bg-[#20BA5A] hover:shadow-lg hover:-translate-y-1 w-full sm:w-auto"
                        >
                            <span className="mr-3 text-xl">📱</span>
                            Chat en WhatsApp
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </a>

                        <a
                            href="https://www.instagram.com/oliviagoldorolaminado/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#dc2743] hover:shadow-lg hover:-translate-y-1 w-full sm:w-auto"
                        >
                            <span className="mr-3 text-xl">📸</span>
                            Síguenos en Instagram
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
