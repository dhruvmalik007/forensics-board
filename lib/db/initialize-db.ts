import { config } from 'dotenv';
import { GraphDatabase } from './graph-database';
import { VectorDatabase } from './vector-database';
import { RedisCache } from './redis-cache';
import { 
  NeptuneGraphClient,
  ExecuteQueryCommand,
  ExecuteQueryCommandInput
} from "@aws-sdk/client-neptune-graph";
import {
  ElastiCacheClient,
  DescribeCacheClustersCommand
} from "@aws-sdk/client-elasticache";
import {
  RDSClient,
  DescribeDBInstancesCommand,
  ModifyDBInstanceCommand,
  RebootDBInstanceCommand
} from "@aws-sdk/client-rds";
import { createMySQLClient } from './mysql-client';
import fs from 'fs';
import path from 'path';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Load environment variables
config({
  path: '.env.local',
});

// Create AWS service clients
const rdsClient = new RDSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const neptuneGraphClient = new NeptuneGraphClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const elastiCacheClient = new ElastiCacheClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

let graphDb: GraphDatabase | null = null;
let vectorDb: VectorDatabase | null = null;
let redisCache: RedisCache | null = null;
let mysqlClient: any = null;

/**
 * Initialize RDS MySQL connection
 * @returns MySQL connection client
 */
export async function initRDS() {
  console.log('Initializing AWS RDS MySQL...');
  
  if (!process.env.RDS_ENDPOINT || !process.env.RDS_DB_NAME || !process.env.RDS_USERNAME || !process.env.RDS_PASSWORD) {
    throw new Error('RDS configuration is incomplete. Please check environment variables.');
  }

  try {
    // First, check if the RDS instance is available using the AWS SDK
    const describeParams = {
      DBInstanceIdentifier: process.env.RDS_INSTANCE_ID
    };
    
    if (process.env.RDS_INSTANCE_ID) {
      try {
        const command = new DescribeDBInstancesCommand(describeParams);
        const response = await rdsClient.send(command);
        
        const instance = response.DBInstances?.[0];
        if (instance) {
          console.log(`RDS Instance ${process.env.RDS_INSTANCE_ID} status: ${instance.DBInstanceStatus}`);
          
          // If the instance is not available, we might want to wait or modify settings
          if (instance.DBInstanceStatus !== 'available') {
            console.log(`RDS Instance is not available (${instance.DBInstanceStatus}), operation may fail`);
          }
        }
      } catch (rdsError) {
        console.warn('Failed to get RDS instance information:', rdsError);
        console.warn('Will still attempt to connect to the database');
      }
    }
    
    // Connect to MySQL using the custom client
    mysqlClient = await createMySQLClient({
      host: process.env.RDS_ENDPOINT,
      database: process.env.RDS_DB_NAME,
      user: process.env.RDS_USERNAME,
      password: process.env.RDS_PASSWORD,
      port: parseInt(process.env.RDS_PORT || '3306', 10),
      ssl: process.env.RDS_SSL === 'true'
    });
    
    // Test the connection
    const result = await mysqlClient.query('SELECT 1 as test');
    if (result && result[0] && result[0].test === 1) {
      console.log('✅ RDS MySQL connection successful');
    } else {
      throw new Error('Connection test failed');
    }
    
    return mysqlClient;
  } catch (error) {
    console.error('❌ Failed to initialize RDS MySQL:', error);
    throw error;
  }
}

/**
 * Run database migrations from SQL files
 */
