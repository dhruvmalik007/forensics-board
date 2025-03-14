# MVP Technical Specification for Blockchain Sleuthing Platform

## Overview
This document outlines the technical implementation of the MVP for the Blockchain Sleuthing Platform. The system provides an interactive UI for users to input a blockchain address, an API that processes user requests via an agentic component, a strategy crafting module, and a batch process for updating tagged addresses. The entire backend is deployed as a serverless function (Lambda-based) using Next.js API routes.

## **1. User Interface (UI)**
- **Technology Stack**: Next.js (React-based UI)
- **No authentication or credit system in MVP**
- **Core Features**:
  - Input field for users to paste a blockchain address.
  - **Quick detection logic**:
    - If Bitcoin address → Offer `BTC Transfers` exploration.
    - If EVM address → Offer `ETH Transfers` and `ERC-20 Transfers`.
    - If Solana address → Offer `SOL Transfers` and `SPL Token Transfers`.
    - If Tron address → Offer `TRX Transfers` and `TRC-20 Transfers`.
  - Display dynamically generated strategy options based on detection.
  - Send user request to backend API.
  - Display results interactively, streaming responses from backend.

## **2. API with Agentic Execution Component**
- **Technology Stack**: Next.js API Routes (deployed as a serverless Lambda function), Vercel AI SDK, LangChain.js, LangGraph.js, Chroma (vector DB for strategy retrieval)
- **Single API endpoint: `/api/run`**
  - Accepts JSON payload with:
    ```json
    {
      "address": "0x...",
      "analysis_type": "erc20_transfers",
      "analysis_request": "Find all ERC-20 transfers related to this address"
    }
    ```
  - Calls **Agentic Execution Engine**:
    - Searches Chroma vector DB for similar past strategies.
    - If a match is found → Executes stored strategy.
    - If no match is found → Delegates to **Strategy Crafting Component**.
  - Streams execution results back to UI.

## **3. Strategy Crafting Component**
## **UI Real-Time Updates & Graph Rendering**
- When a user submits an address, the UI listens for broadcasted updates from the API.
- **Graph Rendering:**
  - New addresses are added as **pending nodes**.
  - As tagging processes execute, the nodes may update to a **confirmed state** with a label.
- **Address Tagging:**
  - If linked wallets are identified, they may be labeled as `alt_wallet_candidate`.
  - If associated with known services, they may be tagged as `dex`, `bridge`, `mixer`, etc.
- **Dynamic Graph Updates:**
  - The UI updates nodes dynamically based on real-time data streaming from the API.
  - Users can see relationships evolve as investigations progress.
- **Technology Stack**: LangChain.js, LangGraph.js, Chroma, Neo4j (for storing validated strategies), PostgreSQL (for structured data, tagging), Redis (caching execution metadata)
- **Responsibilities**:
  - Researches available data sources and APIs.
  - May initiate **Agentic Account Creation** (e.g., Dune API signup).
  - Crafts a new sleuthing strategy dynamically using available tools.

### **Example 1: Crafting a `Bridge Transfer` Strategy**
#### **Step 1: Check Existing Strategy**
- Queries Chroma for a match.
- If found → Executes stored query.
- If not found → Proceeds to crafting.

#### **Step 2: Identify Bridge Index & Explorers**
- Agent scans available bridge indexing services.
- If no known explorer is found:
  - Uses `browser_use` to navigate to popular bridges and extract explorer pages.
  - Stores explorer pages for future lookups.

#### **Step 3: Retrieve Bridge Transactions**
- If an API exists, invokes `rest_api_use` to retrieve transaction history.
- If only web interfaces are available:
  - Uses `browser_use` to automate search queries on bridge explorers.
  - Extracts transaction details using web scraping or automated DOM parsing.

#### **Step 4: Validate & Store Results**
- Results are sent to the user for validation.
- Upon confirmation, stores the bridge identification method for future reuse.

### **Example 2: Crafting an `EVM Transfer` Strategy**
#### **Step 1: Check Existing Strategy**
- Queries Chroma for a match.
- If found → Execute stored query.
- If not found → Proceed to crafting.

#### **Step 2: Create API Access (if needed)**
- Detects that `dune_api_use` tool is needed.
- Agent checks if a valid API key exists in PostgreSQL.
- If not, it:
  - Registers a **Dune Analytics** account.
  - Generates an API key.
  - Stores credentials securely.

#### **Step 3: Generate and Validate Dune Query**
- Loads Dune documentation into LLM context.
- Agent attempts to create an SQL query.
- Iteratively tests the query via the Dune API.
- If successful, results are sent to user for validation.
- Upon user confirmation, the validated query is stored in Neo4j for reuse.

## **4. Tagged Address Update Process**
- **Technology Stack**: Next.js API Route (triggered on invocation), Redis (for last execution timestamp), Neo4j (graph database for storing tagged addresses)
- **Purpose**: Fetch and store tagged addresses from Etherscan & Chainalysis to optimize address tagging.
- **Execution Flow**:
  - When `/api/run` is invoked, check **Redis** for last execution time.
  - If elapsed time is beyond threshold (e.g., 24h):
    - Fetch tagged addresses from:
      - **Etherscan** (for contract labels, CEXs, mixers)
      - **Chainalysis** (for sanctioned wallets, illicit entities)
    - Update **Neo4j** with newly tagged addresses.
    - Store last execution timestamp in **Redis**.

## **Deployment Considerations**
- **Deployed as function on Vercel**
- **Redis used for caching last cron execution timestamps**
- **Neo4j graph database deployed for wallet relationships**
- **PostgreSQL for structured metadata (API keys, tagging data)**
- **Chroma vector search for strategy retrieval**

## **Future Enhancements**
- Introduce authentication and credit-based execution.
- Expand to additional blockchains.
- Optimize LLM execution with fine-tuned models.
- Improve API execution efficiency via batched queries.

This document provides a comprehensive technical breakdown of the MVP. Further refinements will be made as development progresses.

