import React, { useState } from 'react';
import { Mail, User, MessageSquare } from 'lucide-react';

export const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{success: boolean; message: string} | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Aquí iría la lógica para enviar el formulario
      // Por ahora, simulamos un envío exitoso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitStatus({
        success: true,
        message: '¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.'
      });
      
      // Limpiar el formulario después de enviar
      setFormData({ name: '', email: '', message: '' });
      
      // Ocultar el mensaje después de 5 segundos
      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
      
    } catch (error) {
      setSubmitStatus({
        success: false,
        message: 'Hubo un error al enviar el mensaje. Por favor, inténtalo de nuevo.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Tu nombre"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            required
          />
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Tu correo electrónico"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            required
          />
        </div>
        
        <div className="relative">
          <div className="absolute top-3 left-3">
            <MessageSquare className="h-5 w-5 text-gray-400" />
          </div>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Tu mensaje"
            rows={4}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gold-600 hover:bg-gold-700 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
        </button>
      </form>
      
      {submitStatus && (
        <div className={`p-4 rounded-md ${submitStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {submitStatus.message}
        </div>
      )}
    </div>
  );
};

export default ContactForm;
