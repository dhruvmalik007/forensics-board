import { BlockchainExplorerScraper } from './index';
import { ScrapingInput } from './types';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  // Create a new scraper instance
  const scraper = new BlockchainExplorerScraper();

  try {
    // Example Ethereum address (Vitalik's address)
    const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    
    console.log(`Scraping transactions for address: ${address}`);
    
    // Create input object with just the address
    const input: ScrapingInput = {
      address
    };
    
    // Scrape transactions
    const result = await scraper.scrapeTransactions(input);

    console.log(`Found ${result.transactions.length} transactions on ${result.explorer.project_name}`);
    console.log('Transactions:');
    console.log(JSON.stringify(result.transactions, null, 2));

    // Generate a summary
    console.log('\nGenerating summary...');
    // Pass the input object instead of the result
    const summary = await scraper.generateSummary(input);
    console.log('\nSummary:');
    console.log(summary);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
main().catch(console.error); 