import { Router } from 'express';
import { ContactService } from '../services/contact.service';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import { logger } from '../utils/logger';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(2, 'El nombre es muy corto'),
  email: z.string().email('Email inválido'),
  subject: z.string().min(5, 'El asunto es muy corto'),
  message: z.string().min(10, 'El mensaje es muy corto')
});

router.post('/', validate(contactSchema), async (req, res) => {
  try {
    const contactMessage = await ContactService.submitContactForm(req.body);
    res.status(201).json({
      message: 'Mensaje enviado correctamente',
      data: contactMessage
    });
  } catch (error) {
    logger.error('Error in contact form submission', { error });
    res.status(500).json({
      message: 'Error al enviar el mensaje',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;
