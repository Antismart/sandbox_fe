import { Request, Response } from 'express';
import { db } from '@microcrop/database';
import { PolicyService, formatKenyanPhone } from '@microcrop/shared';
import { AfricasTalkingService } from '../services/africas-talking';

interface USSDSession {
  sessionId: string;
  phoneNumber: string;
  step: string;
  data: Record<string, any>;
}

export class USSDController {
  private static sessions: Map<string, USSDSession> = new Map();
  private static smsService = new AfricasTalkingService();

  static async handle(req: Request, res: Response) {
    const { sessionId, serviceCode, phoneNumber, text } = req.body;
    
    console.log('USSD Request:', { sessionId, phoneNumber, text });
    
    let session = USSDController.sessions.get(sessionId) || {
      sessionId,
      phoneNumber: formatKenyanPhone(phoneNumber),
      step: 'main_menu',
      data: {}
    };

    let response = '';
    
    try {
      response = await USSDController.processUSSDRequest(session, text);
    } catch (error) {
      console.error('USSD Error:', error);
      response = 'END Service temporarily unavailable. Please try again later.';
    }

    // Update session
    if (response.startsWith('CON')) {
      USSDController.sessions.set(sessionId, session);
    } else {
      USSDController.sessions.delete(sessionId);
    }

    res.set('Content-Type', 'text/plain');
    res.send(response);
  }

  private static async processUSSDRequest(session: USSDSession, text: string): Promise<string> {
    if (text === '') {
      return USSDController.handleMainMenu();
    }

    const inputs = text.split('*');
    const currentInput = inputs[inputs.length - 1];

    // Route based on first selection
    switch (inputs[0]) {
      case '1':
        return USSDController.handleRegistration(session, currentInput, inputs);
      case '2':
        return USSDController.handlePolicyPurchase(session, currentInput, inputs);
      case '3':
        return USSDController.handlePolicyStatus(session);
      case '4':
        return USSDController.handleClaimsCheck(session);
      case '5':
        return USSDController.handleCustomerSupport();
      default:
        return USSDController.handleMainMenu();
    }
  }

  private static handleMainMenu(): string {
    return `CON Welcome to Microcrop Insurance
1. Register as Farmer
2. Buy Insurance Policy
3. Check Policy Status
4. View Claims
5. Customer Support
0. Exit`;
  }

  private static async handleRegistration(session: USSDSession, input: string, inputs: string[]): Promise<string> {
    if (inputs.length === 1) {
      // First step: ask for location
      return `CON Enter your county/location:
(e.g., Nairobi, Mombasa, Kisumu)`;
    }

    if (inputs.length === 2) {
      const location = inputs[1].trim();
      return `CON Confirm registration details:
Phone: ${session.phoneNumber}
Location: ${location}

1. Confirm
2. Cancel`;
    }

    if (inputs.length === 3) {
      if (inputs[2] === '1') {
        try {
          const location = inputs[1].trim();
          
          // Register farmer
          const farmer = await db.farmer.create({
            data: {
              phoneNumber: session.phoneNumber,
              location: location.toLowerCase(),
              kycStatus: 'verified' // Auto-verify for demo
            }
          });

          // Send SMS confirmation
          await USSDController.smsService.sendSMS(
            session.phoneNumber,
            `Welcome to Microcrop Insurance! Your account has been created. You can now purchase policies by dialing ${process.env.USSD_SERVICE_CODE}`
          );

          return `END Registration successful! Welcome to Microcrop Insurance. SMS confirmation sent.`;
        } catch (error: any) {
          if (error.code === 'P2002') {
            return `END Phone number already registered. Dial ${process.env.USSD_SERVICE_CODE} to access your account.`;
          }
          throw error;
        }
      } else {
        return `END Registration cancelled.`;
      }
    }

    return `END Invalid input. Please try again.`;
  }

