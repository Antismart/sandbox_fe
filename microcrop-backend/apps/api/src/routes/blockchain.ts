import { Router } from 'express';
import { BlockchainService } from '../services/blockchain';

const router = Router();
const blockchainService = new BlockchainService();

// Get pool statistics from blockchain
router.get('/pool-stats', async (req, res) => {
  try {
    const stats = await blockchainService.getPoolStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Pool stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Sync policy from blockchain
router.post('/sync-policy/:flowPolicyId', async (req, res) => {
  try {
    await blockchainService.syncPolicyFromBlockchain(req.params.flowPolicyId);
    res.json({
      success: true,
      message: 'Policy synced from blockchain'
    });
  } catch (error: any) {
    console.error('Policy sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manually create policy on blockchain (admin function)
router.post('/create-policy/:policyId', async (req, res) => {
  try {
    const transactionId = await blockchainService.createBlockchainPolicy(req.params.policyId);
    res.json({
      success: true,
      data: { transactionId }
    });
  } catch (error: any) {
    console.error('Blockchain policy creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manually process claim on blockchain (admin function)
router.post('/process-claim/:claimId', async (req, res) => {
  try {
    const transactionId = await blockchainService.processBlockchainClaim(req.params.claimId);
    res.json({
      success: true,
      data: { transactionId }
    });
  } catch (error: any) {
    console.error('Blockchain claim processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Submit weather data to blockchain (admin function)
router.post('/submit-weather/:weatherDataId', async (req, res) => {
  try {
    const transactionId = await blockchainService.submitWeatherDataToBlockchain(req.params.weatherDataId);
    res.json({
      success: true,
      data: { transactionId }
    });
  } catch (error: any) {
    console.error('Weather data submission error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;