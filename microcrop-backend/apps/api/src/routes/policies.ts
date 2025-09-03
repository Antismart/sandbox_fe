import { Router } from 'express';
import { db } from '@microcrop/database';
import { CreatePolicySchema, PolicyService } from '@microcrop/shared';

const router = Router();

// Create a new policy
router.post('/', async (req, res) => {
  try {
    const { farmerId, cropType, coverageAmount, location } = CreatePolicySchema.parse(req.body);
    
    // Verify farmer exists and is verified
    const farmer = await db.farmer.findUnique({
      where: { id: farmerId }
    });
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        error: 'Farmer not found'
      });
    }
    
    if (farmer.kycStatus !== 'verified') {
      return res.status(400).json({
        success: false,
        error: 'Farmer must be KYC verified to purchase policies'
      });
    }
    
    // Calculate premium
    const premium = PolicyService.calculatePremium(cropType, coverageAmount, location);
    const { startDate, endDate } = PolicyService.calculatePolicyDuration();
    
    // Create policy
    const policy = await db.policy.create({
      data: {
        farmerId,
        cropType,
        coverageAmount: coverageAmount * 100, // Store in cents
        premium: premium * 100, // Store in cents
        startDate,
        endDate,
        location: location.toLowerCase(),
        status: 'pending'
      },
      include: {
        farmer: {
          select: {
            phoneNumber: true,
            location: true
          }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      data: {
        ...policy,
        coverageAmount: policy.coverageAmount / 100,
        premium: policy.premium / 100
      }
    });
    
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Policy creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create policy'
    });
  }
});

// Get policy by ID
router.get('/:id', async (req, res) => {
  try {
    const policy = await db.policy.findUnique({
      where: { id: req.params.id },
      include: {
        farmer: {
          select: {
            phoneNumber: true,
            location: true
          }
        },
        claims: true,
        payments: true
      }
    });
    
    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Policy not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        ...policy,
        coverageAmount: policy.coverageAmount / 100,
        premium: policy.premium / 100
      }
    });
    
  } catch (error) {
    console.error('Get policy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch policy'
    });
  }
});

export default router;