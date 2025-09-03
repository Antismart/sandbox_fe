import { OnramperSDK } from '@microcrop/onramper-sdk';
import { db } from '@microcrop/database';
import { BlockchainService } from '../../../api/src/services/blockchain';

export class EnhancedPaymentProcessorService {
  private onramper: OnramperSDK;
  private blockchain: BlockchainService;

  constructor() {
    this.onramper = new OnramperSDK({
      apiKey: process.env.ONRAMPER_API_KEY!,
      secretKey: process.env.ONRAMPER_SECRET_KEY!,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
    });
    this.blockchain = new BlockchainService();
  }

  // Enhanced premium payment with blockchain integration
  async processPremiumPayment(policyId: string): Promise<string> {
    const policy = await db.policy.findUnique({
      where: { id: policyId },
      include: { farmer: true }
    });

    if (!policy) {
      throw new Error('Policy not found');
    }

    const premiumKES = policy.premium / 100;

    try {
      // Step 1: Create Onramper transaction (KES -> USDC)
      const transaction = await this.onramper.createTransaction({
        amount: premiumKES,
        sourceCurrency: 'KES',
        targetCurrency: 'USDC',
        network: 'flow',
        destinationAddress: process.env.INSURANCE_POOL_WALLET!,
        country: 'KE',
        paymentMethod: 'mpesa',
        webhookURL: `${process.env.API_BASE_URL}/api/v1/webhooks/onramper`,
        metaData: {
          policyId: policyId,
          farmerId: policy.farmerId,
          type: 'premium_payment'
        }
      });

      // Step 2: Store payment record
      await db.payment.create({
        data: {
          policyId: policyId,
          onramperTxId: transaction.id,
          amount: premiumKES * 100,
          currency: 'KES',
          type: 'premium',
          status: 'pending'
        }
      });

      console.log(`Premium payment initiated for policy ${policyId}: KES ${premiumKES}`);
      return transaction.id;

    } catch (error: any) {
      console.error('Premium payment error:', error);
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  // Enhanced claim payout with blockchain integration
  async processClaimPayout(claimId: string): Promise<{ onramperTx: string; blockchainTx: string }> {
    const claim = await db.claim.findUnique({
      where: { id: claimId },
      include: { 
        policy: { 
          include: { farmer: true } 
        } 
      }
    });

    if (!claim) {
      throw new Error('Claim not found');
    }

    try {
      // Step 1: Process claim on blockchain first
      const blockchainTx = await this.blockchain.processBlockchainClaim(claimId);

      // Step 2: Process offramp (USDC -> KES -> M-Pesa)
      const payoutUSDC = claim.payoutAmount / 100;
      
      const onramperTransaction = await this.onramper.createTransaction({
        amount: payoutUSDC,
        sourceCurrency: 'USDC',
        targetCurrency: 'KES',
        network: 'flow',
        sourceAddress: process.env.PAYOUT_WALLET!,
        country: 'KE',
        paymentMethod: 'mpesa',
        webhookURL: `${process.env.API_BASE_URL}/api/v1/webhooks/onramper`,
        metaData: {
          claimId: claimId,
          policyId: claim.policyId,
          farmerId: claim.policy.farmerId,
          type: 'claim_payout',
          recipientPhone: claim.policy.farmer.phoneNumber,
          blockchainTx: blockchainTx
        }
      });

      // Step 3: Store payment record
      await db.payment.create({
        data: {
          claimId: claimId,
          onramperTxId: onramperTransaction.id,
          amount: payoutUSDC * 100,
          currency: 'USDC',
          type: 'payout',
          status: 'pending'
        }
      });

      console.log(`Claim payout initiated - Blockchain: ${blockchainTx}, Onramper: ${onramperTransaction.id}`);
      
      return {
        onramperTx: onramperTransaction.id,
        blockchainTx: blockchainTx
      };

    } catch (error: any) {
      console.error('Claim payout error:', error);
      throw new Error(`Payout processing failed: ${error.message}`);
    }
  }

  // Handle premium payment completion
  private async handlePremiumPaymentComplete(policyId: string, transactionId: string): Promise<void> {
    try {
      // Step 1: Create policy on blockchain
      const blockchainTx = await this.blockchain.createBlockchainPolicy(policyId);

      // Step 2: Activate policy in database
      await db.policy.update({
        where: { id: policyId },
        data: { 
          status: 'active',
          flowPolicyId: blockchainTx
        }
      });

      console.log(`Policy ${policyId} activated - Payment: ${transactionId}, Blockchain: ${blockchainTx}`);

    } catch (error: any) {
      console.error('Premium payment completion error:', error);
      // Mark policy as failed activation
      await db.policy.update({
        where: { id: policyId },
        data: { status: 'failed' }
      });
    }
  }

  // Enhanced webhook handler with blockchain integration
  async handleWebhook(payload: any, signature: string): Promise<void> {
    const isValid = OnramperSDK.verifyWebhookSignature(
      JSON.stringify(payload),
      signature,
      process.env.ONRAMPER_SECRET_KEY!
    );

    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    const { id: transactionId, status, metaData } = payload;

    // Update payment status
    await db.payment.updateMany({
      where: { onramperTxId: transactionId },
      data: {
        status: status,
        processedAt: status === 'completed' ? new Date() : null,
        failureReason: status === 'failed' ? payload.failureReason : null
      }
    });

    // Handle completion events
    if (metaData?.type === 'premium_payment' && status === 'completed') {
      await this.handlePremiumPaymentComplete(metaData.policyId, transactionId);
    } else if (metaData?.type === 'claim_payout' && status === 'completed') {
      await this.handleClaimPayoutComplete(metaData.claimId, transactionId);
    }
  }

  private async handleClaimPayoutComplete(claimId: string, transactionId: string): Promise<void> {
    await db.claim.update({
      where: { id: claimId },
      data: { status: 'paid' }
    });

    console.log(`Claim ${claimId} payout completed via transaction ${transactionId}`);
  }
}