export async function runMigrations() {
  console.log('⏳ Running database migrations...');
  
  try {
    // Ensure we have a MySQL client
    if (!mysqlClient) {
      await initRDS();
    }
    
    // Get all SQL migration files
    const migrationsDir = path.join(process.cwd(), 'lib', 'db', 'migrations');
    const sqlFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure they run in order
    
    console.log(`Found ${sqlFiles.length} migration files`);
    
    // Create migrations table if it doesn't exist
    await mysqlClient.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get already executed migrations
    const executedMigrations = await mysqlClient.query('SELECT name FROM migrations');
    const executedNames = executedMigrations.map(row => row.name);
    
    // Run each migration that hasn't been executed yet
    const start = Date.now();
    let migrationsRun = 0;
    
    for (const file of sqlFiles) {
      if (executedNames.includes(file)) {
        console.log(`Migration ${file} already executed, skipping`);
        continue;
      }
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Start a transaction to ensure migration atomicity
      await mysqlClient.query('START TRANSACTION');
      
      try {
        console.log(`Executing migration: ${file}`);
        await mysqlClient.query(sql);
        
        // Record the migration
        await mysqlClient.query('INSERT INTO migrations (name) VALUES (?)', [file]);
        
        // Commit the transaction
        await mysqlClient.query('COMMIT');
        migrationsRun++;
      } catch (error) {
        // Rollback in case of error
        await mysqlClient.query('ROLLBACK');
        console.error(`Migration ${file} failed:`, error);
        throw error;
      }
    }
    
    const end = Date.now();
    console.log(`✅ Executed ${migrationsRun} migrations in ${end - start} ms`);
    
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Initialize Neptune Graph Database using AWS SDK client-neptune-graph
 * @returns GraphDatabase instance
 */
export async function initGraphDatabase() {
  console.log('Initializing Neptune Graph Database...');
  
  if (!graphDb) {
    try {
      // Check Neptune connection using AWS SDK
      if (process.env.NEPTUNE_GRAPH_ID) {
        try {
          const params: ExecuteQueryCommandInput = {
            queryString: 'MATCH (n) RETURN COUNT(n) LIMIT 1', // Simple test query
            language: 'OPEN_CYPHER',
            graphIdentifier: process.env.NEPTUNE_GRAPH_ID,
          };
          
          const testQuery = new ExecuteQueryCommand(params);
          await neptuneGraphClient.send(testQuery);
          console.log('Neptune Graph connection test successful');
        } catch (neptuneError) {
          console.error('Neptune Graph connection test failed:', neptuneError);
          console.warn('Will still attempt to initialize GraphDatabase');
        }
      }
      
      // Initialize GraphDatabase with Neptune endpoint
      graphDb = new GraphDatabase(
        process.env.NEPTUNE_ENDPOINT,
        process.env.AWS_REGION
      );
      
      const isConnected = await graphDb.connect();
      
      if (isConnected) {
        console.log('✅ Neptune Graph Database initialized successfully');
      } else {
        console.error('❌ Failed to connect to Neptune Graph Database');
        throw new Error('Failed to connect to Neptune Graph Database');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Neptune Graph Database:', error);
      throw error;
    }
  }
  
  return graphDb;
}

/**
 * Initialize Weaviate Vector Database
 * @returns VectorDatabase instance
 */
export async function initVectorDatabase() {
  console.log('Initializing Weaviate Vector Database...');
  
  if (!vectorDb) {
    try {
      vectorDb = new VectorDatabase(
        process.env.WEAVIATE_ENDPOINT,
        process.env.WEAVIATE_API_KEY,
        process.env.OPENAI_API_KEY
      );
      
      const isConnected = await vectorDb.connect();
      
      if (isConnected) {
        console.log('✅ Weaviate Vector Database initialized successfully');
      } else {
        console.error('❌ Failed to connect to Weaviate Vector Database');
        throw new Error('Failed to connect to Weaviate Vector Database');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Weaviate Vector Database:', error);
      throw error;
    }
  }
  
  return vectorDb;
}

/**
 * Initialize Redis Cache with AWS ElastiCache
 * @returns RedisCache instance
 */
export async function initRedisCache() {
  console.log('Initializing Redis Cache with AWS ElastiCache...');
  
  if (!redisCache) {
    try {
      // First verify ElastiCache cluster exists and get connection info
      if (process.env.ELASTICACHE_CLUSTER_ID) {
        const describeCommand = new DescribeCacheClustersCommand({
          CacheClusterId: process.env.ELASTICACHE_CLUSTER_ID,
          ShowCacheNodeInfo: true
        });
        
        try {
          const response = await elastiCacheClient.send(describeCommand);
          const cluster = response.CacheClusters?.[0];
          
          if (cluster && cluster.CacheNodes && cluster.CacheNodes.length > 0) {
            console.log('ElastiCache cluster found and available');
            
            // Get endpoint information from the first cache node
            const endpoint = cluster.CacheNodes[0].Endpoint;
            if (endpoint) {
              // Format the Redis URL using the ElastiCache endpoint
              process.env.REDIS_URL = `redis://${endpoint.Address}:${endpoint.Port}`;
              console.log(`Using ElastiCache endpoint: ${process.env.REDIS_URL}`);
            }
          }
        } catch (elastiCacheError) {
          console.warn('Failed to retrieve ElastiCache cluster info:', elastiCacheError);
          console.warn('Falling back to provided REDIS_URL');
        }
      }
      
      // Initialize RedisCache with the URL (either from ElastiCache or from env vars)
      redisCache = new RedisCache(process.env.REDIS_URL);
      const isConnected = await redisCache.connect();
      
      if (isConnected) {
        console.log('✅ Redis Cache initialized successfully');
      } else {
        console.error('❌ Failed to connect to Redis Cache');
        throw new Error('Failed to connect to Redis Cache');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Redis Cache:', error);
      throw error;
    }
  }
  
  return redisCache;
}

/**
 * Initialize all databases
 */
export async function initAllDatabases() {
  try {
    console.log('🔄 Initializing all databases...');
    
    // Run RDS initialization first
    await initRDS();
    
    // Then run migrations
    await runMigrations();
    
    // Run other initializations in parallel
    await Promise.all([
      initGraphDatabase(),
      initVectorDatabase(),
      initRedisCache()
    ]);
    
    console.log('✅ All databases initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize all databases:', error);
    throw error;
  }
}

/**
 * API route handler for Vercel deployment
 * Can be used to initialize databases from a Vercel serverless function
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Verify authorization (simple token-based auth)
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.DB_INIT_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    await initAllDatabases();
    
    return res.status(200).json({ 
      success: true,
      message: 'All databases initialized successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ 
      success: false,
      error: errorMessage 
    });
  }
}

// If this file is run directly
if (require.main === module) {
  initAllDatabases()
    .then(() => {
      console.log('✅ Database initialization completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Database initialization failed:', error);
      process.exit(1);
    });
} 