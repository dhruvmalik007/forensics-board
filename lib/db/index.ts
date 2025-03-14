/**
 * Database services for agentic operations
 */


// Export types
export interface GraphNode {
  id: string;
  label: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  label: string;
  fromNodeId: string;
  toNodeId: string;
  properties: Record<string, any>;
}

export interface GraphPath {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Create a singleton instance of the database services
 */
import { GraphDatabase } from './graph-database';
import { RedisCache } from './redis-cache';

// Singleton instances
let graphDbInstance: GraphDatabase | null = null;
let redisCacheInstance: RedisCache | null = null;

/**
 * Get the graph database instance
 * @returns GraphDatabase instance
 */
export function getGraphDatabase(): GraphDatabase {
  if (!graphDbInstance) {
    graphDbInstance = new GraphDatabase();
  }
  return graphDbInstance;
}

/**
 * Get the Redis cache instance
 * @returns RedisCache instance
 */
export function getRedisCache(): RedisCache {
  if (!redisCacheInstance) {
    redisCacheInstance = new RedisCache();
  }
  return redisCacheInstance;
} 