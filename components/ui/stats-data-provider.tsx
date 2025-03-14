import React, { createContext, useContext, ReactNode } from 'react';

// Define the types for our statistics data
export interface StatData {
  totalGraphs: {
    value: number;
    change: {
      value: string;
      positive: boolean;
    };
    subtitle: string;
  };
  transactionsMonitored: {
    value: string;
    change: {
      value: string;
      positive: boolean;
    };
    subtitle: string;
  };
  chainsSupported: {
    value: number;
    change: {
      value: string;
      positive: boolean;
    };
    subtitle: string;
  };
  activeUsers: {
    value: number;
    change: {
      value: string;
      positive: boolean;
    };
    subtitle: string;
  };
  chainDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  transactionActivity: Array<{
    date: string;
    tokenTransfers: number;
    crossChainActivity: number;
  }>;
}

// Create a context for our statistics data
const StatsContext = createContext<StatData | undefined>(undefined);

// Mock data for statistics
const mockStatsData: StatData = {
  totalGraphs: {
    value: 1248,
    change: {
      value: '+12.5%',
      positive: true,
    },
    subtitle: 'vs last month',
  },
  transactionsMonitored: {
    value: '3.2M',
    change: {
      value: '+18.2%',
      positive: true,
    },
    subtitle: 'vs last month',
  },
  chainsSupported: {
    value: 24,
    change: {
      value: '+4',
      positive: true,
    },
    subtitle: 'new this quarter',
  },
  activeUsers: {
    value: 8642,
    change: {
      value: '+22.5%',
      positive: true,
    },
    subtitle: 'vs last month',
  },
  chainDistribution: [
    { name: 'Ethereum', value: 312, color: '#627EEA' },
    { name: 'Polygon', value: 250, color: '#8247E5' },
    { name: 'Arbitrum', value: 187, color: '#28A0F0' },
    { name: 'Optimism', value: 125, color: '#FF0420' },
    { name: 'Others', value: 374, color: '#4D5562' },
  ],
  transactionActivity: [
    { date: 'Jan', tokenTransfers: 4000, crossChainActivity: 2400 },
    { date: 'Feb', tokenTransfers: 3000, crossChainActivity: 1398 },
    { date: 'Mar', tokenTransfers: 2000, crossChainActivity: 9800 },
    { date: 'Apr', tokenTransfers: 2780, crossChainActivity: 3908 },
    { date: 'May', tokenTransfers: 1890, crossChainActivity: 4800 },
    { date: 'Jun', tokenTransfers: 2390, crossChainActivity: 3800 },
    { date: 'Jul', tokenTransfers: 3490, crossChainActivity: 4300 },
  ],
};

interface StatsProviderProps {
  children: ReactNode;
  data?: StatData;
}

export function StatsProvider({ children, data = mockStatsData }: StatsProviderProps) {
  return <StatsContext.Provider value={data}>{children}</StatsContext.Provider>;
}

export function useStats() {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
} 