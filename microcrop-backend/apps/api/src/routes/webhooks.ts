
import express from 'express';
import { db } from '@microcrop/database';

const router = express.Router();

// Onramper webhook handler
router.post('/onramper', async (req, res) => {
  try {
    const payload = req.body;
    const signature = req.headers['x-onramper-signature'] as string;

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing signature header'
      });
    }

    // TODO: Verify webhook signature with Onramper secret
    // const isValid = OnramperSDK.verifyWebhookSignature(
    //   JSON.stringify(payload),
    //   signature,
    //   process.env.ONRAMPER_SECRET_KEY!
    // );

    // if (!isValid) {
    //   return res.status(401).json({
    //     success: false,
    //     error: 'Invalid webhook signature'
    //   });
    // }

    const { id: transactionId, status, metaData } = payload;

    // Update payment status
    await db.payment.updateMany({
      where: { onramperTxId: transactionId },
      data: {
        status: status,
        processedAt: status === 'completed' ? new Date() : null,
        failureReason: status === 'failed' ? payload.failureReason : null,
        mpesaReceiptCode: payload.mpesaReceiptCode || null
      }
    });

    // Handle completion events
    if (status === 'completed' && metaData) {
      if (metaData.type === 'premium_payment') {
        await handlePremiumPaymentComplete(metaData.policyId, transactionId);
      } else if (metaData.type === 'claim_payout') {
        await handleClaimPayoutComplete(metaData.claimId, transactionId);
      }
    }

    console.log(`Webhook processed for transaction ${transactionId}: ${status}`);

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Africa's Talking webhook (for SMS/USSD delivery reports)
router.post('/africastalking', async (req, res) => {
  try {
    const { id, status, phoneNumber, cost } = req.body;

    console.log(`Africa's Talking delivery report - ID: ${id}, Status: ${status}, Phone: ${phoneNumber}, Cost: ${cost}`);

    // TODO: Store delivery reports in database if needed
    // await db.smsDeliveryReport.create({
    //   data: { messageId: id, status, phoneNumber, cost }
    // });

    res.json({
      success: true,
      message: 'Delivery report received'
    });
  } catch (error: any) {
    console.error('Africa\'s Talking webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper functions
async function handlePremiumPaymentComplete(policyId: string, transactionId: string) {
  try {
    // Activate policy
    await db.policy.update({
      where: { id: policyId },
      data: { 
        status: 'active'
        // flowPolicyId will be set by blockchain service
      }
    });

    console.log(`Policy ${policyId} activated - Payment: ${transactionId}`);
  } catch (error: any) {
    console.error('Premium payment completion error:', error);
    // Mark policy as failed activation
    await db.policy.update({
      where: { id: policyId },
      data: { status: 'failed' }
    });
  }
}

async function handleClaimPayoutComplete(claimId: string, transactionId: string) {
  try {
    await db.claim.update({
      where: { id: claimId },
      data: { status: 'paid' }
    });

    console.log(`Claim ${claimId} payout completed via transaction ${transactionId}`);
  } catch (error: any) {
    console.error('Claim payout completion error:', error);
  }
}

export default router;