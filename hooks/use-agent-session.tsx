'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface AgentSession {
  id: string;
  userId: string;
  chatId: string;
  agentType: string;
  startedAt: string;
  endedAt?: string;
  status: 'active' | 'completed' | 'failed';
  metadata?: any;
}

interface AgentExecutionLog {
  id: string;
  agentSessionId: string;
  stepId: string;
  stepName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message?: string;
  timestamp: string;
  metadata?: any;
}

interface UseAgentSessionProps {
  privyDID: string;
  chatId: string;
}

export function useAgentSession({ privyDID, chatId }: UseAgentSessionProps) {
  const [session, setSession] = useState<AgentSession | null>(null);
  const [logs, setLogs] = useState<AgentExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new agent session
  const createSession = useCallback(async (agentType: string, metadata?: any) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/agents/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          privyDID,
          chatId,
          agentType,
          metadata
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create agent session');
      }

      const data = await response.json();
      
      if (data.success && data.session) {
        setSession(data.session);
        return data.session;
      }
      
      throw new Error('Failed to create agent session');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create agent session';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [privyDID, chatId]);

  // Update agent session status
  const updateSessionStatus = useCallback(async (
    sessionId: string, 
    status: 'active' | 'completed' | 'failed',
    metadata?: any
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/agents/session', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          status,
          metadata
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update agent session status');
      }

      const data = await response.json();
      
      if (data.success) {
        // Update the local session state
        setSession(prev => prev ? { ...prev, status, metadata: { ...prev.metadata, ...metadata } } : null);
        return true;
      }
      
      throw new Error('Failed to update agent session status');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update agent session status';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new agent execution log
  const createLog = useCallback(async (
    agentSessionId: string,
    stepId: string,
    stepName: string,
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    message?: string,
    metadata?: any
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/agents/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentSessionId,
          stepId,
          stepName,
          status,
          message,
          metadata
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create agent execution log');
      }

      const data = await response.json();
      
      if (data.success && data.log) {
        // Add the new log to the local logs state
        setLogs(prev => [...prev, data.log]);
        return data.log;
      }
      
      throw new Error('Failed to create agent execution log');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create agent execution log';
      setError(errorMessage);
      console.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get agent execution logs by session ID
  const getLogs = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/agents/logs?sessionId=${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get agent execution logs');
      }

      const data = await response.json();
      
      if (data.success && data.logs) {
        setLogs(data.logs);
        return data.logs;
      }
      
      throw new Error('Failed to get agent execution logs');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get agent execution logs';
      setError(errorMessage);
      console.error(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper function to track agent progress
  const trackAgentProgress = useCallback(async (
    sessionId: string,
    stepId: string,
    stepName: string,
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    message?: string,
    metadata?: any
  ) => {
    // Create a log entry
    await createLog(sessionId, stepId, stepName, status, message, metadata);
    
    // If the status is 'completed' or 'failed', update the session status
    if (status === 'completed' || status === 'failed') {
      await updateSessionStatus(sessionId, status === 'completed' ? 'completed' : 'failed', metadata);
    }
  }, [createLog, updateSessionStatus]);

  return {
    session,
    logs,
    isLoading,
    error,
    createSession,
    updateSessionStatus,
    createLog,
    getLogs,
    trackAgentProgress
  };
} 