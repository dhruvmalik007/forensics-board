// Mock data for blockchain forensics dashboard

import { Strategy } from '@/components/dashboard/strategy-control-panel';
import { PredefinedStrategy } from '@/components/dashboard/investigation-input';
import { AddressDetails } from '@/components/dashboard/details-list-view';

// Define node type for better type safety
export type NodeType = 'main' | 'alt_wallet' | 'cex' | 'defi' | 'bridge' | 'mixer' | 'contract' | 'flagged';

// Predefined strategies
export const predefinedStrategies: PredefinedStrategy[] = [
  {
    id: 'token_transfers',
    name: 'Token Transfers',
    description: 'Identifies related wallets through token transactions across chains'
  },
  {
    id: 'nft_transfers',
    name: 'NFT Transfers',
    description: 'Tracks non-fungible token movements between addresses'
  },
  {
    id: 'bidirectional',
    name: 'Bidirectional Transfers',
    description: 'Analyzes wallets interacting in both directions'
  },
  {
    id: 'funding',
    name: 'Funding Analysis',
    description: 'Traces wallets funding a specific wallet'
  },
  {
    id: 'bridging',
    name: 'Bridging Transfers',
    description: 'Tracks cross-chain transfers'
  },
  {
    id: 'lp_analysis',
    name: 'LP Position Transfer Analysis',
    description: 'Identifies side wallets connected to the liquidity pool position'
  },
  {
    id: 'multisig',
    name: 'Multisig Analysis',
    description: 'Extends analysis to multisig wallets and their signers'
  }
];

// Mock nodes and edges for graph visualization
export const generateMockGraphData = (mainAddress: string) => {
  // Generate some random addresses based on the main address
  const generateRandomAddress = () => {
    const chars = '0123456789abcdef';
    let result = '0x';
    for (let i = 0; i < 40; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  };
  
  const addressTypes: NodeType[] = ['alt_wallet', 'cex', 'defi', 'bridge', 'mixer', 'contract', 'flagged'];
  const edgeTypes = ['token_transfer', 'nft_transfer', 'bridge_transaction', 'liquidity_provision'] as const;
  
  // Create nodes
  const nodes: Array<{id: string, label: string, type: NodeType}> = [
    { id: mainAddress, label: mainAddress, type: 'main' }
  ];
  
  // Add 10-15 random nodes
  const numNodes = Math.floor(Math.random() * 6) + 10;
  for (let i = 0; i < numNodes; i++) {
    const address = generateRandomAddress();
    const type = addressTypes[Math.floor(Math.random() * addressTypes.length)];
    nodes.push({ id: address, label: address, type });
  }
  
  // Create edges
  const edges = [];
  
  // Connect main address to some nodes
  for (let i = 1; i < nodes.length; i++) {
    if (Math.random() < 0.7) { // 70% chance to connect to main node
      const edgeType = edgeTypes[Math.floor(Math.random() * edgeTypes.length)];
      edges.push({
        id: `e${mainAddress.substring(0, 6)}-${nodes[i].id.substring(0, 6)}`,
        source: mainAddress,
        target: nodes[i].id,
        type: edgeType
      });
    }
  }
  
  // Add some connections between other nodes
  for (let i = 1; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (Math.random() < 0.3) { // 30% chance to connect nodes
        const edgeType = edgeTypes[Math.floor(Math.random() * edgeTypes.length)];
        edges.push({
          id: `e${nodes[i].id.substring(0, 6)}-${nodes[j].id.substring(0, 6)}`,
          source: nodes[i].id,
          target: nodes[j].id,
          type: edgeType
        });
      }
    }
  }
  
  return { nodes, edges };
};

// Generate a single node for the main address (instant rendering)
export const generateSingleNodeData = (mainAddress: string) => {
  return {
    nodes: [
      {
        id: mainAddress,
        label: mainAddress.substring(0, 8) + '...' + mainAddress.substring(mainAddress.length - 6),
        type: 'main'
      }
    ],
    edges: []
  };
};

