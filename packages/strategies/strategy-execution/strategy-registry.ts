// packages/strategies/strategy-execution/strategy-registry.ts
import { BlockchainType } from '../address-detection/address-type-detector';
import { VectorDatabase } from '../../../lib/db/vector-database';
import { GraphDatabase } from '../../../lib/db/graph-database';
import { LangChainService } from '../../browser-scraping/src/services/langchain-service';

export interface StrategyContext {
  address: string;
  blockchainType: BlockchainType;
  vectorDb: VectorDatabase;
  graphDb: GraphDatabase;
  langChainService: LangChainService;
  params?: Record<string, any>;
}

export interface StrategyResult {
  nodes: Array<{
    id: string;
    address: string;
    type: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: string;
    metadata?: Record<string, any>;
  }>;
  summary: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  applicableBlockchains: BlockchainType[];
  defaultParams?: Record<string, any>;
  execute(context: StrategyContext): Promise<StrategyResult>;
  estimateCredits(context: StrategyContext): number;
}

export class StrategyRegistry {
  private static strategies: Map<string, Strategy> = new Map();
  
  /**
   * Register a strategy
   * @param strategy Strategy implementation
   */
  static register(strategy: Strategy): void {
    this.strategies.set(strategy.id, strategy);
  }
  
  /**
   * Get a strategy by ID
   * @param id Strategy ID
   * @returns Strategy or undefined if not found
   */
  static getStrategy(id: string): Strategy | undefined {
    return this.strategies.get(id);
  }
  
  /**
   * Get strategies applicable for a blockchain type
   * @param blockchainType Blockchain type
   * @returns Array of applicable strategies
   */
  static getStrategiesForBlockchain(blockchainType: BlockchainType): Strategy[] {
    return Array.from(this.strategies.values())
      .filter(strategy => strategy.applicableBlockchains.includes(blockchainType));
  }
  
  /**
   * Find similar strategies based on description
   * @param description Strategy description
   * @param blockchainType Optional blockchain type filter
   * @returns Array of similar strategies
   */
  static async findSimilarStrategies(
    description: string, 
    blockchainType?: BlockchainType,
    vectorDb?: VectorDatabase
  ): Promise<Strategy[]> {
    if (!vectorDb) {
      return [];
    }
    
    // Find similar strategies in vector database
    const similarStrategies = await vectorDb.findSimilarStrategies(
      description,
      blockchainType
    );
    
    // Map to actual strategy implementations
    return similarStrategies
      .map(s => this.getStrategy(s.id))
      .filter(s => s !== undefined) as Strategy[];
  }
}