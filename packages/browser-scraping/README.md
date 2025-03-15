# Browser Scraping Package

This package provides tools for browser automation and web scraping, with a focus on blockchain explorers and data extraction.

## Features

- **Blockchain Explorer Scraping**: Extract transaction data from various blockchain explorers
- **LI.FI Scan Integration**: Specialized support for cross-chain transaction analysis via LI.FI
- **Stagehand Integration**: AI-powered web automation with `@browserbasehq/stagehand`
- **OpenAI Integration**: Content extraction and analysis powered by GPT models

## Services

### BrowserService

Traditional browser automation using Browserbase.

### StagehandService

Modern AI-powered browser automation using Stagehand from Browserbase, which simplifies web interactions through natural language commands:

- `scrapeTransactions`: Extract transaction details from blockchain explorers
- `scrapeDetailedTransactions`: Extract detailed transaction information with parallel processing
- `fetchTransactionsForDashboard`: Streamlined data fetching for dashboard views

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your API keys:
   ```
   BROWSERBASE_API_KEY=your_browserbase_key
   OPENAI_API_KEY=your_openai_key
   ```
3. Install dependencies: `npm install`

## Usage

### Basic Usage

```typescript
import { StagehandService } from './services/stagehand-service';
import { ExplorerService } from './services/explorer-service';

// Initialize services
const stagehandService = new StagehandService();
const explorerService = new ExplorerService();

// Find an explorer
const etherscan = explorerService.findExplorerByName('Etherscan');

// Scrape transactions
const address = '0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b';
const result = await stagehandService.scrapeTransactions(etherscan, address, 10);

// Access the transaction data
console.log(`Found ${result.transactions.length} transactions`);
result.transactions.forEach(tx => {
  console.log(`Hash: ${tx.hash}, From: ${tx.from}, To: ${tx.to}, Value: ${tx.value}`);
});
```

### Dashboard Integration

```typescript
// Fetch transactions for a dashboard view
const address = '0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b';
const chain = 'ethereum'; // optional: specify a particular chain
const result = await stagehandService.fetchTransactionsForDashboard(address, chain);

// Access formatted transaction data
console.log(`Found ${result.transactions.length} transactions on ${result.chain}`);
```

## Running Tests

To run all tests:

```bash
npm run test
```

This will execute tests for:
- LI.FI scan functionality
- Explorer logs functionality
- Stagehand integration

Individual tests can be run with:

```bash
npx ts-node src/tests/stagehand-test.ts
```

## License

MIT 