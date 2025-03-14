'use client';

import React, { useState, useEffect } from 'react';
import { StrategyControlPanel, Strategy } from '../../components/dashboard/strategy-control-panel';
import { GraphVisualization } from '../../components/dashboard/graph-visualization';
import { ChatBox } from '../../components/dashboard/chat-box';
import { DetailsView } from '../../components/dashboard/details-view';
import { AddressList } from '../../components/dashboard/address-list';
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
import { useRouter } from 'next/navigation'
import { usePrivyAuth } from '@/hooks/use-privy-auth';

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
  
  // State for chat visibility
  const [isChatVisible, setIsChatVisible] = useState(true);
  
  // State for chat messages
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  
  // State to trigger chat reset (using a number that increments)
  const [chatResetKey, setChatResetKey] = useState(0);
  
  // Initialize with test data if in freemium mode
  useEffect(() => {
    const isFreemium = localStorage.getItem('freemiumEnabled') === 'true';
    const testAddress = localStorage.getItem('testAddress');
    
    if (isFreemium) {
      // Set chat visible to guide users
      setIsChatVisible(true);
      
      if (testAddress) {
        // If there's a test address, load its data
        const initialData = generateMockGraphData(testAddress);
        setGraphData(initialData);
        setSelectedAddress(testAddress);
        
        // Generate mock address details
        const details = generateMockAddressDetails(testAddress, 'main');
        setAddressDetails(details);
        
        // Generate address list with type casting to ensure correct type
        const addressList = generateAddressList(initialData.nodes).map(item => ({
          ...item,
          type: item.type as NodeType
        }));
        setAddresses(addressList);
        
        // Set investigation state to ready
        setInvestigationState('ready');
        
        // Add some initial strategies
        const initialStrategies = generateMockStrategies(['token_transfers', 'nft_transfers']);
        setStrategies(initialStrategies);
      } else {
        // If no test address, show empty state with chat prompt
        setGraphData({ nodes: [], edges: [] });
        setChatMessages(['Welcome to Freemium mode! Please enter an Ethereum address to start your investigation.']);
        setInvestigationState('idle');
      }
    }
  }, []);
  
  // Handle message submission from chatbox
  const handleMessageSubmit = (message: string) => {
    // Process the user's message
    if (message.startsWith('0x') && message.length === 42) {
      // If it's an address, just render a single node for the main address
      const address = message;
      
      // Use the generateSingleNodeData function for instant rendering
      const singleNodeData = generateSingleNodeData(address);
      
      // Set the graph data with just the main node
      setGraphData({ 
        nodes: singleNodeData.nodes as Node[], 
        edges: [] 
      });
      
      // Set the selected address
      setSelectedAddress(address);
      
      // Generate mock address details
      const details = generateMockAddressDetails(address, 'main');
      setAddressDetails(details);
      
      // Generate address list with just the main address
      const addressList: AddressListItem[] = [{
        address: address,
        type: 'main',
        tags: []
      }];
      setAddresses(addressList);
      
      // Do NOT start any strategies automatically
    } else if (message.toLowerCase().includes('run strategy') || message.toLowerCase().includes('strategy')) {
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
    } else {
      // For other types of messages, just log them for now
      console.log(`Received message: ${message}`);
      // In a real app, you would process the message and update the UI accordingly
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
  };
  
  // Handle node selection in graph
  const handleNodeSelect = (nodeId: string) => {
    setSelectedAddress(nodeId);
    
    // Find the node type from graph data
    const node = graphData.nodes.find(n => n.id === nodeId);
    if (node) {
      // Find all connected edges for this node
      const connectedEdges = graphData.edges.filter(
        edge => edge.source === nodeId || edge.target === nodeId
      );
      
      // Get all connected nodes
      const connectedNodeIds = new Set<string>();
      connectedEdges.forEach(edge => {
        if (edge.source === nodeId) {
          connectedNodeIds.add(edge.target);
        } else {
          connectedNodeIds.add(edge.source);
        }
      });
      
      const connectedNodes = Array.from(connectedNodeIds).map(id => 
        graphData.nodes.find(n => n.id === id)
      ).filter(Boolean) as Node[];
      
      // Generate details based on actual connections
      const details = generateRelevantAddressDetails(
        nodeId, 
        node.type, 
        connectedNodes,
        connectedEdges
      );
      
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
    <div className="h-[calc(100vh-48px)] w-full bg-gray-900 text-white overflow-hidden">
      <div className="h-full flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel - Strategy Control */}
        <div className="w-full md:w-64 lg:w-72 xl:w-80 border-b md:border-b-0 md:border-r border-gray-800 p-2 md:p-4 flex flex-col h-auto md:h-full">
          <div className="flex-grow overflow-y-auto">
            <StrategyControlPanel 
              strategies={strategies}
              onRemoveStrategy={handleRemoveStrategy}
              onStartStrategy={handleStartStrategy}
              onPauseStrategy={handlePauseStrategy}
              onMoveStrategy={handleMoveStrategy}
            />
          </div>
          <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-gray-700">
            {/* State 1: Idle - No button rendered but space is blank */}
            {/* State 2: Ready - Show Start Investigation button when at least one strategy is selected */}
            {investigationState === 'ready' && (
              <button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 md:py-3 px-4 rounded font-medium flex items-center justify-center"
                onClick={handleStartInvestigation}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                Start Investigation
              </button>
            )}
            
            {/* State 3: Active - Show Pause Investigation button when investigation is running */}
            {investigationState === 'active' && (
              <button 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 md:py-3 px-4 rounded font-medium flex items-center justify-center"
                onClick={handlePauseInvestigation}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Pause Investigation
              </button>
            )}
            
            {/* State 4: Paused - Show Resume and Stop buttons when investigation is paused */}
            {investigationState === 'paused' && (
              <div className="flex space-x-2">
                <button 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 md:py-3 px-4 rounded font-medium flex items-center justify-center"
                  onClick={handleResumeInvestigation}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Resume
                </button>
                <button 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 md:py-3 px-4 rounded font-medium flex items-center justify-center"
                  onClick={handleStopInvestigation}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                  Stop
                </button>
              </div>
            )}
            
            {/* State 5: Completed - Show Start New Investigation button when all strategies are completed */}
            {investigationState === 'completed' && (
              <button 
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 md:py-3 px-4 rounded font-medium flex items-center justify-center"
                onClick={handleStartNewInvestigation}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Start New Investigation
              </button>
            )}
          </div>
        </div>
        
        {/* Center Panel - Graph Visualization with Floating Chat */}
        <div className="flex-1 md:flex-grow relative h-[40vh] md:h-full">
          <div className="h-full">
            <GraphVisualization 
              key={graphData.nodes.length > 0 ? graphData.nodes[0].id : 'empty-graph'}
              nodes={graphData.nodes}
              edges={graphData.edges}
              onNodeSelect={handleNodeSelect}
              selectedNode={selectedAddress}
            />
          </div>
          
          {/* Floating Chat Box */}
          <div className={`absolute bottom-4 right-4 w-[90%] md:w-[60%] lg:w-[40rem] ${isChatVisible ? 'block' : 'hidden'}`}>
            <ChatBox 
              onMessageSubmit={handleMessageSubmit}
              onClose={() => setIsChatVisible(false)}
              predefinedStrategies={predefinedStrategies}
              resetKey={chatResetKey}
            />
          </div>
          
          {/* Chat Toggle Button (when chat is hidden) */}
          {!isChatVisible && (
            <button 
              className="absolute bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg"
              onClick={toggleChat}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Right Panel - Details and Address List */}
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
  );
}