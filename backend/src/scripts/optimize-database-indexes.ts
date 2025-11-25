#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

const optimizationQueries = [
  // ============================================================================
  // PRODUCT INDEXES FOR PERFORMANCE
  // ============================================================================
  {
    name: 'Product search optimization',
    queries: [
      // Composite index for product search and filtering
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search_composite 
       ON products (category, subcategory, "inStock", featured, price);`,

      // GIN index for full-text search on product name and description
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_gin 
       ON products USING gin(to_tsvector('spanish', name));`,

      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_description_gin 
       ON products USING gin(to_tsvector('spanish', description));`,

      // Index for sorting by price
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price_desc 
       ON products (price DESC);`,

      // Index for sorting by rating
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_rating_desc 
       ON products (rating DESC, "reviewCount" DESC);`,

      // Index for featured products
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_featured_created 
       ON products (featured, "createdAt" DESC) WHERE featured = true;`,

      // Index for in-stock products
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_instock_created 
       ON products ("inStock", "createdAt" DESC) WHERE "inStock" = true;`,

      // Partial index for active products only
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_composite 
       ON products (category, price, rating) WHERE "inStock" = true;`,
    ]
  },

  // ============================================================================
  // ORDER INDEXES FOR PERFORMANCE
  // ============================================================================
  {
    name: 'Order optimization',
    queries: [
      // Composite index for order queries
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_customer_status 
       ON orders ("customerId", status, "createdAt" DESC);`,

      // Index for order status filtering
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_created 
       ON orders (status, "createdAt" DESC);`,

      // Index for order total and date
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_total_date 
       ON orders (total DESC, "createdAt" DESC);`,

      // Index for order number lookup
      `CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_number_unique 
       ON orders ("orderNumber");`,
    ]
  },

  // ============================================================================
  // CUSTOMER INDEXES FOR PERFORMANCE
  // ============================================================================
  {
    name: 'Customer optimization',
    queries: [
      // Index for customer email search
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_email_gin 
       ON customers USING gin(to_tsvector('spanish', email));`,

      // Index for customer phone search
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_phone 
       ON customers (phone) WHERE phone IS NOT NULL;`,

      // Index for customer orders relationship
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_created_orders 
       ON customers ("createdAt" DESC, "totalOrders");`,
    ]
  },

  // ============================================================================
  // INVENTORY INDEXES FOR PERFORMANCE
  // ============================================================================
  {
    name: 'Inventory optimization',
    queries: [
      // Index for low stock alerts
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_low_stock 
       ON inventory (quantity) WHERE quantity <= 10;`,

      // Index for reserved quantity tracking
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_reserved 
       ON inventory ("reservedQuantity") WHERE "reservedQuantity" > 0;`,

      // Composite index for inventory management
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_product_quantity 
       ON inventory ("productId", quantity, "reservedQuantity");`,
    ]
  },

  // ============================================================================
  // REVIEW INDEXES FOR PERFORMANCE  
  // ============================================================================
  {
    name: 'Review optimization',
    queries: [
      // Index for product reviews
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_product_status 
       ON reviews ("productId", status, date DESC);`,

      // Index for approved reviews only
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_approved_date 
       ON reviews (date DESC) WHERE status = 'APPROVED';`,

      // Index for review rating analysis
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_rating_product 
       ON reviews ("productId", rating) WHERE status = 'APPROVED';`,
    ]
  },

  // ============================================================================
  // USER AND AUTHENTICATION INDEXES
  // ============================================================================
  {
    name: 'User authentication optimization',
    queries: [
      // Index for user login
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
       ON users (email, "isActive") WHERE "isActive" = true;`,

      // Index for Google OAuth
      `CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_users_google_id 
       ON users ("googleId") WHERE "googleId" IS NOT NULL;`,

      // Index for user profiles
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_name 
       ON user_profiles (name) WHERE name IS NOT NULL;`,
    ]
  },

  // ============================================================================
  // ANALYTICS AND REPORTING INDEXES
  // ============================================================================
  {
    name: 'Analytics optimization',
    queries: [
      // Index for sales analytics by date
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_analytics_date 
       ON orders (DATE("createdAt"), status, total) WHERE status = 'COMPLETED';`,

      // Index for product performance analytics
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_analytics 
       ON order_items ("productId", quantity, price);`,

      // Index for audit logs
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_action 
       ON audit_logs ("userId", action, "createdAt" DESC);`,

      // Index for audit logs by entity
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity 
       ON audit_logs ("entityType", "entityId", "createdAt" DESC);`,
    ]
  },

  // ============================================================================
  // CART AND SESSION INDEXES
  // ============================================================================
  {
    name: 'Cart and session optimization',
    queries: [
      // Index for cart items
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_items_cart_product 
       ON cart_items ("cartId", "productId");`,

      // Index for active carts
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_carts_user_updated 
       ON carts ("userId", "updatedAt" DESC);`,

      // Index for abandoned cart analysis
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_carts_abandoned 
       ON carts ("updatedAt") WHERE "updatedAt" < NOW() - INTERVAL '24 hours';`,
    ]
  },
];

async function optimizeDatabaseIndexes(): Promise<void> {
  logger.info('🔧 Starting database index optimization...');

  try {
    // First, analyze current database performance
    logger.info('📊 Analyzing current database statistics...');
    
    // Get table sizes
    const tableSizes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation,
        most_common_vals
      FROM pg_stats 
      WHERE schemaname = 'public'
      ORDER BY tablename, attname;
    `;
    
    logger.info('Current table statistics:', tableSizes);

    // Execute optimization queries
    for (const optimization of optimizationQueries) {
      logger.info(`\n🔨 Applying ${optimization.name}...`);
      
      for (const query of optimization.queries) {
        try {
          logger.info(`Executing: ${query.split('\n')[0]}...`);
          await prisma.$executeRawUnsafe(query);
          logger.info('✅ Index created successfully');
        } catch (error: any) {
          if (error.code === '42P07') {
            logger.info('ℹ️  Index already exists, skipping...');
          } else {
            logger.error(`❌ Error creating index: ${error.message}`);
            // Continue with other indexes even if one fails
          }
        }
      }
    }

    // Analyze tables after creating indexes
    logger.info('\n📈 Analyzing tables to update statistics...');
    
    const tables = [
      'products', 'orders', 'customers', 'inventory', 
      'reviews', 'users', 'user_profiles', 'order_items',
      'cart_items', 'carts', 'audit_logs'
    ];

    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`ANALYZE ${table};`);
        logger.info(`✅ Analyzed table: ${table}`);
      } catch (error: any) {
        logger.warn(`⚠️  Could not analyze table ${table}: ${error.message}`);
      }
    }

    // Get updated statistics
    logger.info('\n📊 Gathering updated performance statistics...');
    
    const indexUsage = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
      ORDER BY idx_tup_read DESC
      LIMIT 20;
    `;
    
    logger.info('Top index usage:', indexUsage);

    // Get slow queries if available (requires pg_stat_statements extension)
    try {
      const slowQueries = await prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY mean_time DESC 
        LIMIT 10;
      `;
      
      logger.info('Slowest queries:', slowQueries);
    } catch (error) {
      logger.info('ℹ️  pg_stat_statements extension not available for query analysis');
    }

    logger.info('\n✅ Database optimization completed successfully!');
    logger.info('💡 Recommendations:');
    logger.info('   - Monitor query performance using EXPLAIN ANALYZE');
    logger.info('   - Consider enabling pg_stat_statements for query monitoring');
    logger.info('   - Regular VACUUM and ANALYZE maintenance');
    logger.info('   - Monitor index usage and remove unused indexes');

  } catch (error) {
    logger.error('❌ Database optimization failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run optimization if called directly
if (require.main === module) {
  optimizeDatabaseIndexes()
    .then(() => {
      logger.info('🎉 Database optimization script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Database optimization script failed:', error);
      process.exit(1);
    });
}

export { optimizeDatabaseIndexes };