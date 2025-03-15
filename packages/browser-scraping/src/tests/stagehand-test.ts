#!/usr/bin/env ts-node

import { StagehandService } from '../services/stagehand-service';
import { ExplorerService } from '../services/explorer-service';
import { ChainExplorer } from '../types';
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
const requiredEnvVars = ['BROWSERBASE_API_KEY', 'OPENAI_API_KEY'];
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
      case 'STAGEHAND_OPERATION':
        return `[${timestamp}] 🎭 ${logData.operation} - ${formatLogDetails(logData)}`;
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
      
      if (typeof logEntry === 'string' && logEntry.includes('[STAGEHAND_OPERATION]')) {
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
    this.originalConsoleLog('\n📋 STAGEHAND OPERATION LOGS:');
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
 * End-to-end test for scraping transactions using Stagehand
 */
async function runStagehandTest(explorer: ChainExplorer, address: string): Promise<any> {
  // Initialize log collector
  const logCollector = new LogCollector();
  
  console.log(`\n🎭 Testing Stagehand with explorer: ${explorer.project_name} (${explorer.explorer_url})`);
  console.log(`Category: ${explorer.category}`);
  
  // Create Stagehand service
  const stagehandService = new StagehandService();
  
  try {
    console.log(`Scraping transactions for address ${address}...`);
    
    // Start time measurement
    const startTime = Date.now();
    
    // Scrape transactions using Stagehand
    const result = await stagehandService.scrapeTransactions(explorer, address, 5);
    
    // End time measurement
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // in seconds
    
    // Log results
    console.log(`\n✅ Scraped ${result.transactions.length} transactions from ${result.explorer.project_name}`);
    console.log(`Time taken: ${duration.toFixed(2)} seconds`);
    
    // Print transaction details
    console.log('\n📝 Transaction Details:');
    console.log('='.repeat(80));
    
    result.transactions.forEach((tx, index) => {
      console.log(`Transaction #${index + 1}:`);
      console.log(`  Hash: ${tx.hash}`);
      console.log(`  Timestamp: ${tx.timestamp}`);
      console.log(`  From: ${tx.from || 'Unknown'}`);
      console.log(`  To: ${tx.to || 'Unknown'}`);
      console.log(`  Value: ${tx.value || 'N/A'}`);
      console.log(`  Status: ${tx.status || 'Unknown'}`);
      console.log('-'.repeat(40));
    });
    
    // Print collected logs
    logCollector.printLogs();
    
    // Save logs to file
    const logsDir = path.join(__dirname, '..', '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const safeExplorerName = explorer.project_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const logFilename = path.join(logsDir, `stagehand_${safeExplorerName}_logs.txt`);
    logCollector.saveLogs(logFilename);
    
    console.log(`\n✨ Stagehand test for ${explorer.project_name} completed successfully!`);
    
    // Restore original console.log
    logCollector.restore();
    
    return { 
      explorer: explorer.project_name,
      transactionsCount: result.transactions.length,
      transactions: result.transactions,
      duration,
      logs: logCollector.getLogs()
    };
  } catch (error) {
    console.error(`❌ Error testing Stagehand with ${explorer.project_name}:`, error);
    
    // Print collected logs even on error
    logCollector.printLogs();
    
    // Save error logs to file
    const logsDir = path.join(__dirname, '..', '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const safeExplorerName = explorer.project_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const logFilename = path.join(logsDir, `stagehand_${safeExplorerName}_error_logs.txt`);
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
 * Test detailed transaction scraping with Stagehand
 */
async function runDetailedStagehandTest(explorer: ChainExplorer, address: string): Promise<any> {
  // Initialize log collector
  const logCollector = new LogCollector();
  
  console.log(`\n🔍 Testing Stagehand Detailed Scraping with explorer: ${explorer.project_name}`);
  
  // Create Stagehand service
  const stagehandService = new StagehandService();
  
  try {
    console.log(`Scraping detailed transactions for address ${address}...`);
    
    // Start time measurement
    const startTime = Date.now();
    
    // Scrape detailed transactions using Stagehand
    const result = await stagehandService.scrapeDetailedTransactions(explorer, address);
    
    // End time measurement
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // in seconds
    
    // Log results
    console.log(`\n✅ Scraped ${result.transactions.length} detailed transactions from ${result.explorer.project_name}`);
    console.log(`Time taken: ${duration.toFixed(2)} seconds`);
    
    // Print transaction details
    console.log('\n📝 Detailed Transaction Information:');
    console.log('='.repeat(80));
    
    result.transactions.forEach((tx, index) => {
      console.log(`Transaction #${index + 1}:`);
      console.log(`  Hash: ${tx.hash}`);
      
      if (tx.details) {
        console.log('  Detailed info:');
        Object.entries(tx.details).forEach(([key, value]) => {
          if (key !== 'hash') { // Skip hash as we already displayed it
            console.log(`    ${key}: ${value || 'N/A'}`);
          }
        });
      }
      
      console.log('-'.repeat(40));
    });
    
    // Print collected logs
    logCollector.printLogs();
    
    // Save logs to file
    const logsDir = path.join(__dirname, '..', '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const safeExplorerName = explorer.project_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const logFilename = path.join(logsDir, `stagehand_detailed_${safeExplorerName}_logs.txt`);
    logCollector.saveLogs(logFilename);
    
    console.log(`\n✨ Stagehand detailed test for ${explorer.project_name} completed successfully!`);
    
    // Restore original console.log
    logCollector.restore();
    
    return { 
      explorer: explorer.project_name,
      transactionsCount: result.transactions.length,
      detailedTransactions: result.transactions,
      duration,
      logs: logCollector.getLogs()
    };
  } catch (error) {
    console.error(`❌ Error testing Stagehand detailed scraping with ${explorer.project_name}:`, error);
    
    // Print collected logs even on error
    logCollector.printLogs();
    
    // Save error logs to file
    const logsDir = path.join(__dirname, '..', '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const safeExplorerName = explorer.project_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const logFilename = path.join(logsDir, `stagehand_detailed_${safeExplorerName}_error_logs.txt`);
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
 * Test dashboard transaction fetching with Stagehand
 */
async function runDashboardFetchTest(address: string, chain?: string): Promise<any> {
  // Initialize log collector
  const logCollector = new LogCollector();
  
  console.log(`\n📊 Testing Stagehand Dashboard Fetch`);
  console.log(`Address: ${address}${chain ? `, Chain: ${chain}` : ''}`);
  
  // Create Stagehand service
  const stagehandService = new StagehandService();
  
  try {
    console.log(`Fetching transactions for dashboard...`);
    
    // Start time measurement
    const startTime = Date.now();
    
    // Fetch transactions for dashboard
    const result = await stagehandService.fetchTransactionsForDashboard(address, chain);
    
    // End time measurement
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // in seconds
    
    // Log results
    console.log(`\n✅ Fetched ${result.transactions.length} transactions for the dashboard`);
    console.log(`Explorer used: ${result.explorer}`);
    console.log(`Time taken: ${duration.toFixed(2)} seconds`);
    
    // Print transaction details
    if (result.transactions.length > 0) {
      console.log('\n📝 Transactions:');
      console.log('='.repeat(80));
      
      result.transactions.slice(0, 3).forEach((tx: any, index: number) => {
        console.log(`Transaction #${index + 1}:`);
        Object.entries(tx).forEach(([key, value]) => {
          console.log(`  ${key}: ${value || 'N/A'}`);
        });
        console.log('-'.repeat(40));
      });
      
      if (result.transactions.length > 3) {
        console.log(`... and ${result.transactions.length - 3} more transactions`);
      }
    }
    
    // Print collected logs
    logCollector.printLogs();
    
    // Save logs to file
    const logsDir = path.join(__dirname, '..', '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const chainSuffix = chain ? `_${chain}` : '';
    const logFilename = path.join(logsDir, `stagehand_dashboard${chainSuffix}_logs.txt`);
    logCollector.saveLogs(logFilename);
    
    console.log(`\n✨ Stagehand dashboard fetch test completed successfully!`);
    
    // Restore original console.log
    logCollector.restore();
    
    return { 
      chain: result.chain,
      explorer: result.explorer,
      transactionsCount: result.transactions.length,
      transactions: result.transactions,
      duration,
      logs: logCollector.getLogs()
    };
  } catch (error) {
    console.error(`❌ Error testing Stagehand dashboard fetch:`, error);
    
    // Print collected logs even on error
    logCollector.printLogs();
    
    // Save error logs to file
    const logsDir = path.join(__dirname, '..', '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const chainSuffix = chain ? `_${chain}` : '';
    const logFilename = path.join(logsDir, `stagehand_dashboard${chainSuffix}_error_logs.txt`);
    logCollector.saveLogs(logFilename);
    
    // Restore original console.log
    logCollector.restore();
    
    return { 
      error: error instanceof Error ? error.message : String(error),
      logs: logCollector.getLogs()
    };
  }
}

/**
 * Run all Stagehand tests
 */
async function runAllStagehandTests() {
  console.log('🚀 Starting Stagehand tests...');
  
  // Create explorer service
  const explorerService = new ExplorerService();
  
  // Test addresses - Using known addresses with transaction history
  const testAddresses = {
    ethereum: '0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b', // Ethereum address with known activity
    polygon: '0x05950478088e32B2CdF25ffA2D5855a96A79aA73', // Polygon address with known activity
    binance: '0x8894E0a0c962CB723c1976a4421c95949bE2D4E3', // Binance Smart Chain address with known activity
  };
  
  // Get explorers to test
  const etherscan = explorerService.findExplorerByName('Etherscan');
  const polygonscan = explorerService.findExplorerByName('Polygonscan');
  
  if (!etherscan || !polygonscan) {
    console.error('Required explorers not found');
    return;
  }
  
  const results = [];
  
  // Test basic transaction scraping
  console.log('\n📌 TESTING BASIC TRANSACTION SCRAPING');
  console.log('='.repeat(80));
  const basicResult = await runStagehandTest(etherscan, testAddresses.ethereum);
  results.push(basicResult);
  
  // Test detailed transaction scraping
  console.log('\n📌 TESTING DETAILED TRANSACTION SCRAPING');
  console.log('='.repeat(80));
  const detailedResult = await runDetailedStagehandTest(etherscan, testAddresses.ethereum);
  results.push(detailedResult);
  
  // Test dashboard fetching for Ethereum
  console.log('\n📌 TESTING DASHBOARD FETCH (ETHEREUM)');
  console.log('='.repeat(80));
  const dashboardEthResult = await runDashboardFetchTest(testAddresses.ethereum, 'ethereum');
  results.push(dashboardEthResult);
  
  // Test dashboard fetching for Polygon
  console.log('\n📌 TESTING DASHBOARD FETCH (POLYGON)');
  console.log('='.repeat(80));
  const dashboardPolygonResult = await runDashboardFetchTest(testAddresses.polygon, 'polygon');
  results.push(dashboardPolygonResult);
  
  // Print summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  
  results.forEach((result, index) => {
    if ('error' in result) {
      console.log(`❌ Test #${index + 1}: FAILED - ${result.error}`);
    } else {
      console.log(`✅ Test #${index + 1}: PASSED - ${result.explorer || result.chain} - ${result.transactionsCount} transactions`);
    }
  });
  
  console.log('\n✨ All Stagehand tests completed!');
}

// Run the tests
runAllStagehandTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
}); 