import { ChatOpenAI } from '@langchain/openai';
import { ChainExplorer, Transaction } from '../types';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

export class LangChainService {
  private model: ChatOpenAI;

  constructor(apiKey?: string) {
    this.model = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0,
      openAIApiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Log structured information about LLM operations
   */
  private logOperation(operation: string, details: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      service: 'langchain',
      operation,
      ...details
    };
    console.log(`[LANGCHAIN_OPERATION] ${JSON.stringify(logEntry)}`);
  }

  /**
   * Generate browser automation instructions for a given explorer and address
   */
  async generateBrowserInstructions(explorer: ChainExplorer, address: string): Promise<string> {
    this.logOperation('GENERATE_INSTRUCTIONS_START', { 
      explorer: explorer.project_name,
      address
    });

    const prompt = `
      You are a blockchain explorer expert. I need step-by-step instructions to search for transactions 
      related to the address ${address} on ${explorer.project_name} (${explorer.explorer_url}).
      
      IMPORTANT CONSTRAINTS:
      1. Only provide instructions for actions that can be performed with certainty
      2. Do NOT make assumptions about the UI if you're not sure
      3. If you're uncertain about any step, indicate that clearly
      4. Focus on finding the search functionality and entering the address
      5. Do NOT hallucinate features that may not exist on the site
      
      Please provide detailed browser automation instructions including:
      1. How to navigate to the explorer
      2. Where to find the search box (be specific about selectors if possible)
      3. How to enter the address
      4. How to submit the search
      5. How to identify transaction data elements
      
      Format your response as a series of clear, executable steps.
    `;

    try {
      const response = await this.model.invoke(prompt);
      const instructions = response.content.toString();
      
      this.logOperation('GENERATE_INSTRUCTIONS_SUCCESS', { 
        explorer: explorer.project_name,
        instructionsLength: instructions.length
      });
      
      return instructions;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logOperation('GENERATE_INSTRUCTIONS_ERROR', { 
        explorer: explorer.project_name,
        error: errorMessage
      });
      throw error;
    }
  }

  /**
   * Parse transaction data from HTML content
   */
  async parseTransactionData(htmlContent: string, explorer: ChainExplorer): Promise<Transaction[]> {
    this.logOperation('PARSE_TRANSACTION_DATA_START', { 
      explorer: explorer.project_name,
      contentLength: htmlContent.length
    });

    const transactionParser = StructuredOutputParser.fromZodSchema(
      z.array(
        z.object({
          hash: z.string().describe('The transaction hash'),
          timestamp: z.string().describe('The transaction timestamp'),
          from: z.string().optional().describe('The sender address'),
          to: z.string().optional().describe('The recipient address'),
          value: z.string().optional().describe('The transaction value'),
          type: z.string().optional().describe('The transaction type'),
          status: z.string().optional().describe('The transaction status'),
          details: z.record(z.string(), z.string()).optional().describe('Additional transaction details')
        })
      )
    );

    const prompt = `
      You are a blockchain data extraction expert. I need you to extract transaction data from the following HTML content 
      from ${explorer.project_name}.
      
      IMPORTANT CONSTRAINTS:
      1. Only extract data that is clearly present in the HTML
      2. Do NOT invent or hallucinate any transaction data
      3. If you cannot find certain fields, leave them as undefined
      4. If you cannot find any transactions at all, return an empty array
      5. Be precise and accurate with the data you extract
      6. Ensure transaction hashes are complete and accurate
      7. Do not make up timestamps, addresses, or values
      
      The HTML content is from a page showing transactions for an address. Please extract all transactions you can find.
      
      HTML Content:
      \`\`\`html
      ${htmlContent.substring(0, 50000)} ${htmlContent.length > 50000 ? '... (content truncated)' : ''}
      \`\`\`
      
      ${transactionParser.getFormatInstructions()}
      
      Extract as many transactions as you can find in the HTML. If the HTML is truncated, extract what you can from the visible portion.
      If you cannot find any transactions, return an empty array [].
    `;

    try {
      const response = await this.model.invoke(prompt);
      const parsedResponse = await transactionParser.parse(response.content.toString());
      
      this.logOperation('PARSE_TRANSACTION_DATA_SUCCESS', { 
        explorer: explorer.project_name,
        transactionsCount: parsedResponse.length
      });
      
      return parsedResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logOperation('PARSE_TRANSACTION_DATA_ERROR', { 
        explorer: explorer.project_name,
        error: errorMessage
      });
      
      // Return empty array instead of throwing to handle parsing errors gracefully
      console.error('Error parsing transaction data:', error);
      return [];
    }
  }

  /**
   * Generate a summary of transaction data
   */
  async generateTransactionSummary(transactions: Transaction[], address: string): Promise<string> {
    this.logOperation('GENERATE_SUMMARY_START', { 
      address,
      transactionsCount: transactions.length
    });

    if (!transactions.length) {
      const noTransactionsMessage = `No transactions found for address ${address}.`;
      this.logOperation('GENERATE_SUMMARY_NO_TRANSACTIONS', { address });
      return noTransactionsMessage;
    }

    const prompt = `
      You are a blockchain analyst. I need you to analyze the following transactions for address ${address} 
      and provide a concise summary.
      
      IMPORTANT CONSTRAINTS:
      1. Only base your analysis on the provided transaction data
      2. Do NOT make assumptions beyond what is directly supported by the data
      3. If the data is limited, acknowledge this limitation in your summary
      4. Be factual and avoid speculative statements
      5. Use precise numbers and statistics based only on the provided transactions
      6. Do not reference external data or knowledge not present in the transactions
      
      Transactions:
      ${JSON.stringify(transactions, null, 2)}
      
      Please include in your summary:
      1. Total number of transactions
      2. Breakdown of transaction types (if available)
      3. Incoming vs outgoing transaction counts
      4. Common addresses interacted with (if any patterns exist)
      5. Value ranges and averages (if value data is available)
      6. Timestamp ranges (oldest to newest transaction)
      
      Format your response as a clear, concise summary that would be helpful for someone investigating this address.
      Start with a factual overview sentence, then use bullet points for key statistics.
    `;

    try {
      const response = await this.model.invoke(prompt);
      const summary = response.content.toString();
      
      this.logOperation('GENERATE_SUMMARY_SUCCESS', { 
        address,
        transactionsCount: transactions.length,
        summaryLength: summary.length
      });
      
      return summary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logOperation('GENERATE_SUMMARY_ERROR', { 
        address,
        error: errorMessage
      });
      
      // Return a basic summary instead of throwing
      return `Failed to generate detailed summary for ${address}. Found ${transactions.length} transactions.`;
    }
  }
} 