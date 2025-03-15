import { logger } from '../../../lib/utils';

export enum BlockchainType {
  ETHEREUM = 'ethereum',
  BITCOIN = 'bitcoin',
  SOLANA = 'solana',
  TRON = 'tron',
  UNKNOWN = 'unknown'
}

export class AddressTypeDetector {
  /**
   * Detect blockchain type from address format
   * @param address The blockchain address to analyze
   * @returns BlockchainType enum value
   */
  static detectBlockchainType(address: string): BlockchainType {
    // Trim the address and remove any whitespace
    address = address.trim();
    
    // Ethereum address: 0x followed by 40 hex characters
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return BlockchainType.ETHEREUM;
    }
    
    // Bitcoin address: Starts with 1, 3, or bc1
    if (/^(1|3|bc1)[a-zA-Z0-9]{25,90}$/.test(address)) {
      return BlockchainType.BITCOIN;
    }
    
    // Solana address: Base58 encoded string, typically 32-44 characters
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) && !address.includes('0x')) {
      return BlockchainType.SOLANA;
    }
    
    // Tron address: Starts with T followed by 33 Base58 characters
    if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) {
      return BlockchainType.TRON;
    }
    
    return BlockchainType.UNKNOWN;
  }
  
  /**
   * Get available strategies for a blockchain type
   * @param blockchainType The blockchain type
   * @returns Array of available strategy names
   */
  static getAvailableStrategies(blockchainType: BlockchainType): string[] {
    switch (blockchainType) {
      case BlockchainType.ETHEREUM:
        return [
          'erc20-transfers',
          'erc721-transfers',
          'bidirectional-transfers',
          'recursive-funding',
          'lp-position-transfers',
          'safe-signer-extensions',
          'address-clustering',
          'transaction-pattern',
          'flow-of-funds',
          'anomaly-detection',
        ];
      
      case BlockchainType.BITCOIN:
        return [
          'bidirectional-transfers',
          'recursive-funding',
          'address-clustering',
          'transaction-pattern',
          'flow-of-funds',
          'anomaly-detection',
        ];
      
      case BlockchainType.SOLANA:
        return [
          'spl-token-transfers',
          'bidirectional-transfers',
          'recursive-funding',
          'address-clustering',
          'transaction-pattern',
          'flow-of-funds',
        ];
      
      case BlockchainType.TRON:
        return [
          'trc20-transfers',
          'bidirectional-transfers',
          'recursive-funding',
          'address-clustering',
          'transaction-pattern',
          'flow-of-funds',
        ];
      
      default:
        return [];
    }
  }
}