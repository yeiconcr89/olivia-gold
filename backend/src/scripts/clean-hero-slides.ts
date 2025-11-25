import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanAndRecreateHeroSlides() {
  console.log('🧹 Limpiando y recreando Hero Slides...');

  try {
    // 1. Eliminar todos los slides existentes
    console.log('🗑️  Eliminando todos los slides existentes...');
    await prisma.heroSlide.deleteMany({});

    // 2. Crear los slides oficiales del seed
    const officialSlides = [
      {
        title: 'Nueva Colección Primavera',
        subtitle: 'Descubre nuestra exclusiva línea de joyería',
        description: 'Piezas únicas en oro laminado 18k que destacan tu elegancia natural. Diseños contemporáneos con la calidad de siempre.',
        imageUrl: 'https://images.pexels.com/photos/1639729/pexels-photo-1639729.jpeg?auto=compress&cs=tinysrgb&w=1920',
        ctaText: 'Ver Colección',
        ctaLink: '/productos',
        offerText: 'Hasta 30% OFF',
        isActive: true,
        orderIndex: 1,
      },
      {
        title: 'Envío Gratis en Colombia',
        subtitle: 'En compras superiores a $200.000',
        description: 'Recibe tus joyas favoritas sin costo adicional. Envío seguro y con seguimiento a todo el país.',
        imageUrl: 'https://images.pexels.com/photos/1458691/pexels-photo-1458691.jpeg?auto=compress&cs=tinysrgb&w=1920',
        ctaText: 'Comprar Ahora',
        ctaLink: '/?category=collares',
        offerText: 'Envío Gratis',
        isActive: true,
        orderIndex: 2,
      },
      {
        title: 'Anillos de Compromiso',
        subtitle: 'Momentos únicos merecen joyas especiales',
        description: 'Encuentra el anillo perfecto para esa propuesta inolvidable. Diseños clásicos y modernos en oro laminado de alta calidad.',
        imageUrl: 'https://images.pexels.com/photos/1346086/pexels-photo-1346086.jpeg?auto=compress&cs=tinysrgb&w=1920',
        ctaText: 'Ver Anillos',
        ctaLink: '/?category=anillos',
        offerText: 'Diseños Únicos',
        isActive: true,
        orderIndex: 3,
      },
    ];

    console.log('➕ Creando slides oficiales...');
    for (const slideData of officialSlides) {
      const heroSlide = await prisma.heroSlide.create({
        data: slideData,
      });
      console.log(`  ✅ ${heroSlide.title} (orden: ${heroSlide.orderIndex})`);
    }

    // 3. Verificar resultado final
    const finalSlides = await prisma.heroSlide.findMany({
      orderBy: { orderIndex: 'asc' }
    });

    console.log('\n📋 Hero Slides finales:');
    finalSlides.forEach(slide => {
      console.log(`  ${slide.orderIndex}. ${slide.title} (${slide.isActive ? 'Activo' : 'Inactivo'})`);
    });

    console.log('\n🎉 Limpieza y recreación completada exitosamente');

  } catch (error) {
    console.error('❌ Error al limpiar Hero Slides:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanAndRecreateHeroSlides()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });