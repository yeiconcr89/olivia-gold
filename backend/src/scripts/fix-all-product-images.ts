import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAllProductImages() {
  console.log('🖼️ Actualizando TODAS las imágenes de productos a Cloudinary...');

  try {
    // URLs de Cloudinary disponibles para usar
    const cloudinaryImages = [
      'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752988060/collar_elegante_01_xfmq31.png',
      'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752988060/anillo_clasico_01_o5i8dm.png',
      'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752988060/pulsera_sofisticada_01_mseuda.png',
      'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752988060/aretes_modernos_01_llgxla.png',
      'https://res.cloudinary.com/dflhmlbrz/image/upload/v1753003807/products/olivia_gold-removebg-preview-1753003803496-dbdivus7cct.png',
      'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752999725/products/pulsera_sofisticada_02-1752999721407-fh07i07n3js.png'
    ];

    // Obtener todos los productos
    const allProducts = await prisma.product.findMany({
      include: {
        images: true
      }
    });

    console.log(`📋 Encontrados ${allProducts.length} productos`);

    // Actualizar cada producto
    for (let i = 0; i < allProducts.length; i++) {
      const product = allProducts[i];
      
      // Seleccionar imagen de Cloudinary basada en la categoría
      let selectedImage: string;
      
      switch (product.category) {
        case 'collares':
          selectedImage = cloudinaryImages[0]; // collar
          break;
        case 'anillos':
          selectedImage = cloudinaryImages[1]; // anillo
          break;
        case 'pulseras':
          selectedImage = cloudinaryImages[2]; // pulsera
          break;
        case 'aretes':
          selectedImage = cloudinaryImages[3]; // aretes
          break;
        case 'conjuntos':
          selectedImage = cloudinaryImages[4]; // conjunto
          break;
        case 'relojes':
          selectedImage = cloudinaryImages[5]; // reloj
          break;
        default:
          selectedImage = cloudinaryImages[0]; // default a collar
      }

      console.log(`🔄 Actualizando "${product.name}" (${product.category})`);

      // Eliminar imágenes existentes
      await prisma.productImage.deleteMany({
        where: { productId: product.id }
      });

      // Crear nueva imagen con URL de Cloudinary
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: selectedImage,
          isPrimary: true,
          order: 0,
        },
      });

      console.log(`✅ Actualizado: ${product.name}`);
    }

    console.log('🎉 TODAS las imágenes de productos actualizadas a Cloudinary');
  } catch (error) {
    console.error('❌ Error actualizando imágenes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixAllProductImages()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
