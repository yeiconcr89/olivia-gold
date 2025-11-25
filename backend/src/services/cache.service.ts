import { redisService, RedisService } from './redis.service';
import { logger } from '../utils/logger';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

class CacheService {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
  };

  // Default TTL values for different types of data
  static TTL = {
    SHORT: 300,    // 5 minutes
    MEDIUM: 1800,  // 30 minutes
    LONG: 3600,    // 1 hour
    DAY: 86400,    // 24 hours
    WEEK: 604800,  // 7 days
  };

  // ============================================================================
  // BASIC CACHE OPERATIONS
  // ============================================================================

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await redisService.get<T>(key);
      
      if (result !== null) {
        this.stats.hits++;
        logger.debug(`Cache HIT for key: ${key}`);
      } else {
        this.stats.misses++;
        logger.debug(`Cache MISS for key: ${key}`);
      }
      
      this.updateHitRate();
      return result;
    } catch (error) {
      logger.error(`Cache GET error for key ${key}:`, error);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      const ttl = options.ttl || CacheService.TTL.MEDIUM;
      const result = await redisService.set(key, value, ttl);
      
      if (result) {
        this.stats.sets++;
        logger.debug(`Cache SET for key: ${key}, TTL: ${ttl}s`);
        
        // Store tags for cache invalidation
        if (options.tags) {
          await this.storeTags(key, options.tags);
        }
      }
      
      return result;
    } catch (error) {
      logger.error(`Cache SET error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const result = await redisService.del(key);
      
      if (result) {
        this.stats.deletes++;
        logger.debug(`Cache DELETE for key: ${key}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Cache DELETE error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    return await redisService.exists(key);
  }

  // ============================================================================
  // CACHE WITH FALLBACK PATTERN
  // ============================================================================

  async getOrSet<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T | null> {
    try {
      // Try to get from cache first
      let result = await this.get<T>(key);
      
      if (result !== null) {
        return result;
      }

      // If not in cache, execute fallback function
      logger.debug(`Executing fallback for key: ${key}`);
      result = await fallbackFn();
      
      if (result !== null && result !== undefined) {
        // Store in cache for next time
        await this.set(key, result, options);
      }
      
      return result;
    } catch (error) {
      logger.error(`Cache getOrSet error for key ${key}:`, error);
      // If cache fails, still try to return fallback result
      try {
        return await fallbackFn();
      } catch (fallbackError) {
        logger.error(`Fallback function failed for key ${key}:`, fallbackError);
        return null;
      }
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const promises = keys.map(key => this.get<T>(key));
    return await Promise.all(promises);
  }

  async mset(items: Array<{ key: string; value: any; options?: CacheOptions }>): Promise<boolean[]> {
    const promises = items.map(item => this.set(item.key, item.value, item.options));
    return await Promise.all(promises);
  }

  async mdel(keys: string[]): Promise<boolean[]> {
    const promises = keys.map(key => this.del(key));
    return await Promise.all(promises);
  }

  // ============================================================================
  // CACHE INVALIDATION BY TAGS
  // ============================================================================

  private async storeTags(key: string, tags: string[]): Promise<void> {
    const promises = tags.map(tag => 
      redisService.sadd(`tag:${tag}`, key)
    );
    await Promise.all(promises);
  }

  async invalidateByTag(tag: string): Promise<boolean> {
    try {
      const keys = await redisService.smembers<string>(`tag:${tag}`);
      
      if (keys.length > 0) {
        logger.info(`Invalidating ${keys.length} keys with tag: ${tag}`);
        await this.mdel(keys);
        await redisService.del(`tag:${tag}`);
      }
      
      return true;
    } catch (error) {
      logger.error(`Cache invalidation by tag ${tag} failed:`, error);
      return false;
    }
  }

  async invalidateByPattern(pattern: string): Promise<boolean> {
    try {
      return await redisService.flushPattern(pattern);
    } catch (error) {
      logger.error(`Cache invalidation by pattern ${pattern} failed:`, error);
      return false;
    }
  }

  // ============================================================================
  // SPECIALIZED CACHE METHODS FOR BUSINESS LOGIC
  // ============================================================================

  // Product caching
  async getProduct(id: string) {
    return await this.get(RedisService.keys.product(id));
  }

  async setProduct(id: string, product: any, ttl: number = CacheService.TTL.LONG) {
    return await this.set(
      RedisService.keys.product(id), 
      product, 
      { ttl, tags: ['products', `product:${id}`] }
    );
  }

  async invalidateProduct(id: string) {
    return await this.invalidateByTag(`product:${id}`);
  }

  // Products list caching
  async getProducts(page: number, limit: number, filters?: string) {
    return await this.get(RedisService.keys.products(page, limit, filters));
  }

  async setProducts(page: number, limit: number, products: any, filters?: string, ttl: number = CacheService.TTL.MEDIUM) {
    return await this.set(
      RedisService.keys.products(page, limit, filters),
      products,
      { ttl, tags: ['products'] }
    );
  }

  // Search results caching
  async getSearchResults(query: string, page: number, limit: number) {
    return await this.get(RedisService.keys.search(query, page, limit));
  }

  async setSearchResults(query: string, page: number, limit: number, results: any, ttl: number = CacheService.TTL.MEDIUM) {
    return await this.set(
      RedisService.keys.search(query, page, limit),
      results,
      { ttl, tags: ['search'] }
    );
  }

  // User session caching
  async getUserSession(sessionId: string) {
    return await this.get(RedisService.keys.userSession(sessionId));
  }

  async setUserSession(sessionId: string, sessionData: any, ttl: number = CacheService.TTL.DAY) {
    return await this.set(
      RedisService.keys.userSession(sessionId),
      sessionData,
      { ttl, tags: ['sessions'] }
    );
  }

  // Order statistics caching
  async getOrderStats(period: string) {
    return await this.get(RedisService.keys.orderStats(period));
  }

  async setOrderStats(period: string, stats: any, ttl: number = CacheService.TTL.LONG) {
    return await this.set(
      RedisService.keys.orderStats(period),
      stats,
      { ttl, tags: ['stats', 'orders'] }
    );
  }

  // Popular/Featured products
  async getPopularProducts() {
    return await this.get(RedisService.keys.popularProducts());
  }

  async setPopularProducts(products: any, ttl: number = CacheService.TTL.LONG) {
    return await this.set(
      RedisService.keys.popularProducts(),
      products,
      { ttl, tags: ['products', 'popular'] }
    );
  }

  async getFeaturedProducts() {
    return await this.get(RedisService.keys.featuredProducts());
  }

  async setFeaturedProducts(products: any, ttl: number = CacheService.TTL.LONG) {
    return await this.set(
      RedisService.keys.featuredProducts(),
      products,
      { ttl, tags: ['products', 'featured'] }
    );
  }

  // ============================================================================
  // CACHE WARMING
  // ============================================================================

  async warmup(): Promise<void> {
    // Skip warmup if Redis is disabled
    if (process.env.REDIS_ENABLED !== 'true') {
      return;
    }
    
    logger.info('Starting cache warmup...');
    try {
      // Set a timeout to avoid hanging
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Cache warmup timeout')), 5000)
      );
      
      // Actual warmup logic with timeout
      await Promise.race([
        Promise.resolve(), // placeholder for actual warmup
        timeout
      ]);
      
      logger.info('Cache warmup completed successfully');
    } catch (error) {
      logger.error('Cache warmup failed:', error);
      // Don't rethrow - allow server to continue
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  async clear(): Promise<boolean> {
    try {
      return await redisService.flushPattern('*');
    } catch (error) {
      logger.error('Cache clear failed:', error);
      return false;
    }
  }

  async getStats(): Promise<CacheStats> {
    return { ...this.stats };
  }

  async getRedisStats() {
    return await redisService.getStats();
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
    };
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck(): Promise<{ status: string; latency?: number; error?: string }> {
    try {
      const start = Date.now();
      await redisService.get('health-check');
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const cacheService = new CacheService();
export { CacheService };