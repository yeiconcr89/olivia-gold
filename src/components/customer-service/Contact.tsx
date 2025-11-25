import React from 'react';
import { useContactForm } from '../../hooks/useContactForm';
import { Loader2 } from 'lucide-react';

const Contact: React.FC = () => {
  const { formData, loading, error, success, handleChange, handleSubmit, resetForm } = useContactForm();
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-6">Contacto</h1>
      
      <div className="space-y-8">
        <section className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-medium mb-4">Información de Contacto</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Teléfono</h3>
                <p>+57 (601) 123-4567</p>
              </div>
              <div>
                <h3 className="font-medium">WhatsApp</h3>
                <p>+57 300 123 4567</p>
              </div>
              <div>
                <h3 className="font-medium">Email</h3>
                <p>servicio@oliviagold.com</p>
              </div>
              <div>
                <h3 className="font-medium">Horario de Atención</h3>
                <p>Lunes a Viernes: 9:00 AM - 6:00 PM</p>
                <p>Sábados: 10:00 AM - 2:00 PM</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-medium mb-4">Formulario de Contacto</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
                  Tu mensaje ha sido enviado correctamente. Te responderemos pronto.
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-1">
                  Asunto
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1">
                  Mensaje
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : 'Enviar Mensaje'}
              </button>
            </form>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-medium mb-4">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-medium mb-2">¿Cuál es el tiempo de respuesta?</h3>
              <p>Respondemos todas las consultas en un máximo de 24 horas hábiles.</p>
            </div>
            <div className="border-b pb-4">
              <h3 className="font-medium mb-2">¿Tienen atención presencial?</h3>
              <p>Por el momento solo atendemos de manera virtual y telefónica.</p>
            </div>
            <div className="border-b pb-4">
              <h3 className="font-medium mb-2">¿Cómo puedo hacer seguimiento a mi consulta?</h3>
              <p>Te enviaremos un número de ticket para que puedas dar seguimiento a tu caso.</p>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-2xl font-medium mb-4">Ubicación</h2>
          <div className="prose prose-lg">
            <p>Oficina principal:</p>
            <address className="not-italic">
              Calle 123 # 45-67<br />
              Edificio Gold Center, Piso 5<br />
              Bogotá, Colombia
            </address>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contact;
