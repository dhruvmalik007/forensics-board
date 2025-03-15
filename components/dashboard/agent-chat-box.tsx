'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, ChevronDown, ChevronUp, Wallet, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Toggle } from '../ui/toggle';
import { AgentMode } from '../../packages/agentkit/src/types';

// Mock ethers formatEther function for demo purposes
const ethers = {
  formatEther: (value: string) => {
    return (Number(value) / 1e18).toString();
  }
};

type AgentChatBoxProps = {
  onMessageSubmit: (message: string) => void;
  onClose: () => void;
  onNodeSelect?: (nodeId: string) => void;
  predefinedStrategies: { id: string; name: string; description: string }[];
  resetKey?: number;
  selectedNode?: { id: string; label: string; type: string } | null;
  userAddress?: string;
};

export function AgentChatBox({ 
  onMessageSubmit, 
  onClose, 
  onNodeSelect,
  predefinedStrategies, 
  resetKey = 0,
  selectedNode,
  userAddress
}: AgentChatBoxProps) {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasAddressSubmitted, setHasAddressSubmitted] = useState(false);
  const [keepSuggestionsOpen, setKeepSuggestionsOpen] = useState(false);
  const [mode, setMode] = useState<AgentMode>(AgentMode.NORMAL);
  const [isProcessingNode, setIsProcessingNode] = useState(false);
  const [agentResponse, setAgentResponse] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<{text: string; isUser: boolean}[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Focus the input when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Reset state when resetKey changes
  useEffect(() => {
    setHasAddressSubmitted(false);
    setMessage('');
    setAgentResponse(null);
    setChatMessages([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [resetKey]);
  
  // Handle clicks outside the suggestions box
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showSuggestions && 
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !keepSuggestionsOpen
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions, keepSuggestionsOpen]);
  
  // Handle selected node changes
  useEffect(() => {
    if (selectedNode && mode === AgentMode.AGENT) {
      handleNodeSelection(selectedNode);
    }
  }, [selectedNode, mode]);
  
  const handleNodeSelection = async (node: { id: string; label: string; type: string }) => {
    if (!userAddress) {
      addMessage(`Please connect your wallet to interact with tokens.`, false);
      return;
    }
    
    setIsProcessingNode(true);
    addMessage(`Processing node: ${node.label} (${node.id})`, false);
    
    try {
      // Call the AgentKit API to process the node selection
      const response = await fetch('/api/agentkit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selectedNode: {
            ...node,
            tokenAddress: node.id, // Assuming the node ID is the token address
            chainId: 8453 // Base chain ID
          },
          userAddress
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAgentResponse(data.data);
        
        if (data.data.type === 'swap') {
          const { fromToken, toToken, amount, quote } = data.data.params;
          
          addMessage(`I can help you swap ${fromToken.symbol} for ${toToken.symbol}.`, false);
          addMessage(`Current rate: 1 ${fromToken.symbol} = ${Number(quote.toAmount) / Number(quote.fromAmount)} ${toToken.symbol}`, false);
          addMessage(`Would you like to swap ${ethers.formatEther(amount)} ${fromToken.symbol} for approximately ${Number(quote.toAmount) / 10**toToken.decimals} ${toToken.symbol}?`, false);
        } else {
          addMessage(`I found information about this node: ${data.data.params.message || 'No details available'}`, false);
        }
      } else {
        addMessage(`Error processing node: ${data.error}`, false);
      }
    } catch (error) {
      console.error('Error processing node:', error);
      addMessage(`Error processing node. Please try again.`, false);
    } finally {
      setIsProcessingNode(false);
    }
  };
  
  const addMessage = (text: string, isUser: boolean) => {
    setChatMessages(prev => [...prev, { text, isUser }]);
  };
  
  const handleSubmit = () => {
    if (!message.trim()) return;
    
    // Add user message to chat
    addMessage(message, true);
    
    if (mode === AgentMode.NORMAL) {
      // In normal mode, just pass the message to the parent component
      onMessageSubmit(message);
    } else {
      // In agent mode, process the message based on context
      if (agentResponse?.type === 'swap') {
        if (message.toLowerCase().includes('yes') || message.toLowerCase().includes('swap')) {
          addMessage(`Great! To complete this swap, you would need to sign a transaction. In a production app, this would connect to your wallet.`, false);
          addMessage(`Transaction details:
- From: ${agentResponse.params.fromToken.symbol}
- To: ${agentResponse.params.toToken.symbol}
- Amount: ${ethers.formatEther(agentResponse.params.amount)} ${agentResponse.params.fromToken.symbol}
- Estimated to receive: ${Number(agentResponse.params.quote.toAmount) / 10**agentResponse.params.toToken.decimals} ${agentResponse.params.toToken.symbol}
- Gas estimate: ${agentResponse.params.quote.estimatedGas}`, false);
        } else if (message.toLowerCase().includes('no') || message.toLowerCase().includes('cancel')) {
          addMessage(`No problem. Let me know if you'd like to explore other options.`, false);
          setAgentResponse(null);
        } else {
          addMessage(`I'm not sure if you want to proceed with the swap. Please say "yes" to confirm or "no" to cancel.`, false);
        }
      } else {
        // Handle general agent mode messages
        addMessage(`I'm in agent mode, but I don't have a specific action to perform. You can select a token node from the graph to see swap options.`, false);
      }
    }
    
    setMessage('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const toggleMode = () => {
    const newMode = mode === AgentMode.NORMAL ? AgentMode.AGENT : AgentMode.NORMAL;
    setMode(newMode);
    
    if (newMode === AgentMode.AGENT) {
      addMessage(`Switched to Agent Mode. You can now select token nodes from the graph to see swap options.`, false);
    } else {
      addMessage(`Switched to Normal Mode. You can now use the chat for blockchain forensics analysis.`, false);
      setAgentResponse(null);
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 w-96 bg-card border rounded-lg shadow-lg flex flex-col z-50">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center">
          <h3 className="font-medium">Blockchain Assistant</h3>
          <div className="ml-2 flex items-center bg-muted rounded-full p-1">
            <Toggle
              pressed={mode === AgentMode.AGENT}
              onPressedChange={toggleMode}
              aria-label="Toggle agent mode"
              className={`${mode === AgentMode.AGENT ? 'bg-primary text-primary-foreground' : 'bg-transparent'} rounded-full p-1 h-7`}
            >
              <Wallet className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={mode === AgentMode.NORMAL}
              onPressedChange={toggleMode}
              aria-label="Toggle normal mode"
              className={`${mode === AgentMode.NORMAL ? 'bg-primary text-primary-foreground' : 'bg-transparent'} rounded-full p-1 h-7`}
            >
              <MessageSquare className="h-4 w-4" />
            </Toggle>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-muted rounded-full"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <>
          <div className="p-3 flex-1 overflow-y-auto max-h-96 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                {mode === AgentMode.NORMAL ? (
                  "Enter an Ethereum address or ask a question about blockchain forensics."
                ) : (
                  "Select a token node from the graph to see swap options, or switch to normal mode for forensics analysis."
                )}
              </div>
            ) : (
              chatMessages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`p-2 rounded-lg ${msg.isUser ? 'bg-primary text-primary-foreground ml-8' : 'bg-muted mr-8'}`}
                >
                  {msg.text}
                </div>
              ))
            )}
            
            {isProcessingNode && (
              <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Processing node...</span>
              </div>
            )}
          </div>
          
          <div className="p-3 border-t">
            <div className="flex items-center space-x-2">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={mode === AgentMode.NORMAL ? "Enter an address or question..." : "Respond to agent..."}
                className="flex-1"
                disabled={isProcessingNode}
              />
              <Button 
                size="icon" 
                onClick={handleSubmit}
                disabled={!message.trim() || isProcessingNode}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {showSuggestions && (
              <div 
                ref={suggestionsRef}
                className="mt-2 bg-card border rounded-md shadow-md p-2 max-h-48 overflow-y-auto"
              >
                <div className="font-medium mb-1">Suggested Strategies:</div>
                {predefinedStrategies.map((strategy) => (
                  <div 
                    key={strategy.id}
                    className="p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => {
                      setMessage(`Run strategy: ${strategy.name}`);
                      if (!keepSuggestionsOpen) {
                        setShowSuggestions(false);
                      }
                    }}
                  >
                    <div className="font-medium">{strategy.name}</div>
                    <div className="text-xs text-muted-foreground">{strategy.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 