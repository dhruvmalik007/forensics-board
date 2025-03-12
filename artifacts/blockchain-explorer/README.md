# Blockchain Explorer Artifact

The Blockchain Explorer artifact provides a way to explore and analyze blockchain transactions and wallet activities directly within the chat interface. It leverages our browser-scraping package to fetch transaction data from various blockchain explorers and present it in an interactive format.

## Features

- **Multi-chain Support**: Explore transactions across multiple blockchains including Ethereum, Binance Smart Chain, Polygon, Arbitrum, and more.
- **Transaction Analysis**: View detailed transaction information and get AI-generated summaries of wallet activity.
- **Interactive UI**: Toggle between summary and detailed transaction views, with copy/share functionality.
- **Automatic Trigger**: Automatically suggests the artifact when a user asks about blockchain transactions or mentions an Ethereum address.

## Components

The Blockchain Explorer artifact consists of the following files:

- `artifact.tsx`: The main component that displays transaction data and summaries.
- `artifact-actions.tsx`: Provides interactive actions like updating search parameters, exporting data, and sharing results.
- `server.tsx`: Handles the server-side logic for detecting relevant user queries and extracting blockchain addresses and chain information.

## How It Works

1. When a user sends a message containing an Ethereum address (0x...) and mentions transactions or a specific blockchain, the artifact is automatically triggered.
2. The artifact extracts the wallet address and blockchain from the message.
3. It then fetches transaction data using our browser-scraping package, which interacts with the appropriate blockchain explorer.
4. The data is displayed in a tabbed interface showing both a summary analysis and detailed transaction list.
5. Users can interact with the data through various actions like updating search parameters, exporting, or sharing.

## Integration with Browser-Scraping

This artifact integrates with our browser-scraping package to fetch blockchain data. The package handles:

- Identifying the appropriate explorer for the selected blockchain
- Generating browser automation instructions
- Parsing transaction data from explorer HTML
- Generating AI-powered summaries of transaction patterns

## Example Queries

The artifact responds to queries like:

- "Show me transactions for 0x1234...5678 on Ethereum"
- "What's the activity for this wallet: 0xabcd...efgh"
- "Check transactions from 0x9876...5432 on Polygon"

## Future Enhancements

Planned enhancements for this artifact include:

- Token transfer tracking and visualization
- Contract interaction analysis
- Transaction flow diagrams
- Cross-chain transaction tracking
- Suspicious activity alerts 