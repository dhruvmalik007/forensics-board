# Browser Scraping Package for Blockchain Explorers

This package provides automated browser scraping capabilities for blockchain explorers, allowing you to extract transaction data for any address across multiple blockchain networks.

## Features

- **Multi-Chain Support**: Works with Ethereum, Binance Smart Chain, Polygon, Arbitrum, Optimism, and more
- **AI-Powered Automation**: Uses LangChain and OpenAI to generate browser automation instructions
- **Flexible Scraping**: Extract transaction hashes, timestamps, addresses, values, and more
- **Transaction Analysis**: Generate summaries and insights from transaction data

## Installation

```bash
npm install browser-scraping
```

## Usage

```typescript
import { BlockchainExplorerScraper } from 'browser-scraping';

// Create a new scraper instance
const scraper = new BlockchainExplorerScraper(process.env.OPENAI_API_KEY);

// Scrape transactions for an Ethereum address
const result = await scraper.scrapeTransactions({
  address: '0x1234567890abcdef1234567890abcdef12345678',
  chain: 'ethereum',
  limit: 10
});

console.log(`Found ${result.transactions.length} transactions`);

// Generate a summary of the transactions
const summary = await scraper.generateSummary(result);
console.log(summary);
```

## Supported Explorers

The package supports various blockchain explorers:

### Chain Explorers
- Etherscan (Ethereum)
- BscScan (Binance Smart Chain)
- PolygonScan (Polygon)
- Arbiscan (Arbitrum)
- Optimism Explorer (Optimism)
- Avalanche Explorer (Avalanche)
- Fantom Explorer (Fantom)

### Cross-Chain Transaction Explorers
- Hyperlane
- LayerZero
- Connext
- Stargate
- Synapse Protocol
- Hop
- Axelar
- Wormhole
- And many more...

## How It Works

1. The user provides an address and chain
2. The package identifies the appropriate blockchain explorer
3. LangChain + OpenAI generates browser automation instructions
4. The instructions are executed to navigate to the explorer and search for the address
5. Transaction data is extracted from the search results
6. The data is parsed and returned in a structured format

## API Reference

### `BlockchainExplorerScraper`

The main class for blockchain explorer scraping.

#### Constructor

```typescript
constructor(openAIApiKey?: string)
```

#### Methods

```typescript
async scrapeTransactions(input: ScrapingInput): Promise<ScrapingResult>
```

```typescript
async generateSummary(result: ScrapingResult): Promise<string>
```

### Types

```typescript
interface ScrapingInput {
  address: string;
  chain: string;
  category?: 'chain-explorer' | 'crosschain-txn' | 'intent-bridge' | 'intel-txn';
  limit?: number;
}

interface ScrapingResult {
  explorer: ChainExplorer;
  transactions: Transaction[];
  metadata: {
    total: number;
    scraped: number;
    timestamp: string;
  };
}

interface Transaction {
  hash: string;
  timestamp: string;
  from?: string;
  to?: string;
  value?: string;
  type?: string;
  status?: string;
  details?: Record<string, any>;
}
```

## License

MIT 