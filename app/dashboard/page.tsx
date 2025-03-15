'use client';

import React, { useState, useEffect } from 'react';
import { StrategyControlPanel, Strategy } from '@/components/dashboard/strategy-control-panel';
import { GraphVisualization } from '@/components/dashboard/graph-visualization';
import { ChatBox } from '@/components/dashboard/chat-box';
import { DetailsView } from '@/components/dashboard/details-view';
import { AddressList } from '@/components/dashboard/address-list';
import { 
  predefinedStrategies, 
  generateMockGraphData, 
  generateSingleNodeData,
  generateMockStrategies,
  generateMockAddressDetails,
  generateAddressList,
  NodeType,
  generateRelevantAddressDetails
} from '../../lib/mock-data';
import { Sidebar } from '@/components/dashboard/spinner';
import { useRouter } from 'next/navigation'
import { usePrivyAuth } from '@/hooks/use-privy-auth';
import { FeatureVisualization } from '@/components/dashboard/feature-visualization';
import { TokenHolderAnalysis } from '@/components/dashboard/token-holder-analysis';
import { ConnectionExplorer } from '@/components/dashboard/connection-explorer';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InvestigationInput } from '@/components/dashboard/investigation-input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CheckIcon } from '@radix-ui/react-icons';
import { AgentChatBox } from '@/components/dashboard/agent-chat-box';
import { ethers } from 'ethers';

// Import the Node and Edge types from the graph visualization component
type Node = {
  id: string;
  label: string;
  type: 'main' | 'alt_wallet' | 'cex' | 'defi' | 'bridge' | 'mixer' | 'contract' | 'flagged';
  x?: number;
  y?: number;
};

type Edge = {
  id: string;
  source: string;
  target: string;
  type: 'token_transfer' | 'nft_transfer' | 'bridge_transaction' | 'liquidity_provision';
};

// Type for address list items
type AddressListItem = {
  address: string;
  type: 'main' | 'alt_wallet' | 'cex' | 'defi' | 'bridge' | 'mixer' | 'contract' | 'flagged';
  tags: string[];
};

