import { z } from 'zod';

export const CreatePolicySchema = z.object({
  farmerId: z.string().cuid(),
  cropType: z.enum(['maize', 'rice', 'wheat', 'beans', 'tomatoes']),
  coverageAmount: z.number().min(5000).max(500000), // KES
  location: z.string().min(2),
});

export type CreatePolicyRequest = z.infer<typeof CreatePolicySchema>;

export interface PolicyResponse {
  id: string;
  farmerId: string;
  cropType: string;
  coverageAmount: number;
  premium: number;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'active' | 'expired' | 'claimed';
  location: string;
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  type: 'premium' | 'payout';
  status: 'pending' | 'completed' | 'failed';
  policyId?: string;
  claimId?: string;
}