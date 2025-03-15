import { getRedisValue, setRedisValue, hasRedisKey } from './RedisClient';

/**
 * Creates a cached version of an async function using Redis for storage
 * 
 * @param fn The async function to cache
 * @param cacheTime Cache duration in seconds
 * @param serialiseKey Function to convert arguments to a cache key string
 * @param serialiseValue Function to convert the result to a string for storage
 * @param parseValue Function to parse the stored string back to the original type
 * @returns A wrapped function that uses caching
 */
export const constructCachedAsyncFn = <U, T = void>(
  fn: (args: T) => Promise<U>,
  cacheTime: number,
  serialiseKey: (args: T) => string = JSON.stringify,
  serialiseValue: (value: U) => string = JSON.stringify,
  parseValue: (str: string) => U = JSON.parse,
) => {
  /**
   * The wrapped function that implements caching
   * @param args Arguments to pass to the original function
   * @returns The cached result or a fresh result if cache miss
   */
  return async (args: T): Promise<U> => {
    // Create a cache key based on the function name and arguments
    const fnName = fn.name || 'anonymous';
    const argKey = serialiseKey(args);
    const cacheKey = `cached_fn:${fnName}:${argKey}`;
    
    try {
      // Check if we have a cached result
      const exists = await hasRedisKey(cacheKey);
      
      if (exists) {
        // Cache hit - return the cached value
        const cachedValue = await getRedisValue(cacheKey);
        if (cachedValue) {
          return parseValue(cachedValue);
        }
      }
      
      // Cache miss - execute the function
      const result = await fn(args);
      
      // Store the result in cache
      const serializedResult = serialiseValue(result);
      await setRedisValue(cacheKey, serializedResult, cacheTime);
      
      return result;
    } catch (error) {
      // If there's any error with caching, fall back to the original function
      console.error(`Cache error for ${cacheKey}:`, error);
      return fn(args);
    }
  };
};

/**
 * Creates a cached version of an async function using in-memory storage
 * Useful for testing or when Redis is not available
 * 
 * @param fn The async function to cache
 * @param cacheTime Cache duration in seconds
 * @param serialiseKey Function to convert arguments to a cache key string
 * @returns A wrapped function that uses in-memory caching
 */
export const constructInMemoryCachedAsyncFn = <U, T = void>(
  fn: (args: T) => Promise<U>,
  cacheTime: number,
  serialiseKey: (args: T) => string = JSON.stringify,
) => {
  // In-memory cache storage
  const cache = new Map<string, { value: U; expiry: number }>();
  
  /**
   * The wrapped function that implements in-memory caching
   * @param args Arguments to pass to the original function
   * @returns The cached result or a fresh result if cache miss
   */
  return async (args: T): Promise<U> => {
    // Create a cache key based on the function name and arguments
    const fnName = fn.name || 'anonymous';
    const argKey = serialiseKey(args);
    const cacheKey = `${fnName}:${argKey}`;
    
    const now = Date.now();
    
    // Check if we have a valid cached result
    if (cache.has(cacheKey)) {
      const cachedItem = cache.get(cacheKey)!;
      
      // Check if the cached item is still valid
      if (cachedItem.expiry > now) {
        return cachedItem.value;
      }
      
      // Expired item, remove it
      cache.delete(cacheKey);
    }
    
    // Cache miss - execute the function
    const result = await fn(args);
    
    // Store the result in cache with expiry
    const expiry = now + (cacheTime * 1000);
    cache.set(cacheKey, { value: result, expiry });
    
    return result;
  };
}; 