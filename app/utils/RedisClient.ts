import { createClient, RedisClientType } from 'redis';

/**
 * Redis client wrapper using singleton pattern to ensure only one connection is established
 */
export const getRedisClient = (() => {
  // Create a variable in the closure to hold our instance
  let client: RedisClientType | null = null;
  
  // Return a function that creates the instance only once
  return async () => {
    // If we already have an instance and it's connected, return it
    if (client?.isOpen) {
      return client;
    }
    
    // Check for required environment variables
    const host = process.env.REDIS_HOST;
    const port = process.env.REDIS_PORT;
    const username = process.env.REDIS_USERNAME;
    const password = process.env.REDIS_PASSWORD;
    
    if (!host || !port) {
      throw new Error("REDIS_HOST and REDIS_PORT environment variables are required");
    }
    
    // Create Redis client with authentication if credentials are provided
    const url = username && password
      ? `redis://${username}:${password}@${host}:${port}`
      : `redis://${host}:${port}`;
    
    try {
      // Create and connect to Redis
      client = createClient({ url });
      
      // Set up error handler
      client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });
      
      // Connect to Redis
      await client.connect();
      console.log('Successfully connected to Redis');
      
      return client;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  };
})();

/**
 * Helper function to set a value in Redis with optional expiration
 * @param key The key to set
 * @param value The value to set
 * @param expiryInSeconds Optional expiration time in seconds
 */
export async function setRedisValue(key: string, value: string, expiryInSeconds?: number): Promise<void> {
  try {
    const client = await getRedisClient();
    
    if (expiryInSeconds) {
      await client.set(key, value, { EX: expiryInSeconds });
    } else {
      await client.set(key, value);
    }
  } catch (error) {
    console.error(`Error setting Redis value for key ${key}:`, error);
    throw error;
  }
}

/**
 * Helper function to get a value from Redis
 * @param key The key to retrieve
 * @returns The value or null if not found
 */
export async function getRedisValue(key: string): Promise<string | null> {
  try {
    const client = await getRedisClient();
    return await client.get(key);
  } catch (error) {
    console.error(`Error getting Redis value for key ${key}:`, error);
    throw error;
  }
}

/**
 * Helper function to delete a key from Redis
 * @param key The key to delete
 */
export async function deleteRedisKey(key: string): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.del(key);
  } catch (error) {
    console.error(`Error deleting Redis key ${key}:`, error);
    throw error;
  }
}

/**
 * Helper function to check if a key exists in Redis
 * @param key The key to check
 * @returns True if the key exists, false otherwise
 */
export async function hasRedisKey(key: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    console.error(`Error checking if Redis key ${key} exists:`, error);
    throw error;
  }
}

/**
 * Helper function to set a key with a JSON value
 * @param key The key to set
 * @param value The object to store as JSON
 * @param expiryInSeconds Optional expiration time in seconds
 */
export async function setRedisJson<T>(key: string, value: T, expiryInSeconds?: number): Promise<void> {
  try {
    const jsonValue = JSON.stringify(value);
    await setRedisValue(key, jsonValue, expiryInSeconds);
  } catch (error) {
    console.error(`Error setting Redis JSON for key ${key}:`, error);
    throw error;
  }
}

/**
 * Helper function to get a JSON value from Redis
 * @param key The key to retrieve
 * @returns The parsed object or null if not found
 */
export async function getRedisJson<T>(key: string): Promise<T | null> {
  try {
    const value = await getRedisValue(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Error getting Redis JSON for key ${key}:`, error);
    throw error;
  }
} 