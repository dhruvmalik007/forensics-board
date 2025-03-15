import { z } from 'zod';

// Explorer types
export const ExplorerCategorySchema = z.enum([
  'EOAAddress',
  'ContractAddress',
  'TokenAddress',
]);

export type ExplorerCategory = z.infer<typeof ExplorerCategorySchema>;

// Address category types
export const AddressCategorySchema = z.enum([
  'main',
  'alt_wallet',
  'cex',
  'defi',
  'bridge',
  'mixer',
  'contract',
  'flagged',
  'unknown'
]);

export type AddressCategory = z.infer<typeof AddressCategorySchema>;

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

// Address data types
export const AddressInfoSchema = z.object({
  address: z.string(),
  category: AddressCategorySchema.optional(),
  tags: z.array(z.string()).optional(),
  label: z.string().optional(),
  balance: z.string().optional(),
  transactionCount: z.number().optional(),
  firstSeen: z.string().optional(),
  lastSeen: z.string().optional()
});

export type AddressInfo = z.infer<typeof AddressInfoSchema>;

// Input types
export const ScrapingInputSchema = z.object({
  address: z.string(),
  category: z.string().optional(),
});

export type ScrapingInput = z.infer<typeof ScrapingInputSchema>;

// Output types
export const ScrapingResultSchema = z.object({
  explorer: ChainExplorerSchema,
  transactions: z.array(TransactionSchema),
  addressInfo: AddressInfoSchema.optional(),
  relatedAddresses: z.array(AddressInfoSchema).optional(),
  metadata: z.object({
    total: z.number(),
    scraped: z.number(),
    timestamp: z.string()
  })
});

export type ScrapingResult = z.infer<typeof ScrapingResultSchema>; 