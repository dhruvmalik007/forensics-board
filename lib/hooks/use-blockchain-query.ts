import { useState, useEffect, useCallback } from 'react';
import { parseBlockchainQuery, generateStructuredQuery, isBlockchainQuery } from '../blockchain-query-parser';
import { toast } from 'sonner';

interface UseBlockchainQueryProps {
  onQueryGenerated?: (query: string) => void;
}

export function useBlockchainQuery({ onQueryGenerated }: UseBlockchainQueryProps = {}) {
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [structuredQuery, setStructuredQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Process the input query to generate a structured query
  const processQuery = useCallback(async (query: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Check if it's a blockchain query
      if (!isBlockchainQuery(query)) {
        setError('This doesn\'t appear to be a blockchain query. Please include a wallet address (0x...)');
        setIsProcessing(false);
        return null;
      }
      
      // Parse the query
      const params = parseBlockchainQuery(query);
      if (!params) {
        setError('Could not parse blockchain address from query');
        setIsProcessing(false);
        return null;
      }
      
      // Generate structured query
      const generated = generateStructuredQuery(params);
      setStructuredQuery(generated);
      
      // Call the callback if provided
      if (onQueryGenerated) {
        onQueryGenerated(generated);
      }
      
      return generated;
    } catch (err) {
      console.error('Error processing blockchain query:', err);
      setError('Failed to process query. Please try again.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [onQueryGenerated]);

  // Process the current input query
  const processCurrentQuery = useCallback(async () => {
    if (!inputQuery.trim()) {
      toast.error('Please enter a query');
      return null;
    }
    
    return processQuery(inputQuery);
  }, [inputQuery, processQuery]);

  // Validate a query without processing it
  const validateQuery = useCallback((query: string) => {
    if (!query.trim()) return false;
    return isBlockchainQuery(query);
  }, []);

  return {
    inputQuery,
    setInputQuery,
    isProcessing,
    structuredQuery,
    error,
    processQuery,
    processCurrentQuery,
    validateQuery,
  };
} 