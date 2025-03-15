import { AgentService } from './services/agent-service';
import { AgentMode, SelectedNode } from './types';

/**
 * Example of using the AgentKit package
 */
async function main() {
  // Initialize the AgentService
  const agentService = new AgentService(process.env.COINBASE_API_KEY);
  
  console.log('AgentKit Example');
  console.log('----------------');
  
  // Example 1: Get token information
  const tokenAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
  const chainId = 8453; // Base chain ID
  
  console.log(`\nExample 1: Getting token information for ${tokenAddress} on chain ${chainId}`);
  try {
    const token = await agentService.getToken(tokenAddress, chainId);
    console.log('Token information:');
    console.log(token);
  } catch (error) {
    console.error('Error getting token information:', error);
  }
  
  // Example 2: Process a node selection
  const selectedNode: SelectedNode = {
    id: tokenAddress,
    label: 'USDC',
    type: 'contract',
    tokenAddress,
    chainId
  };
  
  const userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Example user address
  
  console.log(`\nExample 2: Processing node selection for ${selectedNode.label}`);
  try {
    const action = await agentService.processNodeSelection(selectedNode, userAddress);
    console.log('Action:');
    console.log(action);
  } catch (error) {
    console.error('Error processing node selection:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error running example:', error);
      process.exit(1);
    });
}

export { main }; 