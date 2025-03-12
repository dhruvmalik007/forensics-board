import { createDocumentHandler } from '@/lib/artifacts/server';
import { BlockchainExplorerScraper } from '@/packages/browser-scraping/src';
import { ScrapingResult, Transaction } from '@/packages/browser-scraping/src/types';
import { DataStreamWriter } from 'ai';
import { z } from 'zod';

// Define the stream part types for blockchain explorer
interface BlockchainExplorerStreamPart {
  type: 
    | 'address-update' 
    | 'chain-update' 
    | 'category-update' 
    | 'result-update' 
    | 'summary-update' 
    | 'error-update';
  content: string | ScrapingResult;
}

// Define bridging services for better detection
const bridgingServices = {
  'lifi': ['lifi', 'li.fi'],
  'deBridge': ['debridge', 'de-bridge'],
  'hop': ['hop', 'hop protocol', 'hop bridge'],
  'across': ['across', 'across protocol'],
  'stargate': ['stargate', 'stargate finance'],
  'synapse': ['synapse', 'synapse protocol'],
  'celer': ['celer', 'cbridge', 'celer bridge'],
  'polygon': ['polygon bridge', 'matic bridge'],
  'arbitrum': ['arbitrum bridge', 'arbitrum one'],
  'optimism': ['optimism bridge', 'optimism gateway'],
  'everclear': ['everclear', 'intents', 'intent protocol'],
  'connext': ['connext', 'connext bridge'],
  'wormhole': ['wormhole', 'portal bridge'],
  'layerzero': ['layerzero', 'layer zero', 'stargate'],
  'axelar': ['axelar', 'axelar network'],
};

// Define the schema for blockchain explorer inputs
const blockchainExplorerInputSchema = z.object({
  address: z.string().min(1, 'Wallet address is required'),
  chain: z.string().default('ethereum'),
});

// Define type for the inputs
export type BlockchainExplorerInputs = z.infer<typeof blockchainExplorerInputSchema>;

// Define regex patterns to match queries about blockchain transactions
const addressRegex = /(0x[a-fA-F0-9]{40})/;
const chainRegex = /(ethereum|binance|polygon|arbitrum|optimism|avalanche|fantom|base|zksync|linea|scroll)/i;
const transactionRegex = /\b(transactions?|tx|activity|transfers?)\b/i;

