import { ChainExplorer, ScrapingInput, ScrapingResult, Transaction, ExplorerCategory } from '../types';
import { ExplorerService } from './explorer-service';
import { LangChainService } from './langchain-service';
import { BrowserbaseService } from './browserbase-service';

/**
 * Service for browser automation and scraping
 */
export class BrowserService {
  private explorerService: ExplorerService;
  private langChainService: LangChainService;
  private browserbaseService: BrowserbaseService;

  constructor() {
    this.explorerService = new ExplorerService();
    this.langChainService = new LangChainService();
    this.browserbaseService = new BrowserbaseService();
  }

  /**
   * Log structured information about browser operations
   */
  private logOperation(operation: string, details: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      operation,
      ...details
    };
    console.log(`[BROWSER_OPERATION] ${JSON.stringify(logEntry)}`);
  }

  /**
   * Scrape transactions from a blockchain explorer
   */
  async scrapeTransactions(input: ScrapingInput): Promise<ScrapingResult> {
    const { address } = input;
    // Default to EOAAddress category if not provided
    const category = input.category ? input.category as unknown as ExplorerCategory : 'EOAAddress';
    
    this.logOperation('SCRAPE_START', { address, category });
    
    // Find all explorers for the given category
    const explorers = this.explorerService.getAllExplorers().filter(
      explorer => explorer.category === category
    );
    
    if (explorers.length === 0) {
      const error = `No explorer found for address ${address} with category ${category}`;
      this.logOperation('SCRAPE_ERROR', { error, address, category });
      throw new Error(error);
    }
    
    // Use the first available explorer
    const explorer = explorers[0];
    
    this.logOperation('USING_EXPLORER', { 
      explorer: explorer.project_name,
      address,
      category
    });
    
    return this.scrapeWithExplorer(explorer, address, 10);
  }
  
  /**
   * Scrape transactions using a specific explorer
   */
  private async scrapeWithExplorer(explorer: ChainExplorer, address: string, limit: number): Promise<ScrapingResult> {
    try {
      // Generate browser instructions for the explorer
      this.logOperation('GENERATE_INSTRUCTIONS_START', { explorer: explorer.project_name, address });
      const instructions = await this.langChainService.generateBrowserInstructions(explorer, address);
      this.logOperation('GENERATE_INSTRUCTIONS_COMPLETE', { 
        explorer: explorer.project_name,
        instructionsLength: instructions.length
      });
      
      // Use Browserbase to scrape the explorer
      this.logOperation('BROWSER_SCRAPE_START', { 
        explorer: explorer.project_name, 
        url: explorer.explorer_url,
        address 
      });
      const htmlContent = await this.browserbaseService.scrapeExplorerTransactions(explorer, address);
      this.logOperation('BROWSER_SCRAPE_COMPLETE', { 
        explorer: explorer.project_name,
        contentLength: htmlContent.length
      });
      
      // Parse the transaction data from the HTML content
      this.logOperation('PARSE_TRANSACTIONS_START', { explorer: explorer.project_name });
      const transactions = await this.langChainService.parseTransactionData(htmlContent, explorer);
      this.logOperation('PARSE_TRANSACTIONS_COMPLETE', { 
        explorer: explorer.project_name,
        transactionsCount: transactions.length
      });
      
      // Limit the number of transactions if specified
      const limitedTransactions = limit ? transactions.slice(0, limit) : transactions;
      
      const result = {
        explorer,
        transactions: limitedTransactions,
        metadata: {
          total: transactions.length,
          scraped: limitedTransactions.length,
          timestamp: new Date().toISOString()
        }
      };
      
      this.logOperation('SCRAPE_COMPLETE', { 
        explorer: explorer.project_name,
        transactionsCount: limitedTransactions.length,
        totalTransactions: transactions.length
      });
      
      return result;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logOperation('SCRAPE_ERROR', { 
        explorer: explorer.project_name,
        error: errorMessage,
        address
      });
      
      // Instead of using mock data, throw a more descriptive error
      throw new Error(`Failed to scrape transactions for ${address} on ${explorer.project_name}: ${errorMessage}`);
    }
  }

  /**
   * Generate a summary of transactions for an address
   */
  async generateSummary(input: ScrapingInput): Promise<string> {
    const { address } = input;
    
    this.logOperation('SUMMARY_START', { address });
    
    try {
      // Scrape transactions first
      const result = await this.scrapeTransactions(input);
      
      // Generate a summary of the transactions
      this.logOperation('GENERATE_SUMMARY_START', { 
        address,
        transactionsCount: result.transactions.length
      });
      
      const summary = await this.langChainService.generateTransactionSummary(result.transactions, address);
      
      this.logOperation('GENERATE_SUMMARY_COMPLETE', { 
        address,
        summaryLength: summary.length
      });
      
      return summary;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logOperation('SUMMARY_ERROR', { 
        address,
        error: errorMessage
      });
      
      return `Failed to generate summary for ${address}: ${errorMessage}`;
    }
  }
} 