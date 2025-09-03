import { z } from 'zod';

export const CreateFarmerSchema = z.object({
  phoneNumber: z.string().regex(/^254\d{9}$/, 'Invalid Kenya phone number format'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
});

export type CreateFarmerRequest = z.infer<typeof CreateFarmerSchema>;

export interface FarmerResponse {
  id: string;
  phoneNumber: string;
  location: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
}