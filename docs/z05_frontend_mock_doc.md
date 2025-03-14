# Description of the Mock UI

## 1. User Interface

The interface is divided into four main sections:

### 1.1 Strategy Control Panel (Left Section)
Located on the left side of the interface, this panel is where you control ongoing investigations:
- View and manage the queue of executing strategies
- Start, pause, re-order or cancel investigations
- Watch strategies execute sequentially with progress indicators

### 1.2 Graph Visualization (Center Section)
The central area displays the relationship graph between addresses as it evolves:
- The initial address appears as the central node
- Connected addresses appear as linked nodes
- Relationships (transactions, approvals, etc.) are shown as edges
- Node colors and icons indicate address types and tags
- Interactive controls allow zooming, panning, and focusing

### 1.3 Investigation Input (Floating Bottom Section)
A floating interface overlaying the bottom of the graph area:
- By default shows an input field for wallet addresses and strategy selection
- Expands into a chat-like interface when clicked, showing interaction history
- Allows selection of predefined strategies or natural language input for custom goals
- Collapses to a button after strategy selection, can be expanded again as needed

### 1.4 Details & List View (Right Section)
The right section is split into two parts:

#### Address Details (Upper Part)
When selecting a node in the graph (by default showing the main node), this area shows:
- Complete address information
- Tags and their sources (alt_wallet_candidate, bridge, cex, dex, mixer...)
- Transaction history, with clear indicators showing if transactions connect to addresses on the left or right of the selected node
- Actions for further investigation: execute one or several strategies starting from this node only

#### Address List (Lower Part)
A scrollable list of all addresses discovered during investigation:
- Compact tabular format of all addresses
- Ability to select nodes directly from the list to view their details above
- Quick filters and sorting options
- Selection highlighting synced with graph visualization

### 1.5 Navigation Controls
The top navigation bar offers:
- View toggle between graph and list views
- Filter controls for the displayed data
- Investigation management (save, load, new)
- User settings and preferences

## 2. Working with Strategies

### 2.1 Predefined Strategies
The platform offers several predefined investigation strategies:
- **Token Transfers**: Identifies related wallets through token transactions across chains
- **NFT Transfers**: Tracks non-fungible token movements between addresses
- **Bidirectional Transfers**: Analyzes wallets interacting in both directions
- **Funding Analysis**: Traces wallets funding a specific wallet (in the future add auto recursivity)
- **Bridging Transfers**: Tracks cross-chain transfers
- **LP Analysis**: Identifies side wallets connected to the liquidity pool position (whether token or nft transfers)
- **Multisig Analysis**: Extends analysis to multisig wallets and their signers

### 2.2 Custom Strategy Creation
To create a custom investigation strategy:
1. Enter your investigation goal in natural language
2. The system will determine the best approach to fulfill your request
3. Review the proposed strategy before execution
4. Execute the strategy and provide feedback on results

### 2.3 Strategy Queue Management
Multiple strategies can be queued for execution:
1. Select strategies to add to the queue
2. Drag and drop to reorder the queue as needed
3. Remove strategies that are no longer needed
4. Monitor progress as strategies execute sequentially

### 2.4 Providing Feedback
As strategies execute, you may be prompted to provide feedback:
- Validate or reject potential connections
- Confirm the accuracy of identified patterns
- Provide additional context for ambiguous findings
- Report incorrect or suspicious links

## 3. Understanding the Graph

### 3.1 Node Types
Addresses in the graph are categorized by type:
- **Main**: the main address that we entered
- **Alt Wallet (?)**: Potentially related to the main address
- **CEX**: Centralized exchange addresses
- **DeFi**: Decentralized finance protocol addresses
- **Bridge**: Cross-chain bridge addresses
- **Mixer**: Privacy-enhancing service addresses
- **Contract**: Smart contracts with specific functions
- **Flagged**: Malicious addresses reported by certain providers (etherscan, chainanalysis, previous investigations...)

### 3.2 Relationship Types
Connections between addresses may represent:
- Token transfers (native or token, any chain, any standard, this would resolve backend side)
- NFT Transfers
- Bridge transactions
- Liquidity provision

### 3.3 Tags and Sources
Addresses may have tags from various sources:
- **Custom tags**: User-defined labels
- **Etherscan**: Labels from the Etherscan database
- **Arkham Intelligence**: Identifications from Arkham
- **Chainalysis**: Blockchain analytics categorizations
- **Community**: Tags provided by platform users

## 4. Control
### 4.1 Selection
When should be able to select nodes from the graph or the list, in any case it should focus on both the list and graph and we should open the detail for that address.

### 4.2 Node Filtering
Have a button to toggle off anything that is not the main or alt wallet
