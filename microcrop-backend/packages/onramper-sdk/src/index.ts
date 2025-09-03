import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

interface OnramperConfig {
  apiKey: string;
  secretKey: string;
  environment: 'sandbox' | 'production';
}

interface OnramperTransaction {
  amount: number;
  sourceCurrency: string;
  targetCurrency: string;
  network?: string;
  destinationAddress?: string;
  sourceAddress?: string;
  country?: string;
  paymentMethod?: string;
  email?: string;
  redirectURL?: string;
  webhookURL?: string;
  metaData?: Record<string, any>;
}

interface OnramperResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  url?: string;
  amount: number;
  sourceCurrency: string;
  targetCurrency: string;
  createdAt: string;
  updatedAt: string;
  metaData?: Record<string, any>;
}

export class OnramperSDK {
  private client: AxiosInstance;
  private config: OnramperConfig;

  constructor(config: OnramperConfig) {
    this.config = config;
    
    const baseURL = config.environment === 'production' 
      ? 'https://api.onramper.com' 
      : 'https://api-sandbox.onramper.com';

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': config.apiKey
      }
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      if (config.data) {
        const timestamp = Date.now().toString();
        const signature = this.createSignature(config.data, timestamp);
        config.headers!['X-Timestamp'] = timestamp;
        config.headers!['X-Signature'] = signature;
      }
      return config;
    });
  }

  private createSignature(data: any, timestamp: string): string {
    const message = JSON.stringify(data) + timestamp;
    return crypto.createHmac('sha256', this.config.secretKey).update(message).digest('hex');
  }

  // Create a new transaction (onramp/offramp)
  async createTransaction(transaction: OnramperTransaction): Promise<OnramperResponse> {
    try {
      const response = await this.client.post('/v2/transactions', transaction);
      return response.data;
    } catch (error: any) {
      console.error('Onramper transaction creation error:', error.response?.data || error.message);
      throw new Error(`Transaction creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get transaction status
  async getTransaction(transactionId: string): Promise<OnramperResponse> {
    try {
      const response = await this.client.get(`/v2/transactions/${transactionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Onramper get transaction error:', error.response?.data || error.message);
      throw new Error(`Get transaction failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get available payment methods for a country
  async getPaymentMethods(country: string = 'KE'): Promise<any[]> {
    try {
      const response = await this.client.get('/v2/payment-methods', {
        params: { country }
      });
      return response.data;
    } catch (error: any) {
      console.error('Onramper payment methods error:', error.response?.data || error.message);
      throw new Error(`Get payment methods failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get supported currencies
  async getSupportedCurrencies(): Promise<any[]> {
    try {
      const response = await this.client.get('/v2/currencies');
      return response.data;
    } catch (error: any) {
      console.error('Onramper currencies error:', error.response?.data || error.message);
      throw new Error(`Get currencies failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get exchange rates
  async getExchangeRate(from: string, to: string, amount: number): Promise<any> {
    try {
      const response = await this.client.get('/v2/rate', {
        params: { from, to, amount }
      });
      return response.data;
    } catch (error: any) {
      console.error('Onramper exchange rate error:', error.response?.data || error.message);
      throw new Error(`Get exchange rate failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Verify webhook signature
  static verifyWebhookSignature(payload: string, signature: string, secretKey: string): boolean {
    const expectedSignature = crypto.createHmac('sha256', secretKey).update(payload).digest('hex');
    return expectedSignature === signature;
  }
}

export type { OnramperConfig, OnramperTransaction, OnramperResponse };