# AgentKit

Integration with Coinbase AgentKit for blockchain interactions.

## Overview

AgentKit provides a seamless way to integrate Coinbase's CDP (Coinbase Developer Platform) APIs and Base blockchain functionality into your application. It enables token swaps, transactions, and other blockchain interactions through a simple API.

## Features

- **Token Information**: Fetch detailed information about tokens on various chains
- **Swap Quotes**: Get real-time swap quotes between tokens
- **Transaction Building**: Generate transaction data for swaps and other operations
- **Node Selection Processing**: Process graph node selections for token interactions
- **Mock Data Fallbacks**: Provides realistic mock data when API keys are not available

## Installation

```bash
npm install @frontiertech/agentkit
```

## Usage

### Basic Usage

```typescript
import { AgentService } from '@frontiertech/agentkit';

// Initialize the service
const agentService = new AgentService('YOUR_COINBASE_API_KEY');

// Get token information
const token = await agentService.getToken('0x1234...', 8453); // Base chain ID

// Process a node selection
const action = await agentService.processNodeSelection({
  id: '0x1234...',
  label: 'USDC',
  type: 'contract',
  tokenAddress: '0x1234...',
  chainId: 8453
}, '0xUserAddress...');

console.log(action);
```

### Integration with UI

The package is designed to be easily integrated with UI components, particularly for:

1. Token selection from graph visualizations
2. Swap interfaces
3. Transaction confirmation flows

## API Reference

### AgentService

The main service for interacting with Coinbase CDP APIs.

#### Methods

- `getToken(tokenAddress: string, chainId?: number)`: Get token information
- `getSwapQuote(fromToken: Token, toToken: Token, amount: string)`: Get swap quote
- `buildSwapTransaction(quote: SwapQuote, userAddress: string)`: Build a swap transaction
- `processNodeSelection(selectedNode: SelectedNode, userAddress: string)`: Process a node selection

## Environment Variables

- `COINBASE_API_KEY`: Your Coinbase API key for CDP

## License

MIT 