// Export services
export { BrowserService } from './services/browser-service';
export { BrowserbaseService } from './services/browserbase-service';
export { ExplorerService } from './services/explorer-service';
export { LangChainService } from './services/langchain-service';

// Export types
export * from './types';

// Export tests
export { runLifiScanTest } from './tests/lifi-scan-test';

/**
 * Browser Scraping Package
 * 
 * This package provides a service for scraping blockchain explorer websites using Browserbase
 * for browser automation. It includes functionality for extracting transaction data from
 * various blockchain explorers and generating summaries of transaction activity.
 */

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
   */
  constructor() {
    this.browserService = new BrowserService();
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
   * @param input - Scraping input parameters
   * @returns Summary of transaction data
   */
  async generateSummary(input: ScrapingInput): Promise<string> {
    return this.browserService.generateSummary(input);
  }
}

// Default export
export default BlockchainExplorerScraper; 