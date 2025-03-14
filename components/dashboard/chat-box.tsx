'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

type ChatBoxProps = {
  onMessageSubmit: (message: string) => void;
  onClose: () => void;
  predefinedStrategies: { id: string; name: string; description: string }[];
  resetKey?: number;
};

export function ChatBox({ onMessageSubmit, onClose, predefinedStrategies, resetKey = 0 }: ChatBoxProps) {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasAddressSubmitted, setHasAddressSubmitted] = useState(false);
  const [keepSuggestionsOpen, setKeepSuggestionsOpen] = useState(false);
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // Check if this is an Ethereum address (simple check for 0x prefix and length)
      const isEthereumAddress = message.trim().startsWith('0x') && message.trim().length === 42;
      
      // If it's an address and no address has been submitted yet, set the flag
      if (isEthereumAddress && !hasAddressSubmitted) {
        setHasAddressSubmitted(true);
      }
      
      onMessageSubmit(message.trim());
      setMessage('');
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    // If the suggestion is an address and no address has been submitted yet, set the flag
    if (suggestion.includes('0x') && suggestion.length >= 42 && !hasAddressSubmitted) {
      setHasAddressSubmitted(true);
    }
    
    onMessageSubmit(suggestion);
    setShowSuggestions(false);
    setKeepSuggestionsOpen(false);
  };
  
  const openSuggestions = () => {
    setShowSuggestions(true);
    setKeepSuggestionsOpen(true);
  };
  
  const handleInputFocus = () => {
    // Only show suggestions if an address has already been submitted
    if (hasAddressSubmitted) {
      setShowSuggestions(true);
    }
  };
  
  const closeSuggestions = () => {
    if (!keepSuggestionsOpen) {
      setShowSuggestions(false);
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-700 p-3 flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="font-medium text-white">Investigation Chat</h3>
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="ml-2 text-gray-300 hover:text-white"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
        <button 
          onClick={onClose} 
          className="text-gray-300 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Body - only show when expanded */}
      {isExpanded && (
        <>
          {/* Chat messages would go here - increased height from h-48 to h-72 (1.5x taller) */}
          <div className="p-3 h-72 overflow-y-auto bg-gray-900">
            {/* No default welcome messages in the chat as per user preference */}
            
            {/* Example message - only show after address submission */}
            {hasAddressSubmitted && (
              <div className="mb-2">
                <div className="bg-blue-600 text-white p-2 rounded-lg inline-block max-w-[80%]">
                  What do you want to check? Write an idea or 
                  <button 
                    className="ml-1 underline text-white hover:text-gray-200"
                    onClick={(e) => {
                      e.preventDefault();
                      openSuggestions();
                    }}
                  >
                    sleuth strat
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Input area */}
          <form onSubmit={handleSubmit} className="p-3 bg-gray-700 flex">
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                hasAddressSubmitted
                  ? "What do you want to check? Write an idea or pick a sleuthing strategy"
                  : "Enter a blockchain address to start investigation..."
              }
              className="flex-grow bg-gray-600 text-white border-gray-600 focus:ring-blue-500"
              onFocus={handleInputFocus}
              ref={inputRef}
            />
            <Button type="submit" className="ml-2 bg-blue-600 hover:bg-blue-700">
              <Send size={16} />
            </Button>
          </form>
          
          {/* Suggestions dropdown */}
          {showSuggestions && hasAddressSubmitted && (
            <div 
              ref={suggestionsRef}
              className="absolute bottom-[4.5rem] left-0 right-0 bg-gray-700 border border-gray-600 rounded-t-lg overflow-hidden"
            >
              <div className="p-2 text-sm text-gray-300 flex justify-between">
                <span>Suggestions:</span>
                <button 
                  onClick={() => {
                    setShowSuggestions(false);
                    setKeepSuggestionsOpen(false);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {predefinedStrategies.map(strategy => (
                  <button 
                    key={strategy.id}
                    className="w-full text-left p-2 hover:bg-gray-600 text-white text-sm"
                    onClick={() => handleSuggestionClick(`Run strategy: ${strategy.name}`)}
                  >
                    <div className="font-medium">{strategy.name}</div>
                    <div className="text-gray-400 text-xs">{strategy.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
