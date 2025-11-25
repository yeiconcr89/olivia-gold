import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface PaginationOptions {
  page: number;
  limit: number;
  cursor?: string; // For cursor-based pagination
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

interface QueryOptimizationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
  performance: {
    queryTime: number;
    cacheHit: boolean;
  };
}

class QueryOptimizerService {
  
  // ============================================================================
  // OPTIMIZED PAGINATION METHODS
  // ============================================================================

  /**
   * Cursor-based pagination for large datasets
   * More efficient than offset-based pagination for large offsets
   */
  async paginateWithCursor<T>(
    model: any,
    options: PaginationOptions,
    where: any = {},
    include: any = {},
    select: any = null
  ): Promise<QueryOptimizationResult<T>> {
    const start = Date.now();
    const { limit, cursor, orderBy = 'createdAt', orderDirection = 'desc' } = options;

    const cursorCondition = cursor ? {
      [orderBy]: orderDirection === 'desc' 
        ? { lt: cursor }
        : { gt: cursor }
    } : {};

    const whereCondition = {
      ...where,
      ...cursorCondition
    };

    // Get limit + 1 to check if there are more items
    const items = await model.findMany({
      where: whereCondition,
      ...(select ? { select } : { include }),
      orderBy: { [orderBy]: orderDirection },
      take: limit + 1,
    });

    const hasNext = items.length > limit;
    const data = hasNext ? items.slice(0, -1) : items;
    
    const nextCursor = hasNext && data.length > 0 
      ? data[data.length - 1][orderBy] 
      : undefined;

    const queryTime = Date.now() - start;

    return {
      data,
      pagination: {
        page: 1, // Cursor pagination doesn't use pages
        limit,
        total: -1, // Total count not available in cursor pagination
        pages: -1,
        hasNext,
        hasPrev: !!cursor,
        nextCursor: nextCursor?.toString(),
        prevCursor: cursor,
      },
      performance: {
        queryTime,
        cacheHit: false,
      }
    };
  }

