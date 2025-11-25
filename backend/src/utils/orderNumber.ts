import { prisma } from './prisma';

/**
 * Genera un número de pedido único con formato PED-AAMMDD-XXX
 * @returns Promise<string> Número de pedido generado
 */
export const generateOrderNumber = async (): Promise<string> => {
  const now = new Date();
  
  // Formatear fecha como AAMMDD
  const year = now.getFullYear().toString().slice(-2); // Últimos 2 dígitos del año
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;
  
  // Buscar el último número de pedido del día
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  
  const lastOrder = await prisma.order.findFirst({
    where: {
      orderDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
      id: {
        startsWith: `PED-${datePrefix}-`,
      },
    },
    orderBy: {
      orderDate: 'desc',
    },
    select: {
      id: true,
    },
  });

  let sequence = 1;
  
  if (lastOrder && lastOrder.id.startsWith(`PED-${datePrefix}-`)) {
    // Extraer el número secuencial del último pedido
    const lastSequence = lastOrder.id.split('-')[2];
    if (lastSequence && !isNaN(parseInt(lastSequence))) {
      sequence = parseInt(lastSequence) + 1;
    }
  }

  // Formatear el número secuencial con 3 dígitos
  const sequenceStr = sequence.toString().padStart(3, '0');
  
  return `PED-${datePrefix}-${sequenceStr}`;
};