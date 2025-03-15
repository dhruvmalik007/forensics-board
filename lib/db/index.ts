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
import { MySQLClient, createMySQLClient } from './mysql-client';

// Singleton instances
let graphDbInstance: GraphDatabase | null = null;
let redisCacheInstance: RedisCache | null = null;
let mysqlClientInstance: MySQLClient | null = null;

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

/**
 * Get the MySQL client instance
 * @returns MySQLClient instance
 */
export async function getMySQLClient(): Promise<MySQLClient> {
  if (!mysqlClientInstance) {
    if (!process.env.RDS_ENDPOINT || !process.env.RDS_DB_NAME || !process.env.RDS_USERNAME || !process.env.RDS_PASSWORD) {
      throw new Error('RDS configuration is incomplete. Please check environment variables.');
    }

    mysqlClientInstance = await createMySQLClient({
      host: process.env.RDS_ENDPOINT,
      database: process.env.RDS_DB_NAME,
      user: process.env.RDS_USERNAME,
      password: process.env.RDS_PASSWORD,
      port: parseInt(process.env.RDS_PORT || '3306', 10),
      ssl: process.env.RDS_SSL === 'true'
    });
  }
  return mysqlClientInstance;
} 