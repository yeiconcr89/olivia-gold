import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixHeroSlides() {
  console.log('🔧 Iniciando corrección de Hero Slides...');

  try {
    // 1. Obtener todos los slides actuales
    const allSlides = await prisma.heroSlide.findMany({
      orderBy: { createdAt: 'asc' }
    });

    console.log(`📊 Encontrados ${allSlides.length} slides en total`);

    // 2. Identificar duplicados por título
    const titleCounts = new Map<string, number>();
    const duplicates: string[] = [];

    allSlides.forEach(slide => {
      const count = titleCounts.get(slide.title) || 0;
      titleCounts.set(slide.title, count + 1);
      if (count > 0) {
        duplicates.push(slide.id);
      }
    });

    // 3. Eliminar duplicados (mantener el más antiguo)
    if (duplicates.length > 0) {
      console.log(`🗑️  Eliminando ${duplicates.length} slides duplicados...`);
      await prisma.heroSlide.deleteMany({
        where: {
          id: { in: duplicates }
        }
      });
    }

    // 4. Obtener slides limpios
    const cleanSlides = await prisma.heroSlide.findMany({
      orderBy: { createdAt: 'asc' }
    });

    // 5. Corregir orderIndex para que sean únicos y secuenciales
    console.log('🔄 Corrigiendo orderIndex de slides...');
    
    for (let i = 0; i < cleanSlides.length; i++) {
      const newOrderIndex = i + 1;
      if (cleanSlides[i].orderIndex !== newOrderIndex) {
        await prisma.heroSlide.update({
          where: { id: cleanSlides[i].id },
          data: { orderIndex: newOrderIndex }
        });
        console.log(`  ✅ ${cleanSlides[i].title}: orderIndex ${cleanSlides[i].orderIndex} → ${newOrderIndex}`);
      }
    }

    // 6. Verificar resultado final
    const finalSlides = await prisma.heroSlide.findMany({
      orderBy: { orderIndex: 'asc' }
    });

    console.log('\n📋 Estado final de Hero Slides:');
    finalSlides.forEach(slide => {
      console.log(`  ${slide.orderIndex}. ${slide.title} (${slide.isActive ? 'Activo' : 'Inactivo'})`);
    });

    console.log('\n🎉 Corrección de Hero Slides completada exitosamente');

  } catch (error) {
    console.error('❌ Error al corregir Hero Slides:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixHeroSlides()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });