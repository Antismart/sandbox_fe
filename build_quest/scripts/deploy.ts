// Contract deployment script for Base Sepolia
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function deployQuestBoard() {
  console.log('🚀 Deploying QuestBoard to Base Sepolia...');
  
  try {
    // Build the contract first
    console.log('📦 Building contract...');
    const buildResult = await execAsync('forge build', { 
      cwd: path.join(process.cwd(), 'contract/BuildQuest') 
    });
    console.log('✅ Contract built successfully');

    // Deploy the contract
    console.log('🔗 Deploying to Base Sepolia...');
    const deployCmd = `forge create --rpc-url https://sepolia.base.org --private-key ${process.env.PRIVATE_KEY} src/QuestBoard.sol:QuestBoard`;
    
    const deployResult = await execAsync(deployCmd, { 
      cwd: path.join(process.cwd(), 'contract/BuildQuest') 
    });
    
    // Extract contract address from output
    const output = deployResult.stdout;
    const addressMatch = output.match(/Deployed to: (0x[a-fA-F0-9]{40})/);
    
    if (!addressMatch) {
      throw new Error('Could not extract contract address from deployment output');
    }

    const contractAddress = addressMatch[1];
    console.log(`✅ QuestBoard deployed to: ${contractAddress}`);

    // Update .env.local with the contract address
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = `NEXT_PUBLIC_QUEST_BOARD_ADDRESS=${contractAddress}\n`;
    
    await fs.writeFile(envPath, envContent);
    console.log('✅ Contract address saved to .env.local');

    // Verify the contract (optional)
    if (process.env.BASESCAN_API_KEY) {
      console.log('🔍 Verifying contract...');
      const verifyCmd = `forge verify-contract ${contractAddress} src/QuestBoard.sol:QuestBoard --chain-id 84532 --etherscan-api-key ${process.env.BASESCAN_API_KEY}`;
      
      try {
        await execAsync(verifyCmd, { 
          cwd: path.join(process.cwd(), 'contract/BuildQuest') 
        });
        console.log('✅ Contract verified successfully');
      } catch (verifyError) {
        console.log('⚠️ Contract verification failed (this is optional)');
      }
    }

    return contractAddress;
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

// Run deployment if called directly
if (require.main === module) {
  deployQuestBoard()
    .then(address => {
      console.log(`\n🎉 Deployment complete!`);
      console.log(`📍 Contract Address: ${address}`);
      console.log(`🌐 View on BaseScan: https://sepolia.basescan.org/address/${address}`);
    })
    .catch(error => {
      console.error('Deployment failed:', error);
      process.exit(1);
    });
}

export { deployQuestBoard };
