import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testOrderCreation() {
  try {
    console.log('🧪 Probando creación de pedido...');
    
    // Obtener un producto existente
    const existingProduct = await prisma.product.findFirst({
      where: { inStock: true },
      include: { inventory: true }
    });
    
    if (!existingProduct) {
      console.error('❌ No hay productos en la base de datos');
      console.log('💡 Ejecuta: npx prisma db seed');
      return;
    }
    
    console.log('✅ Producto encontrado:', {
      id: existingProduct.id,
      name: existingProduct.name,
      price: existingProduct.price,
      stock: existingProduct.inventory?.quantity || 0
    });

    // Calcular valores correctamente
    const subtotal = Number(existingProduct.price);
    const shipping = 15000;
    const tax = Math.round(subtotal * 0.19);
    const total = subtotal + shipping + tax;

    // Datos de prueba con un producto real
    const testOrderData = {
      customerName: 'Juan Pérez Test',
      customerEmail: 'juan.test@email.com',
      customerPhone: '+57 300 123 4567',
      items: [
        {
          productId: existingProduct.id,
          quantity: 1,
          price: existingProduct.price
        }
      ],
      shippingAddress: {
        street: 'Calle 123 #45-67',
        city: 'Bogotá',
        state: 'Cundinamarca',
        zipCode: '110111',
        country: 'Colombia'
      },
      paymentMethod: 'CREDIT_CARD',
      subtotal: subtotal,
      shipping: shipping,
      tax: tax,
      total: total
    };

    console.log('📦 Creando pedido con datos:', JSON.stringify(testOrderData, null, 2));

    // Crear el pedido usando transacción
    const order = await prisma.$transaction(async (tx) => {
      // Crear o encontrar el cliente
      let customer = await tx.customer.findUnique({
        where: { email: testOrderData.customerEmail }
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name: testOrderData.customerName,
            email: testOrderData.customerEmail,
            phone: testOrderData.customerPhone,
            status: 'ACTIVE',
            totalOrders: 0,
            totalSpent: 0,
            wishlistItems: 0,
            preferences: [],
            addresses: {
              create: {
                ...testOrderData.shippingAddress,
                isDefault: true
              }
            }
          }
        });
        console.log('✅ Cliente creado:', customer.id);
      } else {
        console.log('✅ Cliente existente encontrado:', customer.id);
      }

      // Crear el pedido
      const newOrder = await tx.order.create({
        data: {
          customerId: customer.id,
          customerName: testOrderData.customerName,
          customerEmail: testOrderData.customerEmail,
          customerPhone: testOrderData.customerPhone,
          status: 'PENDING',
          subtotal: testOrderData.subtotal,
          shippingAmount: testOrderData.shipping,
          taxAmount: testOrderData.tax,
          total: testOrderData.total,
          paymentMethod: testOrderData.paymentMethod,
          paymentStatus: 'PENDING',
          items: {
            create: testOrderData.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          },
          shippingAddress: {
            create: testOrderData.shippingAddress
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          customer: true
        }
      });

      // Actualizar estadísticas del cliente
      await tx.customer.update({
        where: { id: customer.id },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: testOrderData.total }
        }
      });

      // Actualizar inventario
      for (const item of testOrderData.items) {
        await tx.inventory.updateMany({
          where: { productId: item.productId },
          data: {
            quantity: { decrement: item.quantity }
          }
        });
      }

      return newOrder;
    });

    console.log('🎉 Pedido creado exitosamente!');
    console.log('📋 Detalles del pedido:', {
      id: order.id,
      status: order.status,
      total: order.total,
      customer: order.customer.name,
      items: order.items.map(item => ({
        product: item.product.name,
        quantity: item.quantity,
        price: item.price
      }))
    });

    // Verificar que el pedido se puede consultar
    const savedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true
      }
    });

    if (savedOrder) {
      console.log('✅ Pedido verificado en base de datos');
      console.log('🔍 ID del pedido para buscar en admin:', savedOrder.id);
    } else {
      console.error('❌ Error: No se pudo verificar el pedido en la base de datos');
    }

  } catch (error) {
    console.error('❌ Error creando pedido de prueba:', error);
    
    if (error instanceof Error) {
      console.error('Mensaje:', error.message);
      console.error('Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Función para listar todos los pedidos
async function listAllOrders() {
  try {
    console.log('📋 Listando todos los pedidos...');
    
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Total de pedidos encontrados: ${orders.length}`);
    
    orders.forEach((order, index) => {
      console.log(`\n${index + 1}. Pedido ID: ${order.id}`);
      console.log(`   Cliente: ${order.customer.name} (${order.customer.email})`);
      console.log(`   Estado: ${order.status}`);
      console.log(`   Total: $${order.total.toLocaleString()}`);
      console.log(`   Fecha: ${order.createdAt.toISOString()}`);
      console.log(`   Items: ${order.items.length}`);
      order.items.forEach(item => {
        console.log(`     - ${item.product.name} x${item.quantity} = $${item.total.toLocaleString()}`);
      });
    });

  } catch (error) {
    console.error('❌ Error listando pedidos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar según el argumento
const command = process.argv[2];

if (command === 'list') {
  listAllOrders();
} else {
  testOrderCreation();
}