import { prisma } from '../config/database-optimized';
import { logger } from '../utils/logger';

interface QueryPerformanceMetrics {
  queryName: string;
  executionTime: number;
  recordCount: number;
  cacheHit: boolean;
  timestamp: Date;
}

class QueryPerformanceService {
  private metrics: QueryPerformanceMetrics[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics

  /**
   * Wrapper function to measure query performance
   */
  async measureQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    cacheHit: boolean = false
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const executionTime = Date.now() - startTime;
      
      // Determine record count
      let recordCount = 0;
      if (Array.isArray(result)) {
        recordCount = result.length;
      } else if (result && typeof result === 'object' && 'length' in result) {
        recordCount = (result as any).length;
      } else if (result) {
        recordCount = 1;
      }

      // Store metrics
      this.addMetric({
        queryName,
        executionTime,
        recordCount,
        cacheHit,
        timestamp: new Date(),
      });

      // Log slow queries
      if (executionTime > 1000) { // > 1 second
        logger.warn(`Slow query detected: ${queryName} took ${executionTime}ms`);
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`Query failed: ${queryName} after ${executionTime}ms`, error);
      throw error;
    }
  }

  private addMetric(metric: QueryPerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(timeWindow: number = 3600000) { // 1 hour default
    const cutoff = new Date(Date.now() - timeWindow);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageExecutionTime: 0,
        slowQueries: 0,
        cacheHitRate: 0,
        topSlowQueries: [],
        queryBreakdown: [],
      };
    }

    const totalQueries = recentMetrics.length;
    const totalExecutionTime = recentMetrics.reduce((sum, m) => sum + m.executionTime, 0);
    const averageExecutionTime = totalExecutionTime / totalQueries;
    const slowQueries = recentMetrics.filter(m => m.executionTime > 1000).length;
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate = (cacheHits / totalQueries) * 100;

    // Top slow queries
    const topSlowQueries = recentMetrics
      .filter(m => m.executionTime > 500)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10)
      .map(m => ({
        queryName: m.queryName,
        executionTime: m.executionTime,
        recordCount: m.recordCount,
        timestamp: m.timestamp,
      }));

    // Query breakdown by name
    const queryGroups = recentMetrics.reduce((groups, metric) => {
      if (!groups[metric.queryName]) {
        groups[metric.queryName] = {
          count: 0,
          totalTime: 0,
          avgTime: 0,
          maxTime: 0,
          minTime: Infinity,
        };
      }
      
      const group = groups[metric.queryName];
      group.count++;
      group.totalTime += metric.executionTime;
      group.maxTime = Math.max(group.maxTime, metric.executionTime);
      group.minTime = Math.min(group.minTime, metric.executionTime);
      group.avgTime = group.totalTime / group.count;
      
      return groups;
    }, {} as Record<string, any>);

    const queryBreakdown = Object.entries(queryGroups)
      .map(([name, stats]) => ({ queryName: name, ...stats }))
      .sort((a, b) => b.avgTime - a.avgTime);

    return {
      totalQueries,
      averageExecutionTime: Math.round(averageExecutionTime),
      slowQueries,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      topSlowQueries,
      queryBreakdown,
    };
  }

  /**
   * Analyze database performance
   */
  async analyzeDatabasePerformance() {
    try {
      // Get database statistics
      const dbStats = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname;
      `;

      // Get index usage
      const indexStats = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC;
      `;

      // Get table sizes
      const tableSizes = await prisma.$queryRaw`
        SELECT 
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
      `;

      // Get slow queries from pg_stat_statements (if available)
      let slowQueries = [];
      try {
        slowQueries = await prisma.$queryRaw`
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
      } catch (error) {
        // pg_stat_statements extension might not be available
        logger.debug('pg_stat_statements not available');
      }

      return {
        dbStats,
        indexStats,
        tableSizes,
        slowQueries,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Failed to analyze database performance:', error);
      throw error;
    }
  }

  /**
   * Get recommendations for query optimization
   */
  getOptimizationRecommendations(): string[] {
    const stats = this.getPerformanceStats();
    const recommendations: string[] = [];

    // Cache hit rate recommendations
    if (stats.cacheHitRate < 50) {
      recommendations.push('Consider implementing more aggressive caching strategies');
    }

    // Slow query recommendations
    if (stats.slowQueries > stats.totalQueries * 0.1) {
      recommendations.push('High number of slow queries detected - review query optimization');
    }

    // Average execution time recommendations
    if (stats.averageExecutionTime > 500) {
      recommendations.push('Average query execution time is high - consider adding indexes');
    }

    // Specific query recommendations
    stats.queryBreakdown.forEach(query => {
      if (query.avgTime > 1000) {
        recommendations.push(`Query "${query.queryName}" is consistently slow (${query.avgTime}ms avg)`);
      }
    });

    return recommendations;
  }

  /**
   * Clear metrics (for testing or maintenance)
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

export const queryPerformanceService = new QueryPerformanceService();
export { QueryPerformanceService };