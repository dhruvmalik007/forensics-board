import axios from 'axios';
import { ethers } from 'ethers';
import { 
  Token, 
  SwapQuote, 
  Transaction, 
  AgentAction,
  SelectedNode
} from '../types';

/**
 * Service for interacting with Coinbase CDP APIs and Base blockchain
 */
export class AgentService {
  private apiKey: string;
  private baseUrl: string = 'https://api.coinbase.com/api/v3/cdp';
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.COINBASE_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('No Coinbase API key provided. AgentKit will use mock data.');
    }
  }

  /**
   * Log structured information about agent operations
   */
  private logOperation(operation: string, details: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      service: 'agentkit',
      operation,
      ...details
    };
    console.log(`[AGENTKIT_OPERATION] ${JSON.stringify(logEntry)}`);
  }

  /**
   * Get token information
   * @param tokenAddress The token address
   * @param chainId The chain ID (default: 8453 for Base)
   * @returns Token information
   */
  async getToken(tokenAddress: string, chainId: number = 8453): Promise<Token> {
    this.logOperation('GET_TOKEN', { tokenAddress, chainId });
    
    try {
      if (!this.apiKey) {
        // Return mock data if no API key
        return this.getMockToken(tokenAddress, chainId);
      }
      
      const response = await axios.get(`${this.baseUrl}/tokens/${tokenAddress}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        params: {
          chainId
        }
      });
      
      return response.data;
    } catch (error) {
      this.logOperation('GET_TOKEN_ERROR', { 
        tokenAddress,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Fall back to mock data on error
      return this.getMockToken(tokenAddress, chainId);
    }
  }

  /**
   * Get swap quote for tokens
   * @param fromToken The source token
   * @param toToken The destination token
   * @param amount The amount to swap
   * @returns Swap quote information
   */
  async getSwapQuote(fromToken: Token, toToken: Token, amount: string): Promise<SwapQuote> {
    this.logOperation('GET_SWAP_QUOTE', { 
      fromToken: fromToken.symbol,
      toToken: toToken.symbol,
      amount
    });
    
    try {
      if (!this.apiKey) {
        // Return mock data if no API key
        return this.getMockSwapQuote(fromToken, toToken, amount);
      }
      
      const response = await axios.get(`${this.baseUrl}/swap/quote`, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        params: {
          fromTokenAddress: fromToken.address,
          toTokenAddress: toToken.address,
          amount,
          chainId: fromToken.chainId
        }
      });
      
      return response.data;
    } catch (error) {
      this.logOperation('GET_SWAP_QUOTE_ERROR', { 
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Fall back to mock data on error
      return this.getMockSwapQuote(fromToken, toToken, amount);
    }
  }

  /**
   * Build a swap transaction
   * @param quote The swap quote
   * @param userAddress The user's address
   * @returns Transaction data
   */
  async buildSwapTransaction(quote: SwapQuote, userAddress: string): Promise<Transaction> {
    this.logOperation('BUILD_SWAP_TRANSACTION', { 
      fromToken: quote.fromToken.symbol,
      toToken: quote.toToken.symbol,
      userAddress
    });
    
    try {
      if (!this.apiKey) {
        // Return mock data if no API key
        return this.getMockTransaction(quote, userAddress);
      }
      
      const response = await axios.post(`${this.baseUrl}/swap/transaction`, {
        quoteId: quote.bestRoute.protocol,
        fromTokenAddress: quote.fromToken.address,
        toTokenAddress: quote.toToken.address,
        amount: quote.fromAmount,
        userAddress,
        chainId: quote.fromToken.chainId
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      });
      
      return response.data;
    } catch (error) {
      this.logOperation('BUILD_SWAP_TRANSACTION_ERROR', { 
        fromToken: quote.fromToken.symbol,
        toToken: quote.toToken.symbol,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Fall back to mock data on error
      return this.getMockTransaction(quote, userAddress);
    }
  }

  /**
   * Process a node selection for agent actions
   * @param selectedNode The selected node
   * @param userAddress The user's address
   * @returns Agent action to perform
   */
  async processNodeSelection(selectedNode: SelectedNode, userAddress: string): Promise<AgentAction> {
    this.logOperation('PROCESS_NODE_SELECTION', { 
      nodeId: selectedNode.id,
      nodeType: selectedNode.type,
      userAddress
    });
    
    // If the node is a token contract, prepare a swap action
    if (selectedNode.type === 'contract' && selectedNode.tokenAddress) {
      // Get token information
      const token = await this.getToken(selectedNode.tokenAddress, selectedNode.chainId || 8453);
      
      // Get ETH token for the from token
      const ethToken: Token = {
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        chainId: selectedNode.chainId || 8453,
        price: 3000
      };
      
      // Get a swap quote
      const quote = await this.getSwapQuote(ethToken, token, ethers.parseEther('0.1').toString());
      
      // Build the swap transaction
      const transaction = await this.buildSwapTransaction(quote, userAddress);
      
      // Return the swap action
      return {
        type: 'swap',
        params: {
          fromToken: ethToken,
          toToken: token,
          amount: ethers.parseEther('0.1').toString(),
          quote,
          transaction
        }
      };
    }
    
    // Default action if node type is not recognized
    return {
      type: 'swap',
      params: {
        message: `Selected node ${selectedNode.id} of type ${selectedNode.type} is not a token contract.`
      }
    };
  }

  /**
   * Get mock token data
   */
  private getMockToken(tokenAddress: string, chainId: number): Token {
    // Generate a deterministic token based on the address
    const addressSum = tokenAddress.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const mockSymbols = ['USDC', 'WETH', 'DAI', 'LINK', 'UNI', 'AAVE', 'MKR', 'SNX'];
    const mockNames = ['USD Coin', 'Wrapped Ethereum', 'Dai Stablecoin', 'Chainlink', 'Uniswap', 'Aave', 'Maker', 'Synthetix'];
    
    const index = addressSum % mockSymbols.length;
    
    return {
      address: tokenAddress,
      symbol: mockSymbols[index],
      name: mockNames[index],
      decimals: index === 0 ? 6 : 18, // USDC has 6 decimals, others 18
      chainId,
      logoURI: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${tokenAddress}/logo.png`,
      price: 10 + (addressSum % 1000),
      priceChange24h: (addressSum % 20) - 10
    };
  }

  /**
   * Get mock swap quote data
   */
  private getMockSwapQuote(fromToken: Token, toToken: Token, amount: string): SwapQuote {
    const mockProtocols = ['Uniswap', 'Sushiswap', 'Curve', 'Balancer'];
    const mockRoute = {
      protocol: mockProtocols[Math.floor(Math.random() * mockProtocols.length)],
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: (Number(amount) * (toToken.price || 1) / (fromToken.price || 1)).toString(),
      priceImpact: Math.random() * 2,
      estimatedGas: '100000',
      gasCost: '0.001'
    };
    
    return {
      routes: [mockRoute],
      bestRoute: mockRoute,
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: mockRoute.toAmount,
      estimatedGas: '100000'
    };
  }

  /**
   * Get mock transaction data
   */
  private getMockTransaction(quote: SwapQuote, userAddress: string): Transaction {
    // Generate a mock transaction
    return {
      to: '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch router address
      data: '0x12345678',
      value: quote.fromToken.symbol === 'ETH' ? quote.fromAmount : '0',
      gasLimit: '250000',
      chainId: quote.fromToken.chainId
    };
  }
} 