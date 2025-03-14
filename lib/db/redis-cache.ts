import Redis from 'ioredis';
import { logger } from '../utils';

/**
 * RedisCache service for agentic operations using AWS ElastiCache
 */
export class RedisCache {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  /**
   * Create a new RedisCache instance
   * @param endpoint Redis endpoint URL
   * @param port Redis port
   * @param password Redis password
   */
  constructor(
    private endpoint: string = process.env.REDIS_ENDPOINT || '',
    private port: number = parseInt(process.env.REDIS_PORT || '6379', 10),
    private password: string = process.env.REDIS_PASSWORD || ''
  ) {
    if (!this.endpoint) {
      logger.warn('No Redis endpoint provided. Cache operations will not work.');
    }
  }

  /**
   * Connect to the Redis server
   */
  async connect(): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }

    try {
      if (!this.endpoint) {
        throw new Error('Redis endpoint is required for connection');
      }

      logger.info(`Connecting to Redis at ${this.endpoint}:${this.port}`);
      
      this.client = new Redis({
        host: this.endpoint,
        port: this.port,
        password: this.password || undefined,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      // Test connection
      await this.client.ping();
      this.isConnected = true;
      
      logger.info('Successfully connected to Redis');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to connect to Redis: ${errorMessage}`);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Close the connection to Redis
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Closed connection to Redis');
    }
  }

  /**
   * Ensure connection is established before performing operations
   */
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) {
        throw new Error('Failed to connect to Redis server');
      }
    }
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to store
   * @param ttlSeconds Time to live in seconds (optional)
   * @returns True if successful
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    await this.ensureConnection();
    
    try {
      if (typeof value !== 'string') {
        value = JSON.stringify(value);
      }
      
      if (ttlSeconds) {
        await this.client!.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client!.set(key, value);
      }
      
      logger.info(`Set cache key: ${key}${ttlSeconds ? ` (TTL: ${ttlSeconds}s)` : ''}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to set cache key ${key}: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @param parseJson Whether to parse the value as JSON
   * @returns The cached value or null if not found
   */
  async get(key: string, parseJson: boolean = true): Promise<any> {
    await this.ensureConnection();
    
    try {
      const value = await this.client!.get(key);
      
      if (value === null) {
        logger.info(`Cache miss for key: ${key}`);
        return null;
      }
      
      logger.info(`Cache hit for key: ${key}`);
      
      if (parseJson) {
        try {
          return JSON.parse(value);
        } catch (e) {
          // If parsing fails, return the raw value
          return value;
        }
      }
      
      return value;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get cache key ${key}: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Delete a value from the cache
   * @param key Cache key
   * @returns True if successful
   */
  async delete(key: string): Promise<boolean> {
    await this.ensureConnection();
    
    try {
      const result = await this.client!.del(key);
      logger.info(`Deleted cache key: ${key} (${result === 1 ? 'success' : 'not found'})`);
      return result === 1;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to delete cache key ${key}: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Check if a key exists in the cache
   * @param key Cache key
   * @returns True if the key exists
   */
  async exists(key: string): Promise<boolean> {
    await this.ensureConnection();
    
    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to check if cache key ${key} exists: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Get the TTL of a key in seconds
   * @param key Cache key
   * @returns TTL in seconds or -1 if no TTL, -2 if key doesn't exist
   */
  async ttl(key: string): Promise<number> {
    await this.ensureConnection();
    
    try {
      return await this.client!.ttl(key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get TTL for cache key ${key}: ${errorMessage}`);
      return -2;
    }
  }

  /**
   * Set a TTL for an existing key
   * @param key Cache key
   * @param ttlSeconds Time to live in seconds
   * @returns True if successful
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    await this.ensureConnection();
    
    try {
      const result = await this.client!.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to set TTL for cache key ${key}: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Increment a numeric value in the cache
   * @param key Cache key
   * @param increment Amount to increment by (default: 1)
   * @returns The new value
   */
  async increment(key: string, increment: number = 1): Promise<number> {
    await this.ensureConnection();
    
    try {
      if (increment === 1) {
        return await this.client!.incr(key);
      } else {
        return await this.client!.incrby(key, increment);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to increment cache key ${key}: ${errorMessage}`);
      throw new Error(`Failed to increment cache key ${key}: ${errorMessage}`);
    }
  }

  /**
   * Decrement a numeric value in the cache
   * @param key Cache key
   * @param decrement Amount to decrement by (default: 1)
   * @returns The new value
   */
  async decrement(key: string, decrement: number = 1): Promise<number> {
    await this.ensureConnection();
    
    try {
      if (decrement === 1) {
        return await this.client!.decr(key);
      } else {
        return await this.client!.decrby(key, decrement);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to decrement cache key ${key}: ${errorMessage}`);
      throw new Error(`Failed to decrement cache key ${key}: ${errorMessage}`);
    }
  }

  /**
   * Add a member to a set
   * @param key Set key
   * @param members Members to add
   * @returns Number of members added
   */
  async addToSet(key: string, ...members: string[]): Promise<number> {
    await this.ensureConnection();
    
    try {
      return await this.client!.sadd(key, ...members);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to add to set ${key}: ${errorMessage}`);
      throw new Error(`Failed to add to set ${key}: ${errorMessage}`);
    }
  }

  /**
   * Get all members of a set
   * @param key Set key
   * @returns Array of set members
   */
  async getSetMembers(key: string): Promise<string[]> {
    await this.ensureConnection();
    
    try {
      return await this.client!.smembers(key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get members of set ${key}: ${errorMessage}`);
      throw new Error(`Failed to get members of set ${key}: ${errorMessage}`);
    }
  }

  /**
   * Check if a member exists in a set
   * @param key Set key
   * @param member Member to check
   * @returns True if the member exists in the set
   */
  async isInSet(key: string, member: string): Promise<boolean> {
    await this.ensureConnection();
    
    try {
      return (await this.client!.sismember(key, member)) === 1;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to check if member exists in set ${key}: ${errorMessage}`);
      throw new Error(`Failed to check if member exists in set ${key}: ${errorMessage}`);
    }
  }

  /**
   * Remove a member from a set
   * @param key Set key
   * @param members Members to remove
   * @returns Number of members removed
   */
  async removeFromSet(key: string, ...members: string[]): Promise<number> {
    await this.ensureConnection();
    
    try {
      return await this.client!.srem(key, ...members);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to remove from set ${key}: ${errorMessage}`);
      throw new Error(`Failed to remove from set ${key}: ${errorMessage}`);
    }
  }

  /**
   * Add a key-value pair to a hash
   * @param key Hash key
   * @param field Field name
   * @param value Field value
   * @returns 1 if field is new, 0 if field was updated
   */
  async setHashField(key: string, field: string, value: any): Promise<number> {
    await this.ensureConnection();
    
    try {
      if (typeof value !== 'string') {
        value = JSON.stringify(value);
      }
      
      return await this.client!.hset(key, field, value);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to set hash field ${field} in ${key}: ${errorMessage}`);
      throw new Error(`Failed to set hash field ${field} in ${key}: ${errorMessage}`);
    }
  }

  /**
   * Get a value from a hash
   * @param key Hash key
   * @param field Field name
   * @param parseJson Whether to parse the value as JSON
   * @returns The field value or null if not found
   */
  async getHashField(key: string, field: string, parseJson: boolean = true): Promise<any> {
    await this.ensureConnection();
    
    try {
      const value = await this.client!.hget(key, field);
      
      if (value === null) {
        return null;
      }
      
      if (parseJson) {
        try {
          return JSON.parse(value);
        } catch (e) {
          // If parsing fails, return the raw value
          return value;
        }
      }
      
      return value;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get hash field ${field} from ${key}: ${errorMessage}`);
      throw new Error(`Failed to get hash field ${field} from ${key}: ${errorMessage}`);
    }
  }

  /**
   * Get all fields and values from a hash
   * @param key Hash key
   * @param parseJson Whether to parse values as JSON
   * @returns Object with field-value pairs
   */
  async getHashAll(key: string, parseJson: boolean = true): Promise<Record<string, any>> {
    await this.ensureConnection();
    
    try {
      const hash = await this.client!.hgetall(key);
      
      if (parseJson) {
        // Try to parse each value as JSON
        Object.keys(hash).forEach(field => {
          try {
            hash[field] = JSON.parse(hash[field]);
          } catch (e) {
            // If parsing fails, keep the original value
          }
        });
      }
      
      return hash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get all fields from hash ${key}: ${errorMessage}`);
      throw new Error(`Failed to get all fields from hash ${key}: ${errorMessage}`);
    }
  }

  /**
   * Delete a field from a hash
   * @param key Hash key
   * @param fields Fields to delete
   * @returns Number of fields removed
   */
  async deleteHashField(key: string, ...fields: string[]): Promise<number> {
    await this.ensureConnection();
    
    try {
      return await this.client!.hdel(key, ...fields);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to delete hash field(s) from ${key}: ${errorMessage}`);
      throw new Error(`Failed to delete hash field(s) from ${key}: ${errorMessage}`);
    }
  }

  /**
   * Check if a field exists in a hash
   * @param key Hash key
   * @param field Field name
   * @returns True if the field exists
   */
  async hashFieldExists(key: string, field: string): Promise<boolean> {
    await this.ensureConnection();
    
    try {
      return (await this.client!.hexists(key, field)) === 1;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to check if hash field ${field} exists in ${key}: ${errorMessage}`);
      throw new Error(`Failed to check if hash field ${field} exists in ${key}: ${errorMessage}`);
    }
  }

  /**
   * Get all keys matching a pattern
   * @param pattern Pattern to match (e.g., "user:*")
   * @returns Array of matching keys
   */
  async keys(pattern: string): Promise<string[]> {
    await this.ensureConnection();
    
    try {
      return await this.client!.keys(pattern);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get keys matching pattern ${pattern}: ${errorMessage}`);
      throw new Error(`Failed to get keys matching pattern ${pattern}: ${errorMessage}`);
    }
  }

  /**
   * Flush all data from the cache
   * @returns True if successful
   */
  async flushAll(): Promise<boolean> {
    await this.ensureConnection();
    
    try {
      await this.client!.flushall();
      logger.info('Flushed all data from Redis');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to flush Redis: ${errorMessage}`);
      return false;
    }
  }
} 