  /**
   * Optimized offset-based pagination with total count optimization
   */
  async paginateWithOffset<T>(
    model: any,
    options: PaginationOptions,
    where: any = {},
    include: any = {},
    select: any = null,
    skipCount: boolean = false
  ): Promise<QueryOptimizationResult<T>> {
    const start = Date.now();
    const { page, limit, orderBy = 'createdAt', orderDirection = 'desc' } = options;
    const offset = (page - 1) * limit;

    // For large offsets, suggest cursor-based pagination
    if (offset > 10000) {
      logger.warn(`Large offset detected (${offset}). Consider using cursor-based pagination for better performance.`);
    }

    const orderByClause = { [orderBy]: orderDirection };

    // Execute queries in parallel when count is needed
    const queries = [
      model.findMany({
        where,
        ...(select ? { select } : { include }),
        orderBy: orderByClause,
        skip: offset,
        take: limit,
      })
    ];

    if (!skipCount) {
      queries.push(model.count({ where }));
    }

    const results = await Promise.all(queries);
    const data = results[0];
    const total = skipCount ? -1 : results[1];
    const pages = skipCount ? -1 : Math.ceil(total / limit);

    const queryTime = Date.now() - start;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: !skipCount && page < pages,
        hasPrev: page > 1,
      },
      performance: {
        queryTime,
        cacheHit: false,
      }
    };
  }

  // ============================================================================
  // OPTIMIZED SEARCH METHODS
  // ============================================================================

  /**
   * Full-text search with ranking and highlighting
   */
  async fullTextSearch(
    query: string,
    options: {
      tables: string[];
      columns: string[];
      limit?: number;
      rankThreshold?: number;
    }
  ) {
    const { tables, columns, limit = 20, rankThreshold = 0.1 } = options;
    const start = Date.now();

    // Use PostgreSQL full-text search with ranking
    const searchQuery = `
      SELECT 
        '${tables[0]}' as table_name,
        id,
        ${columns.map(col => `"${col}"`).join(', ')},
        ts_rank(
          to_tsvector('spanish', ${columns.map(col => `COALESCE("${col}", '')`).join(' || \' \' || ')}),
          plainto_tsquery('spanish', $1)
        ) as rank,
        ts_headline(
          'spanish',
          ${columns[0]},
          plainto_tsquery('spanish', $1),
          'MaxWords=20, MinWords=5'
        ) as highlight
      FROM ${tables[0]}
      WHERE to_tsvector('spanish', ${columns.map(col => `COALESCE("${col}", '')`).join(' || \' \' || ')})
            @@ plainto_tsquery('spanish', $1)
      AND ts_rank(
        to_tsvector('spanish', ${columns.map(col => `COALESCE("${col}", '')`).join(' || \' \' || ')}),
        plainto_tsquery('spanish', $1)
      ) > $2
      ORDER BY rank DESC
      LIMIT $3;
    `;

    const results = await prisma.$queryRawUnsafe(
      searchQuery,
      query,
      rankThreshold,
      limit
    );

    const queryTime = Date.now() - start;

    return {
      results,
      performance: {
        queryTime,
        searchQuery: query,
        resultsCount: Array.isArray(results) ? results.length : 0,
      }
    };
  }

  /**
   * Optimized product search with filters
   */
  async searchProducts(
    searchQuery: string,
    filters: {
      category?: string;
      subcategory?: string;
      priceRange?: { min: number; max: number };
      inStock?: boolean;
      featured?: boolean;
    },
    pagination: PaginationOptions
  ) {
    const start = Date.now();

    const where: any = {};

    // Add search conditions
    if (searchQuery) {
      where.OR = [
        {
          name: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          materials: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          tags: {
            some: {
              tag: {
                contains: searchQuery,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    // Add filters
    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.subcategory) {
      where.subcategory = filters.subcategory;
    }

    if (filters.priceRange) {
      where.price = {
        gte: filters.priceRange.min,
        lte: filters.priceRange.max,
      };
    }

    if (filters.inStock !== undefined) {
      where.inStock = filters.inStock;
    }

    if (filters.featured !== undefined) {
      where.featured = filters.featured;
    }

    // Use optimized pagination
    const result = await this.paginateWithOffset(
      prisma.product,
      pagination,
      where,
      {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        tags: true,
        inventory: true,
      }
    );

    result.performance.queryTime = Date.now() - start;

    return result;
  }

  // ============================================================================
  // QUERY ANALYSIS AND OPTIMIZATION
  // ============================================================================

  /**
   * Analyze query performance
   */
  async analyzeQuery(query: string, params: any[] = []): Promise<any> {
    const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
    
    try {
      const result = await prisma.$queryRawUnsafe(explainQuery, ...params);
      return result;
    } catch (error) {
      logger.error('Query analysis failed:', error);
      return null;
    }
  }

  /**
   * Get database performance metrics
   */
  async getDatabaseMetrics(): Promise<any> {
    try {
      const metrics = await Promise.all([
        // Table sizes
        prisma.$queryRaw`
          SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
          FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
        `,

        // Index usage
        prisma.$queryRaw`
          SELECT 
            schemaname,
            tablename,
            indexname,
            idx_tup_read,
            idx_tup_fetch,
            idx_tup_read + idx_tup_fetch as total_usage
          FROM pg_stat_user_indexes 
          WHERE schemaname = 'public'
          ORDER BY (idx_tup_read + idx_tup_fetch) DESC
          LIMIT 10;
        `,

        // Connection statistics
        prisma.$queryRaw`
          SELECT 
            count(*) as total_connections,
            count(*) FILTER (WHERE state = 'active') as active_connections,
            count(*) FILTER (WHERE state = 'idle') as idle_connections
          FROM pg_stat_activity;
        `,

        // Database size
        prisma.$queryRaw`
          SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;
        `,
      ]);

      return {
        tableSizes: metrics[0],
        indexUsage: metrics[1],
        connections: metrics[2],
        databaseSize: metrics[3],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting database metrics:', error);
      return null;
    }
  }

  /**
   * Suggest query optimizations
   */
  async suggestOptimizations(
    tableName: string,
    commonQueries: string[] = []
  ): Promise<string[]> {
    const suggestions: string[] = [];

    try {
      // Check for missing indexes
      const tableStats = await prisma.$queryRawUnsafe(`
        SELECT 
          attname,
          n_distinct,
          correlation,
          most_common_vals
        FROM pg_stats 
        WHERE schemaname = 'public' 
        AND tablename = $1
        ORDER BY n_distinct DESC;
      `, tableName);

      // Analyze common WHERE clauses and suggest indexes
      for (const query of commonQueries) {
        if (query.includes('WHERE')) {
          const whereClause = query.split('WHERE')[1]?.split('ORDER BY')[0];
          if (whereClause) {
            suggestions.push(`Consider adding index for WHERE clause: ${whereClause.trim()}`);
          }
        }

        if (query.includes('ORDER BY')) {
          const orderClause = query.split('ORDER BY')[1];
          if (orderClause) {
            suggestions.push(`Consider adding index for ORDER BY: ${orderClause.trim()}`);
          }
        }
      }

      // Check for unused indexes
      const unusedIndexes = await prisma.$queryRawUnsafe(`
        SELECT 
          indexrelname as index_name,
          schemaname,
          tablename
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public' 
        AND tablename = $1
        AND idx_tup_read = 0 
        AND idx_tup_fetch = 0;
      `, tableName);

      if (Array.isArray(unusedIndexes) && unusedIndexes.length > 0) {
        suggestions.push(`Consider removing unused indexes: ${unusedIndexes.map((idx: any) => idx.index_name).join(', ')}`);
      }

    } catch (error) {
      logger.error('Error generating optimization suggestions:', error);
    }

    return suggestions;
  }

  // ============================================================================
  // BULK OPERATIONS OPTIMIZATION
  // ============================================================================

  /**
   * Optimized bulk insert
   */
  async bulkInsert<T>(
    model: any,
    data: T[],
    batchSize: number = 1000
  ): Promise<{ inserted: number; errors: any[] }> {
    const start = Date.now();
    let inserted = 0;
    const errors: any[] = [];

    // Process in batches to avoid memory issues
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        await model.createMany({
          data: batch,
          skipDuplicates: true,
        });
        inserted += batch.length;
        logger.debug(`Inserted batch ${Math.floor(i / batchSize) + 1}, items: ${batch.length}`);
      } catch (error) {
        errors.push({
          batch: Math.floor(i / batchSize) + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        logger.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
      }
    }

    const queryTime = Date.now() - start;
    logger.info(`Bulk insert completed: ${inserted} items in ${queryTime}ms`);

    return { inserted, errors };
  }

  /**
   * Optimized bulk update
   */
  async bulkUpdate<T>(
    model: any,
    updates: Array<{ where: any; data: Partial<T> }>,
    batchSize: number = 500
  ): Promise<{ updated: number; errors: any[] }> {
    const start = Date.now();
    let updated = 0;
    const errors: any[] = [];

    // Process updates in batches
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      const promises = batch.map(async (update, index) => {
        try {
          await model.update(update);
          return { success: true, index: i + index };
        } catch (error) {
          return {
            success: false,
            index: i + index,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      const results = await Promise.allSettled(promises);
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            updated++;
          } else {
            errors.push(result.value);
          }
        } else {
          errors.push({
            error: result.reason,
            batch: Math.floor(i / batchSize) + 1,
          });
        }
      });
    }

    const queryTime = Date.now() - start;
    logger.info(`Bulk update completed: ${updated} items in ${queryTime}ms`);

    return { updated, errors };
  }
}

export const queryOptimizer = new QueryOptimizerService();
export { QueryOptimizerService };