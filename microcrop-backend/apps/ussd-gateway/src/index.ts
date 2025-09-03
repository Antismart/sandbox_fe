import express from 'express';
import dotenv from 'dotenv';
import { USSDController } from './controllers/ussd';

dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'USSD Gateway' });
});

// USSD endpoint
app.post('/ussd', USSDController.handle);

const PORT = process.env.USSD_PORT || 3001;
app.listen(PORT, () => {
  console.log(`📱 USSD Gateway running on port ${PORT}`);
});