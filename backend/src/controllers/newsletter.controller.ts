import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { sendEmail } from '../utils/mailer';
import { EmailTemplates } from '../utils/emailTemplates';

const subscribeSchema = z.object({
    email: z.string().email('Email inválido'),
});

export const subscribe = async (req: Request, res: Response) => {
    try {
        const { email } = subscribeSchema.parse(req.body);

        // Verificar si el email ya está suscrito
        const existing = await prisma.newsletterSubscriber.findUnique({
            where: { email },
        });

        if (existing) {
            if (existing.active) {
                return res.status(400).json({
                    success: false,
                    message: 'Este email ya está suscrito a nuestro newsletter',
                });
            } else {
                // Reactivar suscripción
                await prisma.newsletterSubscriber.update({
                    where: { email },
                    data: {
                        active: true,
                        unsubscribedAt: null,
                    },
                });

                // Enviar email de bienvenida (reactivación)
                try {
                    await sendEmail({
                        to: email,
                        template: EmailTemplates.newsletterWelcome()
                    });
                } catch (emailError) {
                    console.error('Error enviando email de bienvenida:', emailError);
                    // No fallamos la request si el email falla, pero lo logueamos
                }

                return res.status(200).json({
                    success: true,
                    message: '¡Bienvenido de vuelta! Tu suscripción ha sido reactivada',
                });
            }
        }

        // Crear nueva suscripción
        await prisma.newsletterSubscriber.create({
            data: { email },
        });

        // Enviar email de bienvenida
        try {
            await sendEmail({
                to: email,
                template: EmailTemplates.newsletterWelcome()
            });
        } catch (emailError) {
            console.error('Error enviando email de bienvenida:', emailError);
            // No fallamos la request si el email falla, pero lo logueamos
        }

        res.status(201).json({
            success: true,
            message: '¡Gracias por suscribirte! Revisa tu email para confirmar',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: error.issues[0].message,
            });
        }

        console.error('Error al suscribir al newsletter:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar tu suscripción. Intenta nuevamente',
        });
    }
};

export const unsubscribe = async (req: Request, res: Response) => {
    try {
        const { email } = subscribeSchema.parse(req.body);

        const subscriber = await prisma.newsletterSubscriber.findUnique({
            where: { email },
        });

        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: 'Email no encontrado en nuestra lista',
            });
        }

        await prisma.newsletterSubscriber.update({
            where: { email },
            data: {
                active: false,
                unsubscribedAt: new Date(),
            },
        });

        res.status(200).json({
            success: true,
            message: 'Te has dado de baja correctamente',
        });
    } catch (error) {
        console.error('Error al dar de baja del newsletter:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar tu solicitud',
        });
    }
};
