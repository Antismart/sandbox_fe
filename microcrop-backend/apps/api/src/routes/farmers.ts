import { Router } from 'express';
import { db } from '@microcrop/database';
import { CreateFarmerSchema, formatKenyanPhone } from '@microcrop/shared';

const router = Router();

// Register a new farmer
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, location } = CreateFarmerSchema.parse(req.body);
    
    // Format phone number
    const formattedPhone = formatKenyanPhone(phoneNumber);
    
    // Check if farmer already exists
    const existingFarmer = await db.farmer.findUnique({
      where: { phoneNumber: formattedPhone }
    });
    
    if (existingFarmer) {
      return res.status(409).json({
        success: false,
        error: 'Farmer with this phone number already exists'
      });
    }
    
    // Create new farmer
    const farmer = await db.farmer.create({
      data: {
        phoneNumber: formattedPhone,
        location: location.toLowerCase(),
        kycStatus: 'verified' // Auto-verify for demo
      }
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: farmer.id,
        phoneNumber: farmer.phoneNumber,
        location: farmer.location,
        kycStatus: farmer.kycStatus,
        createdAt: farmer.createdAt
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
    
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register farmer'
    });
  }
});

// Get farmer by ID
router.get('/:id', async (req, res) => {
  try {
    const farmer = await db.farmer.findUnique({
      where: { id: req.params.id },
      include: {
        policies: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        error: 'Farmer not found'
      });
    }
    
    res.json({
      success: true,
      data: farmer
    });
    
  } catch (error) {
    console.error('Get farmer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch farmer'
    });
  }
});

// Get farmer by phone number
router.get('/phone/:phoneNumber', async (req, res) => {
  try {
    const formattedPhone = formatKenyanPhone(req.params.phoneNumber);
    
    const farmer = await db.farmer.findUnique({
      where: { phoneNumber: formattedPhone },
      include: {
        policies: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        error: 'Farmer not found'
      });
    }
    
    res.json({
      success: true,
      data: farmer
    });
    
  } catch (error) {
    console.error('Get farmer by phone error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch farmer'
    });
  }
});

export default router;