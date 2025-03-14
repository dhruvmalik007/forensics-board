# UI/UX Brief for Blockchain Sleuthing Platform

## **Objective**
The goal of this platform is to provide an intuitive and efficient interface for users to explore blockchain addresses and track transactions dynamically. The experience should be highly interactive, visually clear, and offer real-time feedback as the investigation progresses.

## **Core User Interactions**

### **Sleuthing Strategy Execution & Address Management**
- Users can execute several strategies in a row, allowing for continuous investigation flows.
- Each strategy runs until completion, but the user can **interrupt** it at any moment.
- Interrupting a strategy does **not erase progress**—any discovered data remains available for future reference.
- Users may need to provide validation or feedback as the investigation progresses across strategies.
- Each executed strategy may yield **new nodes** in the graph, meaning new addresses have been discovered and are now part of the investigation.

### **Address Discovery & Interaction**
- All discovered addresses should be visible both **on the graph** and in a **list view**.
- Clicking on an address in either the graph or the list should:
  - Highlight the address in the other view.
  - Open the node to reveal extra insights such as transaction links, tags, and metadata.
- This ensures users can navigate the investigation efficiently between the **visual graph** and a structured **list-based** approach.
- Users can execute several strategies in a row without having to restart the entire investigation process.
- Each strategy runs until completion, but the user can **interrupt** it at any moment.
- Interrupting a strategy does **not erase progress**—any discovered data remains available for future reference.
- Each executed strategy may yield **new nodes** in the graph, meaning new addresses have been discovered and are now part of the investigation.

### **1. Address Input & User Selection**
- Users paste a blockchain address into an input bar.
- They are presented with a set of predefined investigation options such as:
  - `Token Transfers`
  - `Bridge Transfers`
  - `NFT Transfers`
  - `Funding Address Analysis`
- Users may also enter a custom request in plain text if none of the presets match their needs.
- The backend automatically detects the chain (Bitcoin, EVM, Tron, Solana, Near, etc.) and determines the best strategy accordingly.

### **2. Dynamic Graph Exploration**
- A **central node** is created representing the initial address.
- As transactions or related addresses are discovered, new **pending nodes** appear.
- Pending nodes may change status based on tagging results:
  - `alt_wallet_candidate`
  - `cex`
  - `smart_wallet`
  - `contract` (for any contract that was not resolved)
  - `dex`
  - `bridge`
  - `mixer`
  - Other relevant categories.
- The user should be able to interact with nodes:
  - Click to see transaction details.
  - Expand to explore further relationships.
  - Report incorrect or suspicious links.

### **3. Real-Time Investigation Feedback**
- The UI should stream updates dynamically as strategies execute.
- Users should receive clear visual indicators for:
  - **Pending processes** (e.g., strategies running, awaiting confirmation).
  - **Completed investigations** (e.g., confirmed transaction links, validated alt-wallets).
- The interface should allow users to:
  - See strategy execution progress.
  - Receive notifications when new insights are available.
  - Accept or refine results (human-in-the-loop feedback mechanism).

### **4. Investigation History & Contextual Insights**
- Users should be able to revisit previous investigations and see past results.
- Each address/node should display relevant metadata:
  - **Visual Indicator**: A clear icon or label to signify if the node is an `alt_wallet_candidate`, `smart_wallet`, `cex`, `contract`, or another category.
  - **Linked Transactions**: Details on the transactions that connect the address to others, including:
    - Transaction type (Token Transfer, NFT Transfer, Bridge Transaction, etc.).
    - Amount and asset type.
  - **Tags & Sources**: Display known tags along with their source (e.g., Etherscan, Chainalysis, Arkham Intelligence).

### **5. User Controls & Customization**
- Users should have control over toggling non-user wallets on or off from the graph.
- As long as a strategy has not begun execution, users can interrupt it or remove it from the stack of pending strategies.
- The queue of pending strategies should be clearly visible with options to edit, reorder, or remove strategies before execution begins.
- Users should be able to easily manage their strategy queue to optimize their investigation workflow.

### **6. Graph Interactions & Adaptability**
- Graph interactions should be fluid and support:
  - Zooming, panning, and expanding nodes.
  - Easy access to key transaction insights.
  - Responsive design ensuring a seamless experience across devices.

## **Final Notes**
The experience should be designed with a balance between **usability** and **technical depth**. Users should feel empowered to explore blockchain data without being overwhelmed. Clear **progress indicators**, **intuitive navigation**, and **real-time feedback** will be critical to achieving a smooth and engaging investigative experience.

Let's ensure that users can navigate through blockchain data effortlessly while still having the ability to dive deep into transaction details when needed.