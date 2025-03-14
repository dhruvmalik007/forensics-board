# Description of the Mock UI

## 1. User Interface Layout

The interface is divided into three main sections:

### 1.1 Strategy Control Panel (Left Panel)
A vertical stack of strategy items, each representing an investigation strategy:
- Each item contains:
  - Strategy title as text label
  - State indicator showing:
    - **Done**: Green bubble showing number of discovered addresses
    - **Running**: Animated icon indicating active execution
    - **Pause**: Pause icon for suspended strategies
    - **Idle**: Default state for queued strategies
- Items can be reordered via drag-and-drop
- Delete button to remove strategies
- Maintains small margins between items for clear separation

### 1.2 Graph & Chat Interface (Center Panel)
Contains two distinct elements working in harmony:

#### Interactive Graph
Occupies 100% of the center panel space:
- Displays relationship graph between addresses
- Initial address appears as central node
- Connected addresses shown as linked nodes
- Relationships (transactions, approvals) displayed as edges
- Node colors/icons indicate address types and tags
- Interactive controls for zoom/pan/focus
- Dynamically adjusts to fill available space

#### Floating Chat Interface
Overlays the bottom-right corner of the graph:
- Intelligent chatbox interface for investigations
- Natural language input for custom queries
- Supports both free-form text and preset strategy selection
- Shows conversation history when expanded
- Includes close button to minimize
- Can be reopened via floating action button
- Floats above graph without affecting layout

### 1.3 Information Panel (Right Panel)
Divided into two clean, focused sections:

#### Address Details Card (Top Section)
Detailed information display for selected addresses:
- Complete blockchain address
- Associated tags and sources (alt_wallet_candidate, bridge, cex, dex, mixer...)
- Transaction history with directional indicators
- Investigation actions
- Updates based on graph/list selection

#### Address List (Bottom Section)
Pure, minimalistic list view:
- Single-line entries showing only blockchain addresses
- No additional metadata or decorations
- Clean, focused presentation
- Syncs with graph selection
- Simple vertical scroll

## 2. Working with Strategies

### 2.1 Predefined Strategies
The platform offers several predefined investigation strategies:
- **Token Transfers**: Identifies related wallets through token transactions across chains
- **NFT Transfers**: Tracks non-fungible token movements between addresses
- **Bidirectional Transfers**: Analyzes wallets interacting in both directions
- **Funding Analysis**: Traces wallets funding a specific wallet (in the future add auto recursivity)
- **Bridging Transfers**: Tracks cross-chain transfers
- **LP Analysis**: Identifies side wallets connected to the liquidity pool position
- **Multisig Analysis**: Extends analysis to multisig wallets and their signers

### 2.2 Custom Strategy Creation
To create a custom investigation strategy:
1. Use the chat interface to describe your investigation goal
2. System determines optimal approach
3. Review proposed strategy
4. Execute and provide feedback on results

### 2.3 Strategy Queue Management
Multiple strategies can be queued for execution:
1. Add strategies via chat or preset selection
2. Reorder using drag-and-drop
3. Delete unwanted strategies
4. Monitor execution states and progress

### 2.4 Providing Feedback
As strategies execute, you may be prompted to:
- Validate or reject potential connections
- Confirm identified patterns
- Provide additional context
- Report incorrect links

## 3. Understanding the Graph

### 3.1 Node Types
Addresses in the graph are categorized by type:
- **Main**: The main address being investigated
- **Alt Wallet (?)**: Potentially related addresses
- **CEX**: Centralized exchange addresses
- **DeFi**: Decentralized finance protocol addresses
- **Bridge**: Cross-chain bridge addresses
- **Mixer**: Privacy-enhancing service addresses
- **Contract**: Smart contracts
- **Flagged**: Malicious addresses from various sources

### 3.2 Relationship Types
Connections between addresses may represent:
- Token transfers (native or token, cross-chain)
- NFT Transfers
- Bridge transactions
- Liquidity provision

### 3.3 Tags and Sources
Addresses may have tags from various sources:
- **Custom tags**: User-defined labels
- **Etherscan**: Labels from Etherscan
- **Arkham Intelligence**: Identifications from Arkham
- **Chainalysis**: Blockchain analytics categorizations
- **Community**: Platform user-provided tags

## 4. Control Features

### 4.1 Selection
Node selection can be made from either:
- Clicking nodes in the graph
- Selecting addresses in the list
Both will sync highlighting and display details in the right panel

### 4.2 Node Filtering
Quick filters available to:
- Toggle visibility of non-main/alt wallet nodes
- Focus on specific node types
- Highlight specific relationship patterns
