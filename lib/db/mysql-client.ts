import mysql from 'mysql2/promise';

export interface MySQLConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

export interface MySQLClient {
  query: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
  execute: <T = any>(sql: string, params?: any[]) => Promise<[T[], any]>;
  close: () => Promise<void>;
}

/**
 * Create a MySQL client for interacting with RDS MySQL
 * @param config MySQL connection configuration
 * @returns MySQL client with query and execute methods
 */
export async function createMySQLClient(config: MySQLConfig): Promise<MySQLClient> {
  // Create connection pool
  const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl ? {
      rejectUnauthorized: true
    } : undefined,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
  });

  // Test the connection
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log('MySQL connection pool created successfully');
  } catch (error) {
    console.error('Failed to create MySQL connection pool:', error);
    throw error;
  }

  return {
    /**
     * Execute a query and return the results
     * @param sql SQL query
     * @param params Query parameters
     * @returns Query results as an array
     */
    query: async <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
      const [rows] = await pool.query<mysql.RowDataPacket[]>(sql, params);
      return rows as T[];
    },

    /**
     * Execute a query and return the results with field info
     * @param sql SQL query
     * @param params Query parameters
     * @returns Tuple of [results, fields]
     */
    execute: async <T = any>(sql: string, params: any[] = []): Promise<[T[], any]> => {
      return pool.execute(sql, params) as Promise<[T[], any]>;
    },

    /**
     * Close the connection pool
     */
    close: async (): Promise<void> => {
      await pool.end();
      console.log('MySQL connection pool closed');
    }
  };
} 