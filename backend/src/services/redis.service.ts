import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    // Skip connection if Redis is disabled or URL is missing
    if (process.env.REDIS_ENABLED !== 'true' || !process.env.REDIS_URL) {
      logger.info('Redis está deshabilitado o no configurado (usando memoria local)');
      return;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        lazyConnect: true,
        socket: {
          connectTimeout: 3000, // Reduced timeout
          reconnectStrategy: false // Disable automatic reconnection
        }
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Connected to Redis');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.warn('Disconnected from Redis');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      // Don't throw error - allow app to continue without cache
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  // ============================================================================
  // CACHE OPERATIONS
  // ============================================================================

  async get<T>(key: string): Promise<T | null> {
    if (!this.isReady()) return null;

    try {
      const value = await this.client!.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      await this.client!.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      await this.client!.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  // ============================================================================
  // HASH OPERATIONS (for complex data structures)
  // ============================================================================

  async hget<T>(key: string, field: string): Promise<T | null> {
    if (!this.isReady()) return null;

    try {
      const value = await this.client!.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Redis HGET error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  async hset(key: string, field: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      await this.client!.hSet(key, field, JSON.stringify(value));
      await this.client!.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      logger.error(`Redis HSET error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  async hgetall<T>(key: string): Promise<Record<string, T> | null> {
    if (!this.isReady()) return null;

    try {
      const hash = await this.client!.hGetAll(key);
      if (!hash || Object.keys(hash).length === 0) return null;

      const result: Record<string, T> = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      logger.error(`Redis HGETALL error for key ${key}:`, error);
      return null;
    }
  }

  // ============================================================================
  // LIST OPERATIONS (for recent items, queues)
  // ============================================================================

  async lpush(key: string, value: any): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      await this.client!.lPush(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Redis LPUSH error for key ${key}:`, error);
      return false;
    }
  }

  async lrange<T>(key: string, start: number = 0, stop: number = -1): Promise<T[]> {
    if (!this.isReady()) return [];

    try {
      const values = await this.client!.lRange(key, start, stop);
      return values.map(value => JSON.parse(value));
    } catch (error) {
      logger.error(`Redis LRANGE error for key ${key}:`, error);
      return [];
    }
  }

  async ltrim(key: string, start: number, stop: number): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      await this.client!.lTrim(key, start, stop);
      return true;
    } catch (error) {
      logger.error(`Redis LTRIM error for key ${key}:`, error);
      return false;
    }
  }

  // ============================================================================
  // SET OPERATIONS (for unique collections)
  // ============================================================================

  async sadd(key: string, value: any): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      await this.client!.sAdd(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Redis SADD error for key ${key}:`, error);
      return false;
    }
  }

  async smembers<T>(key: string): Promise<T[]> {
    if (!this.isReady()) return [];

    try {
      const members = await this.client!.sMembers(key);
      return members.map(member => JSON.parse(member));
    } catch (error) {
      logger.error(`Redis SMEMBERS error for key ${key}:`, error);
      return [];
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async flushPattern(pattern: string): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length > 0) {
        await this.client!.del(keys);
      }
      return true;
    } catch (error) {
      logger.error(`Redis FLUSH PATTERN error for pattern ${pattern}:`, error);
      return false;
    }
  }

  async getStats(): Promise<any> {
    if (!this.isReady()) return null;

    try {
      const info = await this.client!.info();
      return {
        connected: this.isConnected,
        memory: info.split('\r\n').find(line => line.startsWith('used_memory_human:'))?.split(':')[1],
        connections: info.split('\r\n').find(line => line.startsWith('connected_clients:'))?.split(':')[1],
        uptime: info.split('\r\n').find(line => line.startsWith('uptime_in_seconds:'))?.split(':')[1],
      };
    } catch (error) {
      logger.error('Redis STATS error:', error);
      return null;
    }
  }

  // ============================================================================
  // CACHE KEY GENERATORS
  // ============================================================================

  static keys = {
    product: (id: string) => `product:${id}`,
    products: (page: number, limit: number, filters?: string) =>
      `products:${page}:${limit}${filters ? `:${filters}` : ''}`,
    productsByCategory: (category: string, page: number, limit: number) =>
      `products:category:${category}:${page}:${limit}`,
    search: (query: string, page: number, limit: number) =>
      `search:${query}:${page}:${limit}`,
    popularProducts: () => 'products:popular',
    featuredProducts: () => 'products:featured',
    recentProducts: () => 'products:recent',
    user: (id: string) => `user:${id}`,
    userSession: (sessionId: string) => `session:${sessionId}`,
    orders: (userId: string, page: number, limit: number) =>
      `orders:${userId}:${page}:${limit}`,
    orderStats: (period: string) => `stats:orders:${period}`,
    inventory: (productId: string) => `inventory:${productId}`,
    reviews: (productId: string, page: number, limit: number) =>
      `reviews:${productId}:${page}:${limit}`,
    reviewStats: (productId: string) => `reviews:stats:${productId}`,
  };
}

export const redisService = new RedisService();
export { RedisService };