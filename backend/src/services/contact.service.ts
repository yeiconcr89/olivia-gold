import { prisma } from '../config/prisma';
import { sendEmail } from '../utils/mailer';
import { logger } from '../utils/logger';
import { ContactFormData } from '../types';
import { EmailTemplates } from '../utils/emailTemplates';

export class ContactService {
  static async submitContactForm(data: ContactFormData) {
    try {
      // Guardar el mensaje en la base de datos
      const contactMessage = await prisma.contactMessage.create({
        data: {
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          status: 'PENDING'
        }
      });

      // Enviar notificación por email al administrador
      await sendEmail({
        to: process.env.CONTACT_EMAIL || 'admin@oliviagold.com',
        template: EmailTemplates.contactFormNotification(data)
      });

      // Enviar confirmación al cliente
      await sendEmail({
        to: data.email,
        template: EmailTemplates.contactFormConfirmation(data.name)
      });

      logger.info('Contact form submitted successfully', { id: contactMessage.id });
      return contactMessage;

    } catch (error) {
      logger.error('Error submitting contact form', { error });
      throw error;
    }
  }
}
