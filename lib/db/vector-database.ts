import { logger } from '../utils';
import weaviate, { WeaviateClient, ApiKey } from 'weaviate-client';
import { v4 as uuidv4 } from 'uuid';

// Collection schemas for different data types
const TRANSACTIONS_COLLECTION = 'Transactions';
const STRATEGIES_COLLECTION = 'Strategies';

// Define interfaces for the data we'll store
interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: string;
  chain: string;
  blockNumber: number;
  category?: string;
  metadata?: Record<string, any>;
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  query: string;
  parameters?: Record<string, any>;
  analysisType: string;
  targetChain?: string;
  createdAt: string;
  updatedAt?: string;
  executionCount?: number;
  successRate?: number;
  metadata?: Record<string, any>;
}

interface SearchParams {
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
}

/**
 * VectorDatabase service for storing and retrieving embeddings using Weaviate
 * This service implements the vector search functionality described in the MVP spec
 */
export class VectorDatabase {
  private client: WeaviateClient | null = null;
  private isConnected: boolean = false;

  /**
   * Create a new VectorDatabase instance
   * @param endpoint Weaviate endpoint URL
   * @param apiKey Weaviate API key
   * @param openaiApiKey OpenAI API key for embeddings
   */
  constructor(
    private endpoint: string = process.env.WEAVIATE_ENDPOINT || '',
    private apiKey: string = process.env.WEAVIATE_API_KEY || '',
    private openaiApiKey: string = process.env.OPENAI_API_KEY || ''
  ) {
    if (!this.endpoint) {
      logger.warn('No Weaviate endpoint provided. Vector database operations will not work.');
    }
  }

