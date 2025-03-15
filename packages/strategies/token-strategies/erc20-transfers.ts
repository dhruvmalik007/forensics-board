// packages/strategies/strategies/erc20-transfers.ts
import { 
    Strategy, 
    StrategyContext, 
    StrategyResult, 
    StrategyRegistry 
  } from '../strategy-execution/strategy-registry';
  import { BlockchainType } from '../address-detection/address-type-detector';
  import { BrowserService } from '../../browser-scraping/src/services/browser-service';
  import { logger } from '../../../lib/utils';
  
  export class ERC20TransfersStrategy implements Strategy {
    id = 'erc20-transfers';
    name = 'ERC-20 Token Transfers';
    description = 'Identify side wallets by tracking ERC-20 token transfers';
    applicableBlockchains = [BlockchainType.ETHEREUM];
    defaultParams = {
      minTransactions: 1,
      maxAddresses: 50
    };
    
    /**
     * Execute the ERC-20 Token Transfers strategy
     * @param context Strategy execution context
     * @returns Strategy execution result
     */
    async execute(context: StrategyContext): Promise<StrategyResult> {
      const { address, params, langChainService } = context;
      const mergedParams = { ...this.defaultParams, ...params };
      
      logger.info(`Executing ERC-20 Transfers strategy for ${address}`);
      
      // Create BrowserService instance
      const browserService = new BrowserService();
      
      // Scrape transactions using browser-scraping package
      const transactions = await browserService.scrapeTransactions({
        address,
        chain: 'ethereum',
        category: 'erc20'
      });
      
      logger.info(`Found ${transactions.length} ERC-20 transactions for ${address}`);
      
      // Process transactions to identify patterns
      const nodes = new Map<string, any>();
      const edges = new Map<string, any>();
      
      // Add source node
      nodes.set(address, {
        id: address,
        address,
        type: 'address',
        tags: ['source']
      });
      
      // Process each transaction to build the graph
      for (const tx of transactions) {
        const counterpartyAddress = tx.from === address ? tx.to : tx.from;
        const direction = tx.from === address ? 'outgoing' : 'incoming';
        
        // Skip if counterparty is undefined
        if (!counterpartyAddress) continue;
        
        // Add counterparty node if not already added
        if (!nodes.has(counterpartyAddress)) {
          nodes.set(counterpartyAddress, {
            id: counterpartyAddress,
            address: counterpartyAddress,
            type: 'address',
            tags: ['erc20-counterparty']
          });
        }
        
        // Add edge between addresses
        const edgeId = `${tx.from}-${tx.to}-${tx.hash}`;
        edges.set(edgeId, {
          source: tx.from,
          target: tx.to,
          type: 'erc20-transfer',
          metadata: {
            hash: tx.hash,
            value: tx.value,
            timestamp: tx.timestamp,
            direction
          }
        });
      }
      
      // Generate a summary using LangChain
      const summary = await langChainService.generateTransactionSummary(transactions, address);
      
      return {
        nodes: Array.from(nodes.values()),
        edges: Array.from(edges.values()),
        summary
      };
    }
    
    /**
     * Estimate credits required for this strategy
     * @param context Strategy execution context
     * @returns Estimated credit cost
     */
    estimateCredits(context: StrategyContext): number {
      // Base cost of 10 credits plus 1 credit per expected transaction
      return 10 + Math.min(context.params?.maxAddresses || this.defaultParams.maxAddresses, 50);
    }
  }
  
  // Register the strategy
  StrategyRegistry.register(new ERC20TransfersStrategy());