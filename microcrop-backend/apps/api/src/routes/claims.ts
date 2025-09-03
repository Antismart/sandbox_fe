import express from 'express';
import { db } from '@microcrop/database';

const router = express.Router();

// Get all claims for a farmer
router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    const claims = await db.claim.findMany({
      where: {
        policy: {
          farmerId: farmerId
        }
      },
      include: {
        policy: {
          select: {
            id: true,
            cropType: true,
            coverageAmount: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      claims
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get claim by ID
router.get('/:claimId', async (req, res) => {
  try {
    const { claimId } = req.params;
    
    const claim = await db.claim.findUnique({
      where: { id: claimId },
      include: {
        policy: {
          include: {
            farmer: true
          }
        },
        payments: true
      }
    });

    if (!claim) {
      return res.status(404).json({
        success: false,
        error: 'Claim not found'
      });
    }

    res.json({
      success: true,
      claim
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manual claim submission (for non-automatic triggers)
router.post('/', async (req, res) => {
  try {
    const { policyId, description, evidence } = req.body;
    
    const policy = await db.policy.findUnique({
      where: { id: policyId }
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found'
      });
    }

    if (policy.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Policy must be active to file a claim'
      });
    }

    const claim = await db.claim.create({
      data: {
        policyId,
        triggerCondition: `Manual claim: ${description}`,
        triggerData: { description, evidence, type: 'manual' },
        payoutAmount: Math.round(policy.coverageAmount * 0.8), // 80% payout for manual claims
        status: 'pending' // Manual claims require approval
      }
    });

    res.json({
      success: true,
      claim
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;