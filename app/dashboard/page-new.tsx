'use client';

import React, { useState, useEffect } from 'react';
import { StrategyControlPanel, Strategy } from '@/components/dashboard/strategy-control-panel';
import { GraphVisualization } from '@/components/dashboard/graph-visualization';
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
import { useRouter } from 'next/navigation';
import { FeatureModule } from '@/components/dashboard/feature-module';
import { ViewToggle } from '@/components/dashboard/view-toggle';
import { AgentChatBox } from '@/components/dashboard/agent-chat-box';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InvestigationInput } from '@/components/dashboard/investigation-input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CheckIcon } from '@radix-ui/react-icons';
import { Spinner } from '@/components/ui/spinner';

// Node and Edge types
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

export default function Dashboard() {
  const router = useRouter();
  
  // State for graph data
  const [graphData, setGraphData] = useState<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });
  
  // State for address list
  const [addresses, setAddresses] = useState<AddressListItem[]>([]);
  
  // State for selected address
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  
  // State for address details
  const [addressDetails, setAddressDetails] = useState<any>(null);
  
  // State for loading
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // State for strategies
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  
  // State for investigation
  type InvestigationState = 'idle' | 'ready' | 'active' | 'paused' | 'completed';
  const [investigationState, setInvestigationState] = useState<InvestigationState>('idle');
  
  // State for chat
  const [showChat, setShowChat] = useState<boolean>(false);
  const [chatResetKey, setChatResetKey] = useState<number>(0);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  
  // State for view toggle
  const [activeView, setActiveView] = useState<'graph' | 'features'>('graph');
  
  // State for selected node and user address (for AgentKit)
  const [selectedNode, setSelectedNode] = useState<{ id: string; label: string; type: string } | null>(null);
  const [userAddress, setUserAddress] = useState<string>('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'); // Mock user address for demo
  
  // State for investigation dialog
  const [showInvestigationDialog, setShowInvestigationDialog] = useState<boolean>(false);
  
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
      if (strategyMatch) {
        const strategyName = strategyMatch[1].trim();
        // Find the strategy by name
        const strategy = predefinedStrategies.find(s => 
          s.name.toLowerCase() === strategyName.toLowerCase()
        );
        
        if (strategy) {
          // Add the strategy
          handleAddStrategy({
            id: strategy.id,
            name: strategy.name,
            status: 'idle',
            progress: 0
          });
          
          setChatMessages(prev => [...prev, `Added strategy: ${strategy.name}`]);
        } else {
          setChatMessages(prev => [...prev, `Strategy "${strategyName}" not found. Available strategies: ${predefinedStrategies.map(s => s.name).join(', ')}`]);
        }
      }
    }
  };
  
  // Handle address submission from investigation input
  const handleAddressSubmit = (address: string, strategyIds: string[]) => {
    setIsLoading(true);
    
    // Generate mock data for the address
    const mockData = generateMockGraphData(address);
    setGraphData({ 
      nodes: mockData.nodes as Node[], 
      edges: mockData.edges as Edge[] 
    });
    
    // Generate mock address list
    const addressList = generateAddressList(address);
    setAddresses(addressList);
    
    // Generate mock address details
    const details = generateMockAddressDetails(address, 'main');
    setAddressDetails(details);
    
    // Set the selected address
    setSelectedAddress(address);
    
    // Create strategies based on selected strategy IDs
    const selectedStrategies = strategyIds.map(id => {
      const predefined = predefinedStrategies.find(s => s.id === id);
      return {
        id,
        name: predefined?.name || id,
        status: 'idle' as const,
        progress: 0
      };
    });
    
    setStrategies(selectedStrategies);
    
    // Set investigation state to ready
    setInvestigationState('ready');
    
    // Show the chat
    setShowChat(true);
    
    // Reset chat
    setChatResetKey(prev => prev + 1);
    
    // Add a message to the chat
    setChatMessages([`Found data for address ${address}. You can now start the investigation.`]);
    
    setIsLoading(false);
    
    // Close the dialog
    setShowInvestigationDialog(false);
  };
  
  // Handle node selection
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
  
  // Toggle chat
  const toggleChat = () => {
    setShowChat(!showChat);
  };
  
  // Handle strategy actions
  const handleStartStrategy = (id: string) => {
    setStrategies(prev => 
      prev.map(s => s.id === id ? { ...s, status: 'active', progress: 0 } : s)
    );
    
    // Set investigation state to active if it's not already
    if (investigationState !== 'active') {
      setInvestigationState('active');
    }
    
    // Simulate strategy execution
    simulateStrategyExecution(id);
  };
  
  const simulateStrategyExecution = (strategyId: string) => {
    // Find the strategy
    const strategy = strategies.find(s => s.id === strategyId);
    if (!strategy) return;
    
    // Generate random nodes for the strategy
    generateRandomNodesForStrategy(strategyId);
    
    // Simulate progress updates
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      
      setStrategies(prev => 
        prev.map(s => s.id === strategyId ? { ...s, progress } : s)
      );
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // Mark strategy as completed
        setStrategies(prev => 
          prev.map(s => s.id === strategyId ? { ...s, status: 'completed', progress: 100 } : s)
        );
        
        // Handle strategy completion
        handleStrategyComplete(strategyId);
      }
    }, 500);
  };
  
  const generateRandomNodesForStrategy = (strategyId: string) => {
    // Get the strategy
    const strategy = strategies.find(s => s.id === strategyId);
    if (!strategy) return;
    
    // Generate random nodes based on strategy type
    const mainAddress = selectedAddress || '';
    if (!mainAddress) return;
    
    // Get current nodes and edges
    const { nodes, edges } = graphData;
    
    // Generate new nodes and edges based on strategy type
    let newNodes: Node[] = [...nodes];
    let newEdges: Edge[] = [...edges];
    
    // Different strategies generate different types of nodes and connections
    switch (strategyId) {
      case 'token_transfers':
        // Add token transfer nodes
        for (let i = 0; i < 3; i++) {
          const id = `0x${Math.random().toString(16).substring(2, 42)}`;
          newNodes.push({
            id,
            label: id.substring(0, 8),
            type: Math.random() > 0.7 ? 'contract' : 'alt_wallet'
          });
          
          newEdges.push({
            id: `e-${strategyId}-${i}`,
            source: mainAddress,
            target: id,
            type: 'token_transfer'
          });
        }
        break;
        
      case 'nft_transfers':
        // Add NFT transfer nodes
        for (let i = 0; i < 2; i++) {
          const id = `0x${Math.random().toString(16).substring(2, 42)}`;
          newNodes.push({
            id,
            label: id.substring(0, 8),
            type: 'alt_wallet'
          });
          
          newEdges.push({
            id: `e-${strategyId}-${i}`,
            source: mainAddress,
            target: id,
            type: 'nft_transfer'
          });
        }
        break;
        
      case 'bridging':
        // Add bridging nodes
        for (let i = 0; i < 2; i++) {
          const id = `0x${Math.random().toString(16).substring(2, 42)}`;
          newNodes.push({
            id,
            label: id.substring(0, 8),
            type: 'bridge'
          });
          
          newEdges.push({
            id: `e-${strategyId}-${i}`,
            source: mainAddress,
            target: id,
            type: 'bridge_transaction'
          });
          
          // Add a destination node on the other side of the bridge
          const destId = `0x${Math.random().toString(16).substring(2, 42)}`;
          newNodes.push({
            id: destId,
            label: destId.substring(0, 8),
            type: 'alt_wallet'
          });
          
          newEdges.push({
            id: `e-${strategyId}-${i}-dest`,
            source: id,
            target: destId,
            type: 'bridge_transaction'
          });
        }
        break;
        
      default:
        // Generic strategy - add some random connections
        for (let i = 0; i < 2; i++) {
          const id = `0x${Math.random().toString(16).substring(2, 42)}`;
          newNodes.push({
            id,
            label: id.substring(0, 8),
            type: Math.random() > 0.5 ? 'alt_wallet' : 'contract'
          });
          
          newEdges.push({
            id: `e-${strategyId}-${i}`,
            source: mainAddress,
            target: id,
            type: 'token_transfer'
          });
        }
    }
    
    // Update graph data
    setGraphData({ nodes: newNodes, edges: newEdges });
    
    // Update address list
    const newAddresses = newNodes
      .filter(node => !addresses.some(a => a.address === node.id))
      .map(node => ({
        address: node.id,
        type: node.type,
        tags: []
      }));
    
    setAddresses(prev => [...prev, ...newAddresses]);
  };
  
  const handleStrategyComplete = (id: string) => {
    // Check if all strategies are completed
    const allCompleted = strategies.every(s => 
      s.id === id ? true : s.status === 'completed'
    );
    
    if (allCompleted) {
      // Set investigation state to completed
      setInvestigationState('completed');
      
      // Add a message to the chat
      setChatMessages(prev => [...prev, 'All strategies have completed. The investigation is now complete.']);
    } else {
      // Start the next strategy if available
      const nextStrategy = strategies.find(s => s.status === 'idle');
      if (nextStrategy) {
        // Add a message to the chat
        setChatMessages(prev => [...prev, `Strategy "${strategies.find(s => s.id === id)?.name}" completed. Starting next strategy: ${nextStrategy.name}`]);
        
        // Start the next strategy after a short delay
        setTimeout(() => {
          handleStartStrategy(nextStrategy.id);
        }, 1000);
      } else {
        // Add a message to the chat
        setChatMessages(prev => [...prev, `Strategy "${strategies.find(s => s.id === id)?.name}" completed.`]);
      }
    }
  };
  
  // Handle investigation actions
  const handleStartInvestigation = () => {
    // Set investigation state to active
    setInvestigationState('active');
    
    // Start the first strategy
    const firstStrategy = strategies.find(s => s.status === 'idle');
    if (firstStrategy) {
      handleStartStrategy(firstStrategy.id);
    }
  };
  
  const handleStartNewInvestigation = () => {
    // Show the investigation dialog
    setShowInvestigationDialog(true);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Blockchain Forensics Dashboard</h2>
          
          <div className="flex items-center space-x-4">
            <ViewToggle 
              activeView={activeView} 
              onToggle={(view) => setActiveView(view)} 
            />
            
            <Button onClick={handleStartNewInvestigation}>
              New Investigation
            </Button>
          </div>
        </div>
        
        {activeView === 'graph' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Graph Visualization</CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[600px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center">
                      <Spinner className="w-12 h-12 mb-4" />
                      <div className="text-lg font-medium">Searching blockchain data...</div>
                    </div>
                  </div>
                ) : graphData.nodes.length > 0 ? (
                  <GraphVisualization 
                    nodes={graphData.nodes} 
                    edges={graphData.edges} 
                    onNodeSelect={handleNodeSelect}
                    selectedNodeId={selectedAddress || undefined}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-md">
                      <h3 className="text-lg font-medium mb-2">No Data to Visualize</h3>
                      <p className="text-muted-foreground mb-4">
                        Start a new investigation to visualize blockchain data.
                      </p>
                      <Button onClick={handleStartNewInvestigation}>
                        Start New Investigation
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="col-span-3">
              <div className="grid gap-4 grid-rows-2 h-full">
                <Card className="row-span-1">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Investigation Control</CardTitle>
                    <div className="flex space-x-2">
                      {investigationState === 'ready' && (
                        <Button 
                          size="sm" 
                          onClick={handleStartInvestigation}
                        >
                          Start
                        </Button>
                      )}
                      
                      {investigationState === 'completed' && (
                        <Button 
                          size="sm" 
                          onClick={handleStartNewInvestigation}
                        >
                          New
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={toggleChat}
                      >
                        {showChat ? 'Hide Chat' : 'Show Chat'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <StrategyControlPanel 
                      strategies={strategies}
                      onStartStrategy={handleStartStrategy}
                      onMoveStrategy={(id, direction) => {
                        // Reorder strategies
                        const index = strategies.findIndex(s => s.id === id);
                        if (index === -1) return;
                        
                        const newIndex = direction === 'up' ? index - 1 : index + 1;
                        if (newIndex < 0 || newIndex >= strategies.length) return;
                        
                        const newStrategies = [...strategies];
                        const temp = newStrategies[index];
                        newStrategies[index] = newStrategies[newIndex];
                        newStrategies[newIndex] = temp;
                        
                        setStrategies(newStrategies);
                      }}
                      onRemoveStrategy={(id) => {
                        setStrategies(prev => prev.filter(s => s.id !== id));
                      }}
                      onAddStrategy={(strategy) => {
                        setStrategies(prev => [...prev, strategy]);
                      }}
                    />
                  </CardContent>
                </Card>
                
                <Card className="row-span-1">
                  <CardHeader>
                    <CardTitle>Details</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {selectedAddress ? (
                      <DetailsView 
                        details={addressDetails} 
                        onAddressClick={setSelectedAddress}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full p-4">
                        <div className="text-center text-muted-foreground">
                          Select a node to view details
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Address List</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <AddressList 
                  addresses={addresses}
                  selectedAddress={selectedAddress}
                  onAddressSelect={setSelectedAddress}
                />
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Transaction Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {addressDetails?.transactions ? (
                  <div className="space-y-2">
                    {addressDetails.transactions.map((tx: any) => (
                      <div key={tx.id} className="p-2 border rounded flex justify-between items-center">
                        <div>
                          <div className="font-medium">{tx.hash.substring(0, 10)}...</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(tx.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${tx.direction === 'outgoing' ? 'text-red-500' : 'text-green-500'}`}>
                            {tx.direction === 'outgoing' ? '-' : '+'}{tx.value} {tx.asset}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {tx.direction === 'outgoing' ? 'To: ' : 'From: '}
                            {tx.direction === 'outgoing' ? tx.to.substring(0, 8) : tx.from.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    No transaction data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <FeatureModule />
        )}
      </div>
      
      {showChat && (
        <AgentChatBox
          onMessageSubmit={handleMessageSubmit}
          onClose={toggleChat}
          predefinedStrategies={predefinedStrategies}
          resetKey={chatResetKey}
          selectedNode={selectedNode}
          userAddress={userAddress}
        />
      )}
      
      <Dialog open={showInvestigationDialog} onOpenChange={setShowInvestigationDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Start New Investigation</DialogTitle>
            <DialogDescription>
              Enter an address and select strategies to investigate.
            </DialogDescription>
          </DialogHeader>
          
          <InvestigationInput 
            predefinedStrategies={predefinedStrategies}
            onSubmit={handleAddressSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 