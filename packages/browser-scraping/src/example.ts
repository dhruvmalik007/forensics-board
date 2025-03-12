import { BlockchainExplorerScraper } from './index';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  // Create a new scraper instance
  const scraper = new BlockchainExplorerScraper(process.env.OPENAI_API_KEY);

  try {
    // Example Ethereum address (Vitalik's address)
    const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    
    console.log(`Scraping transactions for address: ${address}`);
    
    // Scrape transactions
    const result = await scraper.scrapeTransactions({
      address,
      chain: 'ethereum',
      category: 'chain-explorer',
      limit: 5
    });

    console.log(`Found ${result.transactions.length} transactions on ${result.explorer.project_name}`);
    console.log('Transactions:');
    console.log(JSON.stringify(result.transactions, null, 2));

    // Generate a summary
    console.log('\nGenerating summary...');
    const summary = await scraper.generateSummary(result);
    console.log('\nSummary:');
    console.log(summary);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
main().catch(console.error); 