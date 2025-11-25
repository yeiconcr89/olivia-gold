import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

// ============================================================================
// TIPOS Y VALIDACIONES
// ============================================================================

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  size?: string;
  customization?: any;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    inStock: boolean;
    inventory?: {
      quantity: number;
      reservedQuantity: number;
    };
  };
  subtotal: number;
}

interface CartSummary {
  id: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  couponCode?: string;
  expiresAt: Date;
}

const addToCartSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(10),
  size: z.string().optional(),
  customization: z.any().optional(),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(10),
  size: z.string().optional(),
  customization: z.any().optional(),
});

const applyCouponSchema = z.object({
  couponCode: z.string().min(1),
});

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

export const getOrCreateCart = async (userId?: string, sessionId?: string, guestEmail?: string) => {
  // Validar que al menos tengamos un identificador
  if (!userId && !sessionId && !guestEmail) {
    logger.error('Intento de crear carrito sin identificadores', { userId, sessionId, guestEmail });
    throw new BadRequestError('Se requiere userId, sessionId o guestEmail para identificar el carrito');
  }
  
  logger.debug('Buscando o creando carrito', { userId, sessionId, guestEmail });

  // Buscar carrito existente
  let cart = await prisma.cart.findFirst({
    where: {
      OR: [
        ...(userId ? [{ userId }] : []),
        ...(sessionId ? [{ sessionId }] : []),
        ...(guestEmail ? [{ guestEmail }] : []),
      ],
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              images: {
                where: { isPrimary: true },
                select: { url: true },
                take: 1,
              },
              inStock: true,
              inventory: {
                select: {
                  quantity: true,
                  reservedQuantity: true,
                },
              },
            },
          },
        },
      }
    },
  });

  // Si no existe, crear uno nuevo
  if (!cart) {
    try {
      cart = await prisma.cart.create({
        data: {
          userId,
          sessionId,
          guestEmail,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: {
                    where: { isPrimary: true },
                    select: { url: true },
                    take: 1,
                  },
                  inStock: true,
                  inventory: {
                    select: {
                      quantity: true,
                      reservedQuantity: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } catch (error) {
      // Manejar error de clave duplicada (cart ya existe)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        // Intentar recuperar el carrito existente (sin filtrar por expiración)
        cart = await prisma.cart.findFirst({
          where: {
            OR: [
              ...(userId ? [{ userId }] : []),
              ...(sessionId ? [{ sessionId }] : []),
              ...(guestEmail ? [{ guestEmail }] : []),
            ],
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    images: {
                      where: { isPrimary: true },
                      select: { url: true },
                      take: 1,
                    },
                    inStock: true,
                    inventory: {
                      select: {
                        quantity: true,
                        reservedQuantity: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        // Si se recupera un carrito expirado, extender su vigencia
        if (cart && cart.expiresAt < new Date()) {
          cart = await prisma.cart.update({
            where: { id: cart.id },
            data: {
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // extiende 7 días
            },
            include: {
              items: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      price: true,
                      images: {
                        where: { isPrimary: true },
                        select: { url: true },
                        take: 1,
                      },
                      inStock: true,
                      inventory: {
                        select: {
                          quantity: true,
                          reservedQuantity: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });
        }
      } else {
        throw error;
      }
    }

    // Asegurar que siempre devolvemos un carrito válido
    if (!cart) {
      logger.error('No se pudo crear o recuperar el carrito', { userId, sessionId, guestEmail });
      throw new Error('No se pudo obtener el carrito');
    }
  }

  return formatCartResponse(cart);
};

export const addToCart = async (
  cartIdentifier: { userId?: string; sessionId?: string; guestEmail?: string },
  itemData: z.infer<typeof addToCartSchema>
) => {
  const validatedData = addToCartSchema.parse(itemData);
  const { productId, quantity, size, customization } = validatedData;
  
  logger.info(`🛒 addToCart llamado - productId: ${productId}, quantity recibida: ${quantity}, size: ${size}`);

  // Verificar que el producto existe y está disponible
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      inventory: true,
    },
  });

  if (!product) {
    throw new NotFoundError('Producto no encontrado');
  }

  if (!product.inStock) {
    throw new BadRequestError('El producto no está disponible');
  }

  // Verificar inventario disponible
  const availableQuantity = (product.inventory?.quantity || 0) - (product.inventory?.reservedQuantity || 0);
  if (availableQuantity < quantity) {
    throw new BadRequestError(`Solo hay ${availableQuantity} unidades disponibles`);
  }

  // Obtener o crear carrito
  const cart = await getOrCreateCart(cartIdentifier.userId, cartIdentifier.sessionId, cartIdentifier.guestEmail);

  // Verificar si el item ya existe en el carrito
  // Normalizar size: undefined, '', y null deben ser todos null para consistencia
  const normalizedSize = size === undefined || size === '' || size === null ? null : size;
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
      size: normalizedSize,
    },
  });

  if (existingItem) {
    // Si el producto ya existe, incrementar por la cantidad solicitada
    const newQuantity = existingItem.quantity + quantity;
    logger.info(`📦 Producto existe en carrito - cantidad actual: ${existingItem.quantity}, cantidad a agregar: ${quantity}, nueva cantidad: ${newQuantity}`);
    
    if (availableQuantity < newQuantity) {
      throw new BadRequestError(`Solo puedes agregar ${availableQuantity - existingItem.quantity} unidades más`);
    }

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { 
        quantity: newQuantity,
        customization: customization || existingItem.customization,
      },
    });
    logger.info(`✅ Producto actualizado en carrito con cantidad: ${newQuantity}`);
  } else {
    // Crear nuevo item con la cantidad solicitada
    logger.info(`🆕 Creando nuevo item en carrito con cantidad: ${quantity}`);
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity: quantity,
        size: normalizedSize, // Usar size normalizado
        customization,
      },
    });
    logger.info(`✅ Nuevo producto agregado al carrito con cantidad: ${quantity}`);
  }

  logger.info(`Item agregado al carrito: ${product.name} x${quantity}`);

  // Retornar carrito actualizado
  return await getCartById(cart.id);
};

