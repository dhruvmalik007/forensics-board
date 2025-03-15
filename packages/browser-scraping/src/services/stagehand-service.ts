import { ChainExplorer, Transaction, ScrapingResult, AddressInfo, AddressCategory } from '../types';
import { Stagehand } from '@browserbasehq/stagehand';
import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { StagehandToolkit } from "@langchain/community/agents/toolkits/stagehand";

/**
 * Service for interacting with blockchain explorers using Stagehand
 */
export class StagehandService {
  private apiKey: string;
  private stagehand: Stagehand;
  private stagehandToolkit: any;
  private llm: ChatOpenAI;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.BROWSERBASE_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('No Browserbase API key provided. StageHand will not work.');
    }
    
    // Initialize the Stagehand instance with the correct parameters
    this.stagehand = new Stagehand({
      apiKey: this.apiKey,
      env: "BROWSERBASE",
      headless: true,
      modelName: "gpt-4o",
      modelClientOptions: {
        apiKey: process.env.OPENAI_API_KEY,
      }
    });
    
    // Initialize the LLM for extraction
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Log structured information about browser operations
   */
  private logOperation(operation: string, details: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      service: 'stagehand',
      operation,
      ...details
    };
    console.log(`[STAGEHAND_OPERATION] ${JSON.stringify(logEntry)}`);
  }

  /**
   * Initialize the StagehandToolkit for LangChain integration
   * This allows using Stagehand through the LangChain ecosystem
   */
  async initializeToolkit() {
    if (!this.stagehandToolkit) {
      this.stagehandToolkit = await StagehandToolkit.fromStagehand(this.stagehand);
    }
    return this.stagehandToolkit;
  }

  /**
   * Get Stagehand tools for direct usage
   */
  async getStagehandTools() {
    const toolkit = await this.initializeToolkit();
    const tools = {
      navigate: toolkit.tools.find((t: any) => t.name === "stagehand_navigate"),
      act: toolkit.tools.find((t: any) => t.name === "stagehand_act"),
      observe: toolkit.tools.find((t: any) => t.name === "stagehand_observe"),
      extract: toolkit.tools.find((t: any) => t.name === "stagehand_extract")
    };
    return tools;
  }

  /**
   * Scrape blockchain transactions using StageHand
   * @param explorer The blockchain explorer to use
   * @param address The address to search for
   * @param limit Optional limit on number of transactions to return
   * @returns Scraping result with transactions
   */
  async scrapeTransactions(explorer: ChainExplorer, address: string, limit: number = 10): Promise<ScrapingResult> {
    this.logOperation('SCRAPE_START', { 
      explorer: explorer.project_name,
      url: explorer.explorer_url,
      address,
      limit
    });
    
    try {
      // 1. Initialize Stagehand and navigate to the explorer
      await this.stagehand.init();
      
      // Navigate to the explorer URL
      await this.stagehand.page.goto(explorer.explorer_url);
      this.logOperation('NAVIGATE_SUCCESS', { url: explorer.explorer_url });
      
      // 2. Observe the page to understand its structure
      const observeResponse = await this.stagehand.page.observe({
        instruction: `Find the search box where I can input a blockchain address on ${explorer.project_name}`
      });
      
      this.logOperation('OBSERVE_SUCCESS', { 
        responseLength: observeResponse.length 
      });
      
      // 3. Act to enter the address and search
      const actResponse = await this.stagehand.page.act(`Search for the address ${address} by:
        1. Find the search input field
        2. Enter the address ${address} into the search field
        3. Submit the search by pressing Enter or clicking the search button
        4. Wait for the results to load completely
      `);
      
      this.logOperation('ACT_SEARCH_SUCCESS', { 
        message: actResponse.message 
      });
      
      // 4. Observe if we need to navigate to a transactions tab
      const checkForTabsResponse = await this.stagehand.page.observe({
        instruction: `Is there a transactions tab or link I need to click to view the transactions for this address?`
      });
      
      // 5. If there's a transactions tab, click it
      if (checkForTabsResponse.some(result => 
        result.description.toLowerCase().includes('yes') || 
        result.description.toLowerCase().includes('transaction')
      )) {
        await this.stagehand.page.act(`Click on the transactions tab or link to view all transactions`);
        
        this.logOperation('ACT_CLICK_TRANSACTIONS_TAB', {});
      }
      
      // 6. Define transaction schema for extraction
      // Use object schema with a "transactions" field that contains the array
      const transactionSchema = z.object({
        transactions: z.array(
          z.object({
            hash: z.string().describe('The transaction hash'),
            timestamp: z.string().describe('The transaction timestamp'),
            from: z.string().optional().describe('The sender address'),
            to: z.string().optional().describe('The recipient address'),
            value: z.string().optional().describe('The transaction value'),
            type: z.string().optional().describe('The transaction type'),
            status: z.string().optional().describe('The transaction status')
          })
        )
      });
      
      // Extract transactions using proper object schema
      const extractResponse = await this.stagehand.page.extract({
        instruction: `Extract all visible blockchain transactions from the page. Look for a table or list of transactions that shows hash, timestamp, from/to addresses, and values. If pagination exists, only extract from the current page.`,
        schema: transactionSchema,
      });
      
      // Access the transactions array from the response
      let transactions: Transaction[] = extractResponse.transactions || [];
      
      this.logOperation('EXTRACT_TRANSACTIONS_SUCCESS', { 
        transactionsCount: transactions.length 
      });
      
      // 7. Check for pagination and extract more if needed
      if (transactions.length > 0 && transactions.length < limit) {
        // Check if there's pagination
        const checkPaginationResponse = await this.stagehand.page.observe({
          instruction: `Is there pagination on this page that would allow me to see more transactions?`
        });
        
        // If pagination exists and we need more transactions, navigate through pages
        if (checkPaginationResponse.some(result => 
          result.description.toLowerCase().includes('yes') || 
          result.description.toLowerCase().includes('pagination') ||
          result.description.toLowerCase().includes('next page')
        )) {
          let currentPage = 1;
          const maxPages = Math.ceil(limit / transactions.length);
          
          while (transactions.length < limit && currentPage < maxPages) {
            currentPage++;
            
            // Try to go to next page
            const nextPageResponse = await this.stagehand.page.act(`Click on the next page button or link to view more transactions`);
            
            // If we successfully navigated, extract transactions from the new page
            if (nextPageResponse.success) {
              const newPageExtractResponse = await this.stagehand.page.extract({
                instruction: `Extract all visible blockchain transactions from this page.`,
                schema: transactionSchema,
              });
              
              // Add new transactions to our list (ensuring it's an array)
              const newTransactions = newPageExtractResponse.transactions || [];
              transactions = [...transactions, ...newTransactions];
              
              this.logOperation('EXTRACT_MORE_TRANSACTIONS', { 
                page: currentPage,
                newCount: newTransactions.length,
                totalCount: transactions.length
              });
            } else {
              // If we couldn't navigate to next page, break the loop
              break;
            }
          }
        }
      }
      
      // 8. Limit the number of transactions if needed
      const limitedTransactions = limit ? transactions.slice(0, limit) : transactions;
      
      // 9. Close the browser instance
      await this.stagehand.close();
      this.logOperation('BROWSER_CLOSED', {});
      
      const result = {
        explorer,
        transactions: limitedTransactions,
        metadata: {
          total: transactions.length,
          scraped: limitedTransactions.length,
          timestamp: new Date().toISOString()
        }
      };
      
      this.logOperation('SCRAPE_SUCCESS', { 
        explorer: explorer.project_name,
        transactionsCount: limitedTransactions.length
      });
      
      return result;
    } catch (error) {
      // Make sure to clean up even if there's an error
      try {
        await this.stagehand.close();
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
      
      this.logOperation('SCRAPE_ERROR', { 
        explorer: explorer.project_name,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Advanced transaction scraping with recursive clicks to get details
   * Using parallel execution for better performance
   * @param explorer The blockchain explorer to use
   * @param address The address to search for
   * @returns Detailed transaction data with recursive exploration
   */
  async scrapeDetailedTransactions(explorer: ChainExplorer, address: string): Promise<ScrapingResult> {
    this.logOperation('DETAILED_SCRAPE_START', { 
      explorer: explorer.project_name,
      address
    });
    
    try {
      // First, get basic transactions
      const basicResult = await this.scrapeTransactions(explorer, address, 5);
      
      // If no transactions, return the basic result
      if (basicResult.transactions.length === 0) {
        return basicResult;
      }
      
      // Create a details schema for extraction as object
      const detailsSchema = z.object({
        details: z.object({
          hash: z.string().describe('The transaction hash'),
          blockNumber: z.string().optional().describe('The block number'),
          timestamp: z.string().describe('The transaction timestamp'),
          from: z.string().optional().describe('The sender address'),
          to: z.string().optional().describe('The recipient address'),
          value: z.string().optional().describe('The transaction value'),
          gasLimit: z.string().optional().describe('Gas limit'),
          gasUsed: z.string().optional().describe('Gas used'),
          gasPrice: z.string().optional().describe('Gas price'),
          status: z.string().optional().describe('The transaction status'),
          method: z.string().optional().describe('The contract method called'),
          nonce: z.string().optional().describe('Transaction nonce'),
          inputData: z.string().optional().describe('Input data or a summary of it')
        })
      });
      
      // Process transactions in parallel using Promise.all
      const enhancedTransactionsPromises = basicResult.transactions.map(async (tx) => {
        // Create a new stagehand instance for each transaction
        const txStagehand = new Stagehand({
          apiKey: this.apiKey,
          env: "BROWSERBASE",
          headless: true,
          modelName: "gpt-4o",
          modelClientOptions: {
            apiKey: process.env.OPENAI_API_KEY,
          }
        });
        
        try {
          // Initialize and navigate to the explorer
          await txStagehand.init();
          await txStagehand.page.goto(explorer.explorer_url);
          
          // Search for the transaction hash
          await txStagehand.page.act(`Search for the transaction hash ${tx.hash} by:
            1. Find the search input field
            2. Enter the hash ${tx.hash} into the search field
            3. Submit the search by pressing Enter or clicking the search button
            4. Wait for the results to load completely
          `);
          
          // Extract detailed information
          const detailsResponse = await txStagehand.page.extract({
            instruction: `Extract detailed information about this transaction. Look through all sections of the page for transaction details.`,
            schema: detailsSchema,
          });
          
          // Clean up this browser instance
          await txStagehand.close();
          
          // Merge basic and detailed information
          const enhancedTx: Transaction = {
            ...tx,
            details: detailsResponse.details
          };
          
          this.logOperation('DETAILED_TX_SUCCESS', { 
            hash: tx.hash,
            explorerName: explorer.project_name
          });
          
          return enhancedTx;
        } catch (error) {
          // Clean up on error
          await txStagehand.close();
          
          this.logOperation('DETAILED_TX_ERROR', { 
            hash: tx.hash,
            error: error instanceof Error ? error.message : String(error)
          });
          
          // Return the original transaction if we couldn't enhance it
          return tx;
        }
      });
      
      // Wait for all parallel executions to complete
      const enhancedTransactions = await Promise.all(enhancedTransactionsPromises);
      
      const result = {
        explorer: basicResult.explorer,
        transactions: enhancedTransactions,
        metadata: {
          ...basicResult.metadata,
          scraped: enhancedTransactions.length
        }
      };
      
      this.logOperation('DETAILED_SCRAPE_SUCCESS', { 
        explorer: explorer.project_name,
        transactionsCount: enhancedTransactions.length
      });
      
      return result;
    } catch (error) {
      this.logOperation('DETAILED_SCRAPE_ERROR', { 
        explorer: explorer.project_name,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Create a single transaction fetch method for the dashboard
   * @param address Address to check
   * @param chain Optional chain name to search on specific explorer
   * @returns Transaction data suitable for the dashboard
   */
  async fetchTransactionsForDashboard(address: string, chain?: string): Promise<any> {
    this.logOperation('DASHBOARD_FETCH_START', { address, chain });
    
    try {
      // Import explorer service to find the right explorer
      const ExplorerService = require('./explorer-service').ExplorerService;
      const explorerService = new ExplorerService();
      
      // Find appropriate explorer
      let explorer: ChainExplorer;
      
      if (chain) {
        // Try to find explorer for specific chain
        const chainExplorer = explorerService.findExplorer(chain, 'chain-explorer');
        if (chainExplorer) {
          explorer = chainExplorer;
        } else {
          // Fallback to a default explorer if chain-specific one isn't found
          explorer = explorerService.findExplorerByName('Etherscan') || 
                    explorerService.getAllExplorers()[0];
        }
      } else {
        // Default to Ethereum mainnet
        explorer = explorerService.findExplorerByName('Etherscan') || 
                  explorerService.getAllExplorers()[0];
      }
      
      if (!explorer) {
        throw new Error('No suitable explorer found');
      }
      
      // Scrape transactions
      const result = await this.scrapeTransactions(explorer, address, 10);
      
      // Format the data for the dashboard
      const formattedResult = {
        address,
        chain: chain || explorer.chain || 'ethereum',
        explorer: explorer.project_name,
        transactions: result.transactions.map(tx => ({
          hash: tx.hash,
          timestamp: tx.timestamp,
          from: tx.from || '',
          to: tx.to || '',
          value: tx.value || '0',
          type: tx.type || 'transfer',
          status: tx.status || 'success'
        })),
        metadata: result.metadata
      };
      
      this.logOperation('DASHBOARD_FETCH_SUCCESS', { 
        address,
        transactionsCount: formattedResult.transactions.length
      });
      
      return formattedResult;
    } catch (error) {
      this.logOperation('DASHBOARD_FETCH_ERROR', { 
        address,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return empty result on error
      return {
        address,
        chain: chain || 'ethereum',
        explorer: 'Unknown',
        transactions: [],
        metadata: {
          total: 0,
          scraped: 0,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
  
  /**
   * Create act/react templates for different blockchain explorers
   * For use with custom automation strategies
   */
  generateExplorerTemplate(explorerName: string): { 
    actTemplate: string; 
    observeTemplate: string;
  } {
    // Base templates for common explorers
    const templates: Record<string, { act: string; observe: string }> = {
      'Etherscan': {
        act: `
        1. Find the search input field (usually at the top of the page)
        2. Enter the address in the search field
        3. Click the search button or press Enter
        4. If transactions don't immediately appear, look for a "Transactions" tab and click it
        5. If there are filters for transaction types, select "All transactions"
        6. Look for "View all" or pagination options if not all transactions are displayed
        `,
        observe: `
        Look for:
        1. A table with transaction hashes (they start with 0x)
        2. "From" and "To" addresses
        3. ETH values
        4. Timestamps (usually in format like "2 hrs ago" or "Jan-02-2023")
        5. Transaction status indicators (Success/Failed)
        6. Pagination controls at the bottom
        `
      },
      'Blockchain.com': {
        act: `
        1. Look for the search bar at the top of the page
        2. Enter the address in the search field
        3. Click the search button or press Enter
        4. Once on the address page, find and click the "Transactions" tab if it's not already selected
        5. Scroll down to view all visible transactions
        6. If there's a "Load More" button, click it to see additional transactions
        `,
        observe: `
        Look for:
        1. A list of transactions with hashes
        2. Amount values in BTC
        3. Timestamps
        4. Incoming/Outgoing indicators
        5. A "Load More" button at the bottom
        `
      },
      'Polygonscan': {
        act: `
        1. Find the search input at the top of the page
        2. Enter the address in the search field
        3. Click search or press Enter
        4. Look for and click the "Transactions" tab if not automatically selected
        5. Check for transaction filters and select "All" if needed
        6. Check pagination options at the bottom of the transaction table
        `,
        observe: `
        Look for:
        1. A table with transaction hashes
        2. "From" and "To" addresses
        3. MATIC values
        4. Timestamps
        5. Gas fees
        6. Method IDs or names
        7. Pagination controls
        `
      },
      'LI.FI': {
        act: `
        1. Find the search input field
        2. Enter the address
        3. Click the search button
        4. Wait for the transaction list to load
        5. Look for "View more" options if available
        `,
        observe: `
        Look for:
        1. A list of cross-chain transactions
        2. Source and destination chains
        3. Amount and token information
        4. Status indicators
        5. Timestamps
        `
      }
    };
    
    // Default templates for unknown explorers
    const defaultTemplates = {
      act: `
      1. Find a search input field that accepts addresses
      2. Enter the address in the search field
      3. Submit the search (click search button or press Enter)
      4. Look for a transactions section, tab, or link
      5. If needed, click to navigate to the transactions view
      6. Look for pagination, "Load More", or "View All" options
      `,
      observe: `
      Look for:
      1. Any table or list containing transaction information
      2. Transaction hashes (usually long hexadecimal strings starting with 0x)
      3. From/To addresses
      4. Value/Amount fields
      5. Timestamps
      6. Status indicators
      7. Pagination controls
      `
    };
    
    // Find a matching template or use default
    const template = templates[explorerName] || defaultTemplates;
    
    return {
      actTemplate: template.act.trim(),
      observeTemplate: template.observe.trim()
    };
  }

  /**
   * Categorize an address based on its characteristics and transaction history
   * @param address The address to categorize
   * @param transactions Optional transactions to use for categorization
   * @returns AddressInfo with category and other details
   */
  async categorizeAddress(address: string, transactions?: Transaction[]): Promise<AddressInfo> {
    this.logOperation('CATEGORIZE_ADDRESS_START', { address });
    
    try {
      // Initialize Stagehand if not already done
      await this.stagehand.init();
      
      // If no transactions provided, we need to fetch some basic info about the address
      if (!transactions || transactions.length === 0) {
        // Navigate to Etherscan or similar explorer
        await this.stagehand.page.goto('https://etherscan.io');
        
        // Search for the address
        await this.stagehand.page.act(`Search for the address ${address} by:
          1. Find the search input field
          2. Enter the address ${address} into the search field
          3. Submit the search by pressing Enter or clicking the search button
          4. Wait for the results to load completely
        `);
      }
      
      // Define schema for address categorization
      const addressCategorySchema = z.object({
        addressInfo: z.object({
          address: z.string(),
          category: z.enum([
            'main', 'alt_wallet', 'cex', 'defi', 'bridge', 
            'mixer', 'contract', 'flagged', 'unknown'
          ]),
          tags: z.array(z.string()).optional(),
          label: z.string().optional(),
          balance: z.string().optional(),
          transactionCount: z.number().optional(),
          firstSeen: z.string().optional(),
          lastSeen: z.string().optional()
        })
      });
      
      // Extract address information
      const extractResponse = await this.stagehand.page.extract({
        instruction: `
          Analyze this blockchain address and categorize it based on its characteristics.
          Look for clues such as:
          1. Is it a contract or EOA (externally owned account)?
          2. Is it labeled as an exchange, bridge, or other known entity?
          3. What is the transaction pattern (high volume might indicate CEX)?
          4. Are there any warning flags or tags associated with this address?
          5. Check balance, transaction count, and first/last seen dates if available.
          
          Categorize as one of: main, alt_wallet, cex, defi, bridge, mixer, contract, flagged, unknown
        `,
        schema: addressCategorySchema,
      });
      
      this.logOperation('CATEGORIZE_ADDRESS_SUCCESS', { 
        address,
        category: extractResponse.addressInfo.category
      });
      
      return extractResponse.addressInfo;
    } catch (error) {
      this.logOperation('CATEGORIZE_ADDRESS_ERROR', { 
        address,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return basic info with unknown category if categorization fails
      return {
        address,
        category: 'unknown',
        tags: ['categorization_failed']
      };
    } finally {
      // Close the browser instance
      await this.stagehand.close();
    }
  }

  /**
   * Enhanced transaction scraping that includes address categorization
   * @param explorer The blockchain explorer to use
   * @param address The address to search for
   * @param limit Optional limit on number of transactions to return
   * @returns Scraping result with transactions and address categorization
   */
  async scrapeTransactionsWithCategories(explorer: ChainExplorer, address: string, limit: number = 10): Promise<ScrapingResult> {
    this.logOperation('SCRAPE_WITH_CATEGORIES_START', { 
      explorer: explorer.project_name,
      address,
      limit
    });
    
    try {
      // First, get basic transactions
      const basicResult = await this.scrapeTransactions(explorer, address, limit);
      
      // Then categorize the main address
      const addressInfo = await this.categorizeAddress(address, basicResult.transactions);
      
      // Extract unique addresses from transactions for categorization
      const uniqueAddresses = new Set<string>();
      basicResult.transactions.forEach(tx => {
        if (tx.from && tx.from !== address) uniqueAddresses.add(tx.from);
        if (tx.to && tx.to !== address) uniqueAddresses.add(tx.to);
      });
      
      // Categorize related addresses (limit to 5 to avoid too many browser sessions)
      const relatedAddressesArray = Array.from(uniqueAddresses).slice(0, 5);
      const relatedAddressesPromises = relatedAddressesArray.map(addr => 
        this.categorizeAddress(addr)
      );
      
      // Wait for all categorizations to complete
      const relatedAddresses = await Promise.all(relatedAddressesPromises);
      
      // Return enhanced result with categorizations
      return {
        ...basicResult,
        addressInfo,
        relatedAddresses
      };
    } catch (error) {
      this.logOperation('SCRAPE_WITH_CATEGORIES_ERROR', { 
        address,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
} 