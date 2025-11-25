import express from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = express.Router();

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const analyticsQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

const exportQuerySchema = z.object({
  type: z.enum(['sales', 'customers', 'products', 'orders']),
  format: z.enum(['json', 'csv']).default('json'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// ============================================================================
// UTILIDADES
// ============================================================================

const getDateRange = (period: string) => {
  const now = new Date();
  const startDate = new Date();

  switch (period) {
    case 'day':
      startDate.setDate(now.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }

  return { startDate, endDate: now };
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
};

// ============================================================================
// RUTAS PRIVADAS (ADMIN/MANAGER)
// ============================================================================

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Obtener métricas principales del dashboard
 * @access  Private (Admin/Manager)
 */
router.get('/dashboard',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validateQuery(analyticsQuerySchema),
  async (req: AuthRequest, res) => {
    try {
      const { startDate: queryStartDate, endDate: queryEndDate, period } = req.query as any;
      
      const { startDate, endDate } = queryStartDate && queryEndDate 
        ? { startDate: new Date(queryStartDate), endDate: new Date(queryEndDate) }
        : getDateRange(period);

      // Obtener métricas principales
      const [
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        averageOrderValue,
        conversionRate,
        topProducts,
        recentOrders,
        customerGrowth,
        revenueGrowth,
      ] = await Promise.all([
        // Ingresos totales
        prisma.order.aggregate({
          where: {
            paymentStatus: 'PAID',
            orderDate: { gte: startDate, lte: endDate },
          },
          _sum: { total: true },
        }),
        
        // Total de pedidos
        prisma.order.count({
          where: {
            orderDate: { gte: startDate, lte: endDate },
          },
        }),
        
        // Total de clientes
        prisma.customer.count({
          where: {
            registrationDate: { gte: startDate, lte: endDate },
          },
        }),
        
        // Total de productos
        prisma.product.count(),
        
        // Valor promedio de pedido
        prisma.order.aggregate({
          where: {
            paymentStatus: 'PAID',
            orderDate: { gte: startDate, lte: endDate },
          },
          _avg: { total: true },
        }),
        
        // Tasa de conversión (simulada)
        Promise.resolve(0.035), // 3.5% tasa de conversión promedio
        
        // Productos más vendidos
        prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            order: {
              orderDate: { gte: startDate, lte: endDate },
              paymentStatus: 'PAID',
            },
          },
          _sum: { quantity: true },
          _count: { productId: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5,
        }).then(async (items) => {
          const productsWithDetails = await Promise.all(
            items.map(async (item) => {
              const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: { id: true, name: true, price: true, images: true },
              });
              return {
                product,
                totalSold: item._sum.quantity || 0,
                totalOrders: item._count.productId,
                revenue: Number(product?.price || 0) * (item._sum.quantity || 0),
              };
            })
          );
          return productsWithDetails;
        }),
        
        // Pedidos recientes
        prisma.order.findMany({
          where: {
            orderDate: { gte: startDate, lte: endDate },
          },
          orderBy: { orderDate: 'desc' },
          take: 10,
          select: {
            id: true,
            customerName: true,
            total: true,
            status: true,
            orderDate: true,
          },
        }),
        
        // Crecimiento de clientes
        prisma.customer.count({
          where: {
            registrationDate: { 
              gte: new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
              lt: startDate,
            },
          },
        }).then(previousCount => {
          const currentCount = totalCustomers;
          const growth = previousCount > 0 
            ? ((currentCount - previousCount) / previousCount) * 100 
            : 0;
          return { current: currentCount, previous: previousCount, growth };
        }),
        
        // Crecimiento de ingresos
        prisma.order.aggregate({
          where: {
            paymentStatus: 'PAID',
            orderDate: { 
              gte: new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
              lt: startDate,
            },
          },
          _sum: { total: true },
        }).then(previousRevenue => {
          const currentRevenue = Number(totalRevenue._sum.total || 0);
          const previousRevenueAmount = Number(previousRevenue._sum.total || 0);
          const growth = previousRevenueAmount > 0 
            ? ((currentRevenue - previousRevenueAmount) / previousRevenueAmount) * 100 
            : 0;
          return { current: currentRevenue, previous: previousRevenueAmount, growth };
        }),
      ]);

      res.json({
        period: {
          startDate,
          endDate,
          period,
        },
        metrics: {
          revenue: {
            total: Number(totalRevenue._sum.total || 0),
            formatted: formatCurrency(Number(totalRevenue._sum.total || 0)),
            growth: revenueGrowth.growth,
          },
          orders: {
            total: totalOrders,
            growth: 0, // Se puede calcular similar a revenue
          },
          customers: {
            total: totalCustomers,
            growth: customerGrowth.growth,
          },
          products: {
            total: totalProducts,
          },
          averageOrderValue: {
            amount: Number(averageOrderValue._avg.total || 0),
            formatted: formatCurrency(Number(averageOrderValue._avg.total || 0)),
          },
          conversionRate: {
            rate: conversionRate,
            formatted: `${(conversionRate * 100).toFixed(2)}%`,
          },
        },
        topProducts: topProducts.map(item => ({
          ...item,
          revenue: formatCurrency(item.revenue),
        })),
        recentOrders: recentOrders.map(order => ({
          ...order,
          total: Number(order.total),
          totalFormatted: formatCurrency(Number(order.total)),
        })),
      });
    } catch (error) {
      logger.error('Error obteniendo analytics del dashboard:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
      });
    }
  }
);

