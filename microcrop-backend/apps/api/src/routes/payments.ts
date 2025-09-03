import express from 'express';
import { db } from '@microcrop/database';

const router = express.Router();

// Get all payments for a farmer
router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    const payments = await db.payment.findMany({
      where: {
        OR: [
          {
            policy: {
              farmerId: farmerId
            }
          },
          {
            claim: {
              policy: {
                farmerId: farmerId
              }
            }
          }
        ]
      },
      include: {
        policy: {
          select: {
            id: true,
            cropType: true
          }
        },
        claim: {
          select: {
            id: true,
            triggerCondition: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      payments
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get payment by ID
router.get('/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        policy: {
          include: {
            farmer: true
          }
        },
        claim: true
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      payment
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get payment status by Onramper transaction ID
router.get('/onramper/:txId', async (req, res) => {
  try {
    const { txId } = req.params;
    
    const payment = await db.payment.findUnique({
      where: { onramperTxId: txId },
      include: {
        policy: {
          select: {
            id: true,
            farmerId: true,
            cropType: true
          }
        },
        claim: {
          select: {
            id: true,
            payoutAmount: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment transaction not found'
      });
    }

    res.json({
      success: true,
      payment
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;