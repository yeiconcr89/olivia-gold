import { prisma } from '../config/database-optimized';
import { logger } from '../utils/logger';

interface QueryPerformanceStats {
  query: string;
  calls: number;
  totalTime: number;
  meanTime: number;
  rows: number;
}

interface IndexUsageStats {
  schemaname: string;
  tablename: string;
  indexname: string;
  scans: number;
  tuplesRead: number;
  tuplesFetched: number;
  usageLevel: 'UNUSED' | 'LOW_USAGE' | 'MEDIUM_USAGE' | 'HIGH_USAGE';
}

interface TableSizeStats {
  tablename: string;
  totalSize: string;
  tableSize: string;
  indexSize: string;
  sizeBytes: number;
}

// ============================================================================
// DATABASE OPTIMIZATION SERVICE
// ============================================================================

class DatabaseOptimizationService {
  
  /**
   * Get slow query statistics
   */
  async getSlowQueries(limit: number = 20): Promise<QueryPerformanceStats[]> {
    try {
      const slowQueries = await prisma.$queryRaw<QueryPerformanceStats[]>`
        SELECT 
          query,
          calls,
          total_time as "totalTime",
          mean_time as "meanTime",
          rows
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
          AND query NOT LIKE '%COMMIT%'
          AND query NOT LIKE '%BEGIN%'
        ORDER BY mean_time DESC
        LIMIT ${limit};
      `;
      
      return slowQueries;
    } catch (error) {
      logger.warn('pg_stat_statements extension not available');
      return [];
    }
  }

  /**
   * Get index usage statistics
   */
  async getIndexUsageStats(): Promise<IndexUsageStats[]> {
    try {
      const indexStats = await prisma.$queryRaw<IndexUsageStats[]>`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan as scans,
          idx_tup_read as "tuplesRead",
          idx_tup_fetch as "tuplesFetched",
          CASE 
            WHEN idx_scan = 0 THEN 'UNUSED'
            WHEN idx_scan < 100 THEN 'LOW_USAGE'
            WHEN idx_scan < 1000 THEN 'MEDIUM_USAGE'
            ELSE 'HIGH_USAGE'
          END as "usageLevel"
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC;
      `;
      
      return indexStats;
    } catch (error) {
      logger.error('Failed to get index usage stats:', error);
      return [];
    }
  }

  /**
   * Get table size statistics
   */
  async getTableSizeStats(): Promise<TableSizeStats[]> {
    try {
      const tableSizes = await prisma.$queryRaw<TableSizeStats[]>`
        SELECT 
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "totalSize",
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as "tableSize",
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as "indexSize",
          pg_total_relation_size(schemaname||'.'||tablename) as "sizeBytes"
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
      `;
      
      return tableSizes;
    } catch (error) {
      logger.error('Failed to get table size stats:', error);
      return [];
    }
  }

  /**
   * Get database connection statistics
   */
  async getConnectionStats() {
    try {
      const connectionStats = await prisma.$queryRaw`
        SELECT 
          state,
          COUNT(*) as count
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state
        ORDER BY count DESC;
      `;
      
      const totalConnections = await prisma.$queryRaw`
        SELECT COUNT(*) as total
        FROM pg_stat_activity 
        WHERE datname = current_database();
      `;
      
      return {
        byState: connectionStats,
        total: totalConnections,
      };
    } catch (error) {
      logger.error('Failed to get connection stats:', error);
      return { byState: [], total: [{ total: 0 }] };
    }
  }

  /**
   * Get lock statistics
   */
  async getLockStats() {
    try {
      const lockStats = await prisma.$queryRaw`
        SELECT 
          mode,
          COUNT(*) as count
        FROM pg_locks l
        JOIN pg_stat_activity a ON l.pid = a.pid
        WHERE a.datname = current_database()
        GROUP BY mode
        ORDER BY count DESC;
      `;
      
      return lockStats;
    } catch (error) {
      logger.error('Failed to get lock stats:', error);
      return [];
    }
  }

  /**
   * Analyze table statistics
   */
  async analyzeTableStats(tableName?: string) {
    try {
      if (tableName) {
        await prisma.$executeRaw`ANALYZE ${tableName};`;
        logger.info(`Analyzed table: ${tableName}`);
      } else {
        // Analyze all tables
        const tables = ['products', 'orders', 'customers', 'reviews', 'inventory', 'inventory_movements'];
        
        for (const table of tables) {
          await prisma.$executeRaw`ANALYZE ${table};`;
          logger.info(`Analyzed table: ${table}`);
        }
      }
      
      return { success: true, message: 'Table statistics updated' };
    } catch (error) {
      logger.error('Failed to analyze table stats:', error);
      throw error;
    }
  }