/**
 * @route   GET /api/analytics/sales
 * @desc    Obtener análisis de ventas
 * @access  Private (Admin/Manager)
 */
router.get('/sales',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validateQuery(analyticsQuerySchema),
  async (req: AuthRequest, res) => {
    try {
      const { startDate: queryStartDate, endDate: queryEndDate, period, groupBy } = req.query as any;
      
      const { startDate, endDate } = queryStartDate && queryEndDate 
        ? { startDate: new Date(queryStartDate), endDate: new Date(queryEndDate) }
        : getDateRange(period);

      // Ventas por período
      const salesByPeriod = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC(${groupBy}, "orderDate") as period,
          COUNT(*) as orders,
          SUM("total") as revenue,
          AVG("total") as average_order_value
        FROM "orders" 
        WHERE "orderDate" >= ${startDate} 
          AND "orderDate" <= ${endDate}
          AND "paymentStatus" = 'PAID'
        GROUP BY DATE_TRUNC(${groupBy}, "orderDate")
        ORDER BY period ASC
      `;

      // Ventas por categoría
      const salesByCategory = await prisma.$queryRaw`
        SELECT 
          p.category,
          COUNT(oi.*) as orders,
          SUM(oi.quantity) as units_sold,
          SUM(oi.quantity * oi.price) as revenue
        FROM "order_items" oi
        JOIN "products" p ON oi."productId" = p.id
        JOIN "orders" o ON oi."orderId" = o.id
        WHERE o."orderDate" >= ${startDate} 
          AND o."orderDate" <= ${endDate}
          AND o."paymentStatus" = 'PAID'
        GROUP BY p.category
        ORDER BY revenue DESC
      `;

      // Ventas por método de pago
      const salesByPaymentMethod = await prisma.order.groupBy({
        by: ['paymentMethod'],
        where: {
          orderDate: { gte: startDate, lte: endDate },
          paymentStatus: 'PAID',
        },
        _count: { id: true },
        _sum: { total: true },
        orderBy: { _sum: { total: 'desc' } },
      });

      // Estados de pedidos
      const ordersByStatus = await prisma.order.groupBy({
        by: ['status'],
        where: {
          orderDate: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
      });

      res.json({
        period: { startDate, endDate, groupBy },
        salesByPeriod: (salesByPeriod as any[]).map(item => ({
          period: item.period,
          orders: Number(item.orders),
          revenue: Number(item.revenue),
          revenueFormatted: formatCurrency(Number(item.revenue)),
          averageOrderValue: Number(item.average_order_value),
          averageOrderValueFormatted: formatCurrency(Number(item.average_order_value)),
        })),
        salesByCategory: (salesByCategory as any[]).map(item => ({
          category: item.category,
          orders: Number(item.orders),
          unitsSold: Number(item.units_sold),
          revenue: Number(item.revenue),
          revenueFormatted: formatCurrency(Number(item.revenue)),
        })),
        salesByPaymentMethod: salesByPaymentMethod.map(item => ({
          paymentMethod: item.paymentMethod,
          orders: item._count.id,
          revenue: Number(item._sum.total || 0),
          revenueFormatted: formatCurrency(Number(item._sum.total || 0)),
        })),
        ordersByStatus: ordersByStatus.map(item => ({
          status: item.status,
          count: item._count.id,
        })),
      });
    } catch (error) {
      logger.error('Error obteniendo analytics de ventas:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
      });
    }
  }
);

/**
 * @route   GET /api/analytics/customers
 * @desc    Obtener análisis de clientes
 * @access  Private (Admin/Manager)
 */
router.get('/customers',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validateQuery(analyticsQuerySchema),
  async (req: AuthRequest, res) => {
    try {
      const { startDate: queryStartDate, endDate: queryEndDate, period } = req.query as any;
      
      const { startDate, endDate } = queryStartDate && queryEndDate 
        ? { startDate: new Date(queryStartDate), endDate: new Date(queryEndDate) }
        : getDateRange(period);

      // Nuevos clientes por período
      const newCustomers = await prisma.customer.count({
        where: {
          registrationDate: { gte: startDate, lte: endDate },
        },
      });

      // Clientes por estado
      const customersByStatus = await prisma.customer.groupBy({
        by: ['status'],
        _count: { id: true },
      });

      // Top clientes por gasto
      const topCustomers = await prisma.customer.findMany({
        orderBy: { totalSpent: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          totalSpent: true,
          totalOrders: true,
          status: true,
          registrationDate: true,
        },
      });

      // Distribución de clientes por total gastado
      const customerSpendingDistribution = await prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN "totalSpent" = 0 THEN 'Sin compras'
            WHEN "totalSpent" < 100000 THEN 'Menos de $100k'
            WHEN "totalSpent" < 500000 THEN '$100k - $500k'
            WHEN "totalSpent" < 1000000 THEN '$500k - $1M'
            ELSE 'Más de $1M'
          END as spending_range,
          COUNT(*) as customer_count
        FROM "customers"
        GROUP BY spending_range
        ORDER BY 
          CASE spending_range
            WHEN 'Sin compras' THEN 1
            WHEN 'Menos de $100k' THEN 2
            WHEN '$100k - $500k' THEN 3
            WHEN '$500k - $1M' THEN 4
            WHEN 'Más de $1M' THEN 5
          END
      `;

      // Retención de clientes (clientes que han hecho más de una compra)
      const customerRetention = await prisma.customer.count({
        where: { totalOrders: { gt: 1 } },
      });

      const totalCustomersWithOrders = await prisma.customer.count({
        where: { totalOrders: { gt: 0 } },
      });

      const retentionRate = totalCustomersWithOrders > 0 
        ? (customerRetention / totalCustomersWithOrders) * 100 
        : 0;

      res.json({
        period: { startDate, endDate },
        metrics: {
          newCustomers,
          totalCustomers: await prisma.customer.count(),
          retentionRate: {
            rate: retentionRate,
            formatted: `${retentionRate.toFixed(2)}%`,
          },
        },
        customersByStatus: customersByStatus.map(item => ({
          status: item.status,
          count: item._count.id,
        })),
        topCustomers: topCustomers.map(customer => ({
          ...customer,
          totalSpent: Number(customer.totalSpent),
          totalSpentFormatted: formatCurrency(Number(customer.totalSpent)),
        })),
        spendingDistribution: (customerSpendingDistribution as any[]).map(item => ({
          range: item.spending_range,
          count: Number(item.customer_count),
        })),
      });
    } catch (error) {
      logger.error('Error obteniendo analytics de clientes:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
      });
    }
  }
);

