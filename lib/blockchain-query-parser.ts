/**
 * Utility functions for parsing blockchain queries and extracting parameters
 * for the blockchain explorer artifact
 */

export interface BlockchainQueryParams {
  address: string;
  chain: string;
  category: 'chain-explorer' | 'crosschain-txn' | 'intent-bridge' | 'intel-txn';
  bridge?: string;
  limit?: number;
}

/**
 * Parse a natural language query to extract blockchain explorer parameters
 * @param query The user's natural language query
 * @returns Extracted parameters for the blockchain explorer
 */
export function parseBlockchainQuery(query: string): BlockchainQueryParams | null {
  // Default values
  const params: BlockchainQueryParams = {
    address: '',
    chain: 'ethereum',
    category: 'chain-explorer',
    limit: 20,
  };

  // Extract Ethereum address (0x followed by 40 hex characters)
  const addressMatch = query.match(/(0x[a-fA-F0-9]{40})/);
  if (!addressMatch) {
    return null; // No valid address found
  }
  params.address = addressMatch[1];

  // Extract blockchain name
  const chainRegex = /\b(ethereum|eth|polygon|matic|binance|bnb|bsc|arbitrum|optimism|avalanche|avax|fantom|ftm|base|zksync|linea|scroll)\b/i;
  const chainMatch = query.toLowerCase().match(chainRegex);
  if (chainMatch) {
    // Normalize chain names
    const chainMap: Record<string, string> = {
      'eth': 'ethereum',
      'matic': 'polygon',
      'bnb': 'binance',
      'bsc': 'binance',
      'avax': 'avalanche',
      'ftm': 'fantom',
    };
    
    params.chain = chainMap[chainMatch[1]] || chainMatch[1];
  }

  // Determine category based on query content
  if (query.toLowerCase().includes('cross-chain') || 
      query.toLowerCase().includes('crosschain') ||
      query.toLowerCase().includes('bridge')) {
    params.category = 'crosschain-txn';
    
    // Extract specific bridge if mentioned
    const bridgeRegex = /\b(layerzero|stargate|wormhole|polygon bridge|arbitrum bridge|optimism bridge|hop|across|synapse|celer|connext|axelar)\b/i;
    const bridgeMatch = query.toLowerCase().match(bridgeRegex);
    if (bridgeMatch) {
      params.bridge = bridgeMatch[1].toLowerCase();
    }
  } else if (query.toLowerCase().includes('intent')) {
    params.category = 'intent-bridge';
  } else if (query.toLowerCase().includes('intelligence') || 
             query.toLowerCase().includes('analyze') || 
             query.toLowerCase().includes('analysis')) {
    params.category = 'intel-txn';
  }

  // Extract limit if specified
  const limitMatch = query.match(/\blimit\s+(\d+)\b/i) || query.match(/\btop\s+(\d+)\b/i);
  if (limitMatch) {
    const limit = parseInt(limitMatch[1], 10);
    if (!isNaN(limit) && limit > 0) {
      params.limit = Math.min(limit, 100); // Cap at 100 to prevent excessive requests
    }
  }

  return params;
}

/**
 * Generate a structured query for the blockchain explorer based on parsed parameters
 * @param params The parsed blockchain query parameters
 * @returns A structured query string for the blockchain explorer
 */
export function generateStructuredQuery(params: BlockchainQueryParams): string {
  let query = `Show me the transactions for ${params.address} on ${params.chain}`;
  
  if (params.category === 'crosschain-txn') {
    query += ' including cross-chain transactions';
    if (params.bridge) {
      query += ` via ${params.bridge}`;
    }
  } else if (params.category === 'intent-bridge') {
    query += ' focusing on intent bridging activities';
  } else if (params.category === 'intel-txn') {
    query += ' with intelligence analysis';
  }
  
  if (params.limit && params.limit !== 20) {
    query += ` with a limit of ${params.limit} transactions`;
  }
  
  return query;
}

/**
 * Check if a query is related to blockchain exploration
 * @param query The user's query
 * @returns Whether the query is related to blockchain exploration
 */
export function isBlockchainQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  // Check for blockchain-related keywords
  const blockchainKeywords = [
    'blockchain', 'transaction', 'wallet', 'address', '0x', 'ethereum', 
    'polygon', 'binance', 'arbitrum', 'optimism', 'bridge', 'cross-chain'
  ];
  
  return blockchainKeywords.some(keyword => lowerQuery.includes(keyword)) &&
         /0x[a-fA-F0-9]{40}/.test(query); // Must contain an Ethereum address
} 