  /**
   * Connect to the Weaviate database
   * @returns True if connection was successful
   */
  async connect(): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }

    try {
      if (!this.endpoint) {
        throw new Error('Weaviate endpoint is required for connection');
      }

      logger.info(`Connecting to Weaviate at ${this.endpoint}`);
      
      // Parse the endpoint to get host and port
      const url = new URL(this.endpoint);
      const host = url.hostname;
      const port = url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80);
      const secure = url.protocol === 'https:';
      
      // Connect to Weaviate using v3 client
      this.client = await weaviate.connectToCustom({
        httpHost: host,
        httpPort: port,
        grpcHost: host,
        grpcPort: secure ? 443 : 80,
        httpSecure: secure,
        grpcSecure: secure,
        authCredentials: new ApiKey(this.apiKey),
        headers: {
          'X-OpenAI-Api-Key': this.openaiApiKey
        }
      });
      
      // Initialize collections
      await this.initializeCollections();
      
      this.isConnected = true;
      logger.info('Successfully connected to Weaviate');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to connect to Weaviate: ${errorMessage}`);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Close the connection to Weaviate
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      logger.info('Closed connection to Weaviate');
    }
  }

  /**
   * Initialize collections in Weaviate
   */
  private async initializeCollections(): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    try {
      // Get existing collections
      const collections = await this.client.collections.list();
      const collectionNames = collections.map(c => c.name);
      
      // Create Transactions collection if it doesn't exist
      if (!collectionNames.includes(TRANSACTIONS_COLLECTION)) {
        await this.client.collections.create({
          name: TRANSACTIONS_COLLECTION,
          description: 'Collection for blockchain transaction data with embeddings',
          vectorizer: 'text2vec-openai',
          vectorIndexConfig: {
            distance: 'cosine'
          },
          properties: [
            { name: 'hash', dataType: ['text'], description: 'Transaction hash' },
            { name: 'from', dataType: ['text'], description: 'Sender address' },
            { name: 'to', dataType: ['text'], description: 'Recipient address' },
            { name: 'value', dataType: ['text'], description: 'Transaction value' },
            { name: 'timestamp', dataType: ['text'], description: 'Transaction timestamp' },
            { name: 'chain', dataType: ['text'], description: 'Blockchain name' },
            { name: 'blockNumber', dataType: ['int'], description: 'Block number' },
            { name: 'category', dataType: ['text'], description: 'Transaction category' },
            { name: 'metadata', dataType: ['text'], description: 'Additional metadata in JSON format' }
          ]
        });
        
        logger.info(`Created ${TRANSACTIONS_COLLECTION} collection`);
      }
      
      // Create Strategies collection if it doesn't exist
      if (!collectionNames.includes(STRATEGIES_COLLECTION)) {
        await this.client.collections.create({
          name: STRATEGIES_COLLECTION,
          description: 'Collection for blockchain sleuthing strategies',
          vectorizer: 'text2vec-openai',
          vectorIndexConfig: {
            distance: 'cosine'
          },
          properties: [
            { name: 'name', dataType: ['text'], description: 'Strategy name' },
            { name: 'description', dataType: ['text'], description: 'Strategy description' },
            { name: 'query', dataType: ['text'], description: 'Query context in JSON format' },
            { name: 'parameters', dataType: ['text'], description: 'Strategy parameters in JSON format' },
            { name: 'analysisType', dataType: ['text'], description: 'Type of analysis' },
            { name: 'targetChain', dataType: ['text'], description: 'Target blockchain' },
            { name: 'createdAt', dataType: ['text'], description: 'Creation timestamp' },
            { name: 'updatedAt', dataType: ['text'], description: 'Last updated timestamp' },
            { name: 'executionCount', dataType: ['int'], description: 'Number of executions' },
            { name: 'successRate', dataType: ['number'], description: 'Success rate (0-100)' },
            { name: 'metadata', dataType: ['text'], description: 'Additional metadata in JSON format' }
          ]
        });
        
        logger.info(`Created ${STRATEGIES_COLLECTION} collection`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to initialize collections: ${errorMessage}`);
      throw new Error(`Failed to initialize collections: ${errorMessage}`);
    }
  }

  /**
   * Ensure connection before performing operations
   */
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) {
        throw new Error('Failed to connect to Weaviate');
      }
    }
  }

  /**
   * Store a transaction in the vector database
   * @param transaction Transaction data
   * @returns Transaction ID (hash)
   */
  async storeTransaction(transaction: Transaction): Promise<string> {
    await this.ensureConnection();
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      logger.info(`Storing transaction ${transaction.hash}`);
      
      // Get the Transactions collection
      const transactionCollection = this.client.collections.get(TRANSACTIONS_COLLECTION);
      
      // Store transaction data
      await transactionCollection.data.insert({
        ...transaction,
        metadata: transaction.metadata ? JSON.stringify(transaction.metadata) : undefined
      });
      
      logger.info(`Successfully stored transaction ${transaction.hash}`);
      return transaction.hash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to store transaction: ${errorMessage}`);
      throw new Error(`Failed to store transaction: ${errorMessage}`);
    }
  }

  /**
   * Store multiple transactions in batch
   * @param transactions Array of transactions
   * @returns Array of transaction IDs (hashes)
   */
  async storeTransactions(transactions: Transaction[]): Promise<string[]> {
    await this.ensureConnection();
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      logger.info(`Storing ${transactions.length} transactions in batch`);
      
      // Get the Transactions collection
      const transactionCollection = this.client.collections.get(TRANSACTIONS_COLLECTION);
      
      // Process transactions in batches of 100
      const batchSize = 100;
      const transactionIds: string[] = [];
      
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        
        // Prepare batch for insertion
        const objects = batch.map(tx => ({
          ...tx,
          metadata: tx.metadata ? JSON.stringify(tx.metadata) : undefined
        }));
        
        // Insert batch
        await transactionCollection.data.insertMany(objects);
        
        // Collect transaction IDs
        transactionIds.push(...batch.map(tx => tx.hash));
      }
      
      logger.info(`Successfully stored ${transactionIds.length} transactions`);
      return transactionIds;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to store transactions in batch: ${errorMessage}`);
      throw new Error(`Failed to store transactions in batch: ${errorMessage}`);
    }
  }

  /**
   * Store a strategy in the vector database
   * @param strategy Strategy data without ID and createdAt
   * @returns Generated strategy ID
   */
  async storeStrategy(strategy: Omit<Strategy, 'id' | 'createdAt'>): Promise<string> {
    await this.ensureConnection();
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      logger.info(`Storing new strategy`);
      
      // Generate ID and timestamps
      const id = uuidv4();
      const now = new Date().toISOString();
      
      // Get the Strategies collection
      const strategyCollection = this.client.collections.get(STRATEGIES_COLLECTION);
      
      // Store strategy data
      await strategyCollection.data.insert({
        id,
        ...strategy,
        parameters: strategy.parameters ? JSON.stringify(strategy.parameters) : undefined,
        metadata: strategy.metadata ? JSON.stringify(strategy.metadata) : undefined,
        createdAt: now,
        updatedAt: now,
        executionCount: 0,
        successRate: 0
      });
      
      logger.info(`Successfully stored strategy with ID ${id}`);
      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to store strategy: ${errorMessage}`);
      throw new Error(`Failed to store strategy: ${errorMessage}`);
    }
  }

  /**
   * Update a strategy in the vector database
   * @param id Strategy ID
   * @param updates Partial strategy data
   * @returns True if update was successful
   */
  async updateStrategy(id: string, updates: Partial<Omit<Strategy, 'id' | 'createdAt'>>): Promise<boolean> {
    await this.ensureConnection();
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      logger.info(`Updating strategy ${id}`);
      
      // Prepare update data
      const now = new Date().toISOString();
      const updateData = {
        ...updates,
        parameters: updates.parameters ? JSON.stringify(updates.parameters) : undefined,
        metadata: updates.metadata ? JSON.stringify(updates.metadata) : undefined,
        updatedAt: now
      };
      
      // Update the strategy
      const strategyCollection = this.client.collections.get(STRATEGIES_COLLECTION);
      await strategyCollection.data.update(
        { id, ...updateData }
      );
      
      logger.info(`Successfully updated strategy ${id}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to update strategy: ${errorMessage}`);
      throw new Error(`Failed to update strategy: ${errorMessage}`);
    }
  }

  /**
   * Track strategy execution and update success rate
   * @param id Strategy ID
   * @param success Whether execution was successful
   * @returns Updated executionCount and successRate
   */
  async trackStrategyExecution(id: string, success: boolean): Promise<{executionCount: number, successRate: number}> {
    await this.ensureConnection();
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      logger.info(`Tracking execution for strategy ${id}, success: ${success}`);
      
      // Get the strategy
      const strategyCollection = this.client.collections.get(STRATEGIES_COLLECTION);
      const result = await strategyCollection.query.fetch({
        filter: {
          path: ['id'],
          operator: 'Equal',
          valueText: id
        }
      });
      
      if (!result.data || result.data.length === 0) {
        throw new Error(`Strategy with ID ${id} not found`);
      }
      
      const strategy = result.data[0];
      
      // Calculate new execution count and success rate
      const executionCount = (strategy.executionCount || 0) + 1;
      const successCount = success 
        ? (strategy.successRate || 0) * (strategy.executionCount || 0) / 100 + 1
        : (strategy.successRate || 0) * (strategy.executionCount || 0) / 100;
      const successRate = Math.round((successCount / executionCount) * 100);
      
      // Update the strategy
      await strategyCollection.data.update({
        id,
        executionCount,
        successRate,
        updatedAt: new Date().toISOString()
      });
      
      logger.info(`Successfully tracked execution for strategy ${id}`);
      return { executionCount, successRate };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to track strategy execution: ${errorMessage}`);
      throw new Error(`Failed to track strategy execution: ${errorMessage}`);
    }
  }

  /**
   * Search for transactions similar to a query
   * @param query Search query
   * @param params Search parameters
   * @returns Array of matching transactions
   */
  async searchSimilarTransactions(query: string, params: SearchParams = {}): Promise<any[]> {
    await this.ensureConnection();
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      logger.info(`Searching for transactions similar to: ${query}`);
      
      const transactionCollection = this.client.collections.get(TRANSACTIONS_COLLECTION);
      
      // Build the query
      let filter = undefined;
      
      // Apply filters if provided
      if (params.filters) {
        filter = this.buildWhereFilter(params.filters);
      }
      
      // Execute the search
      const result = await transactionCollection.query.nearText({
        query,
        filter,
        limit: params.limit,
        offset: params.offset
      });
      
      if (!result.data) {
        return [];
      }
      
      // Format the results
      return result.data.map(item => {
        // Parse JSON fields
        const metadata = item.metadata ? JSON.parse(item.metadata as string) : undefined;
        
        return {
          ...item,
          metadata
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to search similar transactions: ${errorMessage}`);
      return [];
    }
  }

  /**
   * Find strategies similar to a description
   * @param description Strategy description to match
   * @param analysisType Optional analysis type filter
   * @param params Search parameters
   * @returns Array of matching strategies
   */
  async findSimilarStrategies(description: string, analysisType?: string, params: SearchParams = {}): Promise<any[]> {
    await this.ensureConnection();
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      logger.info(`Finding strategies similar to: ${description}`);
      
      const strategyCollection = this.client.collections.get(STRATEGIES_COLLECTION);
      
      // Build the query
      let searchBuilder = strategyCollection.query.nearText({
        concepts: [description],
      });
      
      // Apply filters
      const filters: Record<string, any> = { ...params.filters };
      
      // Add analysis type filter if provided
      if (analysisType) {
        filters.analysisType = analysisType;
      }
      
      if (Object.keys(filters).length > 0) {
        const whereFilter = this.buildWhereFilter(filters);
        if (whereFilter) {
          searchBuilder = searchBuilder.withWhere(whereFilter);
        }
      }
      
      // Apply pagination
      if (params.limit) {
        searchBuilder = searchBuilder.withLimit(params.limit);
      }
      if (params.offset) {
        searchBuilder = searchBuilder.withOffset(params.offset);
      }
      
      // Execute the search
      const result = await searchBuilder.do();
      
      if (!result.data || !result.data.Get || !result.data.Get[STRATEGIES_COLLECTION]) {
        return [];
      }
      
      const strategies = result.data.Get[STRATEGIES_COLLECTION];
      
      // Parse the JSON fields
      return strategies.map((strategy: any) => ({
        ...strategy,
        parameters: strategy.parameters ? JSON.parse(strategy.parameters) : {},
        metadata: strategy.metadata ? JSON.parse(strategy.metadata) : {},
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to find similar strategies: ${errorMessage}`);
      throw new Error(`Failed to find similar strategies: ${errorMessage}`);
    }
  }

  /**
   * Get transactions for a specific address
   * @param address Blockchain address
   * @param chain Optional blockchain name
   * @param params Search parameters
   * @returns Array of transactions
   */
  async getTransactionsForAddress(address: string, chain?: string, params: SearchParams = {}): Promise<any[]> {
    await this.ensureConnection();
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      logger.info(`Getting transactions for address ${address}${chain ? ` on chain ${chain}` : ''}`);
      
      const transactionCollection = this.client.collections.get(TRANSACTIONS_COLLECTION);
      
      // Build the filters
      const filters: Record<string, any> = {
        ...params.filters,
      };
      
      // Address can be either sender or receiver
      const addressFilter = {
        operator: 'Or',
        operands: [
          {
            path: ['from'],
            operator: 'Equal',
            valueText: address
          },
          {
            path: ['to'],
            operator: 'Equal',
            valueText: address
          }
        ]
      };
      
      // Add chain filter if provided
      if (chain) {
        filters.chain = chain;
      }
      
      // Build the query
      let queryBuilder = transactionCollection.query.get();
      
      // Apply the address filter
      queryBuilder = queryBuilder.withWhere(addressFilter);
      
      // Apply additional filters
      if (Object.keys(filters).length > 0) {
        const whereFilter = this.buildWhereFilter(filters);
        if (whereFilter) {
          // Need to combine with address filter
          const combinedFilter = {
            operator: 'And',
            operands: [addressFilter, whereFilter]
          };
          queryBuilder = transactionCollection.query.get().withWhere(combinedFilter);
        }
      }
      
      // Apply pagination
      if (params.limit) {
        queryBuilder = queryBuilder.withLimit(params.limit);
      }
      if (params.offset) {
        queryBuilder = queryBuilder.withOffset(params.offset);
      }
      
      // Execute the query
      const result = await queryBuilder.do();
      
      if (!result.data || !result.data.Get || !result.data.Get[TRANSACTIONS_COLLECTION]) {
        return [];
      }
      
      const transactions = result.data.Get[TRANSACTIONS_COLLECTION];
      
      // Parse the JSON fields
      return transactions.map((tx: any) => ({
        ...tx,
        metadata: tx.metadata ? JSON.parse(tx.metadata) : {},
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get transactions for address: ${errorMessage}`);
      throw new Error(`Failed to get transactions for address: ${errorMessage}`);
    }
  }

  /**
   * Get a strategy by ID
   * @param id Strategy ID
   * @returns Strategy data
   */
  async getStrategyById(id: string): Promise<any | null> {
    await this.ensureConnection();
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      logger.info(`Getting strategy with ID ${id}`);
      
      const strategyCollection = this.client.collections.get(STRATEGIES_COLLECTION);
      
      // Execute the query
      const result = await strategyCollection.query.fetchObjects({
        where: {
          path: ['id'],
          operator: 'Equal',
          valueText: id
        }
      });
      
      if (!result.data || result.data.length === 0) {
        return null;
      }
      
      const strategy = result.data[0];
      
      // Parse the JSON fields
      return {
        ...strategy,
        parameters: strategy.parameters ? JSON.parse(strategy.parameters) : {},
        metadata: strategy.metadata ? JSON.parse(strategy.metadata) : {},
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get strategy by ID: ${errorMessage}`);
      throw new Error(`Failed to get strategy by ID: ${errorMessage}`);
    }
  }

  /**
   * Get all strategies of a specific type
   * @param analysisType Analysis type
   * @param params Search parameters
   * @returns Array of strategies
   */
  async getStrategiesByType(analysisType: string, params: SearchParams = {}): Promise<any[]> {
    await this.ensureConnection();
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      logger.info(`Getting strategies of type ${analysisType}`);
      
      const strategyCollection = this.client.collections.get(STRATEGIES_COLLECTION);
      
      // Build the query
      let queryBuilder = strategyCollection.query.get().withWhere({
        path: ['analysisType'],
        operator: 'Equal',
        valueText: analysisType
      });
      
      // Apply additional filters
      if (params.filters) {
        const whereFilter = this.buildWhereFilter(params.filters);
        if (whereFilter) {
          // Need to combine with analysis type filter
          const combinedFilter = {
            operator: 'And',
            operands: [
              {
                path: ['analysisType'],
                operator: 'Equal',
                valueText: analysisType
              },
              whereFilter
            ]
          };
          queryBuilder = strategyCollection.query.get().withWhere(combinedFilter);
        }
      }
      
      // Apply pagination
      if (params.limit) {
        queryBuilder = queryBuilder.withLimit(params.limit);
      }
      if (params.offset) {
        queryBuilder = queryBuilder.withOffset(params.offset);
      }
      
      // Execute the query
      const result = await queryBuilder.do();
      
      if (!result.data || !result.data.Get || !result.data.Get[STRATEGIES_COLLECTION]) {
        return [];
      }
      
      const strategies = result.data.Get[STRATEGIES_COLLECTION];
      
      // Parse the JSON fields
      return strategies.map((strategy: any) => ({
        ...strategy,
        parameters: strategy.parameters ? JSON.parse(strategy.parameters) : {},
        metadata: strategy.metadata ? JSON.parse(strategy.metadata) : {},
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get strategies by type: ${errorMessage}`);
      throw new Error(`Failed to get strategies by type: ${errorMessage}`);
    }
  }

  /**
   * Delete a strategy
   * @param id Strategy ID
   * @returns True if successful
   */
  async deleteStrategy(id: string): Promise<boolean> {
    await this.ensureConnection();
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      logger.info(`Deleting strategy with ID ${id}`);
      
      const strategyCollection = this.client.collections.get(STRATEGIES_COLLECTION);
      await strategyCollection.data.delete(id);
      
      logger.info(`Successfully deleted strategy ${id}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to delete strategy: ${errorMessage}`);
      throw new Error(`Failed to delete strategy: ${errorMessage}`);
    }
  }

  /**
   * Get transaction by hash
   * @param hash Transaction hash
   * @param chain Optional blockchain name
   * @returns Transaction data or null if not found
   */
  async getTransactionByHash(hash: string, chain?: string): Promise<any | null> {
    await this.ensureConnection();
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      logger.info(`Getting transaction with hash ${hash}`);
      
      const transactionCollection = this.client.collections.get(TRANSACTIONS_COLLECTION);
      
      // Build the query filter
      let whereFilter: any = {
        path: ['hash'],
        operator: 'Equal',
        valueText: hash
      };
      
      // Add chain filter if provided
      if (chain) {
        whereFilter = {
          operator: 'And',
          operands: [
            whereFilter,
            {
              path: ['chain'],
              operator: 'Equal',
              valueText: chain
            }
          ]
        };
      }
      
      // Execute the query
      const result = await transactionCollection.query.fetchObjects({
        where: whereFilter
      });
      
      if (!result.data || result.data.length === 0) {
        return null;
      }
      
      const transaction = result.data[0];
      
      // Parse the JSON fields
      return {
        ...transaction,
        metadata: transaction.metadata ? JSON.parse(transaction.metadata) : {},
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get transaction by hash: ${errorMessage}`);
      throw new Error(`Failed to get transaction by hash: ${errorMessage}`);
    }
  }

  /**
   * Build a where filter for Weaviate queries
   * @param filters Filter object
   * @returns Weaviate where filter
   */
  private buildWhereFilter(filters: Record<string, any>): any {
    if (!filters || Object.keys(filters).length === 0) {
      return null;
    }
    
    const operands = Object.entries(filters).map(([key, value]) => {
      if (typeof value === 'string') {
        return {
          path: [key],
          operator: 'Equal',
          valueText: value
        };
      } else if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          return {
            path: [key],
            operator: 'Equal',
            valueInt: value
          };
        } else {
          return {
            path: [key],
            operator: 'Equal',
            valueNumber: value
          };
        }
      } else if (typeof value === 'boolean') {
        return {
          path: [key],
          operator: 'Equal',
          valueBoolean: value
        };
      } else {
        // For complex filters, assume it's already in the correct format
        return value;
      }
    });
    
    if (operands.length === 1) {
      return operands[0];
    }
    
    return {
      operator: 'And',
      operands
    };
  }

  /**
   * Store a strategy from scratch when no similar strategies are found
   * @param context The strategy context
   * @param analysisRequest The user's analysis request
   * @param result The strategy execution result
   * @returns The stored strategy ID
   */
  async storeNewStrategy(
    context: {
      address: string,
      blockchainType: string,
      strategyId: string,
      params?: Record<string, any>
    },
    analysisRequest: string,
    result: any
  ): Promise<string> {
    await this.ensureConnection();
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      logger.info(`Storing new strategy from analysis request`);
      
      // Generate a unique ID
      const id = uuidv4();
      const now = new Date().toISOString();
      
      // Create a more descriptive strategy name based on the request
      const name = `${context.blockchainType.toUpperCase()} Strategy - ${
        analysisRequest.length > 30 
          ? analysisRequest.substring(0, 30) + '...' 
          : analysisRequest
      }`;
      
      // Store the strategy
      const strategyCollection = this.client.collections.get(STRATEGIES_COLLECTION);
      await strategyCollection.data.insert({
        id,
        name,
        description: analysisRequest,
        query: JSON.stringify(context),
        parameters: JSON.stringify(context.params || {}),
        analysisType: context.strategyId,
        targetChain: context.blockchainType,
        createdAt: now,
        updatedAt: now,
        executionCount: 1,
        successRate: 100,
        metadata: JSON.stringify({
          initialAddress: context.address,
          resultNodes: result.nodes.length,
          resultEdges: result.edges.length
        })
      });
      
      logger.info(`Successfully stored new strategy with ID ${id}`);
      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to store new strategy: ${errorMessage}`);
      throw new Error(`Failed to store new strategy: ${errorMessage}`);
    }
  }
  
  /**
   * Associate transaction data with a strategy
   * @param strategyId The ID of the strategy that generated the transactions
   * @param transactions The transaction data to store
   * @returns Array of stored transaction IDs
   */
  async storeStrategyTransactions(
    strategyId: string,
    transactions: any[]
  ): Promise<string[]> {
    await this.ensureConnection();
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      logger.info(`Storing ${transactions.length} transactions for strategy ${strategyId}`);
      
      // Get strategy details
      const strategy = await this.getStrategyById(strategyId);
      if (!strategy) {
        throw new Error(`Strategy with ID ${strategyId} not found`);
      }
      
      // Store transactions with strategy context
      const transactionIds = await this.storeTransactions(
        transactions.map(tx => ({
          ...tx,
          metadata: {
            ...(tx.metadata || {}),
            strategyId,
            strategyName: strategy.name
          }
        }))
      );
      
      // Update strategy with new transaction count
      await this.updateStrategy(strategyId, {
        metadata: {
          ...(strategy.metadata || {}),
          transactionCount: (strategy.metadata?.transactionCount || 0) + transactions.length
        }
      });
      
      return transactionIds;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to store strategy transactions: ${errorMessage}`);
      throw new Error(`Failed to store strategy transactions: ${errorMessage}`);
    }
  }
}

// Export a singleton instance
export const vectorDatabase = new VectorDatabase(); 