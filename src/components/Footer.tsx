import React from 'react';
import { Mail, Instagram, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Footer: React.FC = () => {

  return (
    <footer className="bg-elegant-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <div className="mb-6">
              <Logo size="md" variant="light" withText={true} />
            </div>
            <p className="text-gray-400 font-lato leading-relaxed mb-6">
              Especialistas en joyería de oro laminado de alta calidad.
              Diseños únicos que reflejan tu personalidad y estilo.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/oliviagoldorolaminado/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gold-400 transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="https://api.whatsapp.com/send?phone=573153420703" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gold-400 transition-colors">
                <MessageCircle className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Explora */}
          <div>
            <h4 className="text-lg font-playfair font-bold mb-6 text-white border-b border-gold-500/30 pb-2 inline-block">Explora</h4>
            <ul className="space-y-3 font-lato">
              <li><Link to="/productos" className="text-gray-400 hover:text-gold-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-gold-500 rounded-full mr-2 opacity-0 hover:opacity-100 transition-opacity"></span>Productos</Link></li>
              <li><Link to="/sobre-nosotros" className="text-gray-400 hover:text-gold-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-gold-500 rounded-full mr-2 opacity-0 hover:opacity-100 transition-opacity"></span>Sobre Nosotros</Link></li>
              <li><Link to="/guia-tallas" className="text-gray-400 hover:text-gold-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-gold-500 rounded-full mr-2 opacity-0 hover:opacity-100 transition-opacity"></span>Guía de Tallas</Link></li>
              <li><Link to="/cuidado-joyas" className="text-gray-400 hover:text-gold-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-gold-500 rounded-full mr-2 opacity-0 hover:opacity-100 transition-opacity"></span>Cuidado de Joyas</Link></li>
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h4 className="text-lg font-playfair font-bold mb-6 text-white border-b border-gold-500/30 pb-2 inline-block">Ayuda</h4>
            <ul className="space-y-3 font-lato">
              <li><Link to="/preguntas-frecuentes" className="text-gray-400 hover:text-gold-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-gold-500 rounded-full mr-2 opacity-0 hover:opacity-100 transition-opacity"></span>Preguntas Frecuentes</Link></li>
              <li><Link to="/envios-devoluciones" className="text-gray-400 hover:text-gold-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-gold-500 rounded-full mr-2 opacity-0 hover:opacity-100 transition-opacity"></span>Envíos y Devoluciones</Link></li>
              <li><Link to="/garantia" className="text-gray-400 hover:text-gold-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-gold-500 rounded-full mr-2 opacity-0 hover:opacity-100 transition-opacity"></span>Garantía</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-lg font-playfair font-bold mb-6 text-white border-b border-gold-500/30 pb-2 inline-block">Contacto</h4>
            <div className="space-y-4 font-lato">
              <div className="flex items-start space-x-3 group">
                <MessageCircle className="h-5 w-5 text-gold-400 flex-shrink-0 mt-1 group-hover:text-gold-300 transition-colors" />
                <div className="flex flex-col space-y-1">
                  <a href="https://wa.me/573153420703" target="_blank" rel="noopener noreferrer" className="text-gray-400 group-hover:text-white transition-colors hover:underline">
                    +57 315 342 0703
                  </a>
                  <a href="https://wa.me/573103973754" target="_blank" rel="noopener noreferrer" className="text-gray-400 group-hover:text-white transition-colors hover:underline">
                    +57 310 397 3754
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-3 group">
                <Mail className="h-5 w-5 text-gold-400 flex-shrink-0 group-hover:text-gold-300 transition-colors" />
                <a href="mailto:info@oliviagold.com" className="text-gray-400 group-hover:text-white transition-colors">info@oliviagold.com</a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-elegant-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 font-lato text-sm">
              © {new Date().getFullYear()} Olivia Gold. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6">
              <Link to="/politica-privacidad" className="text-gray-500 hover:text-gold-400 text-sm font-lato transition-colors">
                Política de Privacidad
              </Link>
              <Link to="/terminos-condiciones" className="text-gray-500 hover:text-gold-400 text-sm font-lato transition-colors">
                Términos y Condiciones
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