// Create a document handler for the blockchain explorer artifact
export const blockchainExplorerDocumentHandler = createDocumentHandler<'blockchain-explorer'>({
  kind: 'blockchain-explorer',
  
  onCreateDocument: async ({ id, title, dataStream }) => {
    // Extract blockchain address from the title
    const addressMatch = title.match(addressRegex);
    
    let draftContent = '{}';
    
    if (addressMatch) {
      const address = addressMatch[1];
      
      // Send address update to client
      dataStream.writeData({
        type: 'address-update',
        content: address,
      });
      
      // Detect chain from title
      const blockchainKeywords = {
        ethereum: ['ethereum', 'eth', 'ether'],
        binance: ['binance', 'bnb', 'bsc', 'binance smart chain'],
        polygon: ['polygon', 'matic'],
        arbitrum: ['arbitrum', 'arb'],
        optimism: ['optimism', 'op'],
        avalanche: ['avalanche', 'avax'],
        fantom: ['fantom', 'ftm'],
        base: ['base', 'base chain', 'coinbase'],
        zksync: ['zksync', 'zk sync', 'zk-sync'],
        linea: ['linea'],
        scroll: ['scroll'],
      };
      
      const lowerTitle = title.toLowerCase();
      let detectedChain = 'ethereum'; // Default
      
      for (const [chain, keywords] of Object.entries(blockchainKeywords)) {
        if (keywords.some(keyword => lowerTitle.includes(keyword))) {
          detectedChain = chain;
          break;
        }
      }
      
      dataStream.writeData({
        type: 'chain-update',
        content: detectedChain,
      });
      
      // Detect bridging service or explorer category
      let detectedCategory = 'chain-explorer'; // Default
      
      // Check for bridging services first
      let detectedBridges: string[] = [];
      for (const [bridge, keywords] of Object.entries(bridgingServices)) {
        if (keywords.some(keyword => lowerTitle.includes(keyword))) {
          detectedBridges.push(bridge);
          detectedCategory = 'crosschain-txn';
        }
      }
      
      // If no bridge detected, check for other categories
      if (detectedBridges.length === 0) {
        const categoryKeywords = {
          'chain-explorer': ['chain explorer', 'blockchain explorer', 'explorer'],
          'crosschain-txn': ['cross chain', 'crosschain', 'bridge transaction'],
          'intent-bridge': ['intent', 'bridge', 'intent bridge'],
          'intel-txn': ['intelligence', 'intel', 'analysis'],
        };
        
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
          if (keywords.some(keyword => lowerTitle.includes(keyword))) {
            detectedCategory = category;
            break;
          }
        }
      }
      
      dataStream.writeData({
        type: 'category-update',
        content: detectedCategory,
      });
      
      try {
        // Create a new scraper instance
        const scraper = new BlockchainExplorerScraper();
        
        // Scrape transactions
        const result = await scraper.scrapeTransactions({
          address,
          chain: detectedChain,
          category: detectedCategory as any,
          limit: 10,
        });
        
        // Generate enhanced summary with bridge information
        let summary = await scraper.generateSummary(result);
        
        // Add bridge information to summary if detected
        if (detectedBridges.length > 0) {
          const bridgeInfo = `\n\nBridging Services Detected: ${detectedBridges.join(', ')}`;
          summary += bridgeInfo;
          
          // Add plain text transaction summary
          summary += generatePlainTextSummary(result, detectedBridges);
        } else {
          // Add plain text transaction summary
          summary += generatePlainTextSummary(result);
        }
        
        // Send results to client
        dataStream.writeData({
          type: 'result-update',
          content: result,
        });
        
        dataStream.writeData({
          type: 'summary-update',
          content: summary,
        });
        
        // Set the draft content to the JSON result
        draftContent = JSON.stringify(result, null, 2);
        
      } catch (error) {
        console.error('Error scraping blockchain data:', error);
        dataStream.writeData({
          type: 'error-update',
          content: error instanceof Error ? error.message : 'An unknown error occurred',
        });
      }
    }
    
    return draftContent;
  },
  
  onUpdateDocument: async ({ document, description, dataStream }) => {
    // Extract blockchain address from the description
    const addressMatch = description.match(addressRegex);
    
    // Ensure we have a valid string content to return
    let draftContent = document.content || '{}';
    
    if (addressMatch) {
      const address = addressMatch[1];
      
      // Send address update to client
      dataStream.writeData({
        type: 'address-update',
        content: address,
      });
      
      // Look for blockchain name in the description
      const blockchainKeywords = {
        ethereum: ['ethereum', 'eth', 'ether'],
        binance: ['binance', 'bnb', 'bsc', 'binance smart chain'],
        polygon: ['polygon', 'matic'],
        arbitrum: ['arbitrum', 'arb'],
        optimism: ['optimism', 'op'],
        avalanche: ['avalanche', 'avax'],
        fantom: ['fantom', 'ftm'],
        base: ['base', 'base chain', 'coinbase'],
        zksync: ['zksync', 'zk sync', 'zk-sync'],
        linea: ['linea'],
        scroll: ['scroll'],
      };
      
      const lowerDescription = description.toLowerCase();
      let detectedChain = 'ethereum'; // Default
      
      for (const [chain, keywords] of Object.entries(blockchainKeywords)) {
        if (keywords.some(keyword => lowerDescription.includes(keyword))) {
          detectedChain = chain;
          break;
        }
      }
      
      dataStream.writeData({
        type: 'chain-update',
        content: detectedChain,
      });
      
      // Detect bridging service or explorer category
      let detectedCategory = 'chain-explorer'; // Default
      
      // Check for bridging services first
      let detectedBridges: string[] = [];
      for (const [bridge, keywords] of Object.entries(bridgingServices)) {
        if (keywords.some(keyword => lowerDescription.includes(keyword))) {
          detectedBridges.push(bridge);
          detectedCategory = 'crosschain-txn';
        }
      }
      
      // If no bridge detected, check for other categories
      if (detectedBridges.length === 0) {
        const categoryKeywords = {
          'chain-explorer': ['chain explorer', 'blockchain explorer', 'explorer'],
          'crosschain-txn': ['cross chain', 'crosschain', 'bridge transaction'],
          'intent-bridge': ['intent', 'bridge', 'intent bridge'],
          'intel-txn': ['intelligence', 'intel', 'analysis'],
        };
        
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
          if (keywords.some(keyword => lowerDescription.includes(keyword))) {
            detectedCategory = category;
            break;
          }
        }
      }
      
      dataStream.writeData({
        type: 'category-update',
        content: detectedCategory,
      });
      
      try {
        // Create a new scraper instance
        const scraper = new BlockchainExplorerScraper();
        
        // Scrape transactions
        const result = await scraper.scrapeTransactions({
          address,
          chain: detectedChain,
          category: detectedCategory as any,
          limit: 10,
        });
        
        // Generate enhanced summary with bridge information
        let summary = await scraper.generateSummary(result);
        
        // Add bridge information to summary if detected
        if (detectedBridges.length > 0) {
          const bridgeInfo = `\n\nBridging Services Detected: ${detectedBridges.join(', ')}`;
          summary += bridgeInfo;
          
          // Add plain text transaction summary
          summary += generatePlainTextSummary(result, detectedBridges);
        } else {
          // Add plain text transaction summary
          summary += generatePlainTextSummary(result);
        }
        
        // Send results to client
        dataStream.writeData({
          type: 'result-update',
          content: result,
        });
        
        dataStream.writeData({
          type: 'summary-update',
          content: summary,
        });
        
        // Set the draft content to the JSON result
        draftContent = JSON.stringify(result, null, 2);
        
      } catch (error) {
        console.error('Error scraping blockchain data:', error);
        dataStream.writeData({
          type: 'error-update',
          content: error instanceof Error ? error.message : 'An unknown error occurred',
        });
      }
    }
    
    return draftContent;
  },
});

