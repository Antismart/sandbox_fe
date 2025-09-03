import express from 'express';
import dotenv from 'dotenv';
import { EnhancedPaymentProcessorService } from './services/payment';

dotenv.config();

const app = express();
app.use(express.json());

// Health check
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'OK', service: 'Payment Processor' });
});

const paymentService = new EnhancedPaymentProcessorService();

// Process premium payment
app.post('/process-premium', async (req: express.Request, res: express.Response) => {
  try {
    const { policyId } = req.body;
    const transactionId = await paymentService.processPremiumPayment(policyId);
    res.json({ success: true, transactionId });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Process claim payout
app.post('/process-payout', async (req: express.Request, res: express.Response) => {
  try {
    const { claimId } = req.body;
    const transactionId = await paymentService.processClaimPayout(claimId);
    res.json({ success: true, transactionId });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PAYMENT_PROCESSOR_PORT || 3002;
app.listen(PORT, () => {
  console.log(`💳 Payment Processor running on port ${PORT}`);
});