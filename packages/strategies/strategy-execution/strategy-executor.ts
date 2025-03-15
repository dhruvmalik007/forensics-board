// packages/strategies/strategy-execution/strategy-executor.ts
import { 
    Strategy, 
    StrategyContext, 
    StrategyResult, 
    StrategyRegistry 
  } from './strategy-registry';
  import { BlockchainType } from '../address-detection/address-type-detector';
  import { VectorDatabase } from '../../../lib/db/vector-database';
  import { GraphDatabase } from '../../../lib/db/graph-database';
  import { LangChainService } from '../../browser-scraping/src/services/langchain-service';
  import { logger } from '../../../lib/utils';
  
  export class StrategyExecutor {
    private vectorDb: VectorDatabase;
    private graphDb: GraphDatabase;
    private langChainService: LangChainService;
    
    constructor(
      vectorDb: VectorDatabase,
      graphDb: GraphDatabase,
      langChainService: LangChainService
    ) {
      this.vectorDb = vectorDb;
      this.graphDb = graphDb;
      this.langChainService = langChainService;
    }
    
    /**
     * Execute a strategy by ID
     * @param strategyId Strategy ID
     * @param address Blockchain address
     * @param blockchainType Blockchain type
     * @param params Additional parameters
     * @returns Strategy execution result
     */
    async executeStrategy(
      strategyId: string,
      address: string,
      blockchainType: BlockchainType,
      params?: Record<string, any>
    ): Promise<StrategyResult> {
      const strategy = StrategyRegistry.getStrategy(strategyId);
      
      if (!strategy) {
        throw new Error(`Strategy ${strategyId} not found`);
      }
      
      logger.info(`Executing strategy ${strategyId} for address ${address}`);
      
      const context: StrategyContext = {
        address,
        blockchainType,
        vectorDb: this.vectorDb,
        graphDb: this.graphDb,
        langChainService: this.langChainService,
        params
      };
      
      // Execute the strategy
      const result = await strategy.execute(context);
      
      // Store results in graph database
      await this.storeResults(result, address, strategyId);
      
      // Track strategy execution in vector database
      await this.vectorDb.trackStrategyExecution(strategyId, true);
      
      return result;
    }
    
    /**
     * Find the best strategy for a user's analysis request
     * @param address Blockchain address
     * @param blockchainType Blockchain type
     * @param analysisRequest User's analysis request
     * @returns Best matching strategy or undefined if none found
     */
    async findBestStrategy(
      address: string,
      blockchainType: BlockchainType,
      analysisRequest: string
    ): Promise<Strategy | undefined> {
      // First try to find similar strategies in vector database
      const similarStrategies = await StrategyRegistry.findSimilarStrategies(
        analysisRequest,
        blockchainType,
        this.vectorDb
      );
      
      if (similarStrategies.length > 0) {
        // Return the most similar strategy
        return similarStrategies[0];
      }
      
      // If no similar strategy found, use LangChain to recommend a strategy
      const availableStrategies = StrategyRegistry.getStrategiesForBlockchain(blockchainType);
      
      if (availableStrategies.length === 0) {
        return undefined;
      }
      
      // For now, return the first available strategy
      // In a real implementation, this would use LangChain to select the best strategy
      return availableStrategies[0];
    }
    
    /**
     * Store strategy results in the graph database
     * @param result Strategy execution result
     * @param address Source address
     * @param strategyId Strategy ID
     */
    private async storeResults(
      result: StrategyResult,
      address: string,
      strategyId: string
    ): Promise<void> {
      logger.info(`Storing results for strategy ${strategyId}`);
      
      // Store nodes
      for (const node of result.nodes) {
        try {
          await this.graphDb.addNode(node.type, {
            id: node.id,
            address: node.address,
            tags: node.tags,
            metadata: node.metadata,
            strategyId,
            sourceAddress: address,
            createdAt: new Date().toISOString()
          });
        } catch (error) {
          logger.error(`Failed to store node ${node.id}: ${error}`);
        }
      }
      
      // Store edges
      for (const edge of result.edges) {
        try {
          await this.graphDb.addEdge(
            edge.source,
            edge.target,
            edge.type,
            {
              strategyId,
              metadata: edge.metadata,
              createdAt: new Date().toISOString()
            }
          );
        } catch (error) {
          logger.error(`Failed to store edge from ${edge.source} to ${edge.target}: ${error}`);
        }
      }
    }
  }