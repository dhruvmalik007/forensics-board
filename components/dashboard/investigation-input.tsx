'use client';

import React, { useState } from 'react';
import { Search, MessageSquare, ChevronUp, ChevronDown, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

export type PredefinedStrategy = {
  id: string;
  name: string;
  description: string;
  analysisMode: 'simulation' | 'live';
};

type Message = {
  id: string;
  type: 'user' | 'system';
  content: string;
  timestamp: Date;
};

type InvestigationInputProps = {
  predefinedStrategies: PredefinedStrategy[];
  onAddressSubmit: (address: string, selectedStrategies: string[], customStrategy?: string) => void;
};

export function InvestigationInput({ predefinedStrategies, onAddressSubmit }: InvestigationInputProps) {
  // Start with the panel expanded by default
  const [isExpanded, setIsExpanded] = useState(true);
  const [address, setAddress] = useState('');
  const [customStrategy, setCustomStrategy] = useState('');
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAddressValid, setIsAddressValid] = useState(true);
  
  const validateAddress = (value: string) => {
    // Simple validation for Ethereum-like addresses
    // In a real app, you'd want more sophisticated validation
    const isValid = value === '' || /^0x[a-fA-F0-9]{40}$/.test(value);
    setIsAddressValid(isValid);
    return isValid;
  };
  
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    validateAddress(value);
  };
  
  const toggleStrategy = (strategyId: string) => {
    setSelectedStrategies(prev => 
      prev.includes(strategyId)
        ? prev.filter(id => id !== strategyId)
        : [...prev, strategyId]
    );
  };
  
  const handleSubmit = () => {
    if (!address || !validateAddress(address)) return;
    
    // Add message to chat history
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: `Investigating address: ${address}${
        selectedStrategies.length > 0 
          ? ` with strategies: ${selectedStrategies.map(id => 
              predefinedStrategies.find(s => s.id === id)?.name
            ).join(', ')}`
          : ''
      }${customStrategy ? ` and custom strategy: ${customStrategy}` : ''}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Call the onAddressSubmit callback
    onAddressSubmit(address, selectedStrategies, customStrategy);
    
    // Collapse the input after submission
    setIsExpanded(false);
    
    // Reset form
    setCustomStrategy('');
  };
  
  return (
    <div className={`fixed bottom-0 left-1/4 right-1/4 bg-gray-800 border border-gray-700 rounded-t-lg transition-all duration-300 shadow-lg ${
      isExpanded ? 'h-96' : 'h-16'
    }`}>
      <div 
        className="flex items-center justify-between px-4 h-16 cursor-pointer bg-blue-900/30"
        onClick={() => setIsExpanded(prev => !prev)}
      >
        <div className="flex items-center">
          <Search size={18} className="mr-2 text-blue-400" />
          <h3 className="font-medium text-white">Investigation Input</h3>
          {!isExpanded && (
            <span className="ml-3 text-sm text-blue-300">Click here to start an investigation</span>
          )}
        </div>
        <button className="p-1 text-blue-400 hover:text-white">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="p-4 h-80 flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 space-y-3">
            {messages.map(message => (
              <div 
                key={message.id}
                className={`p-3 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-blue-900/30 ml-auto max-w-[80%]' 
                    : 'bg-gray-700 mr-auto max-w-[80%]'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            ))}
            
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-4">
                <MessageSquare className="mx-auto mb-2 opacity-50" size={24} />
                <p>Enter an address below and select strategies to begin</p>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Wallet Address <span className="text-red-500">*</span></label>
              <Input
                value={address}
                onChange={handleAddressChange}
                placeholder="Enter wallet address (0x...)"
                className={`bg-gray-900 border ${isAddressValid ? 'border-gray-700' : 'border-red-500'}`}
              />
              {!isAddressValid && (
                <p className="text-xs text-red-500 mt-1">Please enter a valid wallet address</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Select Strategies <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {predefinedStrategies.map(strategy => (
                  <div 
                    key={strategy.id}
                    className={`p-2 rounded border cursor-pointer text-sm ${
                      selectedStrategies.includes(strategy.id)
                        ? 'bg-blue-900/30 border-blue-500'
                        : 'bg-gray-900 border-gray-700 hover:border-gray-500'
                    }`}
                    onClick={() => toggleStrategy(strategy.id)}
                  >
                    {strategy.name}
                  </div>
                ))}
              </div>
              {selectedStrategies.length === 0 && (
                <p className="text-xs text-amber-500">Select at least one strategy</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Custom Strategy (Optional)</label>
              <Textarea
                value={customStrategy}
                onChange={(e) => setCustomStrategy(e.target.value)}
                placeholder="Describe your investigation goal in natural language..."
                className="bg-gray-900 border border-gray-700 resize-none h-20"
              />
            </div>
            
            <Button 
              onClick={handleSubmit}
              disabled={!address || !isAddressValid || selectedStrategies.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 py-2 text-base font-medium"
            >
              <Search size={18} className="mr-2" />
              Start Investigation
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
