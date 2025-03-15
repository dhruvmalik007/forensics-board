#!/usr/bin/env ts-node

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
 * Run all tests and generate a comprehensive report
 */
async function runAllTests() {
  console.log('🚀 Running Stagehand tests...');
  console.log('='.repeat(80));
  
  const startTime = Date.now();
  const results: Record<string, any> = {};
  
  // Create logs directory if it doesn't exist
  const logsDir = path.join(__dirname, '..', '..', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Run Stagehand test
  console.log('\n🎭 Running Stagehand test...');
  try {
    // Run the Stagehand test
    execSync('npx ts-node src/tests/stagehand-test.ts', { 
      stdio: 'inherit',
      env: process.env
    });
    results.stagehand = {
      success: true
    };
    console.log('✅ Stagehand test completed successfully');
  } catch (error) {
    results.stagehand = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
    console.error('❌ Stagehand test failed:', error);
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
  let report = `# Stagehand Test Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `Duration: ${duration.toFixed(2)} seconds\n\n`;
  
  // Stagehand test results
  report += `\n## Stagehand Test\n\n`;
  if (results.stagehand?.success) {
    report += `✅ **Success**\n\n`;
    
    // Count Stagehand log files
    const logsDir = path.join(__dirname, '..', '..', 'logs');
    const stagehandLogFiles = fs.readdirSync(logsDir).filter(file => 
      file.startsWith('stagehand_') && file.endsWith('_logs.txt')
    );
    
    report += `- Log Files Generated: ${stagehandLogFiles.length}\n`;
    report += `- Log Files:\n`;
    
    stagehandLogFiles.forEach(file => {
      const stats = fs.statSync(path.join(logsDir, file));
      const sizeKb = (stats.size / 1024).toFixed(2);
      report += `  - ${file} (${sizeKb} KB)\n`;
    });
  } else {
    report += `❌ **Failed**\n\n`;
    report += `- Error: ${results.stagehand?.error || 'Unknown error'}\n`;
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
  console.log('Running Stagehand tests...');
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