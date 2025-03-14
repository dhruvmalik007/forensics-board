# Browser Scraping Package

This package provides tools for scraping blockchain explorer websites using Browserbase for browser automation and LangChain for data extraction and analysis.

## Features

- Automated browser-based scraping of blockchain explorers
- Structured logging of all operations
- LLM-powered transaction data extraction and analysis
- Support for multiple blockchain explorers

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:

```
# Both Browserbase API key and Project ID are required
BROWSERBASE_API_KEY=your_browserbase_api_key
BROWSERBASE_PROJECT_ID=your_browserbase_project_id

# OpenAI API key
OPENAI_API_KEY=your_openai_api_key

# Optional: Set to 'true' to enable debug logging
DEBUG=false
```

> **Note**: You can find your Browserbase API key and Project ID in your Browserbase dashboard. Both are required for session creation.

## Running Tests

### SDK Test

This test verifies that the Browserbase SDK is working correctly:

```bash
npm run test:sdk
```

### LI.FI Scan Test

This test demonstrates scraping transactions from the LI.FI explorer:

```bash
npm run test:lifi
```

### Multiple Explorer Test

This test demonstrates scraping from multiple blockchain explorers with detailed structured logging:

```bash
npm run test:explorers
```

### Run All Tests

To run all tests and generate a comprehensive report:

```bash
npm test
```

## Understanding Structured Logs

The tests generate structured logs for each operation in the scraping process. These logs are formatted for readability and saved to the `logs` directory.

### Log Format

Logs are formatted with emojis to indicate the service:

- 🌐 `BROWSER_OPERATION` - High-level browser service operations
- 🖥️ `BROWSERBASE_OPERATION` - Browserbase API operations
- 🧠 `LANGCHAIN_OPERATION` - LLM operations


A typical scraping operation generates logs in this sequence:

1. **Start Scraping**
   ```
   🌐 SCRAPE_START - address: 0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b, chain: ethereum, category: crosschain-txn, limit: 10
   ```

2. **Generate Browser Instructions**
   ```
   🌐 GENERATE_INSTRUCTIONS_START - explorer: LI.FI, address: 0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b
   🧠 GENERATE_INSTRUCTIONS_START - explorer: LI.FI, address: 0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b
   🧠 GENERATE_INSTRUCTIONS_SUCCESS - explorer: LI.FI, instructionsLength: 523
   🌐 GENERATE_INSTRUCTIONS_COMPLETE - explorer: LI.FI, instructionsLength: 523
   ```

