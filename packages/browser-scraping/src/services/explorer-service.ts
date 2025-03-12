import { ChainExplorer, ExplorerCategory } from '../types';
import explorers from '../data/chain-explorer-lists.json';

export class ExplorerService {
  private explorers: ChainExplorer[];

  constructor() {
    this.explorers = explorers as ChainExplorer[];
  }

  /**
   * Find an explorer by chain and category
   */
  findExplorer(chain: string, category: ExplorerCategory = 'chain-explorer'): ChainExplorer | undefined {
    // First try to find an exact match for chain and category
    const exactMatch = this.explorers.find(
      (explorer) => 
        explorer.category === category && 
        explorer.chain?.toLowerCase() === chain.toLowerCase()
    );

    if (exactMatch) {
      return exactMatch;
    }

    // If no exact match, try to find any explorer in the category
    if (category !== 'chain-explorer') {
      return this.explorers.find((explorer) => explorer.category === category);
    }

    // If still no match, return undefined
    return undefined;
  }

  /**
   * Get all explorers by category
   */
  getExplorersByCategory(category: ExplorerCategory): ChainExplorer[] {
    return this.explorers.filter((explorer) => explorer.category === category);
  }

  /**
   * Get all available chains
   */
  getAvailableChains(): string[] {
    return this.explorers
      .filter((explorer) => explorer.chain)
      .map((explorer) => explorer.chain as string)
      .filter((chain, index, self) => self.indexOf(chain) === index);
  }

  /**
   * Get all available categories
   */
  getAvailableCategories(): ExplorerCategory[] {
    return this.explorers
      .map((explorer) => explorer.category)
      .filter((category, index, self) => self.indexOf(category) === index) as ExplorerCategory[];
  }
} 