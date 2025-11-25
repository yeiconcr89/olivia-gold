import { EmailOptions } from '../utils/mailer';

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

export class EmailTemplates {
  static contactFormConfirmation(name: string): EmailTemplate {
    return {
      subject: 'Hemos recibido tu mensaje - Olivia Gold',
      text: `
        Hola ${name},

        Gracias por contactarnos. Hemos recibido tu mensaje y te responderemos lo antes posible.

        Saludos,
        Equipo de Olivia Gold
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Gracias por contactarnos</h2>
          <p style="color: #666;">Hola ${name},</p>
          <p style="color: #666;">Hemos recibido tu mensaje y te responderemos lo antes posible.</p>
          <br>
          <p style="color: #666;">Saludos,</p>
          <p style="color: #666;">Equipo de Olivia Gold</p>
        </div>
      `
    };
  }

  static contactFormNotification(data: { name: string; email: string; subject: string; message: string }): EmailTemplate {
    return {
      subject: `Nuevo mensaje de contacto: ${data.subject}`,
      text: `
        Nombre: ${data.name}
        Email: ${data.email}
        Asunto: ${data.subject}
        Mensaje: ${data.message}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Nuevo mensaje de contacto</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
            <p style="margin: 10px 0;"><strong>Nombre:</strong> ${data.name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${data.email}</p>
            <p style="margin: 10px 0;"><strong>Asunto:</strong> ${data.subject}</p>
            <p style="margin: 10px 0;"><strong>Mensaje:</strong></p>
            <p style="margin: 10px 0; white-space: pre-line;">${data.message}</p>
          </div>
        </div>
      `
    };
  }

  static newsletterWelcome(): EmailTemplate {
    return {
      subject: '¡Bienvenido a Olivia Gold! Aquí tienes tu descuento',
      text: `
        ¡Bienvenido a la familia Olivia Gold!

        Gracias por suscribirte a nuestro newsletter. Como agradecimiento, aquí tienes un código de descuento del 15% para tu primera compra:

        CÓDIGO: BIENVENIDA15

        Descubre nuestra colección de joyería en oro laminado de alta calidad.

        Visítanos en: https://oliviagold.com

        Saludos,
        El equipo de Olivia Gold
      `,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
            <h1 style="color: #D4AF37; margin: 0; font-family: 'Playfair Display', serif;">Olivia Gold</h1>
            <p style="color: #ffffff; margin: 5px 0 0; font-size: 14px;">ORO LAMINADO DE LUJO</p>
          </div>
          
          <div style="padding: 40px 20px; text-align: center; border: 1px solid #e5e5e5; border-top: none;">
            <h2 style="color: #333; margin-bottom: 20px;">¡Bienvenido a la familia!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Gracias por suscribirte a nuestro newsletter. Estamos encantados de tenerte con nosotros.
              Como agradecimiento, queremos regalarte un descuento especial para tu primera compra.
            </p>
            
            <div style="background-color: #f9f9f9; border: 2px dashed #D4AF37; padding: 20px; margin: 30px 0; display: inline-block;">
              <p style="margin: 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Tu código de descuento</p>
              <p style="margin: 10px 0 0; color: #D4AF37; font-size: 24px; font-weight: bold;">BIENVENIDA15</p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Úsalo en el checkout para obtener un <strong>15% de descuento</strong> en cualquiera de nuestras joyas.
            </p>
            
            <a href="http://localhost:5173/productos" style="background-color: #D4AF37; color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-weight: bold; display: inline-block;">
              Ver Colección
            </a>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Olivia Gold. Todos los derechos reservados.</p>
            <p>Si no deseas recibir más correos, puedes darte de baja en cualquier momento.</p>
          </div>
        </div>
      `
    };
  }
}