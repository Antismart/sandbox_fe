import { FlowClient } from '@microcrop/flow-client';
import { db } from '@microcrop/database';

export class BlockchainService {
  private flowClient: FlowClient;

  constructor() {
    this.flowClient = new FlowClient({
      accessNode: process.env.FLOW_ACCESS_NODE!,
      network: (process.env.FLOW_NETWORK as any) || 'testnet',
      privateKey: process.env.FLOW_PRIVATE_KEY!,
      contractAddress: process.env.FLOW_CONTRACT_ADDRESS!
    });
  }

  // Create policy on blockchain after database policy is created
  async createBlockchainPolicy(policyId: string): Promise<string> {
    try {
      const policy = await db.policy.findUnique({
        where: { id: policyId },
        include: { farmer: true }
      });

      if (!policy) {
        throw new Error('Policy not found');
      }

      // Calculate duration in seconds (6 months)
      const duration = 6 * 30 * 24 * 60 * 60; // 6 months in seconds

      const transactionId = await this.flowClient.createPolicy(
        policy.farmerId,
        policy.cropType,
        policy.coverageAmount / 100, // Convert from cents to dollars
        policy.premium / 100, // Convert from cents to dollars
        duration,
        process.env.FLOW_SIGNER_ADDRESS!
      );

      // Update policy with blockchain transaction ID
      await db.policy.update({
        where: { id: policyId },
        data: { flowPolicyId: transactionId }
      });

      console.log(`Policy ${policyId} created on blockchain: ${transactionId}`);
      return transactionId;

    } catch (error: any) {
      console.error('Blockchain policy creation error:', error);
      throw new Error(`Failed to create policy on blockchain: ${error.message}`);
    }
  }

  // Process claim payout on blockchain
  async processBlockchainClaim(claimId: string): Promise<string> {
    try {
      const claim = await db.claim.findUnique({
        where: { id: claimId },
        include: { policy: true }
      });

      if (!claim || !claim.policy.flowPolicyId) {
        throw new Error('Claim or blockchain policy not found');
      }

      const transactionId = await this.flowClient.processClaim(
        claim.policy.flowPolicyId,
        claim.payoutAmount / 100, // Convert from cents to dollars
        process.env.FLOW_SIGNER_ADDRESS!
      );

      console.log(`Claim ${claimId} processed on blockchain: ${transactionId}`);
      return transactionId;

    } catch (error: any) {
      console.error('Blockchain claim processing error:', error);
      throw new Error(`Failed to process claim on blockchain: ${error.message}`);
    }
  }

  // Submit weather data to blockchain oracle
  async submitWeatherDataToBlockchain(weatherDataId: string): Promise<string> {
    try {
      const weatherData = await db.weatherData.findUnique({
        where: { id: weatherDataId }
      });

      if (!weatherData) {
        throw new Error('Weather data not found');
      }

      const transactionId = await this.flowClient.submitWeatherData(
        weatherData.location,
        weatherData.temperature,
        weatherData.rainfall,
        weatherData.humidity || 0,
        weatherData.source
      );

      console.log(`Weather data ${weatherDataId} submitted to blockchain: ${transactionId}`);
      return transactionId;

    } catch (error: any) {
      console.error('Weather data blockchain submission error:', error);
      throw new Error(`Failed to submit weather data to blockchain: ${error.message}`);
    }
  }

  // Get pool statistics from blockchain
  async getPoolStats() {
    try {
      return await this.flowClient.getPoolStats();
    } catch (error: any) {
      console.error('Get pool stats error:', error);
      throw new Error(`Failed to get pool stats: ${error.message}`);
    }
  }

  // Sync blockchain policy with database
  async syncPolicyFromBlockchain(flowPolicyId: string): Promise<void> {
    try {
      const blockchainPolicy = await this.flowClient.getPolicyDetails(flowPolicyId);
      
      if (!blockchainPolicy) {
        throw new Error('Policy not found on blockchain');
      }

      // Update database policy with blockchain state
      await db.policy.updateMany({
        where: { flowPolicyId: flowPolicyId },
        data: {
          // Update relevant fields from blockchain
          status: blockchainPolicy.isActive ? 'active' : 'expired'
        }
      });

      console.log(`Policy ${flowPolicyId} synced from blockchain`);

    } catch (error: any) {
      console.error('Policy sync error:', error);
      throw new Error(`Failed to sync policy from blockchain: ${error.message}`);
    }
  }
}