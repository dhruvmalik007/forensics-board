'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePrivyAuth } from '@/hooks/use-privy-auth';
import { useState } from 'react';
import { SelfVerification } from '@/components/self-verification';
import { toast } from 'sonner';

interface PricingTierProps {
  title: string;
  description: string;
  price: string;
  features: Array<{
    text: string;
    included: boolean;
  }>;
  buttonText: string;
  onButtonClick: () => void;
  highlighted?: boolean;
  badge?: string;
}

const PricingTier = ({
  title,
  description,
  price,
  features,
  buttonText,
  onButtonClick,
  highlighted = false,
  badge,
}: PricingTierProps) => {
  return (
    <Card className={cn(
      "flex flex-col h-full",
      highlighted ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-gray-700"
    )}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{title}</CardTitle>
            <CardDescription className="mt-2">{description}</CardDescription>
          </div>
          {badge && (
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
              {badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-6">
          <span className="text-3xl font-bold">{price}</span>
          {price !== 'Free' && <span className="text-sm text-gray-400 ml-2">/month</span>}
        </div>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <div className="mr-2 mt-1">
                {feature.included ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <X className="h-5 w-5 text-gray-500" />
                )}
              </div>
              <div className="flex flex-col">
                <span className={cn(
                  "text-sm",
                  feature.included ? "text-gray-200" : "text-gray-500 line-through"
                )}>
                  {feature.text}
                </span>
                <span className="text-xs text-gray-500 mt-0.5">
                  {getFeatureDescription(feature.text)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <button
          onClick={onButtonClick}
          className={cn(
            "w-full py-2 rounded-lg font-medium transition-colors",
            highlighted
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-800 hover:bg-gray-700 text-white"
          )}
        >
          {buttonText}
        </button>
      </CardFooter>
    </Card>
  );
};

// Helper function to get descriptions for features
function getFeatureDescription(featureText: string): string {
  switch (featureText) {
    case "Basic blockchain address analysis":
      return "View basic transaction data for any address";
    case "Limited transaction history (10 transactions)":
      return "Access to the 10 most recent transactions";
    case "Single chain analysis":
      return "Analyze transactions on one blockchain at a time";
    case "Basic visualization tools":
      return "Simple charts and data visualization";
    case "Cross-chain analysis":
      return "Track transactions across multiple blockchains";
    case "Advanced pattern detection":
      return "Identify suspicious patterns and anomalies";
    case "Unlimited transaction history":
      return "Access complete transaction history";
    case "Priority support":
      return "Get faster responses to your support requests";
    default:
      return "";
  }
}

export function PricingBanner({ onFreemiumClick }: { 
  onFreemiumClick: () => void;
}) {
  const { authenticated, user, login } = usePrivyAuth();
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  
  // For demo purposes, we'll check if the user has a wallet connected as a proxy for verification
  // In a real implementation, we would check a verified flag in the user's metadata
  const isVerified = authenticated && user?.wallet?.address ? true : false;
  
  const handleVerifyClick = async () => {
    if (!authenticated) {
      toast.info("Please sign in first to verify your identity");
      await login();
      return;
    }
    
    setIsVerificationOpen(true);
  };
  
  const freemiumFeatures = [
    { text: "Basic blockchain address analysis", included: true },
    { text: "Limited transaction history (10 transactions)", included: true },
    { text: "Single chain analysis", included: true },
    { text: "Basic visualization tools", included: true },
    { text: "Cross-chain analysis", included: false },
    { text: "Advanced pattern detection", included: false },
    { text: "Unlimited transaction history", included: false },
    { text: "Priority support", included: false },
  ];

  const verifiedFeatures = [
    { text: "Basic blockchain address analysis", included: true },
    { text: "Limited transaction history (10 transactions)", included: true },
    { text: "Single chain analysis", included: true },
    { text: "Basic visualization tools", included: true },
    { text: "Cross-chain analysis", included: true },
    { text: "Advanced pattern detection", included: true },
    { text: "Unlimited transaction history", included: true },
    { text: "Priority support", included: true },
  ];

  return (
    <div className="py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Get started with our freemium plan or verify your identity with Self Protocol for full access to all features.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <PricingTier
          title="Freemium"
          description="Basic access to blockchain analysis tools"
          price="Free"
          features={freemiumFeatures}
          buttonText="Testing with Freemium Features"
          onButtonClick={onFreemiumClick}
        />
        <PricingTier
          title="Verified Account"
          description="Full access to all blockchain analysis tools"
          price="Free"
          features={verifiedFeatures}
          buttonText={isVerified ? "Access Premium Features" : "Login and Verify using Self Protocol"}
          onButtonClick={isVerified ? onFreemiumClick : handleVerifyClick}
          highlighted={true}
          badge={isVerified ? "Verified" : "Recommended"}
        />
      </div>
      
      <SelfVerification 
        open={isVerificationOpen} 
        onOpenChange={setIsVerificationOpen} 
      />
    </div>
  );
} 