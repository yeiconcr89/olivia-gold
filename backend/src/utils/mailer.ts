import nodemailer from 'nodemailer';
import { logger } from './logger';
import { EmailTemplate } from './emailTemplates';

export interface EmailOptions {
  to: string;
  template: EmailTemplate;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Olivia Gold'}" <${process.env.SMTP_FROM_EMAIL || 'no-reply@oliviagold.com'}>`,
      to: options.to,
      subject: options.template.subject,
      text: options.template.text,
      html: options.template.html
    });

    logger.info('Email sent successfully', { messageId: info.messageId });
  } catch (error) {
    logger.error('Error sending email', { error });
    throw error;
  }
};

export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    logger.info('Email connection verified successfully');
    return true;
  } catch (error) {
    logger.error('Error verifying email connection:', { error });
    return false;
  }
};
