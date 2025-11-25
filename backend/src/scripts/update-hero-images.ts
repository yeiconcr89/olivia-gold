import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateHeroImages() {
  console.log('🖼️ Actualizando imágenes del Hero Slider a Cloudinary...');

  try {
    // URLs de Cloudinary para los hero slides
    const heroImages = [
      'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752988060/collar_elegante_01_xfmq31.png',
      'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752988060/pulsera_sofisticada_01_mseuda.png',
      'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752988060/anillo_clasico_01_o5i8dm.png'
    ];

    // Obtener todos los hero slides
    const heroSlides = await prisma.heroSlide.findMany({
      orderBy: { orderIndex: 'asc' }
    });

    console.log(`📋 Encontrados ${heroSlides.length} hero slides`);

    // Actualizar cada slide con una imagen de Cloudinary
    for (let i = 0; i < heroSlides.length && i < heroImages.length; i++) {
      const slide = heroSlides[i];
      const newImageUrl = heroImages[i];

      console.log(`🔄 Actualizando slide "${slide.title}" con imagen de Cloudinary`);

      await prisma.heroSlide.update({
        where: { id: slide.id },
        data: { imageUrl: newImageUrl }
      });

      console.log(`✅ Actualizado: ${slide.title}`);
    }

    console.log('🎉 Imágenes del Hero Slider actualizadas exitosamente');
  } catch (error) {
    console.error('❌ Error actualizando imágenes del hero:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateHeroImages()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
