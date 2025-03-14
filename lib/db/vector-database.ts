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
   * @param apiKey API key for authentication
   */
  constructor(
    private endpoint: string = process.env.WEAVIATE_ENDPOINT || '',
    private apiKey: string = process.env.WEAVIATE_API_KEY || '',
    private openaiApiKey: string = process.env.OPENAI_API_KEY || ''
  ) {
    if (!this.endpoint) {
      logger.warn('No Weaviate endpoint provided. Vector database operations will not work.');
    }
    if (!this.apiKey) {
      logger.warn('No Weaviate API key provided. Vector database operations will not work.');
    }
  }

  /**
   * Connect to the Weaviate instance
   */
  async connect(): Promise<boolean> {
    if (this.isConnected && this.client) {
      return true;
    }

    try {
      if (!this.endpoint) {
        throw new Error('Weaviate endpoint is required for connection');
      }
      if (!this.apiKey) {
        throw new Error('Weaviate API key is required for connection');
      }

      logger.info(`Connecting to Weaviate at ${this.endpoint}`);
      
      this.client = await weaviate.connectToCustom({
        httpHost: this.endpoint,
        httpPort: 443,
        httpSecure: true,
        grpcHost: this.endpoint,
        grpcPort: 443,
        grpcSecure: true,
        authCredentials: new ApiKey(this.apiKey),
        headers: {
          'X-OpenAI-Api-Key': this.openaiApiKey
        }
      });
      
      this.isConnected = true;
      logger.info('Successfully connected to Weaviate');
      
      // Initialize collections if they don't exist
      await this.initializeCollections();
      
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
   * Initialize collections if they don't exist
   * This creates the necessary schema for our collections
   */
  private async initializeCollections(): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    try {
      // Check if collections exist
      const collectionsData = await this.client.schema.objects.get();
      const collections = collectionsData.objects || [];
      const collectionNames = collections.map(c => c.class);

      // Create Transactions collection if it doesn't exist
      if (!collectionNames.includes(TRANSACTIONS_COLLECTION)) {
        await this.client.schema.classCreator()
          .withClass({
            class: TRANSACTIONS_COLLECTION,
            description: 'Collection for blockchain transaction data with embeddings',
            vectorizer: 'text2vec-openai', // Using OpenAI for embeddings
            moduleConfig: {
              'text2vec-openai': {
                model: 'ada',
                modelVersion: '002',
                type: 'text'
              }
            },
            properties: [
              {
                name: 'hash',
                description: 'Transaction hash',
                dataType: ['text'],
              },
              {
                name: 'from',
                description: 'Sender address',
                dataType: ['text'],
                indexFilterable: true,
                indexSearchable: true,
              },
              {
                name: 'to',
                description: 'Receiver address',
                dataType: ['text'],
                indexFilterable: true,
                indexSearchable: true,
              },
              {
                name: 'value',
                description: 'Transaction value',
                dataType: ['text'],
              },
              {
                name: 'timestamp',
                description: 'Transaction timestamp',
                dataType: ['date'],
                indexFilterable: true,
              },
              {
                name: 'chain',
                description: 'Blockchain name',
                dataType: ['text'],
                indexFilterable: true,
              },
              {
                name: 'blockNumber',
                description: 'Block number',
                dataType: ['int'],
                indexFilterable: true,
              },
              {
                name: 'category',
                description: 'Transaction category',
                dataType: ['text'],
                indexFilterable: true,
              },
              {
                name: 'metadata',
                description: 'Additional transaction metadata',
                dataType: ['text'],
              },
              {
                name: 'content',
                description: 'Transaction summary for vector embedding',
                dataType: ['text'],
                moduleConfig: {
                  'text2vec-openai': {
                    skip: false,
                    vectorizePropertyName: true,
                  }
                },
              }
            ]
          })
          .do();
        
        logger.info(`Created ${TRANSACTIONS_COLLECTION} collection`);
      }

      // Create Strategies collection if it doesn't exist
      if (!collectionNames.includes(STRATEGIES_COLLECTION)) {
        await this.client.schema.classCreator()
          .withClass({
            class: STRATEGIES_COLLECTION,
            description: 'Collection for blockchain sleuthing strategies',
            vectorizer: 'text2vec-openai',
            moduleConfig: {
              'text2vec-openai': {
                model: 'ada',
                modelVersion: '002',
                type: 'text'
              }
            },
            properties: [
              {
                name: 'id',
                description: 'Strategy ID',
                dataType: ['text'],
                indexFilterable: true,
              },
              {
                name: 'name',
                description: 'Strategy name',
                dataType: ['text'],
                indexFilterable: true,
                indexSearchable: true,
              },
              {
                name: 'description',
                description: 'Strategy description',
                dataType: ['text'],
                moduleConfig: {
                  'text2vec-openai': {
                    skip: false,
                    vectorizePropertyName: true,
                  }
                },
              },
              {
                name: 'query',
                description: 'Strategy query execution code',
                dataType: ['text'],
              },
              {
                name: 'parameters',
                description: 'Strategy parameters',
                dataType: ['text'],
              },
              {
                name: 'analysisType',
                description: 'Type of analysis',
                dataType: ['text'],
                indexFilterable: true,
              },
              {
                name: 'targetChain',
                description: 'Target blockchain',
                dataType: ['text'],
                indexFilterable: true,
              },
              {
                name: 'createdAt',
                description: 'Creation timestamp',
                dataType: ['date'],
                indexFilterable: true,
              },
              {
                name: 'updatedAt',
                description: 'Last update timestamp',
                dataType: ['date'],
                indexFilterable: true,
              },
              {
                name: 'executionCount',
                description: 'Number of executions',
                dataType: ['int'],
              },
              {
                name: 'successRate',
                description: 'Success rate',
                dataType: ['number'],
              },
              {
                name: 'metadata',
                description: 'Additional strategy metadata',
                dataType: ['text'],
              }
            ]
          })
          .do();
        
        logger.info(`Created ${STRATEGIES_COLLECTION} collection`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to initialize collections: ${errorMessage}`);
      throw new Error(`Failed to initialize collections: ${errorMessage}`);
    }
  }

  /**
   * Ensure connection is established before performing operations
   */
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected || !this.client) {
      const connected = await this.connect();
      if (!connected) {
        throw new Error('Failed to connect to Weaviate database');
      }
    }
  }

  /**
   * Store a transaction in the vector database
   * @param transaction Transaction data
   * @returns The ID of the stored transaction
   */
  async storeTransaction(transaction: Transaction): Promise<string> {
    await this.ensureConnection();
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      logger.info(`Storing transaction ${transaction.hash} in vector database`);
      
      // Generate a unique ID if not provided
      const id = uuidv4();
      
      // Create a content field that combines important transaction data for embedding
      const content = `
        Transaction ${transaction.hash} from ${transaction.from} to ${transaction.to} 
        with value ${transaction.value} on chain ${transaction.chain} 
        at block ${transaction.blockNumber} timestamp ${transaction.timestamp}
        in category ${transaction.category || 'unknown'}
      `.trim();
      
      // Store the transaction
      const transactionCollection = this.client.collections.get(TRANSACTIONS_COLLECTION);
      await transactionCollection.data.insert({
        id,
        hash: transaction.hash,
        from: transaction.from,
        to: transaction.to,
        value: transaction.value,
        timestamp: transaction.timestamp,
        chain: transaction.chain,
        blockNumber: transaction.blockNumber,
        category: transaction.category || 'unknown',
        metadata: JSON.stringify(transaction.metadata || {}),
        content
      });
      
      logger.info(`Successfully stored transaction ${transaction.hash} with ID ${id}`);
      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to store transaction: ${errorMessage}`);
      throw new Error(`Failed to store transaction: ${errorMessage}`);
    }
  }

  /**
   * Store multiple transactions in the vector database
   * @param transactions Array of transaction data
   * @returns Array of stored transaction IDs
   */
  async storeTransactions(transactions: Transaction[]): Promise<string[]> {
    await this.ensureConnection();
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      logger.info(`Storing ${transactions.length} transactions in vector database`);
      
      const transactionCollection = this.client.collections.get(TRANSACTIONS_COLLECTION);
      const objects = transactions.map(transaction => {
        const id = uuidv4();
        
        // Create a content field that combines important transaction data for embedding
        const content = `
          Transaction ${transaction.hash} from ${transaction.from} to ${transaction.to} 
          with value ${transaction.value} on chain ${transaction.chain} 
          at block ${transaction.blockNumber} timestamp ${transaction.timestamp}
          in category ${transaction.category || 'unknown'}
        `.trim();
        
        return {
          id,
          hash: transaction.hash,
          from: transaction.from,
          to: transaction.to,
          value: transaction.value,
          timestamp: transaction.timestamp,
          chain: transaction.chain,
          blockNumber: transaction.blockNumber,
          category: transaction.category || 'unknown',
          metadata: JSON.stringify(transaction.metadata || {}),
          content
        };
      });
      
      // Insert transactions in batches
      const batchSize = 100;
      const ids: string[] = [];
      
      for (let i = 0; i < objects.length; i += batchSize) {
        const batch = objects.slice(i, i + batchSize);
        await transactionCollection.data.insertMany(batch);
        ids.push(...batch.map(obj => obj.id as string));
      }
      
      logger.info(`Successfully stored ${transactions.length} transactions`);
      return ids;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to store transactions: ${errorMessage}`);
      throw new Error(`Failed to store transactions: ${errorMessage}`);
    }
  }

  /**
   * Store a strategy in the vector database
   * @param strategy Strategy data
   * @returns The ID of the stored strategy
   */
  async storeStrategy(strategy: Omit<Strategy, 'id' | 'createdAt'>): Promise<string> {
    await this.ensureConnection();
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      logger.info(`Storing strategy ${strategy.name} in vector database`);
      
      // Generate a unique ID
      const id = uuidv4();
      const now = new Date().toISOString();
      
      // Store the strategy
      const strategyCollection = this.client.collections.get(STRATEGIES_COLLECTION);
      await strategyCollection.data.insert({
        id,
        ...strategy,
        parameters: JSON.stringify(strategy.parameters || {}),
        metadata: JSON.stringify(strategy.metadata || {}),
        createdAt: now,
        updatedAt: now,
        executionCount: 0,
        successRate: 0
      });
      
      logger.info(`Successfully stored strategy ${strategy.name} with ID ${id}`);
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
   * @param updates Strategy updates
   * @returns True if successful
   */
  async updateStrategy(id: string, updates: Partial<Omit<Strategy, 'id' | 'createdAt'>>): Promise<boolean> {
    await this.ensureConnection();
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      logger.info(`Updating strategy ${id} in vector database`);
      
      // Prepare the updates
      const now = new Date().toISOString();
      const updateData: Record<string, any> = {
        ...updates,
        updatedAt: now
      };
      
      // Convert objects to strings for storage
      if (updateData.parameters) {
        updateData.parameters = JSON.stringify(updateData.parameters);
      }
      if (updateData.metadata) {
        updateData.metadata = JSON.stringify(updateData.metadata);
      }
      
      // Update the strategy
      const strategyCollection = this.client.collections.get(STRATEGIES_COLLECTION);
      await strategyCollection.data.update(id, updateData);
      
      logger.info(`Successfully updated strategy ${id}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to update strategy: ${errorMessage}`);
      throw new Error(`Failed to update strategy: ${errorMessage}`);
    }
  }

  /**
   * Increment the execution count for a strategy
   * @param id Strategy ID
   * @param success Whether the execution was successful
   * @returns Updated execution count and success rate
   */
  async trackStrategyExecution(id: string, success: boolean): Promise<{executionCount: number, successRate: number}> {
    await this.ensureConnection();
    
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    try {
      logger.info(`Tracking execution for strategy ${id}`);
      
      // Get the current strategy
      const strategyCollection = this.client.collections.get(STRATEGIES_COLLECTION);
      const strategyResult = await strategyCollection.query.fetchObjects({
        where: {
          operator: 'Equal',
          path: ['id'],
          valueText: id
        }
      });
      
      if (!strategyResult.data || strategyResult.data.length === 0) {
        throw new Error(`Strategy with ID ${id} not found`);
      }
      
      const strategy = strategyResult.data[0];
      
      // Calculate new execution count and success rate
      const executionCount = (strategy.executionCount || 0) + 1;
      const successCount = success 
        ? ((strategy.executionCount || 0) * (strategy.successRate || 0) / 100) + 1 
        : ((strategy.executionCount || 0) * (strategy.successRate || 0) / 100);
      const successRate = (successCount / executionCount) * 100;
      
      // Update the strategy
      await strategyCollection.data.update(id, {
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
   * Search for similar transactions based on a query
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
      let searchBuilder = transactionCollection.query.nearText({
        concepts: [query],
      });
      
      // Apply filters if provided
      if (params.filters) {
        const whereFilter = this.buildWhereFilter(params.filters);
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
      logger.error(`Failed to search transactions: ${errorMessage}`);
      throw new Error(`Failed to search transactions: ${errorMessage}`);
    }
  }

  /**
   * Find similar strategies based on a description
   * This implements the "Searches Chroma vector DB for similar past strategies" step from the MVP spec
   * @param description Strategy description
   * @param analysisType Type of analysis
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
}

// Export a singleton instance
export const vectorDatabase = new VectorDatabase(); 