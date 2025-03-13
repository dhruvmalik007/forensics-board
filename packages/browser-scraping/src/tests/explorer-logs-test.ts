#!/usr/bin/env ts-node

import { BrowserService } from '../services/browser-service';
import { ExplorerService } from '../services/explorer-service';
import { ScrapingInput, ChainExplorer } from '../types';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '..', '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
  console.error('Please make sure you have copied .env.example to .env and filled in your API keys');
  process.exit(1);
}

// Ensure required environment variables are set
const requiredEnvVars = ['BROWSERBASE_API_KEY', 'BROWSERBASE_PROJECT_ID', 'OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease add these variables to your .env file');
  process.exit(1);
}

/**
 * Format structured logs for better readability
 */
function formatStructuredLog(logEntry: string): string {
  try {
    // Extract the log type and JSON content
    const match = logEntry.match(/\[(.*?)\]\s+(.*)/);
    if (!match) return logEntry;
    
    const [, logType, jsonContent] = match;
    const logData = JSON.parse(jsonContent);
    
    // Format timestamp
    const timestamp = new Date(logData.timestamp).toLocaleTimeString();
    
    // Format based on log type
    switch (logType) {
      case 'BROWSER_OPERATION':
        return `[${timestamp}] 🌐 ${logData.operation} - ${formatLogDetails(logData)}`;
      case 'BROWSERBASE_OPERATION':
        return `[${timestamp}] 🖥️ ${logData.operation} - ${formatLogDetails(logData)}`;
      case 'LANGCHAIN_OPERATION':
        return `[${timestamp}] 🧠 ${logData.operation} - ${formatLogDetails(logData)}`;
      default:
        return `[${timestamp}] ${logType}: ${formatLogDetails(logData)}`;
    }
  } catch (error) {
    return logEntry; // Return original if parsing fails
  }
}

/**
 * Format log details for better readability
 */
function formatLogDetails(logData: Record<string, any>): string {
  // Remove common fields to avoid duplication
  const { timestamp, operation, service, ...details } = logData;
  
  // Format the details
  return Object.entries(details)
    .map(([key, value]) => {
      if (typeof value === 'string' && value.length > 50) {
        return `${key}: ${value.substring(0, 50)}...`;
      }
      return `${key}: ${value}`;
    })
    .join(', ');
}

/**
 * Collect and format logs during test execution
 */
class LogCollector {
  private logs: string[] = [];
  private originalConsoleLog: typeof console.log;
  
  constructor() {
    this.originalConsoleLog = console.log;
    
    // Override console.log to capture structured logs
    console.log = (...args: any[]) => {
      const logEntry = args[0];
      this.originalConsoleLog.apply(console, args);
      
      if (typeof logEntry === 'string' && 
          (logEntry.includes('[BROWSER_OPERATION]') || 
           logEntry.includes('[BROWSERBASE_OPERATION]') || 
           logEntry.includes('[LANGCHAIN_OPERATION]'))) {
        this.logs.push(formatStructuredLog(logEntry));
      }
    };
  }
  
  /**
   * Get all collected logs
   */
  getLogs(): string[] {
    return this.logs;
  }
  
  /**
   * Print all collected logs
   */
  printLogs(): void {
    this.originalConsoleLog('\n📋 STRUCTURED OPERATION LOGS:');
    this.originalConsoleLog('='.repeat(80));
    this.logs.forEach(log => this.originalConsoleLog(log));
    this.originalConsoleLog('='.repeat(80));
  }
  
  /**
   * Restore original console.log
   */
  restore(): void {
    console.log = this.originalConsoleLog;
  }
  
  /**
   * Save logs to a file
   */
  saveLogs(filename: string): void {
    const logContent = this.logs.join('\n');
    fs.writeFileSync(filename, logContent);
    this.originalConsoleLog(`Logs saved to ${filename}`);
  }
}

/**
 * End-to-end test for scraping transactions from a specific explorer
 */