export const updateCartItem = async (
  cartItemId: string,
  updateData: z.infer<typeof updateCartItemSchema>
) => {
  const validatedData = updateCartItemSchema.parse(updateData);
  const { quantity } = validatedData;

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: {
      product: {
        include: { inventory: true },
      },
    },
  });

  if (!cartItem) {
    throw new NotFoundError('Item del carrito no encontrado');
  }

  // Si quantity es 0, eliminar item
  if (quantity === 0) {
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });
    
    return await getCartById(cartItem.cartId);
  }

  // Verificar inventario disponible
  const availableQuantity = (cartItem.product.inventory?.quantity || 0) - (cartItem.product.inventory?.reservedQuantity || 0);
  if (availableQuantity < quantity) {
    throw new BadRequestError(`Solo hay ${availableQuantity} unidades disponibles`);
  }

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: validatedData,
  });

  return await getCartById(cartItem.cartId);
};

export const removeFromCart = async (cartItemId: string) => {
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
  });

  if (!cartItem) {
    throw new NotFoundError('Item del carrito no encontrado');
  }

  await prisma.cartItem.delete({
    where: { id: cartItemId },
  });

  return await getCartById(cartItem.cartId);
};

export const clearCart = async (cartId: string) => {
  await prisma.cartItem.deleteMany({
    where: { cartId },
  });

  return await getCartById(cartId);
};

export const applyCoupon = async (cartId: string, couponData: z.infer<typeof applyCouponSchema>) => {
  const { couponCode } = applyCouponSchema.parse(couponData);

  // Buscar y validar cupón
  const coupon = await prisma.coupon.findUnique({
    where: { code: couponCode },
  });

  if (!coupon) {
    throw new NotFoundError('Cupón no válido');
  }

  if (coupon.status !== 'ACTIVE') {
    throw new BadRequestError('El cupón no está activo');
  }

  if (new Date() < coupon.validFrom || new Date() > coupon.validUntil) {
    throw new BadRequestError('El cupón ha expirado');
  }

  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    throw new BadRequestError('El cupón ha alcanzado su límite de uso');
  }

  const cart = await getCartById(cartId);
  
  // Verificar monto mínimo
  if (coupon.minimumAmount && cart.subtotal < Number(coupon.minimumAmount)) {
    throw new BadRequestError(`El monto mínimo para este cupón es $${coupon.minimumAmount}`);
  }

  // Actualizar carrito con el cupón
  await prisma.cart.update({
    where: { id: cartId },
    data: {
      couponId: coupon.id,
      couponCode: coupon.code,
    },
  });

  logger.info(`Cupón aplicado: ${coupon.code} al carrito ${cartId}`);
  
  return { valid: true, coupon };
};

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

const getCartById = async (cartId: string): Promise<CartSummary> => {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              images: {
                where: { isPrimary: true },
                select: { url: true },
                take: 1,
              },
              inStock: true,
              inventory: {
                select: {
                  quantity: true,
                  reservedQuantity: true,
                },
              },
            },
          },
        },
      }
    },
  });

  if (!cart) {
    throw new NotFoundError('Carrito no encontrado');
  }

  return formatCartResponse(cart);
};

const formatCartResponse = (cart: any): CartSummary => {
  const items: CartItem[] = cart.items.map((item: any) => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    size: item.size,
    customization: item.customization,
    product: {
      id: item.product.id,
      name: item.product.name,
      price: Number(item.product.price),
      images: item.product.images.map((img: any) => img.url),
      inStock: item.product.inStock,
      inventory: item.product.inventory ? {
        quantity: item.product.inventory.quantity,
        reservedQuantity: item.product.inventory.reservedQuantity,
      } : undefined,
    },
    subtotal: Number(item.product.price) * item.quantity,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calcular descuento del cupón
  let discountAmount = 0;
  if (cart.coupon && cart.coupon.status === 'ACTIVE') {
    const now = new Date();
    const validCoupon = now >= cart.coupon.validFrom && now <= cart.coupon.validUntil;
    
    if (validCoupon) {
      if (cart.coupon.type === 'PERCENTAGE') {
        discountAmount = subtotal * (Number(cart.coupon.value) / 100);
        if (cart.coupon.maximumDiscount && discountAmount > Number(cart.coupon.maximumDiscount)) {
          discountAmount = Number(cart.coupon.maximumDiscount);
        }
      } else if (cart.coupon.type === 'FIXED') {
        discountAmount = Math.min(Number(cart.coupon.value), subtotal);
      }
    }
  }
  
  // Cálculos básicos
  const taxRate = 0.19; // 19% IVA en Colombia
  const taxAmount = subtotal * taxRate;
  const shippingAmount = (cart.coupon?.type === 'FREE_SHIPPING' || subtotal >= 150000) ? 0 : 15000; // Envío gratis sobre $150k o con cupón
  const total = subtotal + taxAmount + shippingAmount - discountAmount;

  return {
    id: cart.id,
    items,
    itemCount,
    subtotal,
    taxAmount,
    shippingAmount,
    discountAmount,
    total,
    couponCode: cart.couponCode,
    expiresAt: cart.expiresAt,
  };
};

export const cleanupExpiredCarts = async () => {
  const expiredCarts = await prisma.cart.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  logger.info(`Limpieza automática: ${expiredCarts.count} carritos expirados eliminados`);
  return expiredCarts.count;
};