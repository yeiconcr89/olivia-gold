import React from 'react';
import PageLayout from '../layout/PageLayout';
import { Headset, Mail, Phone, MessageCircle, Clock, MapPin, Package, Shield, RefreshCw, Award, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
// Importación eliminada ya que no se está utilizando

const CustomerService: React.FC = () => {
  return (
    <PageLayout 
      title="Atención al Cliente | Olivia Gold"
      description="Contáctanos para cualquier consulta, soporte o asistencia con tus compras en Olivia Gold. Estamos aquí para ayudarte."
    >
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-elegant-900 to-elegant-800 py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/olivia_gold_logo.png')] bg-center bg-no-repeat bg-contain"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-white mb-4">Atención al Cliente</h1>
            <p className="text-xl text-gold-300 max-w-3xl mx-auto">
              En Olivia Gold, tu satisfacción es nuestra prioridad. Nuestro equipo está listo para brindarte 
              una experiencia de compra excepcional y asistencia personalizada.
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gold-600">
                  Inicio
                </Link>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Servicio al Cliente</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Contact Channels */}
          <div className="md:col-span-2 space-y-8">
            {/* Contact Channels Card */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-amber-900 mb-6 flex items-center">
                <Headset className="mr-2 text-amber-600" size={24} />
                Canales de Atención
              </h2>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border border-amber-100 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="bg-amber-50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <MessageCircle className="text-amber-600" size={24} />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">WhatsApp</h3>
                    <p className="text-gray-700 mb-2">+57 300 123 4567</p>
                    <p className="text-sm text-amber-600 flex items-center">
                      <Clock className="mr-1" size={14} /> Respuesta inmediata
                    </p>
                  </div>
                  
                  <div className="border border-amber-100 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="bg-amber-50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <Mail className="text-amber-600" size={24} />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Correo Electrónico</h3>
                    <p className="text-gray-700 mb-2">servicio@oliviagold.com</p>
                    <p className="text-sm text-amber-600 flex items-center">
                      <Clock className="mr-1" size={14} /> Respuesta en 24h
                    </p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border border-amber-100 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="bg-amber-50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <Phone className="text-amber-600" size={24} />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Teléfono</h3>
                    <p className="text-gray-700 mb-2">+57 (601) 123-4567</p>
                    <p className="text-sm text-amber-600 flex items-center">
                      <Clock className="mr-1" size={14} /> Lun-Vie 9AM-6PM
                    </p>
                  </div>
                  
                  <div className="border border-amber-100 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="bg-amber-50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <MapPin className="text-amber-600" size={24} />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Tienda Física</h3>
                    <p className="text-gray-700 mb-2">Carrera 14 #85-24, Bogotá</p>
                    <p className="text-sm text-amber-600">Lun-Sáb 10AM-7PM</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Services Card */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-amber-900 mb-6">Nuestros Servicios</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-amber-50 p-2 rounded-lg mr-4">
                    <Package className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Envíos a todo el país</h3>
                    <p className="text-gray-600 text-sm mt-1">Envío gratuito en compras superiores a $200.000</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-amber-50 p-2 rounded-lg mr-4">
                    <Shield className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Pago seguro</h3>
                    <p className="text-gray-600 text-sm mt-1">Protegemos tus datos con encriptación SSL</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-amber-50 p-2 rounded-lg mr-4">
                    <RefreshCw className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Devoluciones fáciles</h3>
                    <p className="text-gray-600 text-sm mt-1">30 días para devoluciones</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-amber-50 p-2 rounded-lg mr-4">
                    <Award className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Garantía de autenticidad</h3>
                    <p className="text-gray-600 text-sm mt-1">Todas nuestras joyas son certificadas</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Store Info */}
          <div className="space-y-8">
            {/* Store Hours Card */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-amber-900 mb-6">Horarios de Atención</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">Lunes a Viernes</h3>
                  <p className="text-gray-600">9:00 AM - 6:00 PM</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900">Sábados</h3>
                  <p className="text-gray-600">10:00 AM - 2:00 PM</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900">Domingos y Festivos</h3>
                  <p className="text-gray-600">Cerrado</p>
                </div>
                
                <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-800">
                    *WhatsApp disponible 24/7 para mensajes. Respuestas en horario laboral.
                  </p>
                </div>
              </div>
            </section>

            {/* Commitment Card */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-amber-900 mb-6 flex items-center">
                <Headset className="mr-2 text-amber-600" size={24} />
                Nuestro Compromiso
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <span className="text-amber-500 mr-2 mt-1">•</span>
                  <span className="text-gray-700">Respuesta en menos de 24 horas hábiles</span>
                </div>
                <div className="flex items-start">
                  <span className="text-amber-500 mr-2 mt-1">•</span>
                  <span className="text-gray-700">Atención personalizada y profesional</span>
                </div>
                <div className="flex items-start">
                  <span className="text-amber-500 mr-2 mt-1">•</span>
                  <span className="text-gray-700">Seguimiento de casos hasta su resolución</span>
                </div>
                <div className="flex items-start">
                  <span className="text-amber-500 mr-2 mt-1">•</span>
                  <span className="text-gray-700">Asesoría especializada en joyería</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mt-16 bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-playfair font-bold text-elegant-900">Preguntas Frecuentes</h2>
              <div className="w-20 h-1 bg-gold-500 mx-auto mt-4 mb-6"></div>
              <p className="text-lg text-gray-600 mt-2 max-w-3xl mx-auto">
                Encuentra respuestas a las preguntas más comunes sobre nuestros productos y servicios.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-elegant-900 mb-3">¿Cuáles son los tiempos de envío?</h3>
                <p className="text-gray-600">
                  Los envíos a ciudades principales tardan de 2 a 3 días hábiles. Para otras ciudades, de 3 a 5 días hábiles.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-elegant-900 mb-3">¿Cómo puedo hacer seguimiento a mi pedido?</h3>
                <p className="text-gray-600">
                  Recibirás un correo con el número de seguimiento una vez tu pedido haya sido despachado.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-elegant-900 mb-3">¿Aceptan devoluciones?</h3>
                <p className="text-gray-600">
                  Sí, aceptamos devoluciones dentro de los 30 días posteriores a la recepción del pedido.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-elegant-900 mb-3">¿Cómo cuido mis joyas?</h3>
                <p className="text-gray-600">
                  Te recomendamos guardar tus joyas en un lugar seco y limpio, evitando el contacto con productos químicos.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-elegant-900 mb-3">¿Qué métodos de pago aceptan?</h3>
                <p className="text-gray-600">
                  Aceptamos todas las tarjetas de crédito y débito, transferencias bancarias y pagos en efectivo en nuestras tiendas físicas.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-elegant-900 mb-3">¿Hacen envíos internacionales?</h3>
                <p className="text-gray-600">
                  Actualmente solo realizamos envíos dentro de Colombia. Próximamente estaremos disponibles en más países.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-elegant-900 mb-3">¿Ofrecen garantía en sus productos?</h3>
                <p className="text-gray-600">
                  Todas nuestras joyas tienen garantía de 6 meses por defecto contra defectos de fabricación.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow col-span-2 text-center">
                <h3 className="text-xl font-playfair font-semibold text-elegant-900 mb-4">¿No encontraste lo que buscabas?</h3>
                <p className="text-gray-600 mb-6">Estamos aquí para ayudarte. Contáctanos y te responderemos a la brevedad.</p>
                <Link 
                  to="/contacto" 
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gold-600 hover:bg-gold-700 transition-colors"
                >
                  Contáctanos
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default CustomerService;
