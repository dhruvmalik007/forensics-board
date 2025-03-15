import { runDuneQuery } from '@/app/utils/DuneClient';
import { RunQueryArgs, QueryParameter } from "@duneanalytics/client-sdk";

// Define the types for the strategy
export interface DuneStrategyRequest {
  addresses: string[];
  analysis_type: string;
}

export interface WalletRelationship {
  observed_wallet_address: string;
  produced_wallet_address: string;
  analysis_type: string;
  proofs?: string[];
}

/**
 * Execute the Dune-based strategy
 * 
 * This function:
 * - Maps analysis types to Dune query IDs
 * - Processes each address with the appropriate Dune query
 * - Returns relationships between observed and produced wallet addresses
 * 
 * @param params - The parameters for the Dune-based strategy
 * @returns An array of wallet relationships
 */
export async function executeDuneStrategy(params: DuneStrategyRequest): Promise<WalletRelationship[]> {
  const { addresses, analysis_type } = params;
  
  // Map of analysis types to Dune query IDs
  const analysisTypeToQueryId: Record<string, number> = {
    'bidirectional_transfers': 4777210,
    'founding_address': 4777803
  };
  
  // Check if the analysis type is supported
  const queryId = analysisTypeToQueryId[analysis_type];
  if (!queryId) {
    return [];
  }
  
  try {
    // Process each address with the Dune query
    const relationshipsPromises = addresses.map(async (address) => {
      try {
        // Create query parameters using QueryParameter class
        const queryParameters = [
          QueryParameter.text("wallet_address", address)
        ];
        
        // Prepare query arguments with the address as a parameter
        const queryArgs: RunQueryArgs = {
          queryId: queryId,
          query_parameters: queryParameters
        };
        
        // Run the Dune query for this address
        const response = await runDuneQuery(queryArgs);
        
        const relationships: WalletRelationship[] = [];
        
        // Extract the related addresses from the response
        if (response?.result?.rows) {
          // Extract addresses and proofs from the result rows
          for (const row of response.result.rows) {
            if (row.address) {
              const relationship: WalletRelationship = {
                observed_wallet_address: address,
                produced_wallet_address: row.address as string,
                analysis_type
              };
              
              // Extract proofs if available
              if (row.proofs) {
                // Handle different formats of proofs from Dune
                if (Array.isArray(row.proofs)) {
                  relationship.proofs = row.proofs as string[];
                } else if (typeof row.proofs === 'string') {
                  // If proofs is a comma-separated string, split it
                  relationship.proofs = (row.proofs as string).split(',').map(p => p.trim());
                }
              }
              
              relationships.push(relationship);
            }
          }
        }
        
        return relationships;
      } catch (error) {
        // Return empty array if there's an error
        return [];
      }
    });
    
    // Wait for all queries to complete
    const nestedRelationships = await Promise.all(relationshipsPromises);
    
    // Flatten the nested array of relationships
    const result = nestedRelationships.flat();
    
    return result;
    
  } catch (error) {
    // Return empty array if there's an error
    return [];
  }
}

/**
 * Determine if this strategy can handle the given analysis type
 * 
 * @param analysisType - The analysis type from the request
 * @returns true if this strategy can handle the analysis type
 */
export function canHandleAnalysisType(analysisType: string): boolean {
  const supportedTypes = [
    'bidirectional_transfers',
    'founding_address'
  ];
  
  return supportedTypes.includes(analysisType);
}