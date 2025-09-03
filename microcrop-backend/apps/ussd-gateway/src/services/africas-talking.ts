const AfricasTalking = require('africastalking');

export class AfricasTalkingService {
  private AT: any;

  constructor() {
    const credentials = {
      apiKey: process.env.AFRICAS_TALKING_API_KEY!,
      username: process.env.AFRICAS_TALKING_USERNAME!, // Use 'sandbox' for development
    };
    
    this.AT = AfricasTalking(credentials);
  }

  // Send SMS
  async sendSMS(phoneNumber: string, message: string) {
    try {
      const result = await this.AT.SMS.send({
        to: phoneNumber,
        message: message,
        from: process.env.SMS_SENDER_ID || 'MICROCROP'
      });
      
      console.log('SMS sent successfully:', result);
      return result;
    } catch (error) {
      console.error('SMS sending error:', error);
      throw error;
    }
  }

  // Send bulk SMS
  async sendBulkSMS(recipients: Array<{phoneNumber: string, message: string}>) {
    const promises = recipients.map(recipient => 
      this.sendSMS(recipient.phoneNumber, recipient.message)
    );
    
    return Promise.allSettled(promises);
  }
}