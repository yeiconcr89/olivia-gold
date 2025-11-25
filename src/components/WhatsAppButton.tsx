import React from 'react';

interface WhatsAppButtonProps {
  phoneNumber: string;
  message: string;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ phoneNumber, message }) => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <a
      href={whatsappURL}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-button"
    >
      <i className="fab fa-whatsapp"></i>
      ¿Necesitas ayuda? Contáctanos por WhatsApp
    </a>
  );
};

export default WhatsAppButton;