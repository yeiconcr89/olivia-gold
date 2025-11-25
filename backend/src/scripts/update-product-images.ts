import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateProductImages() {
  console.log('🖼️ Actualizando imágenes de productos a Cloudinary...');

  try {
    // Mapeo de productos a sus nuevas URLs de Cloudinary
    const productImages = {
      'Collar Veneciano Premium': [
        'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752988060/collar_elegante_01_xfmq31.png',
        'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752999725/products/pulsera_sofisticada_02-1752999721407-fh07i07n3js.png'
      ],
      'Anillo Solitario Diamante': [
        'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752988060/anillo_clasico_01_o5i8dm.png',
        'https://res.cloudinary.com/dflhmlbrz/image/upload/v1753003807/products/olivia_gold-removebg-preview-1753003803496-dbdivus7cct.png'
      ],
      'Pulsera Tenis Brillante': [
        'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752988060/pulsera_sofisticada_01_mseuda.png'
      ],
      'Aretes Perla Clásicos': [
        'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752988060/aretes_modernos_01_llgxla.png'
      ],
      'Conjunto Romántico Corazón': [
        'https://res.cloudinary.com/dflhmlbrz/image/upload/v1752988060/collar_elegante_01_xfmq31.png'
      ],
      'Reloj Elegante Dorado': [
        'https://res.cloudinary.com/dflhmlbrz/image/upload/v1753003807/products/olivia_gold-removebg-preview-1753003803496-dbdivus7cct.png'
      ]
    };

    for (const [productName, newImages] of Object.entries(productImages)) {
      console.log(`🔄 Actualizando: ${productName}`);
      
      const product = await prisma.product.findFirst({
        where: { name: productName }
      });

      if (!product) {
        console.log(`⚠️  Producto no encontrado: ${productName}`);
        continue;
      }

      // Eliminar imágenes existentes
      await prisma.productImage.deleteMany({
        where: { productId: product.id }
      });

      // Crear nuevas imágenes
      for (let i = 0; i < newImages.length; i++) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: newImages[i],
            isPrimary: i === 0,
            order: i,
          },
        });
      }

      console.log(`✅ Actualizado: ${productName} con ${newImages.length} imágenes`);
    }

    console.log('🎉 Imágenes de productos actualizadas exitosamente');
  } catch (error) {
    console.error('❌ Error actualizando imágenes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateProductImages()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
