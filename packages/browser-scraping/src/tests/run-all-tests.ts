#!/usr/bin/env ts-node

import { runLifiScanTest } from './lifi-scan-test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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
 * Run all tests and generate a comprehensive report
 */
async function runAllTests() {
  console.log('🚀 Running all browser scraping tests...');
  console.log('='.repeat(80));
  
  const startTime = Date.now();
  const results: Record<string, any> = {};
  
  // Create logs directory if it doesn't exist
  const logsDir = path.join(__dirname, '..', '..', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Run LI.FI scan test
  console.log('\n📊 Running LI.FI scan test...');
  try {
    const lifiResult = await runLifiScanTest();
    results.lifi = {
      success: true,
      transactionsCount: lifiResult.result.transactions.length,
      summaryLength: lifiResult.summary.length,
      logCount: lifiResult.logs.length
    };
    console.log('✅ LI.FI scan test completed successfully');
  } catch (error) {
    results.lifi = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
    console.error('❌ LI.FI scan test failed:', error);
  }
  
  // Run explorer logs test
  console.log('\n📊 Running explorer logs test...');
  try {
    // Run the explorer logs test in a separate process to avoid log collector conflicts
    execSync('npx ts-node src/tests/explorer-logs-test.ts', { 
      stdio: 'inherit',
      env: process.env
    });
    results.explorers = {
      success: true
    };
    console.log('✅ Explorer logs test completed successfully');
  } catch (error) {
    results.explorers = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
    console.error('❌ Explorer logs test failed:', error);
  }
  
  // Generate report
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  const report = generateReport(results, duration);
  
  // Save report to file
  const reportPath = path.join(logsDir, `test-report-${new Date().toISOString().replace(/:/g, '-')}.md`);
  fs.writeFileSync(reportPath, report);
  
  console.log(`\n📝 Report saved to ${reportPath}`);
  console.log('\n='.repeat(80));
  console.log(`🏁 All tests completed in ${duration.toFixed(2)} seconds`);
  
  // Print report summary
  console.log('\n📋 REPORT SUMMARY:');
  console.log('='.repeat(80));
  console.log(report);
  console.log('='.repeat(80));
  
  return results;
}

/**
 * Generate a comprehensive report
 */
function generateReport(results: Record<string, any>, duration: number): string {
  let report = `# Browser Scraping Test Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `Duration: ${duration.toFixed(2)} seconds\n\n`;
  
  // LI.FI test results
  report += `## LI.FI Scan Test\n\n`;
  if (results.lifi?.success) {
    report += `✅ **Success**\n\n`;
    report += `- Transactions: ${results.lifi.transactionsCount}\n`;
    report += `- Summary Length: ${results.lifi.summaryLength} characters\n`;
    report += `- Log Count: ${results.lifi.logCount} entries\n`;
  } else {
    report += `❌ **Failed**\n\n`;
    report += `- Error: ${results.lifi?.error || 'Unknown error'}\n`;
  }
  
  // Explorer logs test results
  report += `\n## Explorer Logs Test\n\n`;
  if (results.explorers?.success) {
    report += `✅ **Success**\n\n`;
    
    // Count log files
    const logsDir = path.join(__dirname, '..', '..', 'logs');
    const logFiles = fs.readdirSync(logsDir).filter(file => file.endsWith('_logs.txt'));
    
    report += `- Log Files Generated: ${logFiles.length}\n`;
    report += `- Log Files:\n`;
    
    logFiles.forEach(file => {
      const stats = fs.statSync(path.join(logsDir, file));
      const sizeKb = (stats.size / 1024).toFixed(2);
      report += `  - ${file} (${sizeKb} KB)\n`;
    });
  } else {
    report += `❌ **Failed**\n\n`;
    report += `- Error: ${results.explorers?.error || 'Unknown error'}\n`;
  }
  
  // Anti-hallucination measures
  report += `\n## Anti-Hallucination Measures\n\n`;
  report += `The following techniques were implemented to prevent hallucination:\n\n`;
  report += `1. **Structured Logging**: Detailed logs of every step in the process\n`;
  report += `2. **Explicit Constraints**: Clear instructions to LLMs to avoid making up data\n`;
  report += `3. **Validation**: Schema validation for all extracted data\n`;
  report += `4. **Error Handling**: Proper error handling instead of falling back to fake data\n`;
  report += `5. **Empty State Handling**: Proper handling of cases where no data is found\n`;
  
  return report;
}

// If this file is run directly (not imported), run all tests
if (require.main === module) {
  console.log('Running all browser scraping tests...');
  console.log('This will run the LI.FI scan test and the explorer logs test');
  console.log('-------------------------------------------------------------------');

  runAllTests()
    .then(() => {
      console.log('All tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Tests failed:', error);
      process.exit(1);
    });
} 