// Generate mock address details
export const generateMockAddressDetails = (address: string, type: string): AddressDetails => {
  const tagSources = ['custom', 'etherscan', 'arkham', 'chainalysis', 'community'] as const;
  const assets = ['ETH', 'USDT', 'USDC', 'DAI', 'WBTC', 'LINK'];
  
  // Generate random tags
  const numTags = Math.floor(Math.random() * 4);
  const tags = [];
  const tagNames = ['Exchange', 'DeFi', 'Whale', 'Mixer', 'Bridge', 'Scammer', 'Validator', 'DAO'];
  
  for (let i = 0; i < numTags; i++) {
    const tagName = tagNames[Math.floor(Math.random() * tagNames.length)];
    const source = tagSources[Math.floor(Math.random() * tagSources.length)];
    tags.push({ name: tagName, source });
  }
  
  // Generate random transactions
  const numTransactions = Math.floor(Math.random() * 10) + 5;
  const transactions = [];
  
  for (let i = 0; i < numTransactions; i++) {
    const hash = `0x${Array.from({length: 64}, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`;
    const timestamp = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)); // Random time in the last 30 days
    const direction = Math.random() > 0.5 ? 'incoming' as const : 'outgoing' as const;
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const value = (Math.random() * 10).toFixed(4);
    
    transactions.push({
      id: `tx-${i}`,
      hash,
      timestamp,
      from: direction === 'incoming' ? `0x${Array.from({length: 40}, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}` : address,
      to: direction === 'outgoing' ? `0x${Array.from({length: 40}, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}` : address,
      value,
      asset,
      direction
    });
  }
  
  // Sort transactions by timestamp (newest first)
  transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  return {
    address,
    type: type as any, // Cast to any to avoid type errors with the string input
    tags,
    transactions
  };
};

// Generate address details based on actual graph connections
export const generateRelevantAddressDetails = (
  address: string, 
  type: string, 
  connectedNodes: Array<{id: string, type: string, label: string}>,
  connectedEdges: Array<{id: string, source: string, target: string, type?: string}>
): AddressDetails => {
  const tagSources = ['custom', 'etherscan', 'arkham', 'chainalysis', 'community'] as const;
  const assets = ['ETH', 'USDT', 'USDC', 'DAI', 'WBTC', 'LINK'];
  
  // Generate tags based on node type
  const tags: {
    name: string;
    source: 'custom' | 'etherscan' | 'arkham' | 'chainalysis' | 'community';
  }[] = [];
  
  // Add tag based on node type
  const nodeTypeToTag: Record<string, string> = {
    'main': 'Main Address',
    'alt_wallet': 'Alternative Wallet',
    'cex': 'Exchange',
    'defi': 'DeFi',
    'bridge': 'Bridge',
    'mixer': 'Mixer',
    'contract': 'Smart Contract',
    'flagged': 'Flagged'
  };
  
  if (nodeTypeToTag[type]) {
    tags.push({ 
      name: nodeTypeToTag[type], 
      source: 'custom' as const 
    });
  }
  
  // Add additional tags based on connections
  if (connectedNodes.some(node => node.type === 'mixer')) {
    tags.push({ name: 'Connected to Mixer', source: 'chainalysis' as const });
  }
  
  if (connectedNodes.some(node => node.type === 'flagged')) {
    tags.push({ name: 'Connected to Flagged Address', source: 'arkham' as const });
  }
  
  if (connectedNodes.some(node => node.type === 'cex')) {
    tags.push({ name: 'Exchange User', source: 'etherscan' as const });
  }
  
  // Generate transactions based on actual connections
  const transactions: {
    id: string;
    hash: string;
    timestamp: Date;
    from: string;
    to: string;
    value: string;
    asset: string;
    direction: 'incoming' | 'outgoing';
  }[] = [];
  
  // Create a transaction for each connected edge
  connectedEdges.forEach((edge, index) => {
    const isOutgoing = edge.source === address;
    const counterpartyAddress = isOutgoing ? edge.target : edge.source;
    const counterpartyNode = connectedNodes.find(node => node.id === counterpartyAddress);
    
    // Generate a consistent hash based on the edge id
    const hash = `0x${Array.from({length: 64}, (_, i) => 
      '0123456789abcdef'[Math.floor((parseInt(edge.id, 36) + i) % 16)]
    ).join('')}`;
    
    // Generate timestamp (more recent for higher index)
    const daysAgo = Math.max(0, 30 - index * 3); // More recent transactions first
    const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    
    // Assign asset based on edge type or node type
    let asset = assets[Math.floor(parseInt(edge.id, 36) % assets.length)];
    if (edge.type === 'token_transfer') {
      asset = ['ETH', 'USDT', 'USDC'][Math.floor(parseInt(edge.id, 36) % 3)];
    } else if (edge.type === 'nft_transfer') {
      asset = 'NFT';
    } else if (edge.type === 'bridge_transaction') {
      asset = ['USDT', 'USDC', 'DAI'][Math.floor(parseInt(edge.id, 36) % 3)];
    } else if (edge.type === 'liquidity_provision') {
      asset = ['ETH-USDC LP', 'ETH-DAI LP'][Math.floor(parseInt(edge.id, 36) % 2)];
    }
    
    // Generate value based on node types
    let value = ((parseInt(edge.id, 36) % 1000) / 100).toFixed(2);
    if (counterpartyNode && counterpartyNode.type === 'cex') {
      value = ((parseInt(edge.id, 36) % 10000) / 100).toFixed(2); // Larger amounts for exchanges
    } else if (counterpartyNode && counterpartyNode.type === 'mixer') {
      value = ((parseInt(edge.id, 36) % 500) / 100).toFixed(2); // Smaller amounts for mixers
    }
    
    transactions.push({
      id: `tx-${edge.id}`,
      hash,
      timestamp,
      from: isOutgoing ? address : counterpartyAddress,
      to: isOutgoing ? counterpartyAddress : address,
      value,
      asset,
      direction: isOutgoing ? 'outgoing' as const : 'incoming' as const
    });
  });
  
  // Sort transactions by timestamp (newest first)
  transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  // Add balance information based on transactions
  const balances: Record<string, number> = {};
  transactions.forEach(tx => {
    if (!balances[tx.asset]) {
      balances[tx.asset] = 0;
    }
    
    if (tx.direction === 'incoming') {
      balances[tx.asset] += parseFloat(tx.value);
    } else {
      balances[tx.asset] -= parseFloat(tx.value);
    }
  });
  
  // Convert balances to array format
  const balance = Object.entries(balances)
    .filter(([_, value]) => value > 0) // Only show positive balances
    .map(([asset, value]) => ({
      asset,
      value: value.toFixed(4)
    }));
  
  // Calculate first and last seen dates
  const sortedByTime = [...transactions].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const firstSeen = sortedByTime.length > 0 ? sortedByTime[0].timestamp : undefined;
  const lastSeen = sortedByTime.length > 0 ? sortedByTime[sortedByTime.length - 1].timestamp : undefined;
  
  // Calculate risk score based on connections
  let riskScore = 0;
  
  // Base risk based on node type
  const typeRisk: Record<string, number> = {
    'main': 20,
    'alt_wallet': 30,
    'cex': 10,
    'defi': 40,
    'bridge': 50,
    'mixer': 90,
    'contract': 30,
    'flagged': 80
  };
  
  riskScore += typeRisk[type] || 0;
  
  // Add risk for connections to high-risk nodes
  if (connectedNodes.some(node => node.type === 'mixer')) {
    riskScore += 30;
  }
  
  if (connectedNodes.some(node => node.type === 'flagged')) {
    riskScore += 20;
  }
  
  // Cap risk score at 100
  riskScore = Math.min(100, riskScore);
  
  return {
    address,
    type: type as any,
    tags,
    transactions,
    balance: balance as any, // Type casting to match AddressDetails
    firstSeen,
    lastSeen,
    riskScore
  };
};