async function runExplorerTest(explorer: ChainExplorer, address: string): Promise<any> {
  // Initialize log collector
  const logCollector = new LogCollector();
  
  console.log(`\n🔍 Testing explorer: ${explorer.project_name} (${explorer.explorer_url})`);
  console.log(`Category: ${explorer.category}`);
  
  // Create services
  const browserService = new BrowserService();
  
  // Create scraping input
  const input: ScrapingInput = {
    address,
    chain: explorer.chain || 'ethereum', // Default to ethereum if no chain specified
    category: explorer.category,
    limit: 5
  };
  
  try {
    console.log(`Scraping transactions for address ${address}...`);
    
    // Scrape transactions
    const result = await browserService.scrapeTransactions(input);
    
    // Log results
    console.log(`\n✅ Scraped ${result.transactions.length} transactions from ${result.explorer.project_name}`);
    
    // Generate summary
    console.log('\n📝 Generating transaction summary...');
    const summary = await browserService.generateSummary(input);
    
    // Print collected logs
    logCollector.printLogs();
    
    // Save logs to file
    const logsDir = path.join(__dirname, '..', '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const safeExplorerName = explorer.project_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const logFilename = path.join(logsDir, `${safeExplorerName}_logs.txt`);
    logCollector.saveLogs(logFilename);
    
    console.log(`\n✨ Test for ${explorer.project_name} completed successfully!`);
    
    // Restore original console.log
    logCollector.restore();
    
    return { 
      explorer: explorer.project_name,
      transactionsCount: result.transactions.length,
      summary,
      logs: logCollector.getLogs()
    };
  } catch (error) {
    console.error(`❌ Error testing ${explorer.project_name}:`, error);
    
    // Print collected logs even on error
    logCollector.printLogs();
    
    // Save error logs to file
    const logsDir = path.join(__dirname, '..', '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const safeExplorerName = explorer.project_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const logFilename = path.join(logsDir, `${safeExplorerName}_error_logs.txt`);
    logCollector.saveLogs(logFilename);
    
    // Restore original console.log
    logCollector.restore();
    
    return { 
      explorer: explorer.project_name,
      error: error instanceof Error ? error.message : String(error),
      logs: logCollector.getLogs()
    };
  }
}

/**
 * Run tests for multiple explorers
 */
async function runMultipleExplorerTests() {
  console.log('Starting explorer tests...');
  
  // Check for required environment variables
  if (!process.env.BROWSERBASE_API_KEY) {
    console.error('Error: BROWSERBASE_API_KEY environment variable is required');
    throw new Error('BROWSERBASE_API_KEY environment variable is required');
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  
  // Create services
  const explorerService = new ExplorerService();
  
  // Test address - Ethereum address with known cross-chain activity
  const testAddress = '0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b';
  
  // Get explorers to test
  const explorers = explorerService.getExplorersByCategory('crosschain-txn').slice(0, 3);
  
  console.log(`Found ${explorers.length} explorers to test`);
  
  const results = [];
  
  for (const explorer of explorers) {
    try {
      const result = await runExplorerTest(explorer, testAddress);
      results.push(result);
    } catch (error) {
      console.error(`Failed to test ${explorer.project_name}:`, error);
      results.push({
        explorer: explorer.project_name,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Generate summary report
  console.log('\n📊 EXPLORER TESTS SUMMARY');
  console.log('='.repeat(80));
  
  results.forEach(result => {
    if ('error' in result) {
      console.log(`❌ ${result.explorer}: Failed - ${result.error}`);
    } else {
      console.log(`✅ ${result.explorer}: ${result.transactionsCount} transactions`);
    }
  });
  
  console.log('='.repeat(80));
  
  return results;
}

// If this file is run directly (not imported), run the tests
if (require.main === module) {
  console.log('Running explorer tests to demonstrate structured logging');
  console.log('This will test multiple blockchain explorers and save detailed logs');
  console.log('-------------------------------------------------------------------');

  runMultipleExplorerTests()
    .then(() => {
      console.log('All tests completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Tests failed:', error);
      process.exit(1);
    });
} 