/**
 * Generate a plain text summary of transactions
 */
function generatePlainTextSummary(result: ScrapingResult, bridges: string[] = []): string {
  if (!result.transactions || result.transactions.length === 0) {
    return '\n\n**No transactions found.**';
  }
  
  // Start with a header
  let summary = '\n\n## Transaction Log Summary\n\n';
  
  // Group transactions by date
  const txByDate = new Map<string, Transaction[]>();
  
  result.transactions.forEach(tx => {
    // Extract date from timestamp (assuming format like "2023-04-15 14:30:45")
    const date = tx.timestamp?.split(' ')[0] || 'Unknown Date';
    
    if (!txByDate.has(date)) {
      txByDate.set(date, []);
    }
    txByDate.get(date)?.push(tx);
  });
  
  // Sort dates in descending order (newest first)
  const sortedDates = Array.from(txByDate.keys()).sort().reverse();
  
  // Process each date
  sortedDates.forEach(date => {
    const transactions = txByDate.get(date) || [];
    summary += `### ${date}\n\n`;
    
    transactions.forEach(tx => {
      const shortHash = tx.hash.substring(0, 8) + '...' + tx.hash.substring(tx.hash.length - 6);
      const shortFrom = tx.from ? (tx.from.substring(0, 6) + '...' + tx.from.substring(tx.from.length - 4)) : 'Unknown';
      const shortTo = tx.to ? (tx.to.substring(0, 6) + '...' + tx.to.substring(tx.to.length - 4)) : 'Unknown';
      const time = tx.timestamp?.split(' ')[1] || '';
      const value = tx.value || '0';
      const status = tx.status || 'Unknown';
      
      // Check if this transaction might be related to a bridge
      let bridgeInfo = '';
      if (bridges.length > 0) {
        // Simple heuristic: if transaction has a high value or specific patterns in the data
        const txData = JSON.stringify(tx).toLowerCase();
        for (const bridge of bridges) {
          if (txData.includes(bridge.toLowerCase())) {
            bridgeInfo = ` (Possible ${bridge} bridge transaction)`;
            break;
          }
        }
      }
      
      summary += `- **${time}** | ${shortHash} | ${shortFrom} → ${shortTo} | ${value} | ${status}${bridgeInfo}\n`;
    });
    
    summary += '\n';
  });
  
  // Add transaction statistics
  const totalTxs = result.transactions.length;
  const uniqueAddresses = new Set([
    ...result.transactions.map(tx => tx.from).filter(Boolean),
    ...result.transactions.map(tx => tx.to).filter(Boolean)
  ]).size;
  
  summary += `**Statistics:** ${totalTxs} transactions with ${uniqueAddresses} unique addresses.\n\n`;
  
  return summary;
}

// Define the server functions for the blockchain explorer
export function shouldCreateFromMessage(message: string): boolean {
  // Check if the message contains an address-like pattern
  const containsAddress = addressRegex.test(message);
  
  // Check if the message mentions a blockchain
  const mentionsChain = chainRegex.test(message);
  
  // Check if the message is about transactions or activity
  const mentionsTransactions = transactionRegex.test(message);
  
  // Message should contain an address and either mention a chain or transactions
  return containsAddress && (mentionsChain || mentionsTransactions);
}

export function getInputsFromMessage(message: string): BlockchainExplorerInputs {
  // Extract address from message
  const addressMatch = message.match(addressRegex);
  const address = addressMatch ? addressMatch[1] : '';
  
  // Extract chain from message or default to ethereum
  const chainMatch = message.match(chainRegex);
  const chain = chainMatch 
    ? chainMatch[1].toLowerCase() 
    : 'ethereum';
  
  return {
    address,
    chain,
  };
} 