/**
 * @route   GET /api/analytics/products
 * @desc    Obtener análisis de productos
 * @access  Private (Admin/Manager)
 */
router.get('/products',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validateQuery(analyticsQuerySchema),
  async (req: AuthRequest, res) => {
    try {
      const { startDate: queryStartDate, endDate: queryEndDate, period } = req.query as any;
      
      const { startDate, endDate } = queryStartDate && queryEndDate 
        ? { startDate: new Date(queryStartDate), endDate: new Date(queryEndDate) }
        : getDateRange(period);

      // Productos más vendidos
      const topSellingProducts = await prisma.$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.category,
          p.price,
          p.images,
          SUM(oi.quantity) as total_sold,
          COUNT(DISTINCT oi."orderId") as order_count,
          SUM(oi.quantity * oi.price) as revenue
        FROM "products" p
        JOIN "order_items" oi ON p.id = oi."productId"
        JOIN "orders" o ON oi."orderId" = o.id
        WHERE o."orderDate" >= ${startDate} 
          AND o."orderDate" <= ${endDate}
          AND o."paymentStatus" = 'PAID'
        GROUP BY p.id, p.name, p.category, p.price, p.images
        ORDER BY total_sold DESC
        LIMIT 10
      `;

      // Productos con mejor rating
      const topRatedProducts = await prisma.product.findMany({
        where: { reviewCount: { gt: 0 } },
        orderBy: [
          { rating: 'desc' },
          { reviewCount: 'desc' },
        ],
        take: 10,
        select: {
          id: true,
          name: true,
          category: true,
          rating: true,
          reviewCount: true,
          price: true,
          images: true,
        },
      });

      // Productos sin ventas
      const productsWithoutSales = await prisma.product.count({
        where: {
          orderItems: {
            none: {
              order: {
                orderDate: { gte: startDate, lte: endDate },
                paymentStatus: 'PAID',
              },
            },
          },
        },
      });

      // Análisis de inventario
      const inventoryAnalysis = await prisma.$queryRaw`
        SELECT 
          p.category,
          COUNT(*) as total_products,
          SUM(CASE WHEN i.quantity > 0 THEN 1 ELSE 0 END) as in_stock,
          SUM(CASE WHEN i.quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
          SUM(CASE WHEN i.quantity <= 10 AND i.quantity > 0 THEN 1 ELSE 0 END) as low_stock
        FROM "products" p
        LEFT JOIN "inventory" i ON p.id = i."productId"
        GROUP BY p.category
        ORDER BY total_products DESC
      `;

      // Rendimiento por categoría
      const categoryPerformance = await prisma.$queryRaw`
        SELECT 
          p.category,
          COUNT(DISTINCT p.id) as product_count,
          SUM(oi.quantity) as units_sold,
          SUM(oi.quantity * oi.price) as revenue,
          AVG(p.rating) as avg_rating,
          SUM(p."reviewCount") as total_reviews
        FROM "products" p
        LEFT JOIN "order_items" oi ON p.id = oi."productId"
        LEFT JOIN "orders" o ON oi."orderId" = o.id AND o."orderDate" >= ${startDate} AND o."orderDate" <= ${endDate} AND o."paymentStatus" = 'PAID'
        GROUP BY p.category
        ORDER BY revenue DESC NULLS LAST
      `;

      res.json({
        period: { startDate, endDate },
        topSellingProducts: (topSellingProducts as any[]).map(product => ({
          id: product.id,
          name: product.name,
          category: product.category,
          price: Number(product.price),
          priceFormatted: formatCurrency(Number(product.price)),
          images: product.images,
          totalSold: Number(product.total_sold),
          orderCount: Number(product.order_count),
          revenue: Number(product.revenue),
          revenueFormatted: formatCurrency(Number(product.revenue)),
        })),
        topRatedProducts: topRatedProducts.map(product => ({
          ...product,
          price: Number(product.price),
          priceFormatted: formatCurrency(Number(product.price)),
          rating: Number(product.rating),
        })),
        metrics: {
          totalProducts: await prisma.product.count(),
          productsWithoutSales,
          averageRating: await prisma.product.aggregate({
            _avg: { rating: true },
          }).then(result => Number(result._avg.rating || 0)),
        },
        inventoryAnalysis: (inventoryAnalysis as any[]).map(item => ({
          category: item.category,
          totalProducts: Number(item.total_products),
          inStock: Number(item.in_stock),
          outOfStock: Number(item.out_of_stock),
          lowStock: Number(item.low_stock),
        })),
        categoryPerformance: (categoryPerformance as any[]).map(item => ({
          category: item.category,
          productCount: Number(item.product_count),
          unitsSold: Number(item.units_sold || 0),
          revenue: Number(item.revenue || 0),
          revenueFormatted: formatCurrency(Number(item.revenue || 0)),
          avgRating: Number(item.avg_rating || 0),
          totalReviews: Number(item.total_reviews || 0),
        })),
      });
    } catch (error) {
      logger.error('Error obteniendo analytics de productos:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
      });
    }
  }
);

/**
 * @route   GET /api/analytics/export
 * @desc    Exportar datos de analytics
 * @access  Private (Admin)
 */
router.get('/export',
  authenticate,
  authorize(['ADMIN']),
  validateQuery(exportQuerySchema),
  async (req: AuthRequest, res) => {
    try {
      const { type, format, startDate: queryStartDate, endDate: queryEndDate } = req.query as any;
      
      const { startDate, endDate } = queryStartDate && queryEndDate 
        ? { startDate: new Date(queryStartDate), endDate: new Date(queryEndDate) }
        : getDateRange('month');

      let data: any[] = [];

      switch (type) {
        case 'sales':
          data = await prisma.order.findMany({
            where: {
              orderDate: { gte: startDate, lte: endDate },
              paymentStatus: 'PAID',
            },
            select: {
              id: true,
              customerName: true,
              customerEmail: true,
              total: true,
              status: true,
              paymentMethod: true,
              orderDate: true,
            },
          });
          break;

        case 'customers':
          data = await prisma.customer.findMany({
            where: {
              registrationDate: { gte: startDate, lte: endDate },
            },
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
              totalOrders: true,
              totalSpent: true,
              registrationDate: true,
            },
          });
          break;

        case 'products':
          data = await prisma.product.findMany({
            select: {
              id: true,
              name: true,
              category: true,
              subcategory: true,
              price: true,
              inStock: true,
              rating: true,
              reviewCount: true,
              createdAt: true,
            },
          });
          break;

        case 'orders':
          data = await prisma.order.findMany({
            where: {
              orderDate: { gte: startDate, lte: endDate },
            },
            include: {
              items: {
                include: {
                  product: {
                    select: { name: true, category: true },
                  },
                },
              },
            },
          });
          break;
      }

      // Formatear datos para exportación
      const formattedData = data.map(item => {
        if (typeof item.total === 'object' && item.total !== null) {
          item.total = Number(item.total);
        }
        if (typeof item.totalSpent === 'object' && item.totalSpent !== null) {
          item.totalSpent = Number(item.totalSpent);
        }
        if (typeof item.price === 'object' && item.price !== null) {
          item.price = Number(item.price);
        }
        return item;
      });

      logger.info(`Datos exportados: ${type} (${format}) por usuario ${req.user!.id}`);

      if (format === 'csv') {
        // Convertir a CSV (implementación básica)
        const headers = Object.keys(formattedData[0] || {});
        const csvContent = [
          headers.join(','),
          ...formattedData.map(row => 
            headers.map(header => JSON.stringify(row[header] || '')).join(',')
          )
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-export-${Date.now()}.csv"`);
        res.send(csvContent);
      } else {
        res.json({
          type,
          period: { startDate, endDate },
          exportedAt: new Date().toISOString(),
          count: formattedData.length,
          data: formattedData,
        });
      }
    } catch (error) {
      logger.error('Error exportando datos de analytics:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
      });
    }
  }
);

export default router;