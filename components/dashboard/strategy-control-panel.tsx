'use client';

import React from 'react';
import { Play, Pause, X, MoveUp, MoveDown } from 'lucide-react';

export type Strategy = {
  id: string;
  baseId?: string; // Original strategy ID for API mapping
  name: string;
  description: string;
  status: 'idle' | 'queued' | 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  discoveredAddresses?: number;
  results?: any;
};

type StrategyControlPanelProps = {
  strategies: Strategy[];
  onStartStrategy: (id: string) => void;
  onPauseStrategy: (id: string) => void;
  onRemoveStrategy: (id: string) => void;
  onMoveStrategy: (id: string, direction: 'up' | 'down') => void;
};

export function StrategyControlPanel({
  strategies,
  onStartStrategy,
  onPauseStrategy,
  onRemoveStrategy,
  onMoveStrategy,
}: StrategyControlPanelProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 h-full overflow-hidden flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Strategy Control Panel</h2>
      
      {strategies.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          <p>No active strategies. Start an investigation to add strategies to the queue.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3">
          {strategies.map((strategy, index) => (
            <div 
              key={strategy.id}
              className={`border rounded-lg p-3 ${
                strategy.status === 'running' 
                  ? 'border-blue-600 bg-blue-900/20' 
                  : strategy.status === 'completed'
                    ? 'border-green-600 bg-green-900/20'
                    : strategy.status === 'failed'
                      ? 'border-red-600 bg-red-900/20'
                      : 'border-gray-700 bg-gray-800/50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{strategy.name}</h3>
                <div className="flex space-x-1">
                  {index > 0 && strategy.status === 'queued' && (
                    <button
                      onClick={() => onMoveStrategy(strategy.id, 'up')}
                      className="p-1 text-gray-400 hover:text-white rounded"
                      aria-label="Move up"
                    >
                      <MoveUp size={16} />
                    </button>
                  )}
                  
                  {index < strategies.length - 1 && strategy.status === 'queued' && (
                    <button
                      onClick={() => onMoveStrategy(strategy.id, 'down')}
                      className="p-1 text-gray-400 hover:text-white rounded"
                      aria-label="Move down"
                    >
                      <MoveDown size={16} />
                    </button>
                  )}
                  
                  {(strategy.status === 'queued' || strategy.status === 'paused') && (
                    <button
                      onClick={() => onStartStrategy(strategy.id)}
                      className="p-1 text-green-400 hover:text-green-300 rounded"
                      aria-label="Start strategy"
                    >
                      <Play size={16} />
                    </button>
                  )}
                  
                  {strategy.status === 'running' && (
                    <button
                      onClick={() => onPauseStrategy(strategy.id)}
                      className="p-1 text-yellow-400 hover:text-yellow-300 rounded"
                      aria-label="Pause strategy"
                    >
                      <Pause size={16} />
                    </button>
                  )}
                  
                  <button
                    onClick={() => onRemoveStrategy(strategy.id)}
                    className="p-1 text-red-400 hover:text-red-300 rounded"
                    aria-label="Remove strategy"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-400 mb-2">{strategy.description}</p>
              
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    strategy.status === 'completed' 
                      ? 'bg-green-600' 
                      : strategy.status === 'failed'
                        ? 'bg-red-600'
                        : 'bg-blue-600'
                  }`}
                  style={{ width: `${strategy.progress}%` }}
                ></div>
              </div>
              
              <div className="mt-2 flex justify-between text-xs text-gray-400">
                <span>
                  {strategy.status === 'running' && 'Running...'}
                  {strategy.status === 'queued' && 'Queued'}
                  {strategy.status === 'paused' && 'Paused'}
                  {strategy.status === 'completed' && 'Completed'}
                  {strategy.status === 'failed' && 'Failed'}
                  {strategy.status === 'idle' && 'Idle'}
                </span>
                <span>{strategy.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
