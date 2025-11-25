import React, { useState } from 'react';
import { ChevronDown, MessageCircle, Mail, ArrowRight, HelpCircle } from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

const FAQPage: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs: FAQItem[] = [
        {
            category: 'Producto',
            question: '¿Qué es el oro laminado 18k?',
            answer: 'El oro laminado 18k es una técnica superior donde se fusiona una capa gruesa de oro de 18 kilates sobre una base de metal de alta calidad. A diferencia del baño de oro tradicional, nuestro laminado es hasta 10 veces más grueso, garantizando una durabilidad excepcional, resistencia al agua y ese brillo inconfundible del oro macizo.'
        },
        {
            category: 'Producto',
            question: '¿Cuánto tiempo dura el oro laminado?',
            answer: 'Con los cuidados adecuados, nuestras joyas están diseñadas para durar años manteniendo su belleza original. La fusión del oro laminado crea una barrera resistente que no se pela ni se decolora fácilmente, ofreciéndote una joya para toda la vida con el cuidado correcto.'
        },
        {
            category: 'Envíos',
            question: '¿Ofrecen envíos a toda Colombia?',
            answer: '¡Sí! Llegamos a cada rincón de Colombia. Disfruta de ENVÍO GRATIS en compras superiores a $200.000. Para pedidos menores, contamos con tarifas preferenciales. Tu pedido llegará seguro entre 2 a 5 días hábiles en ciudades principales.'
        },
        {
            category: 'Garantía',
            question: '¿Cuál es la política de cambios y devoluciones?',
            answer: 'Tu satisfacción es nuestra prioridad. Tienes 30 días para enamorarte de tu joya. Si no es lo que esperabas, puedes cambiarla o devolverla siempre que esté sin uso y en su empaque original. Queremos que compres con total tranquilidad.'
        },
        {
            category: 'Garantía',
            question: '¿Las joyas vienen con garantía?',
            answer: 'Absolutamente. Cada pieza Olivia Gold incluye un certificado de autenticidad y garantía de 30 días por defectos de fabricación. Respaldamos la calidad de nuestros materiales y mano de obra.'
        },
        {
            category: 'Cuidado',
            question: '¿Cómo puedo cuidar mis joyas?',
            answer: 'El secreto para un brillo eterno es simple: evita el contacto directo con perfumes y químicos fuertes, límpialas suavemente con un paño seco después de usarlas y guárdalas en su estuche individual. ¡Así lucirán siempre como el primer día!'
        },
        {
            category: 'Servicio',
            question: '¿Tienen tienda física?',
            answer: 'Somos una marca nativa digital, lo que nos permite ofrecerte la mejor calidad al mejor precio eliminando costos de intermediarios. Sin embargo, nuestra atención es tan cálida y personalizada como si estuvieras en una boutique de lujo.'
        },
        {
            category: 'Servicio',
            question: '¿Puedo hacer pedidos personalizados?',
            answer: '¡Nos encanta ser parte de tus momentos especiales! Escríbenos por WhatsApp para diseñar juntos esa pieza soñada para bodas, compromisos o regalos únicos. Nuestro equipo de diseño te guiará en cada paso.'
        },
        {
            category: 'Pagos',
            question: '¿Qué métodos de pago aceptan?',
            answer: 'Tu comodidad es primero. Aceptamos todas las tarjetas (Crédito/Débito), PSE, Nequi, y Daviplata. También ofrecemos la opción de Pago Contra Entrega en la mayoría de ciudades para que pagues al recibir tu joya.'
        },
        {
            category: 'Cuidado',
            question: '¿Las joyas se pueden mojar?',
            answer: 'Nuestras joyas son resistentes, pero el agua (especialmente con cloro o sal) puede afectar su brillo a largo plazo. Recomendamos quitártelas para nadar o bañarte para preservar su acabado premium por más tiempo.'
        },
        {
            category: 'Tallas',
            question: '¿Cómo sé qué talla de anillo necesito?',
            answer: 'Visita nuestra Guía de Tallas donde encontrarás un paso a paso sencillo para medir tu dedo. Si aún tienes dudas, nuestro equipo de asesores está listo en WhatsApp para ayudarte a elegir el ajuste perfecto.'
        },
        {
            category: 'Envíos',
            question: '¿Realizan envíos internacionales?',
            answer: 'Por el momento, nuestra magia brilla exclusivamente en Colombia. Estamos trabajando arduamente para llevar Olivia Gold al resto de Latinoamérica muy pronto. ¡Suscríbete a nuestro newsletter para ser el primero en saberlo!'
        }
    ];

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="relative bg-elegant-900 text-white py-24 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-elegant-900/80 to-elegant-900"></div>

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-gold-500/10 rounded-full mb-6 animate-fade-in">
                        <HelpCircle className="w-6 h-6 text-gold-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-playfair font-bold text-white mb-6 animate-slide-in">
                        Preguntas <span className="text-gold-400 italic">Frecuentes</span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in delay-100">
                        Todo lo que necesitas saber sobre nuestras joyas, envíos y servicios. Estamos aquí para brindarte la mejor experiencia.
                    </p>
                </div>
            </div>

            {/* FAQ List */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 pb-20">
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl shadow-sm hover:shadow-gold transition-all duration-300 border border-transparent hover:border-gold-100 overflow-hidden group"
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full px-6 py-5 text-left flex items-center justify-between bg-white"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold tracking-wider text-gold-600 uppercase bg-gold-50 px-2 py-1 rounded">
                                        {faq.category}
                                    </span>
                                    <span className="text-lg font-playfair font-semibold text-elegant-900 group-hover:text-gold-700 transition-colors">
                                        {faq.question}
                                    </span>
                                </div>
                                <div className={`p-2 rounded-full transition-colors ${openIndex === index ? 'bg-gold-50 text-gold-600' : 'text-gray-400 group-hover:text-gold-500'}`}>
                                    <ChevronDown
                                        className={`h-5 w-5 transition-transform duration-300 ${openIndex === index ? 'transform rotate-180' : ''}`}
                                    />
                                </div>
                            </button>
                            <div
                                className={`transition-all duration-300 ease-in-out overflow-hidden ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <div className="px-6 pb-6 pt-0 pl-20">
                                    <p className="text-gray-600 font-lato leading-relaxed border-l-2 border-gold-200 pl-4">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact CTA */}
                <div className="mt-16 bg-gradient-to-br from-elegant-900 to-elegant-800 rounded-2xl p-8 md:p-12 text-center text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>

                    <div className="relative z-10">
                        <h2 className="text-2xl md:text-3xl font-playfair font-bold mb-4">
                            ¿No encontraste tu respuesta?
                        </h2>
                        <p className="text-gray-300 font-lato mb-8 max-w-xl mx-auto">
                            Nuestro equipo de atención al cliente está disponible para resolver cualquier duda adicional que tengas.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="https://api.whatsapp.com/send?phone=573153420703&text=Hola%20Olivia%20Gold,%20tengo%20una%20pregunta"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center bg-[#25D366] hover:bg-[#20BA5A] text-white px-8 py-3 rounded-full font-bold transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
                            >
                                <MessageCircle className="w-5 h-5 mr-2" />
                                WhatsApp
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </a>

                            <a
                                href="mailto:info@oliviagold.com"
                                className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold transition-all duration-300 backdrop-blur-sm"
                            >
                                <Mail className="w-5 h-5 mr-2" />
                                Email
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQPage;
