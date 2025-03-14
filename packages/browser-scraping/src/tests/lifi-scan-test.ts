#!/usr/bin/env ts-node

import { BrowserService } from '../services/browser-service';
import { ExplorerService } from '../services/explorer-service';
import { ScrapingInput } from '../types';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '..', '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
  console.error('Please make sure you have copied .env.example to .env and filled in your API keys');
  process.exit(1);
}

// Validate required environment variables
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
}

/**
 * End-to-end test for scraping transactions from LI.FI scan
 */
export async function runLifiScanTest() {
  console.log('Starting LI.FI scan test...');
  
  // Initialize log collector
  const logCollector = new LogCollector();
  
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
  const browserService = new BrowserService();
  const explorerService = new ExplorerService();
  
  // Test address
  const testAddress = '0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b';
  
  // Find LI.FI explorer
  const lifiExplorer = explorerService.findExplorerByName('LI.FI');
  if (!lifiExplorer) {
    console.error('LI.FI explorer not found in the list of explorers');
    throw new Error('LI.FI explorer not found in the list of explorers');
  }
  
  console.log(`Found LI.FI explorer: ${lifiExplorer.project_name} (${lifiExplorer.explorer_url})`);
  
  // Create scraping input - only address is required now
  const input: ScrapingInput = {
    address: testAddress
  };
  
  try {
    console.log(`Scraping transactions for address ${testAddress}...`);
    
    // Scrape transactions
    const result = await browserService.scrapeTransactions(input);
    
    // Log results
    console.log(`\n✅ Scraped ${result.transactions.length} transactions from ${result.explorer.project_name}`);
    console.log('Metadata:', result.metadata);
    
    // Log transaction details
    if (result.transactions.length > 0) {
      console.log('\n📊 Transaction details:');
      result.transactions.forEach((tx, index) => {
        console.log(`\nTransaction ${index + 1}:`);
        console.log(`Hash: ${tx.hash}`);
        console.log(`Timestamp: ${tx.timestamp}`);
        console.log(`From: ${tx.from}`);
        console.log(`To: ${tx.to}`);
        console.log(`Value: ${tx.value}`);
        console.log(`Type: ${tx.type}`);
        console.log(`Status: ${tx.status}`);
        if (tx.details) {
          console.log('Details:', tx.details);
        }
      });
    }
    
    // Generate summary
    console.log('\n📝 Generating transaction summary...');
    const summary = await browserService.generateSummary(input);
    console.log('\n📑 Transaction Summary:');
    console.log(summary);
    
    // Print collected logs
    logCollector.printLogs();
    
    console.log('\n✨ Test completed successfully!');
    
    // Restore original console.log
    logCollector.restore();
    
    return { result, summary, logs: logCollector.getLogs() };
  } catch (error) {
    console.error('❌ Error running LI.FI scan test:', error);
    
    // Print collected logs even on error
    logCollector.printLogs();
    
    // Restore original console.log
    logCollector.restore();
    
    throw error;
  }
}

/**
 * Generate a report of the test execution
 */
function generateTestReport(logs: string[]): string {
  // Count operations by type
  const operationCounts: Record<string, number> = {};
  
  logs.forEach(log => {
    const match = log.match(/🌐|🖥️|🧠\s+(\w+)/);
    if (match && match[1]) {
      const operation = match[1];
      operationCounts[operation] = (operationCounts[operation] || 0) + 1;
    }
  });
  
  // Generate report
  let report = '\n📊 TEST EXECUTION REPORT\n';
  report += '='.repeat(80) + '\n';
  report += 'Operation Counts:\n';
  
  Object.entries(operationCounts).forEach(([operation, count]) => {
    report += `  - ${operation}: ${count}\n`;
  });
  
  report += '='.repeat(80) + '\n';
  return report;
}

// If this file is run directly (not imported), run the test
if (require.main === module) {
  console.log('Running LI.FI scan test with address: 0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b');
  console.log('This test will scrape transaction data from LI.FI scan and generate a summary');
  console.log('-------------------------------------------------------------------');

  runLifiScanTest()
    .then((result) => {
      if (result && result.logs) {
        console.log(generateTestReport(result.logs));
      }
      console.log('Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}