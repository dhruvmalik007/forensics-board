'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import { Chat } from '@/components/chat';
import { SuggestedActions } from '@/components/suggested-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

interface BlockchainChatProps {
  initialQuery?: string;
}

export function BlockchainChat({ initialQuery = '' }: BlockchainChatProps) {
  const [chatId] = useState(() => generateUUID());
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CHAT_MODEL);
  const [userInput, setUserInput] = useState(initialQuery);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get model from cookies on client side
  useEffect(() => {
    // Get the model from cookies using document.cookie
    const cookies = document.cookie.split(';');
    const modelCookie = cookies.find(cookie => cookie.trim().startsWith('chat-model='));
    
    if (modelCookie) {
      const modelValue = modelCookie.split('=')[1];
      setSelectedModel(modelValue);
    }
  }, []);

  // Submit initial query if provided
  useEffect(() => {
    if (initialQuery && !isSubmitting) {
      const submitInitialQuery = async () => {
        setIsSubmitting(true);
        try {
          await append({
            role: 'user',
            content: initialQuery,
          });
          setUserInput('');
        } catch (error) {
          console.error('Error submitting initial query:', error);
          toast.error('Failed to submit your query');
        } finally {
          setIsSubmitting(false);
        }
      };
      
      submitInitialQuery();
    }
  }, [initialQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const { append } = useChat({
    id: chatId,
    body: {
      id: chatId,
      createArtifact: true, // Enable artifact creation
      artifactType: 'blockchain-explorer', // Specify the artifact type
    },
    onError: (error) => {
      console.error('Chat error:', error);
      toast.error('Failed to process your query. Please try again.');
      setIsSubmitting(false);
    },
    onFinish: () => {
      setIsSubmitting(false);
      // Focus the input field after the response is complete
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userInput.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      await append({
        role: 'user',
        content: userInput,
      });
      
      setUserInput('');
      
      // Scroll to the bottom of the chat
      if (chatContainerRef.current) {
        setTimeout(() => {
          chatContainerRef.current?.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }, 100);
      }
    } catch (error) {
      console.error('Error submitting query:', error);
      toast.error('Failed to submit your query');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-white">Ask about blockchain transactions</CardTitle>
          <CardDescription className="text-gray-300">
            Enter your query or select from suggested queries below
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
          <div ref={chatContainerRef} className="flex-1 overflow-auto mb-4 bg-gray-900/50 rounded-lg p-4">
            <Chat
              key={chatId}
              id={chatId}
              initialMessages={[]}
              selectedChatModel={selectedModel}
              selectedVisibilityType="private"
              isReadonly={false}
            />
            <DataStreamHandler id={chatId} />
          </div>
          
          <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Type your blockchain query here..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
              disabled={isSubmitting}
            />
            <Button 
              type="submit" 
              disabled={isSubmitting || !userInput.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
              ) : (
                <Send size={18} />
              )}
            </Button>
          </form>
          
          <div className="mt-2">
            <h3 className="text-sm font-medium mb-3 text-gray-300">Suggested Cross-Chain Queries:</h3>
            <SuggestedActions chatId={chatId} append={append} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 