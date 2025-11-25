import { prisma } from '../utils/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

// ============================================================================
// TIPOS
// ============================================================================

type CreateHeroSlideData = {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink?: string;
  offerText?: string;
  isActive?: boolean;
  orderIndex?: number;
};

type UpdateHeroSlideData = Partial<CreateHeroSlideData>;

// ============================================================================
// FUNCIONES DEL SERVICIO
// ============================================================================

export const getAllHeroSlides = async (includeInactive: boolean = false) => {
  const where = includeInactive ? {} : { isActive: true };
  
  const slides = await prisma.heroSlide.findMany({
    where,
    orderBy: { orderIndex: 'asc' },
  });

  return slides;
};

export const getActiveHeroSlides = async () => {
  const slides = await prisma.heroSlide.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  });

  return slides;
};

export const getHeroSlideById = async (id: string) => {
  const slide = await prisma.heroSlide.findUnique({
    where: { id },
  });

  if (!slide) {
    throw new NotFoundError('Slide no encontrado');
  }

  return slide;
};

export const createHeroSlide = async (slideData: CreateHeroSlideData) => {
  logger.info('🎨 Creando nuevo slide del hero:', JSON.stringify(slideData, null, 2));

  // Si no se especifica orderIndex, usar el siguiente disponible
  if (slideData.orderIndex === undefined) {
    const lastSlide = await prisma.heroSlide.findFirst({
      orderBy: { orderIndex: 'desc' },
    });
    slideData.orderIndex = (lastSlide?.orderIndex || 0) + 1;
  }

  const slide = await prisma.heroSlide.create({
    data: slideData,
  });

  logger.info('✅ Slide creado exitosamente:', slide.id);
  return slide;
};

export const updateHeroSlide = async (id: string, slideData: UpdateHeroSlideData) => {
  logger.info(`🔄 Actualizando slide ${id}:`, JSON.stringify(slideData, null, 2));

  const existingSlide = await prisma.heroSlide.findUnique({
    where: { id },
  });

  if (!existingSlide) {
    throw new NotFoundError('Slide no encontrado');
  }

  const updatedSlide = await prisma.heroSlide.update({
    where: { id },
    data: {
      ...slideData,
      updatedAt: new Date(),
    },
  });

  logger.info('✅ Slide actualizado exitosamente:', updatedSlide.id);
  return updatedSlide;
};

export const deleteHeroSlide = async (id: string) => {
  logger.info(`🗑️ Eliminando slide ${id}`);

  const existingSlide = await prisma.heroSlide.findUnique({
    where: { id },
  });

  if (!existingSlide) {
    throw new NotFoundError('Slide no encontrado');
  }

  await prisma.heroSlide.delete({
    where: { id },
  });

  logger.info('✅ Slide eliminado exitosamente:', id);
  return { success: true };
};

export const reorderHeroSlides = async (slideOrders: { id: string; orderIndex: number }[]) => {
  logger.info('🔄 Reordenando slides:', JSON.stringify(slideOrders, null, 2));

  // Actualizar el orden de cada slide
  const updatePromises = slideOrders.map(({ id, orderIndex }) =>
    prisma.heroSlide.update({
      where: { id },
      data: { orderIndex },
    })
  );

  await Promise.all(updatePromises);

  logger.info('✅ Slides reordenados exitosamente');
  return { success: true };
};

export const toggleHeroSlideStatus = async (id: string) => {
  logger.info(`🔄 Cambiando estado del slide ${id}`);

  const existingSlide = await prisma.heroSlide.findUnique({
    where: { id },
  });

  if (!existingSlide) {
    throw new NotFoundError('Slide no encontrado');
  }

  const updatedSlide = await prisma.heroSlide.update({
    where: { id },
    data: {
      isActive: !existingSlide.isActive,
      updatedAt: new Date(),
    },
  });

  logger.info('✅ Estado del slide cambiado exitosamente:', updatedSlide.id);
  return updatedSlide;
};