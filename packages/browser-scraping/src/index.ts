// Export types
export * from './types';

// Export services
export { ExplorerService } from './services/explorer-service';
export { LangChainService } from './services/langchain-service';
export { BrowserService } from './services/browser-service';

// Main class for browser scraping
import { BrowserService } from './services/browser-service';
import { ScrapingInput, ScrapingResult } from './types';

/**
 * Main class for blockchain explorer scraping
 */
export class BlockchainExplorerScraper {
  private browserService: BrowserService;

  /**
   * Create a new BlockchainExplorerScraper
   * @param openAIApiKey - OpenAI API key (optional, will use environment variable if not provided)
   */
  constructor(openAIApiKey?: string) {
    this.browserService = new BrowserService(openAIApiKey);
  }

  /**
   * Scrape transaction data from a blockchain explorer
   * @param input - Scraping input parameters
   * @returns Scraped transaction data
   */
  async scrapeTransactions(input: ScrapingInput): Promise<ScrapingResult> {
    return this.browserService.scrapeTransactions(input);
  }

  /**
   * Generate a summary of transaction data
   * @param result - Scraping result
   * @returns Summary of transaction data
   */
  async generateSummary(result: ScrapingResult): Promise<string> {
    return this.browserService.generateSummary(result.transactions, result.transactions[0]?.from || '');
  }
}

// Default export
export default BlockchainExplorerScraper; 