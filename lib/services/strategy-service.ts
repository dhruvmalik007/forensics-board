'use client';

import { NodeType } from '@/lib/mock-data';

export type AnalysisMode = 'bidirectional_transfers' | 'funding_address';

export type StrategyResponseItem = {
  observed_wallet_address: string;
  produced_wallet_address: string;
  strategy_key: AnalysisMode;
  proofs: string;
};

export type StrategyResponse = {
  status: 'success' | 'failure';
  data: StrategyResponseItem[];
};

export type Node = {
  id: string;
  label: string;
  type: NodeType;
  x?: number;
  y?: number;
};

export type Edge = {
  id: string;
  source: string;
  target: string;
  type: 'token_transfer' | 'nft_transfer' | 'bridge_transaction' | 'liquidity_provision';
};

/**
 * Executes a strategy with the given addresses and analysis mode
 */
export const runStrategy = async (
  addresses: string[],
  analysisMode: AnalysisMode
): Promise<StrategyResponse> => {
  if (analysisMode !== 'bidirectional_transfers' && analysisMode !== 'funding_address') {
    throw new Error('Unsupported analysis mode');
  }

  try {
    const response = await fetch('/api/run-strategy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        addresses,
        strategy_key: analysisMode,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error executing strategy:', error);
    return {
      status: 'failure',
      data: [],
    };
  }
};

/**
 * Processes the API response and returns new nodes and edges
 */
export const processStrategyResponse = (
  response: StrategyResponse,
  existingNodes: Node[]
): { newNodes: Node[]; newEdges: Edge[] } => {
  if (response.status !== 'success' || !response.data.length) {
    return { newNodes: [], newEdges: [] };
  }

  const existingNodeIds = new Set(existingNodes.map((node) => node.id));
  const newNodes: Node[] = [];
  const newEdges: Edge[] = [];

  response.data.forEach((item) => {
    // Only add nodes that don't already exist
    if (!existingNodeIds.has(item.produced_wallet_address)) {
      newNodes.push({
        id: item.produced_wallet_address,
        label: item.produced_wallet_address,
        type: 'alt_wallet', // Default type, can be refined based on additional data
      });
    }

    // Create edge based on the proof
    const edgeId = `${item.observed_wallet_address}-${item.produced_wallet_address}`;
    
    // Determine edge type based on strategy_key
    const edgeType = item.strategy_key === 'bidirectional_transfers' 
      ? 'token_transfer' 
      : 'liquidity_provision';
    
    newEdges.push({
      id: edgeId,
      source: item.observed_wallet_address,
      target: item.produced_wallet_address,
      type: edgeType,
    });
  });

  return { newNodes, newEdges };
};