3. **Browser Automation**
   ```
   🌐 BROWSER_SCRAPE_START - explorer: LI.FI, url: https://scan.li.fi/, address: 0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b
   🖥️ LIFI_SCRAPE_START - address: 0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b
   🖥️ SESSION_CREATE_START
   🖥️ SESSION_CREATE_SUCCESS - sessionId: sess_abc123
   🖥️ NAVIGATE_START - sessionId: sess_abc123, url: https://scan.li.fi/
   🖥️ NAVIGATE_SUCCESS - sessionId: sess_abc123, url: https://scan.li.fi/
   🖥️ LIFI_WAIT_FOR_SEARCH - sessionId: sess_abc123
   🖥️ WAIT_FOR_ELEMENT_START - sessionId: sess_abc123, selector: input[placeholder*="Search"], timeout: 30000
   🖥️ WAIT_FOR_ELEMENT_SUCCESS - sessionId: sess_abc123, selector: input[placeholder*="Search"]
   🖥️ TYPE_TEXT_START - sessionId: sess_abc123, selector: input[placeholder*="Search"], textLength: 42, textPreview: 0x35FEcd342124CA5d1B4E8E...
   🖥️ TYPE_TEXT_SUCCESS - sessionId: sess_abc123, selector: input[placeholder*="Search"]
   🖥️ LIFI_CLICK_SEARCH - sessionId: sess_abc123
   🖥️ CLICK_ELEMENT_START - sessionId: sess_abc123, selector: button[type="submit"]
   🖥️ CLICK_ELEMENT_SUCCESS - sessionId: sess_abc123, selector: button[type="submit"]
   🖥️ LIFI_WAIT_FOR_RESULTS - sessionId: sess_abc123
   🖥️ WAIT_FOR_ELEMENT_START - sessionId: sess_abc123, selector: .transaction-list, timeout: 60000
   🖥️ WAIT_FOR_ELEMENT_SUCCESS - sessionId: sess_abc123, selector: .transaction-list
   🖥️ GET_PAGE_CONTENT_START - sessionId: sess_abc123
   🖥️ EXECUTE_SCRIPT_START - sessionId: sess_abc123, scriptLength: 52, scriptPreview: return document.documentElement.outerHTML;
   🖥️ EXECUTE_SCRIPT_SUCCESS - sessionId: sess_abc123, resultType: string, resultPreview: "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"/><link rel=\"icon\" href=\"/favicon.ico\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/><meta name=\"theme-color\" content=\"#000000\"/><meta name=\"description\" content=\"LI.FI Scan - Explore cross-chain transactions\"/><link rel=\"apple-touch-icon\" href=\"/logo192.png\"/><link rel=\"manifest\" href=\"/manifest.json\"/><title>LI.FI Scan</title></head><body><div id=\"root\"><div class=\"App\"><header class=\"Header\"><div class=\"container\"><div class=\"logo\"><img src=\"/logo.svg\" alt=\"LI.FI Scan\"/></div><div class=\"search\"><form><input type=\"text\" placeholder=\"Search by address, transaction hash, or token\" value=\"0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b\"/><button type=\"submit\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"11\" cy=\"11\" r=\"8\"></circle><line x1=\"21\" y1=\"21\" x2=\"16.65\" y2=\"16.65\"></line></svg></button></form></div></div></header><main><div class=\"container\"><div class=\"address-details\"><h1>Address: 0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b</h1><div class=\"stats\"><div class=\"stat\"><span>Total Transactions</span><strong>12</strong></div><div class=\"stat\"><span>First Transaction</span><strong>2023-05-15</strong></div><div class=\"stat\"><span>Last Transaction</span><strong>2023-10-20</strong></div></div></div><div class=\"transaction-list\"><h2>Transactions</h2><table><thead><tr><th>Hash</th><th>Date</th><th>From</th><th>To</th><th>Value</th><th>Status</th></tr></thead><tbody><tr><td><a href=\"/tx/0x1a2b3c4d5e6f\">0x1a2b3c4d5e6f</a></td><td>2023-10-20 14:30:45</td><td><a href=\"/address/0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b\">0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b</a></td><td><a href=\"/address/0xabcdef1234567890\">0xabcdef1234567890</a></td><td>1.5 ETH</td><td class=\"success\">Success</td></tr>..."
   🖥️ GET_PAGE_CONTENT_SUCCESS - sessionId: sess_abc123, contentLength: 125000
   🖥️ LIFI_SCRAPE_SUCCESS - address: 0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b, contentLength: 125000
   🖥️ SESSION_CLOSE_START - sessionId: sess_abc123
   🖥️ SESSION_CLOSE_SUCCESS - sessionId: sess_abc123
   🌐 BROWSER_SCRAPE_COMPLETE - explorer: LI.FI, contentLength: 125000
   ```

4. **Parse Transaction Data**
   ```
   🌐 PARSE_TRANSACTIONS_START - explorer: LI.FI
   🧠 PARSE_TRANSACTION_DATA_START - explorer: LI.FI, contentLength: 125000
   🧠 PARSE_TRANSACTION_DATA_SUCCESS - explorer: LI.FI, transactionsCount: 12
   🌐 PARSE_TRANSACTIONS_COMPLETE - explorer: LI.FI, transactionsCount: 12
   ```

5. **Generate Summary**
   ```
   🌐 GENERATE_SUMMARY_START - address: 0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b, transactionsCount: 10
   🧠 GENERATE_SUMMARY_START - address: 0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b, transactionsCount: 10
   🧠 GENERATE_SUMMARY_SUCCESS - address: 0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b, transactionsCount: 10, summaryLength: 450
   🌐 GENERATE_SUMMARY_COMPLETE - address: 0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b, summaryLength: 450
   ```

## Architecture

The package consists of several services:

- **BrowserService**: Coordinates the scraping process
- **BrowserbaseService**: Handles browser automation via Browserbase API
- **LangChainService**: Uses LLMs for generating instructions, parsing data, and creating summaries
- **ExplorerService**: Manages the list of blockchain explorers

## Recent Changes

### BrowserbaseService Updates

The `BrowserbaseService` has been updated to properly initialize and use the Browserbase SDK:

1. Added validation for both API key and Project ID
2. Improved error handling for session creation
3. Added a dedicated SDK test to verify functionality

### SDK Test

A new test file `sdk-test.ts` has been added to verify that the Browserbase SDK is working correctly. This test:

1. Initializes the SDK with your API key
2. Creates a session with your Project ID
3. Connects to a page
4. Navigates to a website
5. Extracts content
6. Closes the session

Run this test to verify that your Browserbase credentials are working correctly:

```bash
npm run test:sdk
```

## Avoiding Hallucination

The package implements several techniques to avoid hallucination:

1. **Structured Logging**: Detailed logs of every step in the process
2. **Explicit Constraints**: Clear instructions to LLMs to avoid making up data
3. **Validation**: Schema validation for all extracted data
4. **Error Handling**: Proper error handling instead of falling back to fake data
5. **Empty State Handling**: Proper handling of cases where no data is found 