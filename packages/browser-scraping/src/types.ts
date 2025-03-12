import { z } from 'zod';

// Explorer types
export const ExplorerCategorySchema = z.enum([
  'crosschain-txn',
  'intent-bridge',
  'intel-txn',
  'chain-explorer'
]);

export type ExplorerCategory = z.infer<typeof ExplorerCategorySchema>;

export const ChainExplorerSchema = z.object({
  project_name: z.string(),
  explorer_url: z.string().url(),
  category: ExplorerCategorySchema,
  chain: z.string().optional()
});

export type ChainExplorer = z.infer<typeof ChainExplorerSchema>;

// Transaction data types
export const TransactionSchema = z.object({
  hash: z.string(),
  timestamp: z.string(),
  from: z.string().optional(),
  to: z.string().optional(),
  value: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  details: z.record(z.string(), z.any()).optional()
});

export type Transaction = z.infer<typeof TransactionSchema>;

// Input types
export const ScrapingInputSchema = z.object({
  address: z.string(),
  chain: z.string(),
  category: ExplorerCategorySchema.optional().default('chain-explorer'),
  limit: z.number().optional().default(10)
});

export type ScrapingInput = z.infer<typeof ScrapingInputSchema>;

// Output types
export const ScrapingResultSchema = z.object({
  explorer: ChainExplorerSchema,
  transactions: z.array(TransactionSchema),
  metadata: z.object({
    total: z.number(),
    scraped: z.number(),
    timestamp: z.string()
  })
});

export type ScrapingResult = z.infer<typeof ScrapingResultSchema>; 