  /**
   * Get query execution plan
   */
  async getQueryPlan(query: string) {
    try {
      const plan = await prisma.$queryRaw`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      return plan;
    } catch (error) {
      logger.error('Failed to get query plan:', error);
      throw error;
    }
  }

  /**
   * Optimize database maintenance
   */
  async performMaintenance(options: {
    vacuum?: boolean;
    analyze?: boolean;
    reindex?: boolean;
    tables?: string[];
  } = {}) {
    const { vacuum = true, analyze = true, reindex = false, tables } = options;
    const results = [];

    try {
      const targetTables = tables || ['products', 'orders', 'customers', 'reviews', 'inventory'];

      for (const table of targetTables) {
        if (vacuum) {
          await prisma.$executeRaw`VACUUM ${table};`;
          results.push(`VACUUM completed for ${table}`);
          logger.info(`VACUUM completed for ${table}`);
        }

        if (analyze) {
          await prisma.$executeRaw`ANALYZE ${table};`;
          results.push(`ANALYZE completed for ${table}`);
          logger.info(`ANALYZE completed for ${table}`);
        }

        if (reindex) {
          await prisma.$executeRaw`REINDEX TABLE ${table};`;
          results.push(`REINDEX completed for ${table}`);
          logger.info(`REINDEX completed for ${table}`);
        }
      }

      return { success: true, results };
    } catch (error) {
      logger.error('Database maintenance failed:', error);
      throw error;
    }
  }

  /**
   * Get database health metrics
   */
  async getDatabaseHealth() {
    try {
      const [
        slowQueries,
        indexStats,
        tableSizes,
        connectionStats,
        lockStats,
      ] = await Promise.all([
        this.getSlowQueries(10),
        this.getIndexUsageStats(),
        this.getTableSizeStats(),
        this.getConnectionStats(),
        this.getLockStats(),
      ]);

      // Calculate health score
      const unusedIndexes = indexStats.filter(idx => idx.usageLevel === 'UNUSED').length;
      const slowQueryCount = slowQueries.filter(q => q.meanTime > 1000).length;
      const totalConnections = connectionStats.total[0]?.total || 0;

      let healthScore = 100;
      
      // Deduct points for issues
      healthScore -= unusedIndexes * 2; // -2 points per unused index
      healthScore -= slowQueryCount * 10; // -10 points per slow query
      healthScore -= Math.max(0, totalConnections - 20) * 1; // -1 point per connection over 20

      healthScore = Math.max(0, Math.min(100, healthScore));

      return {
        healthScore,
        metrics: {
          slowQueries: slowQueries.length,
          unusedIndexes,
          totalConnections,
          largestTable: tableSizes[0]?.tablename || 'unknown',
          largestTableSize: tableSizes[0]?.totalSize || '0 bytes',
        },
        details: {
          slowQueries,
          indexStats,
          tableSizes,
          connectionStats,
          lockStats,
        },
        recommendations: this.generateRecommendations({
          slowQueries,
          indexStats,
          tableSizes,
          totalConnections,
        }),
      };
    } catch (error) {
      logger.error('Failed to get database health:', error);
      throw error;
    }
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(data: {
    slowQueries: QueryPerformanceStats[];
    indexStats: IndexUsageStats[];
    tableSizes: TableSizeStats[];
    totalConnections: number;
  }): string[] {
    const recommendations: string[] = [];

    // Slow query recommendations
    const slowQueries = data.slowQueries.filter(q => q.meanTime > 1000);
    if (slowQueries.length > 0) {
      recommendations.push(`${slowQueries.length} consultas lentas detectadas - considerar optimización`);
    }

    // Unused index recommendations
    const unusedIndexes = data.indexStats.filter(idx => idx.usageLevel === 'UNUSED');
    if (unusedIndexes.length > 0) {
      recommendations.push(`${unusedIndexes.length} índices no utilizados - considerar eliminación`);
    }

    // Connection recommendations
    if (data.totalConnections > 50) {
      recommendations.push('Alto número de conexiones - considerar connection pooling');
    }

    // Table size recommendations
    const largeTables = data.tableSizes.filter(table => table.sizeBytes > 100 * 1024 * 1024); // >100MB
    if (largeTables.length > 0) {
      recommendations.push(`${largeTables.length} tablas grandes detectadas - considerar partitioning`);
    }

    // Index size recommendations
    const indexHeavyTables = data.tableSizes.filter(table => {
      const indexSizeBytes = parseInt(table.indexSize.replace(/[^\d]/g, '')) || 0;
      const tableSizeBytes = parseInt(table.tableSize.replace(/[^\d]/g, '')) || 1;
      return indexSizeBytes > tableSizeBytes * 2; // Index size > 2x table size
    });
    
    if (indexHeavyTables.length > 0) {
      recommendations.push('Algunas tablas tienen índices muy grandes - revisar necesidad');
    }

    return recommendations;
  }

  /**
   * Reset database statistics
   */
  async resetStats() {
    try {
      await prisma.$executeRaw`SELECT pg_stat_reset();`;
      await prisma.$executeRaw`SELECT pg_stat_statements_reset();`;
      
      logger.info('Database statistics reset');
      return { success: true, message: 'Database statistics reset successfully' };
    } catch (error) {
      logger.error('Failed to reset database stats:', error);
      throw error;
    }
  }
}

export const databaseOptimizationService = new DatabaseOptimizationService();
export { DatabaseOptimizationService };