// Generate mock strategies for the control panel
export const generateMockStrategies = (selectedStrategies: string[], customStrategy?: string): Strategy[] => {
  const strategies: Strategy[] = [];
  
  // Add selected predefined strategies
  selectedStrategies.forEach((strategyId, index) => {
    const predefined = predefinedStrategies.find(s => s.id === strategyId);
    if (predefined) {
      strategies.push({
        id: `strategy-${Date.now()}-${index}`,
        name: predefined.name,
        description: predefined.description,
        status: index === 0 ? 'running' : 'queued',
        progress: index === 0 ? 25 : 0,
        startedAt: index === 0 ? new Date() : undefined
      });
    }
  });
  
  // Add custom strategy if provided
  if (customStrategy) {
    strategies.push({
      id: `strategy-${Date.now()}-custom`,
      name: 'Custom Strategy',
      description: customStrategy,
      status: strategies.length === 0 ? 'running' : 'queued',
      progress: strategies.length === 0 ? 25 : 0,
      startedAt: strategies.length === 0 ? new Date() : undefined
    });
  }
  
  return strategies;
};

// Simulate strategy execution
export const simulateStrategyExecution = (
  strategy: Strategy, 
  onProgress: (progress: number) => void,
  onComplete: () => void
) => {
  let progress = strategy.progress;
  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 10) + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      onProgress(progress);
      onComplete();
    } else {
      onProgress(progress);
    }
  }, 1000);
  
  return () => clearInterval(interval);
};

// Generate list of addresses for the address list
export const generateAddressList = (graphNodes: Array<{id: string, type: NodeType | string}>) => {
  return graphNodes.map(node => ({
    address: node.id,
    type: node.type,
    tags: Math.random() > 0.5 ? 
      ['Exchange', 'DeFi', 'Whale', 'Mixer', 'Bridge', 'Scammer', 'Validator', 'DAO']
        .slice(0, Math.floor(Math.random() * 3) + 1) : []
  }));
};
