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
   * Generate browser automation instructions for a given explorer and address
   */
  async generateBrowserInstructions(explorer: ChainExplorer, address: string): Promise<string> {
    const prompt = `
      You are a blockchain explorer expert. I need step-by-step instructions to search for transactions 
      related to the address ${address} on ${explorer.project_name} (${explorer.explorer_url}).
      
      Please provide detailed browser automation instructions including:
      1. How to navigate to the explorer
      2. Where to find the search box
      3. How to enter the address
      4. How to submit the search
      5. How to identify and extract transaction data
      
      Format your response as a series of clear, executable steps.
    `;

    const response = await this.model.invoke(prompt);
    return response.content.toString();
  }

  /**
   * Parse transaction data from HTML content
   */
  async parseTransactionData(htmlContent: string, explorer: ChainExplorer): Promise<Transaction[]> {
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

    const formatInstructions = transactionParser.getFormatInstructions();

    const prompt = `
      You are a blockchain data extraction expert. I need you to extract transaction data from the following HTML content 
      from ${explorer.project_name} (${explorer.explorer_url}).
      
      Extract all transactions with their hash, timestamp, and any other available information like from/to addresses, 
      value, type, and status.
      
      ${formatInstructions}
      
      HTML Content:
      ${htmlContent}
    `;

    const response = await this.model.invoke(prompt);
    return transactionParser.parse(response.content.toString());
  }

  /**
   * Generate a summary of the transaction data
   */
  async generateTransactionSummary(transactions: Transaction[], address: string): Promise<string> {
    const prompt = `
      You are a blockchain analyst. I need you to summarize the following transactions related to address ${address}.
      
      Transactions:
      ${JSON.stringify(transactions, null, 2)}
      
      Please provide:
      1. A summary of transaction types and patterns
      2. Notable transactions (high value, unusual patterns)
      3. Common addresses interacted with
      4. Any other insights you can extract from this data
    `;

    const response = await this.model.invoke(prompt);
    return response.content.toString();
  }
} 