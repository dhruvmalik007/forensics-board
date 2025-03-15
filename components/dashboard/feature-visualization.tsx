import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type FeatureType = {
  name: string;
  description: string;
  backendServices: string[];
  status: 'available' | 'coming-soon' | 'in-development';
};

const features: FeatureType[] = [
  {
    name: 'Visualizing Token Holders',
    description: 'Identify and visualize all holders of a specific token or NFT collection',
    backendServices: ['Blockchain data indexing service', 'Data storage (database)'],
    status: 'available'
  },
  {
    name: 'Identifying Connections',
    description: 'Discover and map relationships between wallets through transaction history',
    backendServices: ['Graph database to store wallet interactions', 'Algorithm to detect fund transfers'],
    status: 'available'
  },
  {
    name: 'Big Bang (Historical Distribution)',
    description: 'Analyze the initial distribution of tokens from genesis to current holders',
    backendServices: ['Historical blockchain data archive', 'Time-series database'],
    status: 'in-development'
  },
  {
    name: 'Magic Nodes (AI Clustering)',
    description: 'Use AI to automatically cluster related addresses and identify patterns',
    backendServices: ['AI/ML model for address clustering', 'Large-scale data processing and analysis infrastructure'],
    status: 'coming-soon'
  },
  {
    name: 'Expand (Connection Explorer)',
    description: 'Interactively explore connections between addresses with real-time data',
    backendServices: ['Real-time blockchain data querying', 'Graph traversal algorithms'],
    status: 'available'
  },
  {
    name: 'Supply Auditing',
    description: 'Track and verify token supply across exchanges and wallets',
    backendServices: ['Aggregation of wallet balances', 'Identification of CEX and contract addresses'],
    status: 'coming-soon'
  }
];

export function FeatureVisualization() {
  return (
    <div className="w-full space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Forensics Features</h2>
      <p className="text-muted-foreground">
        Explore the available features and their underlying technologies
      </p>
      
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="in-development">In Development</TabsTrigger>
          <TabsTrigger value="coming-soon">Coming Soon</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features
              .filter(feature => feature.status === 'available')
              .map((feature, index) => (
                <FeatureCard key={index} feature={feature} />
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="in-development" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features
              .filter(feature => feature.status === 'in-development')
              .map((feature, index) => (
                <FeatureCard key={index} feature={feature} />
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="coming-soon" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features
              .filter(feature => feature.status === 'coming-soon')
              .map((feature, index) => (
                <FeatureCard key={index} feature={feature} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FeatureCard({ feature }: { feature: FeatureType }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{feature.name}</CardTitle>
          <StatusBadge status={feature.status} />
        </div>
        <CardDescription>{feature.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Backend Services:</h4>
          <ul className="space-y-1">
            {feature.backendServices.map((service, index) => (
              <li key={index} className="text-sm text-muted-foreground">
                • {service}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: FeatureType['status'] }) {
  const variants = {
    'available': 'bg-green-100 text-green-800 hover:bg-green-100',
    'in-development': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    'coming-soon': 'bg-amber-100 text-amber-800 hover:bg-amber-100'
  };
  
  const labels = {
    'available': 'Available',
    'in-development': 'In Development',
    'coming-soon': 'Coming Soon'
  };
  
  return (
    <Badge variant="outline" className={variants[status]}>
      {labels[status]}
    </Badge>
  );
} 