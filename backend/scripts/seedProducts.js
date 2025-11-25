import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleProducts = [
  {
    name: "Anillo de Oro 18K con Diamante",
    price: 1250.00,
    originalPrice: 1500.00,
    category: "anillos",
    subcategory: "anillos-de-compromiso",
    description: "Elegante anillo de oro 18K con diamante natural de 0.5ct. Diseño clásico y atemporal.",
    materials: "Oro 18K, Diamante natural 0.5ct",
    dimensions: "Ancho: 2mm, Peso: 3.2g",
    care: "Evitar contacto con productos químicos. Limpiar con paño suave.",
    inStock: true,
    featured: true,
    rating: 4.8,
    reviewCount: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Collar de Plata con Colgante de Corazón",
    price: 85.00,
    category: "collares",
    subcategory: "collares-con-colgante",
    description: "Hermoso collar de plata 925 con colgante de corazón grabado. Perfecto para uso diario.",
    materials: "Plata 925",
    dimensions: "Largo: 45cm, Colgante: 15mm",
    care: "Guardar en lugar seco. Pulir regularmente.",
    inStock: true,
    featured: false,
    rating: 4.5,
    reviewCount: 8,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Pulsera de Oro Rosa con Esmeraldas",
    price: 450.00,
    originalPrice: 520.00,
    category: "pulseras",
    subcategory: "pulseras-de-tenis",
    description: "Exquisita pulsera de oro rosa 14K con esmeraldas naturales. Diseño delicado y femenino.",
    materials: "Oro rosa 14K, Esmeraldas naturales",
    dimensions: "Largo: 18cm, Ancho: 3mm",
    care: "Evitar golpes fuertes. Limpiar profesionalmente.",
    inStock: true,
    featured: true,
    rating: 4.9,
    reviewCount: 12,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Aretes de Plata con Circonitas",
    price: 65.00,
    category: "aretes",
    subcategory: "aretes-de-tornillo",
    description: "Aretes de plata 925 con circonitas brillantes. Cierre de tornillo seguro.",
    materials: "Plata 925, Circonitas",
    dimensions: "Diámetro: 8mm",
    care: "Evitar contacto con agua. Limpiar con paño de plata.",
    inStock: true,
    featured: false,
    rating: 4.3,
    reviewCount: 6,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Conjunto de Oro Blanco con Diamantes",
    price: 2100.00,
    category: "conjuntos",
    subcategory: "conjuntos-de-novia",
    description: "Conjunto completo de collar, aretes y anillo de oro blanco 18K con diamantes. Perfecto para novias.",
    materials: "Oro blanco 18K, Diamantes",
    dimensions: "Collar: 45cm, Aretes: 10mm, Anillo: Talla 12",
    care: "Almacenar en joyero individual. Limpieza profesional recomendada.",
    inStock: true,
    featured: true,
    rating: 5.0,
    reviewCount: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Anillo de Compromiso de Platino",
    price: 3200.00,
    originalPrice: 3800.00,
    category: "anillos",
    subcategory: "anillos-de-compromiso",
    description: "Anillo de compromiso de platino con diamante central de 1ct. Diseño clásico y elegante.",
    materials: "Platino, Diamante 1ct",
    dimensions: "Ancho: 3mm, Peso: 5.8g",
    care: "Servicio de mantenimiento gratuito incluido.",
    inStock: true,
    featured: true,
    rating: 4.9,
    reviewCount: 20,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedProducts() {
  try {
    console.log('🌱 Iniciando seed de productos...');
    
    // Verificar si ya hay productos
    const existingProducts = await prisma.product.count();
    if (existingProducts > 0) {
      console.log(`⚠️  Ya existen ${existingProducts} productos en la base de datos.`);
      console.log('¿Desea continuar y agregar más productos? (s/n)');
      
      // Para desarrollo, simplemente continuamos
      console.log('Continuando con el seed...');
    }

    // Datos de imágenes y tags para cada producto
    const productImages = [
      [
        { url: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500", altText: "Anillo de oro 18K con diamante - Vista 1", isPrimary: true, order: 0 },
        { url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500", altText: "Anillo de oro 18K con diamante - Vista 2", isPrimary: false, order: 1 }
      ],
      [
        { url: "https://images.unsplash.com/photo-1588444650209-aa4d70d217b8?w=500", altText: "Collar de plata con colgante de corazón - Vista 1", isPrimary: true, order: 0 },
        { url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500", altText: "Collar de plata con colgante de corazón - Vista 2", isPrimary: false, order: 1 }
      ],
      [
        { url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500", altText: "Pulsera de oro rosa con esmeraldas - Vista 1", isPrimary: true, order: 0 },
        { url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500", altText: "Pulsera de oro rosa con esmeraldas - Vista 2", isPrimary: false, order: 1 }
      ],
      [
        { url: "https://images.unsplash.com/photo-1576053139628-4d35b61ae935?w=500", altText: "Aretes de plata con circonitas - Vista 1", isPrimary: true, order: 0 },
        { url: "https://images.unsplash.com/photo-1588444650209-aa4d70d217b8?w=500", altText: "Aretes de plata con circonitas - Vista 2", isPrimary: false, order: 1 }
      ],
      [
        { url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500", altText: "Conjunto de oro blanco con diamantes - Vista 1", isPrimary: true, order: 0 },
        { url: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500", altText: "Conjunto de oro blanco con diamantes - Vista 2", isPrimary: false, order: 1 }
      ],
      [
        { url: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500", altText: "Anillo de compromiso de platino - Vista 1", isPrimary: true, order: 0 },
        { url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500", altText: "Anillo de compromiso de platino - Vista 2", isPrimary: false, order: 1 }
      ]
    ];

    const productTags = [
      ["oro", "diamante", "anillo", "compromiso", "elegante"],
      ["plata", "collar", "corazón", "romántico", "diario"],
      ["oro-rosa", "esmeraldas", "pulsera", "elegante", "femenino"],
      ["plata", "circonitas", "aretes", "brillantes", "clásicos"],
      ["oro-blanco", "diamantes", "conjunto", "novia", "elegante"],
      ["platino", "diamante", "anillo", "compromiso", "lujo"]
    ];

    // Crear productos con imágenes y tags
    for (let i = 0; i < sampleProducts.length; i++) {
      const product = sampleProducts[i];
      const images = productImages[i];
      const tags = productTags[i];

      // Crear producto con imágenes y tags
      const createdProduct = await prisma.product.create({
        data: {
          ...product,
          images: {
            create: images
          },
          tags: {
            create: tags.map(tag => ({ tag }))
          }
        }
      });
      console.log(`✅ Producto creado: ${createdProduct.name} (ID: ${createdProduct.id})`);
    }

    console.log(`🎉 Se han creado ${sampleProducts.length} productos exitosamente!`);
    
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed
seedProducts();