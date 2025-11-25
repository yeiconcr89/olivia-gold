import { Router } from 'express';
import * as newsletterController from '../controllers/newsletter.controller';

const router = Router();

// Suscribirse al newsletter
router.post('/subscribe', newsletterController.subscribe);

// Darse de baja del newsletter
router.post('/unsubscribe', newsletterController.unsubscribe);

export default router;
