import { z } from 'zod';

// Token types
export const TokenSchema = z.object({
  address: z.string(),
  symbol: z.string(),
  name: z.string(),
  decimals: z.number(),
  chainId: z.number(),
  logoURI: z.string().optional(),
  price: z.number().optional(),
  priceChange24h: z.number().optional()
});

export type Token = z.infer<typeof TokenSchema>;

// Swap types
export const SwapRouteSchema = z.object({
  protocol: z.string(),
  fromToken: TokenSchema,
  toToken: TokenSchema,
  fromAmount: z.string(),
  toAmount: z.string(),
  priceImpact: z.number().optional(),
  estimatedGas: z.string().optional(),
  gasCost: z.string().optional()
});

export type SwapRoute = z.infer<typeof SwapRouteSchema>;

export const SwapQuoteSchema = z.object({
  routes: z.array(SwapRouteSchema),
  bestRoute: SwapRouteSchema,
  fromToken: TokenSchema,
  toToken: TokenSchema,
  fromAmount: z.string(),
  toAmount: z.string(),
  estimatedGas: z.string()
});

export type SwapQuote = z.infer<typeof SwapQuoteSchema>;

// Transaction types
export const TransactionSchema = z.object({
  to: z.string(),
  data: z.string(),
  value: z.string(),
  gasLimit: z.string().optional(),
  chainId: z.number()
});

export type Transaction = z.infer<typeof TransactionSchema>;

// Agent mode types
export enum AgentMode {
  NORMAL = 'normal',
  AGENT = 'agent'
}

export const AgentActionSchema = z.object({
  type: z.enum(['swap', 'approve', 'transfer', 'stake', 'unstake']),
  params: z.record(z.string(), z.any())
});

export type AgentAction = z.infer<typeof AgentActionSchema>;

// Node selection types
export const SelectedNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string(),
  tokenAddress: z.string().optional(),
  chainId: z.number().optional()
});

export type SelectedNode = z.infer<typeof SelectedNodeSchema>; 