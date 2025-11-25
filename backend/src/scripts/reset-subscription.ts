
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetSubscription() {
    try {
        const email = 'yeiconcr@gmail.com';
        console.log(`Eliminando suscripción para ${email}...`);

        const deleted = await prisma.newsletterSubscriber.deleteMany({
            where: {
                email: email
            }
        });

        if (deleted.count > 0) {
            console.log('✅ Suscripción eliminada correctamente.');
        } else {
            console.log('ℹ️ No se encontró suscripción activa para este email.');
        }
    } catch (error) {
        console.error('❌ Error al eliminar suscripción:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetSubscription();
