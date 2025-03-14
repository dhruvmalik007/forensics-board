'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface BlockchainExploration {
  id: string;
  userId: string;
  documentId: string;
  query: string;
  address?: string;
  network?: string;
  createdAt: string;
  completedAt?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results?: any;
}

interface UseBlockchainExplorationProps {
  privyDID: string;
}

export function useBlockchainExploration({ privyDID }: UseBlockchainExplorationProps) {
  const [explorations, setExplorations] = useState<BlockchainExploration[]>([]);
  const [currentExploration, setCurrentExploration] = useState<BlockchainExploration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new blockchain exploration
  const createExploration = useCallback(async (
    documentId: string,
    query: string,
    address?: string,
    network?: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/blockchain/exploration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          privyDID,
          documentId,
          query,
          address,
          network
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create blockchain exploration');
      }

      const data = await response.json();
      
      if (data.success && data.exploration) {
        setCurrentExploration(data.exploration);
        setExplorations(prev => [data.exploration, ...prev]);
        return data.exploration;
      }
      
      throw new Error('Failed to create blockchain exploration');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create blockchain exploration';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [privyDID]);

  // Update blockchain exploration status
  const updateExplorationStatus = useCallback(async (
    id: string,
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    results?: any
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/blockchain/exploration', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          status,
          results
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update blockchain exploration status');
      }

      const data = await response.json();
      
      if (data.success) {
        // Update the local exploration states
        const updatedExploration = { 
          ...currentExploration, 
          status, 
          results: results || currentExploration?.results,
          completedAt: status === 'completed' || status === 'failed' ? new Date().toISOString() : currentExploration?.completedAt
        };
        
        setCurrentExploration(updatedExploration as BlockchainExploration);
        
        setExplorations(prev => 
          prev.map(exp => exp.id === id ? {
            ...exp,
            status,
            results: results || exp.results,
            completedAt: status === 'completed' || status === 'failed' ? new Date().toISOString() : exp.completedAt
          } : exp)
        );
        
        return true;
      }
      
      throw new Error('Failed to update blockchain exploration status');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update blockchain exploration status';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentExploration]);

  // Get blockchain explorations by user ID
  const getExplorations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/blockchain/exploration?privyDID=${privyDID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get blockchain explorations');
      }

      const data = await response.json();
      
      if (data.success && data.explorations) {
        setExplorations(data.explorations);
        return data.explorations;
      }
      
      throw new Error('Failed to get blockchain explorations');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get blockchain explorations';
      setError(errorMessage);
      console.error(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [privyDID]);

  // Helper function to track blockchain exploration progress
  const trackExplorationProgress = useCallback(async (
    id: string,
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    results?: any
  ) => {
    return await updateExplorationStatus(id, status, results);
  }, [updateExplorationStatus]);

  return {
    explorations,
    currentExploration,
    isLoading,
    error,
    createExploration,
    updateExplorationStatus,
    getExplorations,
    trackExplorationProgress
  };
} 