export default function DashboardPage() {
  const router = useRouter();
  const { authenticated } = usePrivyAuth();
  
  // Check access permissions
  useEffect(() => {
    const isFreemium = localStorage.getItem('freemiumEnabled') === 'true';
    if (!isFreemium && !authenticated) {
      // If not in freemium mode and not authenticated, redirect to home
      window.location.href = '/';
    }
  }, [authenticated]);

  // State for graph data
  const [graphData, setGraphData] = useState<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });
  
  // State for selected address
  const [selectedAddress, setSelectedAddress] = useState<string | undefined>(undefined);
  
  // State for address details
  const [addressDetails, setAddressDetails] = useState<any | undefined>(undefined);
  
  // State for address list
  const [addresses, setAddresses] = useState<AddressListItem[]>([]);
  
  // State for strategies
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  
  // Investigation state management - using a single state with multiple possible values
  type InvestigationState = 'idle' | 'ready' | 'active' | 'paused' | 'completed';
  const [investigationState, setInvestigationState] = useState<InvestigationState>('idle');
  
  // State for chat visibility - start visible
  const [isChatVisible, setIsChatVisible] = useState(true);
  
  // State for chat messages - initially empty
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  
  // State to trigger chat reset (using a number that increments)
  const [chatResetKey, setChatResetKey] = useState(0);
  
  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  
  // Add a state for the active feature tab
  const [activeFeatureTab, setActiveFeatureTab] = useState<string>('graph');
  
  // State for showing the investigation input dialog
  const [showInvestigationInput, setShowInvestigationInput] = useState(false);
  
  // State for showing the investigation dialog
  const [showInvestigationDialog, setShowInvestigationDialog] = useState(false);
  
  // Add state for selected node and user address
  const [selectedNode, setSelectedNode] = useState<{ id: string; label: string; type: string } | null>(null);
  const [userAddress, setUserAddress] = useState<string | undefined>(undefined);
  
  // Initialize with test data if in freemium mode
  useEffect(() => {
    const isFreemium = localStorage.getItem('freemiumEnabled') === 'true';
    
    if (isFreemium) {
      // Set chat visible to guide users
      setIsChatVisible(true);
      
      // Start with an empty state - let user enter an address
      setGraphData({ nodes: [], edges: [] });
      setChatMessages([
        'Welcome to Freemium mode!', 
        'Please enter an Ethereum address (starting with 0x) to start your investigation.',
        'Example: 0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
      ]);
      setInvestigationState('idle');
      
      // Clear any existing data
      setSelectedAddress(undefined);
      setAddressDetails(undefined);
      setAddresses([]);
      setStrategies([]);
    }
  }, []);
  
  // Handle message submission from chatbox
  const handleMessageSubmit = async (message: string) => {
    // Check if the message is an Ethereum address
    const isEthereumAddress = /^0x[a-fA-F0-9]{40}$/.test(message);
    
    if (isEthereumAddress) {
      // Set loading state
      setIsLoading(true);
      
      try {
        // Call the API to get transaction data with categorization
        const response = await fetch(`/api/blockchain/search?address=${message}&categorize=true`);
        const data = await response.json();
        
        if (data.success && data.data) {
          // Generate graph data from transactions
          const { nodes, edges } = generateMockGraphData(message);
          
          // Update graph with real transaction data
          if (data.data.transactions && data.data.transactions.length > 0) {
            // Use the categorized addresses if available
            if (data.data.addressInfo && data.data.relatedAddresses) {
              // Create nodes from the main address and related addresses with their categories
              const categorizedNodes = [
                {
                  id: data.data.addressInfo.address,
                  label: data.data.addressInfo.address.substring(0, 8),
                  type: data.data.addressInfo.category || 'main'
                },
                ...data.data.relatedAddresses.map((addr: any) => ({
                  id: addr.address,
                  label: addr.address.substring(0, 8),
                  type: addr.category || 'unknown'
                }))
              ];
              
              // Create edges from transactions
              const categorizedEdges = data.data.transactions.map((tx: any, index: number) => ({
                id: `e${index}`,
                source: tx.from || message,
                target: tx.to || 'Unknown',
                type: 'token_transfer'
              }));
              
              setGraphData({ 
                nodes: categorizedNodes as Node[], 
                edges: categorizedEdges as Edge[] 
              });
              
              // Create address list with categories
              const addressList: AddressListItem[] = [
                {
                  address: data.data.addressInfo.address,
                  type: data.data.addressInfo.category || 'main',
                  tags: data.data.addressInfo.tags || []
                },
                ...data.data.relatedAddresses.map((addr: any) => ({
                  address: addr.address,
                  type: addr.category || 'unknown',
                  tags: addr.tags || []
                }))
              ];
              
              setAddresses(addressList);
            } else {
              // Fall back to basic graph generation if no categorization
              const txNodes = [
                { id: message, label: message.substring(0, 8), type: 'main' as NodeType }
              ];
              
              // Add unique addresses from transactions
              const uniqueAddresses = new Set<string>();
              data.data.transactions.forEach((tx: any) => {
                if (tx.from && tx.from !== message) uniqueAddresses.add(tx.from);
                if (tx.to && tx.to !== message) uniqueAddresses.add(tx.to);
              });
              
              // Add nodes for unique addresses
              Array.from(uniqueAddresses).forEach(addr => {
                txNodes.push({
                  id: addr,
                  label: addr.substring(0, 8),
                  type: 'alt_wallet' as NodeType
                });
              });
              
              // Create edges from transactions
              const txEdges = data.data.transactions.map((tx: any, index: number) => ({
                id: `e${index}`,
                source: tx.from || message,
                target: tx.to || 'Unknown',
                type: 'token_transfer' as const
              }));
              
              setGraphData({ 
                nodes: txNodes as Node[], 
                edges: txEdges as Edge[] 
              });
              
              // Create address list
              const addressList: AddressListItem[] = txNodes.map(node => ({
                address: node.id,
                type: node.type,
                tags: []
              }));
              
              setAddresses(addressList);
            }
            
            // Create mock address details using real transaction data
            const txDetails = {
              address: message,
              type: data.data.addressInfo?.category || 'main',
              tags: data.data.addressInfo?.tags?.map((tag: string) => ({ name: tag, source: 'api' })) || 
                    [{ name: 'User Input', source: 'custom' }],
              transactions: data.data.transactions.map((tx: any) => ({
                id: `tx-${tx.hash.substring(0, 8)}`,
                hash: tx.hash,
                timestamp: new Date(tx.timestamp),
                from: tx.from || message,
                to: tx.to || 'Unknown',
                value: tx.value || '0',
                asset: tx.type || 'ETH',
                direction: tx.from === message ? 'outgoing' : 'incoming'
              })),
              balance: []
            };
            
            setAddressDetails(txDetails);
          } else {
            // If no transactions found, fall back to mock data
            const singleNodeData = generateSingleNodeData(message);
            setGraphData({ 
              nodes: singleNodeData.nodes as Node[], 
              edges: [] 
            });
            
            // Generate mock address details
            const details = generateMockAddressDetails(message, 'main');
            setAddressDetails(details);
            
            // Generate address list with just the main address
            const addressList: AddressListItem[] = [{
              address: message,
              type: 'main',
              tags: []
            }];
            setAddresses(addressList);
          }
          
          // Set the selected address
          setSelectedAddress(message);
          
          // Set investigation state to ready
          setInvestigationState('ready');
          
          // Add strategies
          setStrategies(generateMockStrategies());
          
          // Add a message to the chat
          setChatMessages(prev => [...prev, `Found data for address ${message}. You can now start the investigation.`]);
        } else {
          // Handle error
          setChatMessages(prev => [...prev, `Error: Could not find data for address ${message}. Please try again.`]);
        }
      } catch (error) {
        console.error('Error fetching transaction data:', error);
        setChatMessages(prev => [...prev, 'Error fetching transaction data. Please try again.']);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Handle non-address messages
      // If the message mentions running a strategy, extract the strategy name
      const strategyMatch = message.match(/run strategy:?\s*([^.]+)/i);
      if (strategyMatch && strategyMatch[1]) {
        const strategyName = strategyMatch[1].trim();
        
        // Find the strategy in predefined strategies
        const strategy = predefinedStrategies.find(s => 
          s.name.toLowerCase() === strategyName.toLowerCase()
        );
        
        if (strategy && selectedAddress) {
          // Run the strategy
          handleAddressSubmit(selectedAddress, [strategy.id]);
        }
      } else {
        // If no specific strategy was mentioned, but the message mentions strategy
        if (selectedAddress) {
          // Run a default strategy
          handleAddressSubmit(selectedAddress, ['token_transfers']);
        }
      }
    }
  };
  
  // Handle address submission
  const handleAddressSubmit = (address: string, strategyIds: string[]) => {
    if (!address) return;
    
    // Set the selected address
    setSelectedAddress(address);
    
    // Create strategy objects for each selected strategy
    const newStrategies = strategyIds.map(id => {
      const predefinedStrategy = predefinedStrategies.find(s => s.id === id);
      return {
        id: `${id}-${Date.now()}`,
        name: predefinedStrategy?.name || id,
        description: predefinedStrategy?.description || '',
        status: 'idle' as const,
        progress: 0,
        startedAt: undefined,
        completedAt: undefined,
        discoveredAddresses: 0
      };
    });
    
    // Add strategies to the queue
    setStrategies(prev => [...prev, ...newStrategies]);
    
    // Set investigation as active
    setInvestigationState('ready');
    
    // For each strategy, call the API with appropriate parameters
    const strategyPromises = strategyIds.map(strategyId => {
      const predefinedStrategy = predefinedStrategies.find(s => s.id === strategyId);
      if (!predefinedStrategy) return Promise.resolve(null);
      
      // Different API calls for different strategy types
      if (strategyId === 'token_transfers') {
        return fetch('/api/blockchain/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            address,
            chain: 'ethereum', // Default to ethereum for now
            detailed: false
          })
        }).then(response => response.json());
      } else if (strategyId === 'bidirectional') {
        return fetch('/api/blockchain/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            address,
            chain: 'ethereum',
            detailed: true // Get detailed info for bidirectional analysis
          })
        }).then(response => response.json());
      } else if (strategyId === 'bridging') {
        return fetch('/api/blockchain/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            address,
            chain: 'polygon', // Check a different chain
            detailed: false
          })
        }).then(response => response.json());
      } else {
        // For other strategies, use mock data for now
        return Promise.resolve({ success: true, data: null });
      }
    });
    
    // Process all strategy results
    Promise.all(strategyPromises)
      .then(results => {
        // Process each strategy result
        results.forEach((result, index) => {
          if (!result?.success || !result?.data) return;
          
          const strategyId = newStrategies[index].id;
          
          // If we got real transaction data
          if (result.data.transactions?.length > 0) {
            processRealTransactionData(result.data, strategyId, address);
          } else {
            // Fall back to mock data if no real data
            generateRandomNodesForStrategy(strategyId);
          }
        });
      })
      .catch(error => {
        console.error('Error executing strategies:', error);
        // Fall back to mock data on error
        newStrategies.forEach(strategy => {
          generateRandomNodesForStrategy(strategy.id);
        });
      });
  };
  
  // Process real transaction data from the API
  const processRealTransactionData = (data: any, strategyId: string, mainAddress: string) => {
    // Set the strategy as running
    setStrategies(prev => 
      prev.map(s => {
        if (s.id === strategyId) {
          return { 
            ...s, 
            status: 'running',
            startedAt: new Date(),
            progress: 25
          };
        }
        return s;
      })
    );
    
    // Extract unique addresses from transactions
    const transactions = data.transactions || [];
    const uniqueAddresses = new Set<string>();
    
    transactions.forEach((tx: any) => {
      if (tx.from && tx.from !== mainAddress) uniqueAddresses.add(tx.from);
      if (tx.to && tx.to !== mainAddress) uniqueAddresses.add(tx.to);
    });
    
    // Create nodes for each unique address
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    uniqueAddresses.forEach((address, index) => {
      // Determine node type based on address characteristics
      let nodeType: NodeType = 'alt_wallet';
      
      if (address.startsWith('0x0')) {
        nodeType = 'contract';
      } else if (transactions.filter((tx: any) => 
        (tx.from === address && tx.to === mainAddress) || 
        (tx.from === mainAddress && tx.to === address)
      ).length > 3) {
        // If there are multiple transactions with this address, mark as alt_wallet
        nodeType = 'alt_wallet';
      } else if (transactions.some((tx: any) => tx.value && parseFloat(tx.value) > 10)) {
        // If there are high value transactions, mark as potentially important
        nodeType = Math.random() > 0.7 ? 'flagged' : 'alt_wallet';
      }
      
      // Create the node
      newNodes.push({
        id: address,
        label: address.substring(0, 6) + '...' + address.substring(address.length - 4),
        type: nodeType
      });
      
      // Create edges based on transaction direction
      const fromTransactions = transactions.filter((tx: any) => tx.from === address && tx.to === mainAddress);
      if (fromTransactions.length > 0) {
        newEdges.push({
          id: `e-${strategyId}-from-${index}`,
          source: address,
          target: mainAddress,
          type: 'token_transfer'
        });
      }
      
      const toTransactions = transactions.filter((tx: any) => tx.from === mainAddress && tx.to === address);
      if (toTransactions.length > 0) {
        newEdges.push({
          id: `e-${strategyId}-to-${index}`,
          source: mainAddress,
          target: address,
          type: 'token_transfer'
        });
      }
    });
    
    // Update graph with new nodes and edges - ensure we're not losing any existing nodes
    setGraphData(prevGraphData => {
      // Filter out duplicates
      const existingNodeIds = new Set(prevGraphData.nodes.map(n => n.id));
      const nodesToAdd = newNodes.filter(n => !existingNodeIds.has(n.id));
      
      const existingEdgeIds = new Set(prevGraphData.edges.map(e => e.id));
      const edgesToAdd = newEdges.filter(e => !existingEdgeIds.has(e.id));
      
      return {
        nodes: [...prevGraphData.nodes, ...nodesToAdd],
        edges: [...prevGraphData.edges, ...edgesToAdd]
      };
    });
    
    // Add to address list
    const newAddressItems: AddressListItem[] = newNodes.map(node => ({
      address: node.id,
      type: node.type,
      tags: []
    }));
    
    setAddresses(prev => {
      const existingAddresses = new Set(prev.map(a => a.address));
      return [
        ...prev,
        ...newAddressItems.filter(a => !existingAddresses.has(a.address))
      ];
    });
    
    // Update strategy with discovered addresses
    setStrategies(prev => 
      prev.map(s => {
        if (s.id === strategyId) {
          return { 
            ...s, 
            discoveredAddresses: (s.discoveredAddresses || 0) + newNodes.length,
            progress: 100,
            status: 'completed',
            completedAt: new Date(),
            results: {
              addresses: newNodes.map(n => n.id),
              timestamp: new Date().toISOString()
            }
          };
        }
        return s;
      })
    );
    
    // Automatically start the next strategy if there is one
    setTimeout(() => {
      startNextStrategy();
    }, 500);
  };
  
  // Handle node selection in graph
  const handleNodeSelect = (nodeId: string) => {
    console.log('Selected node:', nodeId);
    setSelectedAddress(nodeId);
    
    // Find the node in the graph data
    const node = graphData.nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode({
        id: node.id,
        label: node.label,
        type: node.type
      });
      
      // Get address details
      const details = addressDetails?.address === nodeId 
        ? addressDetails 
        : generateRelevantAddressDetails(nodeId, node.type as NodeType);
      
      setAddressDetails(details);
    }
  };
  
  // Handle strategy removal
  const handleRemoveStrategy = (id: string) => {
    setStrategies(prev => prev.filter(s => s.id !== id));
    
    // If we removed the last strategy and we're not in active/paused state, go back to idle
    if (strategies.length === 1 && investigationState !== 'active' && investigationState !== 'paused') {
      setInvestigationState('idle');
    }
  };
  
  // Handle starting a strategy
  const handleStartStrategy = (id: string) => {
    // Set the strategy to running
    setStrategies(prev => 
      prev.map(s => {
        if (s.id === id) {
          return { ...s, status: 'running' as const, startedAt: new Date() };
        }
        return s;
      })
    );
    
    // Simulate strategy execution
    simulateStrategyExecution(id);
  };
  
  // Simulate strategy execution with random duration and node generation
  const simulateStrategyExecution = (strategyId: string) => {
    // Get a random duration between 1-5 seconds
    const duration = Math.floor(Math.random() * 4000) + 1000;
    
    // Set up progress updates
    const totalUpdates = 10;
    const updateInterval = duration / totalUpdates;
    let currentUpdate = 0;
    
    // Reset progress to 0 at the start
    setStrategies(prev => 
      prev.map(s => {
        if (s.id === strategyId) {
          return { ...s, progress: 0 };
        }
        return s;
      })
    );
    
    // Generate nodes at 80% of the progress (8th update)
    const nodeGenerationPoint = Math.floor(totalUpdates * 0.8);
    let nodesGenerated = false;
    
    const progressInterval = setInterval(() => {
      currentUpdate++;
      const progress = (currentUpdate / totalUpdates) * 100;
      
      // Generate nodes at 80% progress if not already generated
      if (currentUpdate === nodeGenerationPoint && !nodesGenerated) {
        generateRandomNodesForStrategy(strategyId);
        nodesGenerated = true;
      }
      
      // Update strategy progress
      setStrategies(prev => 
        prev.map(s => {
          if (s.id === strategyId) {
            // Ensure progress never decreases and caps at 100
            const currentProgress = s.progress || 0;
            return { ...s, progress: Math.max(currentProgress, Math.min(progress, 100)) };
          }
          return s;
        })
      );
      
      // If we've reached the end, clear the interval
      if (currentUpdate >= totalUpdates) {
        clearInterval(progressInterval);
        
        // Mark strategy as completed - no need to generate nodes here anymore
        handleStrategyComplete(strategyId);
      }
    }, updateInterval);
  };
  
  // Generate random nodes for a strategy
  const generateRandomNodesForStrategy = (strategyId: string) => {
    // Find the strategy to get its name
    const strategy = strategies.find(s => s.id === strategyId);
    if (!strategy || !selectedAddress) return;
    
    // Generate between 2-5 new nodes for a more complex graph
    const numNodes = Math.floor(Math.random() * 4) + 2;
    
    // Get current nodes and edges - make sure to create a deep copy
    const currentNodes = [...graphData.nodes];
    const currentEdges = [...graphData.edges];
    
    // Generate new nodes and edges
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // Keep track of all potential source nodes (existing + newly created)
    const potentialSourceNodes = [...currentNodes];
    
    for (let i = 0; i < numNodes; i++) {
      // Generate a random address-like string
      const randomAddress = '0x' + Array(40).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      
      // Determine node type based on strategy
      let nodeType: Node['type'] = 'alt_wallet';
      if (strategy.name.toLowerCase().includes('token')) {
        nodeType = Math.random() > 0.5 ? 'cex' : 'defi';
      } else if (strategy.name.toLowerCase().includes('nft')) {
        nodeType = Math.random() > 0.5 ? 'contract' : 'alt_wallet';
      } else if (strategy.name.toLowerCase().includes('suspicious')) {
        nodeType = Math.random() > 0.5 ? 'flagged' : 'mixer';
      }
      
      // Create new node
      const newNode: Node = {
        id: randomAddress,
        label: randomAddress.substring(0, 6) + '...' + randomAddress.substring(38),
        type: nodeType
      };
      
      // Add the new node to our collection
      newNodes.push(newNode);
      
      // Determine how many connections this node should have (1-3)
      const numConnections = Math.floor(Math.random() * 3) + 1;
      
      // Create connections
      for (let j = 0; j < numConnections; j++) {
        // Determine source node for this connection
        let sourceNode;
        
        if (i === 0 || potentialSourceNodes.length === 0 || Math.random() < 0.3) {
          // For the first node or 30% of the time, connect to the main address
          sourceNode = currentNodes.find(n => n.id === selectedAddress);
        } else {
          // Otherwise, randomly select from potential source nodes
          const randomIndex = Math.floor(Math.random() * potentialSourceNodes.length);
          sourceNode = potentialSourceNodes[randomIndex];
        }
        
        // Skip if we couldn't find a source node
        if (!sourceNode) continue;
        
        // Determine edge type based on strategy and randomness
        const edgeType: Edge['type'] = 
          strategy.name.toLowerCase().includes('token') ? 'token_transfer' :
          strategy.name.toLowerCase().includes('nft') ? 'nft_transfer' :
          strategy.name.toLowerCase().includes('bridge') ? 'bridge_transaction' : 'liquidity_provision';
        
        // Randomly determine direction (sometimes from new node to existing, sometimes vice versa)
        const isOutgoing = Math.random() > 0.5;
        
        const newEdge: Edge = {
          id: isOutgoing ? 
            `${sourceNode.id}-${randomAddress}` : 
            `${randomAddress}-${sourceNode.id}`,
          source: isOutgoing ? sourceNode.id : randomAddress,
          target: isOutgoing ? randomAddress : sourceNode.id,
          type: edgeType
        };
        
        // Check if this edge already exists (avoid duplicates)
        const edgeExists = newEdges.some(e => 
          (e.source === newEdge.source && e.target === newEdge.target) ||
          (e.source === newEdge.target && e.target === newEdge.source)
        );
        
        if (!edgeExists) {
          newEdges.push(newEdge);
        }
      }
      
      // Add the new node to potential source nodes for future connections
      potentialSourceNodes.push(newNode);
      
      // Add to address list
      const newAddressItem: AddressListItem = {
        address: randomAddress,
        type: nodeType,
        tags: [strategy.name]
      };
      
      setAddresses(prev => [...prev, newAddressItem]);
    }
    
    // Update graph with new nodes and edges - ensure we're not losing any existing nodes
    setGraphData(prevGraphData => ({
      nodes: [...prevGraphData.nodes, ...newNodes],
      edges: [...prevGraphData.edges, ...newEdges]
    }));
    
    // Update strategy with discovered addresses
    setStrategies(prev => 
      prev.map(s => {
        if (s.id === strategyId) {
          return { 
            ...s, 
            discoveredAddresses: (s.discoveredAddresses || 0) + numNodes,
            results: {
              addresses: newNodes.map(n => n.id),
              timestamp: new Date().toISOString()
            }
          };
        }
        return s;
      })
    );
  };
  
  // Handle pausing a strategy
  const handlePauseStrategy = (id: string) => {
    setStrategies(prev => 
      prev.map(s => s.id === id ? { ...s, status: 'paused' as const } : s)
    );
  };
  
  // Handle strategy reordering
  const handleMoveStrategy = (strategyId: string, direction: 'up' | 'down') => {
    setStrategies(prev => {
      const index = prev.findIndex(s => s.id === strategyId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? Math.max(0, index - 1) : Math.min(prev.length - 1, index + 1);
      if (newIndex === index) return prev;
      
      const newStrategies = [...prev];
      const [removed] = newStrategies.splice(index, 1);
      newStrategies.splice(newIndex, 0, removed);
      
      return newStrategies;
    });
  };
  
  // Toggle chat visibility
  const toggleChat = () => {
    setIsChatVisible(prev => !prev);
  };
  
  // Handle adding a strategy
  const handleAddStrategy = (strategy: Strategy) => {
    setStrategies(prevStrategies => [...prevStrategies, strategy]);
    
    // If this is the first strategy, update investigation state to ready
    if (strategies.length === 0) {
      setInvestigationState('ready');
    }
  };

  // Function to check and start the next strategy if possible
  const startNextStrategy = () => {
    // Check if any strategy is already running
    const hasRunningStrategy = strategies.some(s => s.status === 'running');
    if (hasRunningStrategy) return; // Don't start another if one is already running
    
    setStrategies(prev => {
      // Double-check that no strategy is running (in case state changed)
      const isAnyRunning = prev.some(s => s.status === 'running');
      if (isAnyRunning) return prev;
      
      // Find the index of the first queued strategy
      const nextStrategyIndex = prev.findIndex(s => s.status === 'queued');
      
      if (nextStrategyIndex === -1) return prev; // No queued strategies
      
      // Get the ID of the next strategy to start
      const nextStrategyId = prev[nextStrategyIndex]?.id;
      
      // If we found a strategy to start, call handleStartStrategy after state update
      if (nextStrategyId) {
        // Use setTimeout to ensure this happens after state update
        setTimeout(() => handleStartStrategy(nextStrategyId), 0);
      }
      
      return prev.map((strategy, index) => {
        if (index === nextStrategyIndex) {
          return {
            ...strategy,
            status: 'running' as const
          };
        }
        return strategy;
      });
    });
  };

  // Handle strategy completion
  const handleStrategyComplete = (id: string) => {
    setStrategies(prev => {
      const updatedStrategies = prev.map(strategy => {
        if (strategy.id === id) {
          return {
            ...strategy,
            status: 'completed' as const,
            completedAt: new Date()
          };
        }
        return strategy;
      });
      
      // Check if there are any running strategies
      const hasRunningStrategy = updatedStrategies.some(s => s.status === 'running');
      
      // Check if all strategies are completed
      const allCompleted = updatedStrategies.every(s => s.status === 'completed');
      
      // If all strategies are completed, set investigation state to completed
      if (allCompleted) {
        setInvestigationState('completed');
      }
      // If no running strategies, start the next one
      else if (!hasRunningStrategy) {
        setTimeout(startNextStrategy, 500); // Small delay before starting next strategy
      }
      
      return updatedStrategies;
    });
  };

  // Handle starting an investigation
  const handleStartInvestigation = () => {
    setIsChatVisible(true);
    setInvestigationState('active');
    
    // Check if any strategy is already running
    const hasRunningStrategy = strategies.some(s => s.status === 'running');
    if (hasRunningStrategy) return; // Don't start if one is already running
    
    // Reset the graph to only show the main node
    if (selectedAddress) {
      // Use the generateSingleNodeData function to create a graph with just the main node
      const singleNodeData = generateSingleNodeData(selectedAddress);
      setGraphData({ 
        nodes: singleNodeData.nodes as Node[], 
        edges: [] 
      });
      
      // Reset the address list to only include the main address
      const mainAddressItem: AddressListItem = {
        address: selectedAddress,
        type: 'main',
        tags: []
      };
      setAddresses([mainAddressItem]);
    }
    
    // Only start the first strategy, queue the rest
    setStrategies(prev => {
      // Mark the first strategy as running, the rest as queued
      return prev.map((strategy, index) => {
        if (index === 0) {
          return {
            ...strategy,
            status: 'running' as const,
            startedAt: new Date(),
            progress: 0
          };
        } else {
          return {
            ...strategy,
            status: 'queued' as const,
            progress: 0
          };
        }
      });
    });
    
    // Start the first strategy
    const firstStrategy = strategies[0];
    if (firstStrategy) {
      handleStartStrategy(firstStrategy.id);
    }
  };
  
  // Handle pausing an investigation
  const handlePauseInvestigation = () => {
    setInvestigationState('paused');
    
    // Pause all running strategies but maintain queue status for others
    setStrategies(prev => 
      prev.map(strategy => {
        if (strategy.status === 'running') {
          return {
            ...strategy,
            status: 'paused' as const
          };
        }
        // Keep queued strategies as queued
        return strategy;
      })
    );
  };
  
  // Handle resuming an investigation
  const handleResumeInvestigation = () => {
    setInvestigationState('active');
    
    // Check if any strategy is already running
    const hasRunningStrategy = strategies.some(s => s.status === 'running');
    if (hasRunningStrategy) return; // Don't start if one is already running
    
    // Find if there are any paused strategies
    const hasPausedStrategy = strategies.some(s => s.status === 'paused');
    
    // Resume paused strategies or start the next queued one if no paused strategies
    if (hasPausedStrategy) {
      setStrategies(prev => {
        // Double-check that no strategy is running (in case state changed)
        const isAnyRunning = prev.some(s => s.status === 'running');
        if (isAnyRunning) return prev;
        
        // Find the first paused strategy
        const firstPausedIndex = prev.findIndex(s => s.status === 'paused');
        if (firstPausedIndex === -1) return prev;
        
        const firstPausedId = prev[firstPausedIndex].id;
        
        // Call handleStartStrategy after state update for only the first paused strategy
        setTimeout(() => handleStartStrategy(firstPausedId), 0);
        
        const updatedStrategies = prev.map((strategy, index) => {
          if (index === firstPausedIndex) {
            return {
              ...strategy,
              status: 'running' as const
            };
          }
          return strategy;
        });
        
        return updatedStrategies;
      });
    } else {
      // If no paused strategies, start the next queued one
      startNextStrategy();
    }
  };
  
  // Handle stopping an investigation
  const handleStopInvestigation = () => {
    setInvestigationState('idle');
    
    // Clear all strategies
    setStrategies([]);
    
    // Additional cleanup logic would go here
  };
  
  // Handle starting a new investigation (reset everything)
  const handleStartNewInvestigation = () => {
    // Reset investigation state to idle
    setInvestigationState('idle');
    
    // Clear all strategies
    setStrategies([]);
    
    // Clear selected address (to force user to enter a new address)
    setSelectedAddress(undefined);
    
    // Reset graph data
    setGraphData({ nodes: [], edges: [] });
    
    // Reset addresses list
    setAddresses([]);
    
    // Reset address details
    setAddressDetails(undefined);
    
    // Show chat for address input
    setIsChatVisible(true);
    
    // Reset chat messages
    setChatMessages([]);
    
    // Increment the chat reset key to force a complete reset
    setChatResetKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Blockchain Forensics Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Tabs value={activeFeatureTab} onValueChange={setActiveFeatureTab} className="w-[400px]">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="graph">Graph</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="token-holders">Token Holders</TabsTrigger>
                <TabsTrigger value="connections">Connections</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        </div>
        
        
        {activeFeatureTab === 'graph' ? (
          // Original dashboard content
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Graph Visualization</CardTitle>
              </CardHeader>
              <CardContent className="pl-2 h-[600px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center">
                      <Spinner className="w-12 h-12 mb-4" />
                      <div className="text-lg font-medium">Searching blockchain data...</div>
                    </div>
                  </div>
                ) : (
                  <GraphVisualization
                    nodes={graphData.nodes}
                    edges={graphData.edges}
                    onNodeSelect={handleNodeSelect}
                    selectedNode={selectedAddress}
                  />
                )}
              </CardContent>
            </Card>
            <div className="col-span-3">
              <div className="grid gap-4 grid-rows-2 h-full">
                <Card className="row-span-1">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Investigation Control</CardTitle>
                    <div className="flex space-x-2">
                      {investigationState === 'idle' && (
                        <Button size="sm" onClick={() => setShowInvestigationInput(true)}>
                          New Investigation
                        </Button>
                      )}
                      {investigationState === 'ready' && (
                        <Button size="sm" onClick={handleStartInvestigation}>
                          Start
                        </Button>
                      )}
                      {investigationState === 'active' && (
                        <Button size="sm" variant="outline" onClick={handlePauseInvestigation}>
                          Pause
                        </Button>
                      )}
                      {investigationState === 'paused' && (
                        <Button size="sm" onClick={handleResumeInvestigation}>
                          Resume
                        </Button>
                      )}
                      {(investigationState === 'active' || investigationState === 'paused') && (
                        <Button size="sm" variant="destructive" onClick={handleStopInvestigation}>
                          Stop
                        </Button>
                      )}
                      {investigationState === 'completed' && (
                        <Button size="sm" onClick={handleStartNewInvestigation}>
                          New Investigation
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={toggleChat}/>
            
            {/* Chat box positioned over the graph */}
            {isChatVisible && (
              <div className="absolute bottom-0 right-0 w-full md:w-96 h-60 md:h-80 shadow-lg z-10">
                <AgentChatBox
                  onMessageSubmit={handleMessageSubmit}
                  onClose={toggleChat}
                  predefinedStrategies={predefinedStrategies}
                  resetKey={chatResetKey}
                  selectedNode={selectedNode}
                  userAddress={userAddress || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'} // Mock user address for demo
                />
              </div>
            )}
          </div>
          
          <div className="w-full md:w-64 lg:w-72 xl:w-80 border-t md:border-t-0 md:border-l border-gray-800 flex flex-col h-[50vh] md:h-full overflow-hidden">
            {/* Top Section - Details View */}
            <div className="h-1/2 p-2 md:p-4 border-b border-gray-800 overflow-y-auto">
              <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-4">Address Details</h2>
              <DetailsView 
                addressDetails={addressDetails}
                selectedAddress={selectedAddress}
              />
            </div>
            
            {/* Bottom Section - Address List */}
            <div className="h-1/2 p-2 md:p-4 overflow-y-auto">
              <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-4">Addresses</h2>
              <AddressList 
                addresses={addresses}
                selectedAddress={selectedAddress}
                onAddressSelect={handleNodeSelect}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}