  private static async handlePolicyPurchase(session: USSDSession, input: string, inputs: string[]): Promise<string> {
    // Check if farmer exists
    const farmer = await db.farmer.findUnique({
      where: { phoneNumber: session.phoneNumber }
    });

    if (!farmer) {
      return `END You need to register first. 
1. Dial ${process.env.USSD_SERVICE_CODE}
2. Select "Register as Farmer"`;
    }

    if (inputs.length === 1) {
      return `CON Select crop type:
1. Maize
2. Rice
3. Wheat
4. Beans
5. Tomatoes`;
    }

    if (inputs.length === 2) {
      const crops = ['', 'maize', 'rice', 'wheat', 'beans', 'tomatoes'];
      const cropType = crops[parseInt(inputs[1])] || 'maize';
      
      return `CON Enter coverage amount (KES):
Examples:
1. 50,000
2. 100,000  
3. 200,000
4. Custom amount`;
    }

    if (inputs.length === 3) {
      const crops = ['', 'maize', 'rice', 'wheat', 'beans', 'tomatoes'];
      const cropType = crops[parseInt(inputs[1])] || 'maize';
      
      let coverageAmount: number;
      
      if (inputs[2] === '1') coverageAmount = 50000;
      else if (inputs[2] === '2') coverageAmount = 100000;
      else if (inputs[2] === '3') coverageAmount = 200000;
      else {
        coverageAmount = parseInt(inputs[2].replace(/,/g, ''));
        if (isNaN(coverageAmount) || coverageAmount < 5000 || coverageAmount > 500000) {
          return `CON Invalid amount. Enter between 5,000 and 500,000:`;
        }
      }

      const premium = PolicyService.calculatePremium(
        cropType,
        coverageAmount,
        farmer.location
      );

      return `CON Policy Summary:
Crop: ${cropType.toUpperCase()}
Coverage: KES ${coverageAmount.toLocaleString()}
Premium: KES ${premium.toLocaleString()}
Period: 6 months

1. Pay Premium
2. Cancel`;
    }

    if (inputs.length === 4) {
      if (inputs[3] === '1') {
        try {
          const crops = ['', 'maize', 'rice', 'wheat', 'beans', 'tomatoes'];
          const cropType = crops[parseInt(inputs[1])] || 'maize';
          
          let coverageAmount: number;
          if (inputs[2] === '1') coverageAmount = 50000;
          else if (inputs[2] === '2') coverageAmount = 100000;
          else if (inputs[2] === '3') coverageAmount = 200000;
          else coverageAmount = parseInt(inputs[2].replace(/,/g, ''));

          const premium = PolicyService.calculatePremium(
            cropType,
            coverageAmount,
            farmer.location
          );

          // Create policy
          const { startDate, endDate } = PolicyService.calculatePolicyDuration();
          
          const policy = await db.policy.create({
            data: {
              farmerId: farmer.id,
              cropType: cropType,
              coverageAmount: coverageAmount * 100, // Store in cents
              premium: premium * 100, // Store in cents
              startDate,
              endDate,
              location: farmer.location,
              status: 'pending'
            }
          });

          // Send SMS with payment instructions
          await USSDController.smsService.sendSMS(
            session.phoneNumber,
            `Policy created! Pay KES ${premium} to complete activation. Policy ID: ${policy.id.slice(0, 8)}`
          );

          return `END Policy created successfully! 
Payment: KES ${premium.toLocaleString()}
SMS sent with payment details.`;

        } catch (error) {
          console.error('Policy creation error:', error);
          return `END Error creating policy. Please try again later.`;
        }
      } else {
        return `END Policy creation cancelled.`;
      }
    }

    return `END Invalid selection.`;
  }

  private static async handlePolicyStatus(session: USSDSession): Promise<string> {
    const farmer = await db.farmer.findUnique({
      where: { phoneNumber: session.phoneNumber },
      include: {
        policies: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!farmer || farmer.policies.length === 0) {
      return `END No policies found. 
Dial ${process.env.USSD_SERVICE_CODE} to purchase a policy.`;
    }

    let response = 'END Your Policies:\n';
    farmer.policies.forEach((policy: any, index: number) => {
      response += `${index + 1}. ${policy.cropType.toUpperCase()} - ${policy.status.toUpperCase()}\n`;
      response += `   Coverage: KES ${(policy.coverageAmount / 100).toLocaleString()}\n`;
    });

    return response;
  }

  private static async handleClaimsCheck(session: USSDSession): Promise<string> {
    const farmer = await db.farmer.findUnique({
      where: { phoneNumber: session.phoneNumber },
      include: {
        policies: {
          include: {
            claims: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!farmer) {
      return `END No account found. Please register first.`;
    }

    const allClaims = farmer.policies.flatMap((policy: any) => policy.claims);

    if (allClaims.length === 0) {
      return `END No claims found.`;
    }

    let response = 'END Your Claims:\n';
    allClaims.slice(0, 3).forEach((claim: any, index: number) => {
      response += `${index + 1}. ${claim.status.toUpperCase()}\n`;
      response += `   Amount: KES ${(claim.payoutAmount / 100).toLocaleString()}\n`;
    });

    return response;
  }

  private static handleCustomerSupport(): string {
    return `END Customer Support:
📞 Call: +254 700 123456
📧 Email: help@microcrop.co.ke
🕐 Hours: 8AM - 6PM (Mon-Fri)

We're here to help!`;
  }
}