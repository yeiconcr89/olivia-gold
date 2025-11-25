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

const reportQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  format: z.enum(['json', 'summary']).default('json'),
});

// ============================================================================
// UTILIDADES
// ============================================================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
};

const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// ============================================================================
// RUTAS PRIVADAS (ADMIN/MANAGER)
// ============================================================================

/**
 * @route   GET /api/reports/sales
 * @desc    Reporte completo de ventas
 * @access  Private (Admin/Manager)
 */
router.get('/sales',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validateQuery(reportQuerySchema),
  async (req: AuthRequest, res) => {
    try {
      const { startDate, endDate, format } = req.query as any;
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Período anterior para comparación
      const periodDuration = end.getTime() - start.getTime();
      const previousStart = new Date(start.getTime() - periodDuration);
      const previousEnd = new Date(start.getTime());

      // Métricas principales
      const [currentMetrics, previousMetrics] = await Promise.all([
        // Período actual
        Promise.all([
          prisma.order.aggregate({
            where: {
              orderDate: { gte: start, lte: end },
              paymentStatus: 'PAID',
            },
            _sum: { total: true },
            _count: { id: true },
            _avg: { total: true },
          }),
          prisma.order.count({
            where: { orderDate: { gte: start, lte: end } },
          }),
          prisma.customer.count({
            where: { registrationDate: { gte: start, lte: end } },
          }),
        ]),
        // Período anterior
        Promise.all([
          prisma.order.aggregate({
            where: {
              orderDate: { gte: previousStart, lte: previousEnd },
              paymentStatus: 'PAID',
            },
            _sum: { total: true },
            _count: { id: true },
            _avg: { total: true },
          }),
          prisma.order.count({
            where: { orderDate: { gte: previousStart, lte: previousEnd } },
          }),
          prisma.customer.count({
            where: { registrationDate: { gte: previousStart, lte: previousEnd } },
          }),
        ]),
      ]);

      const [currentSales, currentTotalOrders, currentNewCustomers] = currentMetrics;
      const [previousSales, previousTotalOrders, previousNewCustomers] = previousMetrics;

      // Ventas por día
      const dailySales = await prisma.$queryRaw`
        SELECT 
          DATE("orderDate") as date,
          COUNT(*) as orders,
          SUM("total") as revenue,
          AVG("total") as avg_order_value
        FROM "orders" 
        WHERE "orderDate" >= ${start} 
          AND "orderDate" <= ${end}
          AND "paymentStatus" = 'PAID'
        GROUP BY DATE("orderDate")
        ORDER BY date ASC
      `;

      // Ventas por categoría
      const salesByCategory = await prisma.$queryRaw`
        SELECT 
          p.category,
          COUNT(DISTINCT o.id) as orders,
          SUM(oi.quantity) as units_sold,
          SUM(oi.quantity * oi.price) as revenue,
          AVG(oi.price) as avg_price
        FROM "order_items" oi
        JOIN "products" p ON oi."productId" = p.id
        JOIN "orders" o ON oi."orderId" = o.id
        WHERE o."orderDate" >= ${start} 
          AND o."orderDate" <= ${end}
          AND o."paymentStatus" = 'PAID'
        GROUP BY p.category
        ORDER BY revenue DESC
      `;

      // Top productos
      const topProducts = await prisma.$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.category,
          p.price,
          SUM(oi.quantity) as units_sold,
          COUNT(DISTINCT oi."orderId") as orders,
          SUM(oi.quantity * oi.price) as revenue
        FROM "order_items" oi
        JOIN "products" p ON oi."productId" = p.id
        JOIN "orders" o ON oi."orderId" = o.id
        WHERE o."orderDate" >= ${start} 
          AND o."orderDate" <= ${end}
          AND o."paymentStatus" = 'PAID'
        GROUP BY p.id, p.name, p.category, p.price
        ORDER BY revenue DESC
        LIMIT 10
      `;

      // Métodos de pago
      const paymentMethods = await prisma.order.groupBy({
        by: ['paymentMethod'],
        where: {
          orderDate: { gte: start, lte: end },
          paymentStatus: 'PAID',
        },
        _count: { id: true },
        _sum: { total: true },
        orderBy: { _sum: { total: 'desc' } },
      });

      // Estados de pedidos
      const orderStatuses = await prisma.order.groupBy({
        by: ['status'],
        where: {
          orderDate: { gte: start, lte: end },
        },
        _count: { id: true },
      });

      const report = {
        period: {
          startDate: start,
          endDate: end,
          days: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
        },
        summary: {
          revenue: {
            current: Number(currentSales._sum.total || 0),
            previous: Number(previousSales._sum.total || 0),
            growth: calculateGrowth(
              Number(currentSales._sum.total || 0),
              Number(previousSales._sum.total || 0)
            ),
            formatted: formatCurrency(Number(currentSales._sum.total || 0)),
          },
          orders: {
            current: currentTotalOrders,
            previous: previousTotalOrders,
            growth: calculateGrowth(currentTotalOrders, previousTotalOrders),
            paid: currentSales._count.id,
          },
          averageOrderValue: {
            current: Number(currentSales._avg.total || 0),
            previous: Number(previousSales._avg.total || 0),
            growth: calculateGrowth(
              Number(currentSales._avg.total || 0),
              Number(previousSales._avg.total || 0)
            ),
            formatted: formatCurrency(Number(currentSales._avg.total || 0)),
          },
          newCustomers: {
            current: currentNewCustomers,
            previous: previousNewCustomers,
            growth: calculateGrowth(currentNewCustomers, previousNewCustomers),
          },
        },
        dailySales: (dailySales as any[]).map(day => ({
          date: day.date,
          orders: Number(day.orders),
          revenue: Number(day.revenue),
          revenueFormatted: formatCurrency(Number(day.revenue)),
          avgOrderValue: Number(day.avg_order_value),
          avgOrderValueFormatted: formatCurrency(Number(day.avg_order_value)),
        })),
        salesByCategory: (salesByCategory as any[]).map(category => ({
          category: category.category,
          orders: Number(category.orders),
          unitsSold: Number(category.units_sold),
          revenue: Number(category.revenue),
          revenueFormatted: formatCurrency(Number(category.revenue)),
          avgPrice: Number(category.avg_price),
          avgPriceFormatted: formatCurrency(Number(category.avg_price)),
        })),
        topProducts: (topProducts as any[]).map(product => ({
          id: product.id,
          name: product.name,
          category: product.category,
          price: Number(product.price),
          priceFormatted: formatCurrency(Number(product.price)),
          unitsSold: Number(product.units_sold),
          orders: Number(product.orders),
          revenue: Number(product.revenue),
          revenueFormatted: formatCurrency(Number(product.revenue)),
        })),
        paymentMethods: paymentMethods.map(method => ({
          method: method.paymentMethod,
          orders: method._count.id,
          revenue: Number(method._sum.total || 0),
          revenueFormatted: formatCurrency(Number(method._sum.total || 0)),
          percentage: ((method._count.id / currentSales._count.id) * 100).toFixed(2),
        })),
        orderStatuses: orderStatuses.map(status => ({
          status: status.status,
          count: status._count.id,
          percentage: ((status._count.id / currentTotalOrders) * 100).toFixed(2),
        })),
        generatedAt: new Date().toISOString(),
        generatedBy: req.user!.email,
      };

      if (format === 'summary') {
        res.json({
          period: report.period,
          summary: report.summary,
          generatedAt: report.generatedAt,
        });
      } else {
        res.json(report);
      }

      logger.info(`Reporte de ventas generado por usuario ${req.user!.id}`);
    } catch (error) {
      logger.error('Error generando reporte de ventas:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
      });
    }
  }
);

/**
 * @route   GET /api/reports/inventory
 * @desc    Reporte de inventario
 * @access  Private (Admin/Manager)
 */
router.get('/inventory',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req: AuthRequest, res) => {
    try {
      // Resumen de inventario
      const inventorySummary = await prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_products,
          SUM(CASE WHEN i.quantity > 10 THEN 1 ELSE 0 END) as well_stocked,
          SUM(CASE WHEN i.quantity <= 10 AND i.quantity > 0 THEN 1 ELSE 0 END) as low_stock,
          SUM(CASE WHEN i.quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
          SUM(i.quantity) as total_units,
          SUM(i.quantity * p.price) as total_value
        FROM "products" p
        LEFT JOIN "inventory" i ON p.id = i."productId"
      `;

      // Inventario por categoría
      const inventoryByCategory = await prisma.$queryRaw`
        SELECT 
          p.category,
          COUNT(*) as product_count,
          SUM(COALESCE(i.quantity, 0)) as total_units,
          SUM(COALESCE(i.quantity, 0) * p.price) as total_value,
          AVG(COALESCE(i.quantity, 0)) as avg_stock,
          SUM(CASE WHEN COALESCE(i.quantity, 0) = 0 THEN 1 ELSE 0 END) as out_of_stock_count
        FROM "products" p
        LEFT JOIN "inventory" i ON p.id = i."productId"
        GROUP BY p.category
        ORDER BY total_value DESC
      `;

      // Productos con stock bajo
      const lowStockProducts = await prisma.product.findMany({
        where: {
          inventory: {
            quantity: { lte: 10, gt: 0 },
          },
        },
        include: {
          inventory: true,
        },
        orderBy: {
          inventory: { quantity: 'asc' },
        },
        take: 20,
      });

      // Productos agotados
      const outOfStockProducts = await prisma.product.findMany({
        where: {
          inventory: {
            quantity: 0,
          },
        },
        include: {
          inventory: true,
        },
        orderBy: { name: 'asc' },
        take: 20,
      });

      // Movimientos recientes
      const recentMovements = await prisma.inventoryMovement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      });

      // Productos más vendidos (últimos 30 días)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const fastMovingProducts = await prisma.$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.category,
          COALESCE(i.quantity, 0) as current_stock,
          SUM(oi.quantity) as sold_last_30_days,
          CASE 
            WHEN COALESCE(i.quantity, 0) = 0 THEN 0
            ELSE SUM(oi.quantity) / COALESCE(i.quantity, 1)
          END as turnover_ratio
        FROM "products" p
        LEFT JOIN "inventory" i ON p.id = i."productId"
        LEFT JOIN "order_items" oi ON p.id = oi."productId"
        LEFT JOIN "orders" o ON oi."orderId" = o.id 
          AND o."orderDate" >= ${thirtyDaysAgo}
          AND o."paymentStatus" = 'PAID'
        GROUP BY p.id, p.name, p.category, i.quantity
        HAVING SUM(oi.quantity) > 0
        ORDER BY sold_last_30_days DESC
        LIMIT 20
      `;

      const summary = inventorySummary as any[];
      const summaryData = summary[0];

      const report = {
        summary: {
          totalProducts: Number(summaryData.total_products),
          wellStocked: Number(summaryData.well_stocked),
          lowStock: Number(summaryData.low_stock),
          outOfStock: Number(summaryData.out_of_stock),
          totalUnits: Number(summaryData.total_units),
          totalValue: Number(summaryData.total_value),
          totalValueFormatted: formatCurrency(Number(summaryData.total_value)),
        },
        inventoryByCategory: (inventoryByCategory as any[]).map(category => ({
          category: category.category,
          productCount: Number(category.product_count),
          totalUnits: Number(category.total_units),
          totalValue: Number(category.total_value),
          totalValueFormatted: formatCurrency(Number(category.total_value)),
          avgStock: Number(category.avg_stock).toFixed(1),
          outOfStockCount: Number(category.out_of_stock_count),
        })),
        lowStockProducts: lowStockProducts.map(product => ({
          id: product.id,
          name: product.name,
          category: product.category,
          currentStock: product.inventory?.quantity || 0,
          price: Number(product.price),
          priceFormatted: formatCurrency(Number(product.price)),
        })),
        outOfStockProducts: outOfStockProducts.map(product => ({
          id: product.id,
          name: product.name,
          category: product.category,
          price: Number(product.price),
          priceFormatted: formatCurrency(Number(product.price)),
        })),
        fastMovingProducts: (fastMovingProducts as any[]).map(product => ({
          id: product.id,
          name: product.name,
          category: product.category,
          currentStock: Number(product.current_stock),
          soldLast30Days: Number(product.sold_last_30_days),
          turnoverRatio: Number(product.turnover_ratio).toFixed(2),
        })),
        recentMovements: recentMovements.map(movement => ({
          id: movement.id,
          type: movement.type,
          quantity: movement.quantity,
          reason: movement.reason,
          createdAt: movement.createdAt,
          product: movement.product,
        })),
        generatedAt: new Date().toISOString(),
        generatedBy: req.user!.email,
      };

      res.json(report);

      logger.info(`Reporte de inventario generado por usuario ${req.user!.id}`);
    } catch (error) {
      logger.error('Error generando reporte de inventario:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
      });
    }
  }
);

/**
 * @route   GET /api/reports/customers
 * @desc    Reporte de clientes
 * @access  Private (Admin/Manager)
 */
router.get('/customers',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  validateQuery(reportQuerySchema),
  async (req: AuthRequest, res) => {
    try {
      const { startDate, endDate } = req.query as any;
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Resumen de clientes
      const customerSummary = await Promise.all([
        prisma.customer.count(),
        prisma.customer.count({ where: { status: 'ACTIVE' } }),
        prisma.customer.count({ where: { status: 'VIP' } }),
        prisma.customer.count({ where: { status: 'INACTIVE' } }),
        prisma.customer.count({
          where: { registrationDate: { gte: start, lte: end } },
        }),
        prisma.customer.aggregate({
          _avg: { totalSpent: true },
          _sum: { totalSpent: true },
        }),
      ]);

      const [
        totalCustomers,
        activeCustomers,
        vipCustomers,
        inactiveCustomers,
        newCustomers,
        spendingStats,
      ] = customerSummary;

      // Clientes por mes de registro
      const customersByMonth = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "registrationDate") as month,
          COUNT(*) as new_customers
        FROM "customers"
        WHERE "registrationDate" >= ${start} AND "registrationDate" <= ${end}
        GROUP BY DATE_TRUNC('month', "registrationDate")
        ORDER BY month ASC
      `;

      // Top clientes por gasto
      const topCustomers = await prisma.customer.findMany({
        orderBy: { totalSpent: 'desc' },
        take: 20,
        select: {
          id: true,
          name: true,
          email: true,
          totalSpent: true,
          totalOrders: true,
          status: true,
          registrationDate: true,
          lastPurchase: true,
        },
      });

      // Distribución de gasto
      const spendingDistribution = await prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN "totalSpent" = 0 THEN 'Sin compras'
            WHEN "totalSpent" < 100000 THEN 'Menos de $100k'
            WHEN "totalSpent" < 500000 THEN '$100k - $500k'
            WHEN "totalSpent" < 1000000 THEN '$500k - $1M'
            ELSE 'Más de $1M'
          END as spending_range,
          COUNT(*) as customer_count,
          SUM("totalSpent") as total_revenue
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

      // Análisis de retención
      const retentionAnalysis = await prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN "totalOrders" = 0 THEN 'Sin pedidos'
            WHEN "totalOrders" = 1 THEN '1 pedido'
            WHEN "totalOrders" <= 3 THEN '2-3 pedidos'
            WHEN "totalOrders" <= 5 THEN '4-5 pedidos'
            ELSE 'Más de 5 pedidos'
          END as order_frequency,
          COUNT(*) as customer_count
        FROM "customers"
        GROUP BY order_frequency
        ORDER BY 
          CASE order_frequency
            WHEN 'Sin pedidos' THEN 1
            WHEN '1 pedido' THEN 2
            WHEN '2-3 pedidos' THEN 3
            WHEN '4-5 pedidos' THEN 4
            WHEN 'Más de 5 pedidos' THEN 5
          END
      `;

      const report = {
        period: { startDate: start, endDate: end },
        summary: {
          totalCustomers,
          activeCustomers,
          vipCustomers,
          inactiveCustomers,
          newCustomers,
          averageSpending: Number(spendingStats._avg.totalSpent || 0),
          averageSpendingFormatted: formatCurrency(Number(spendingStats._avg.totalSpent || 0)),
          totalRevenue: Number(spendingStats._sum.totalSpent || 0),
          totalRevenueFormatted: formatCurrency(Number(spendingStats._sum.totalSpent || 0)),
        },
        customersByMonth: (customersByMonth as any[]).map(month => ({
          month: month.month,
          newCustomers: Number(month.new_customers),
        })),
        topCustomers: topCustomers.map(customer => ({
          ...customer,
          totalSpent: Number(customer.totalSpent),
          totalSpentFormatted: formatCurrency(Number(customer.totalSpent)),
        })),
        spendingDistribution: (spendingDistribution as any[]).map(range => ({
          range: range.spending_range,
          customerCount: Number(range.customer_count),
          totalRevenue: Number(range.total_revenue),
          totalRevenueFormatted: formatCurrency(Number(range.total_revenue)),
        })),
        retentionAnalysis: (retentionAnalysis as any[]).map(freq => ({
          frequency: freq.order_frequency,
          customerCount: Number(freq.customer_count),
          percentage: ((Number(freq.customer_count) / totalCustomers) * 100).toFixed(2),
        })),
        generatedAt: new Date().toISOString(),
        generatedBy: req.user!.email,
      };

      res.json(report);

      logger.info(`Reporte de clientes generado por usuario ${req.user!.id}`);
    } catch (error) {
      logger.error('Error generando reporte de clientes:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
      });
    }
  }
);

export default router;