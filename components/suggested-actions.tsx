'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { ChatRequestOptions, CreateMessage, Message } from 'ai';
import { memo } from 'react';
import { ArrowRight, Zap, Globe, ArrowLeftRight, Workflow, User, Building, Coins, Wallet } from 'lucide-react';

interface SuggestedActionsProps {
  chatId: string;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
}

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  // Cross-chain transaction analysis examples with notable addresses
  const suggestedActions = [
    {
      title: 'Vitalik Buterin',
      label: 'Analyze Ethereum founder\'s transactions',
      action: 'Show me the transactions for 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on ethereum including cross-chain transactions',
      category: 'crosschain-txn',
      icon: <User className="h-5 w-5 text-blue-400" />,
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
    },
    {
      title: 'Binance Hot Wallet',
      label: 'Track Binance exchange transactions via LayerZero',
      action: 'Show me the transactions for 0x28C6c06298d514Db089934071355E5743bf21d60 on ethereum including cross-chain transactions via layerzero',
      category: 'crosschain-txn',
      icon: <Building className="h-5 w-5 text-yellow-400" />,
      color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
    },
    {
      title: 'Coinbase',
      label: 'Analyze Coinbase exchange wallet activity',
      action: 'Show me the transactions for 0x503828976D22510aad0201ac7EC88293211D23Da on ethereum including cross-chain transactions',
      category: 'crosschain-txn',
      icon: <Coins className="h-5 w-5 text-green-400" />,
      color: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    },
    {
      title: 'Uniswap',
      label: 'Explore Uniswap protocol transactions',
      action: 'Show me the transactions for 0x1a9C8182C09F50C8318d769245beA52c32BE35BC on ethereum including cross-chain transactions',
      category: 'crosschain-txn',
      icon: <Wallet className="h-5 w-5 text-pink-400" />,
      color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
    },
    {
      title: 'Polygon Bridge',
      label: 'Analyze cross-chain activity via Polygon Bridge',
      action: 'Show me the transactions for 0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b on ethereum including cross-chain transactions to polygon',
      category: 'crosschain-txn',
      icon: <Globe className="h-5 w-5 text-purple-400" />,
      color: 'from-purple-500/20 to-blue-500/20 border-purple-500/30',
    },
    {
      title: 'LayerZero Transactions',
      label: 'Track transactions via LayerZero protocol',
      action: 'Show me the transactions for 0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b on ethereum including cross-chain transactions via layerzero',
      category: 'crosschain-txn',
      icon: <Zap className="h-5 w-5 text-green-400" />,
      color: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    },
    {
      title: 'Stargate Bridge Activity',
      label: 'Analyze Stargate Finance bridge transactions',
      action: 'Show me the transactions for 0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b on ethereum including cross-chain transactions via stargate',
      category: 'crosschain-txn',
      icon: <ArrowLeftRight className="h-5 w-5 text-blue-400" />,
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    },
    {
      title: 'Wormhole Transfers',
      label: 'Track assets moving through Wormhole',
      action: 'Show me the transactions for 0x35FEcd342124CA5d1B4E8E480eC5b55DA5759f7b on ethereum including cross-chain transactions via wormhole',
      category: 'crosschain-txn',
      icon: <Workflow className="h-5 w-5 text-amber-400" />,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    },
  ];

  const handleActionClick = async (action: string, category: string) => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    // Show loading toast
    const loadingToast = document.createElement('div');
    loadingToast.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50';
    loadingToast.textContent = 'Starting blockchain transaction analysis...';
    document.body.appendChild(loadingToast);
    
    // Append the message to the chat
    await append({
      role: 'user',
      content: action,
    });
    
    // Remove the loading toast after a delay
    setTimeout(() => {
      document.body.removeChild(loadingToast);
    }, 3000);
  };

  return (
    <div
      data-testid="suggested-actions"
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
        >
          <button
            onClick={() => handleActionClick(suggestedAction.action, suggestedAction.category)}
            className={`text-left rounded-xl px-4 py-4 text-sm w-full h-auto flex flex-col bg-gradient-to-br ${suggestedAction.color} border hover:bg-opacity-80 transition-all duration-200 hover:shadow-md`}
          >
            <div className="flex items-center gap-2 mb-2">
              {suggestedAction.icon}
              <span className="font-semibold text-white">{suggestedAction.title}</span>
            </div>
            <span className="text-gray-300 text-xs mb-3">
              {suggestedAction.label}
            </span>
            <div className="flex items-center text-xs text-blue-300 mt-auto">
              <span>Run query</span>
              <ArrowRight size={12} className="ml-1" />
            </div>
          </button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
