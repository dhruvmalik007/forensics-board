import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeatureVisualization } from './feature-visualization';
import { TokenHolderAnalysis } from './token-holder-analysis';
import { ConnectionExplorer } from './connection-explorer';

export function FeatureModule() {
  const [activeTab, setActiveTab] = useState('features');
  
  return (
    <div className="w-full space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="features">Features Overview</TabsTrigger>
          <TabsTrigger value="token-holders">Token Holders</TabsTrigger>
          <TabsTrigger value="connections">Connection Explorer</TabsTrigger>
        </TabsList>
        
        <TabsContent value="features" className="mt-4">
          <FeatureVisualization />
        </TabsContent>
        
        <TabsContent value="token-holders" className="mt-4">
          <TokenHolderAnalysis />
        </TabsContent>
        
        <TabsContent value="connections" className="mt-4">
          <ConnectionExplorer />
        </TabsContent>
      </Tabs>
    </div>
  );
} 