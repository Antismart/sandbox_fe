import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    service: 'Microcrop API',
    blockchain: 'Flow Network',
    network: process.env.FLOW_NETWORK || 'testnet'
  });
});

// Import routes
import farmersRouter from './routes/farmers';
import policiesRouter from './routes/policies';
import claimsRouter from './routes/claims';
import paymentsRouter from './routes/payments';
import webhooksRouter from './routes/webhooks';
import blockchainRouter from './routes/blockchain';

// API routes
app.use('/api/v1/farmers', farmersRouter);
app.use('/api/v1/policies', policiesRouter);
app.use('/api/v1/claims', claimsRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/webhooks', webhooksRouter);
app.use('/api/v1/blockchain', blockchainRouter);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid JSON in request body' 
    });
  }
  
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Microcrop API server running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⛓️  Flow Network: ${process.env.FLOW_NETWORK || 'testnet'}`);
  console.log(`📊 Blockchain routes: http://localhost:${PORT}/api/v1/blockchain`);
});