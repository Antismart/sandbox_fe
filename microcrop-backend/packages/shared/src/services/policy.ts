export class PolicyService {
  static calculatePremium(cropType: string, coverageAmount: number, location: string): number {
    // Base premium rates by crop (percentage of coverage)
    const rates = {
      maize: 0.08,    // 8%
      rice: 0.10,     // 10%
      wheat: 0.07,    // 7%
      beans: 0.09,    // 9%
      tomatoes: 0.12  // 12%
    };
    
    const baseRate = rates[cropType as keyof typeof rates] || 0.10;
    
    // Location risk multiplier (example)
    const locationMultipliers = {
      'nairobi': 0.8,
      'mombasa': 1.2,
      'kisumu': 1.0,
      'nakuru': 0.9,
      'eldoret': 1.1,
      'thika': 0.9,
      'malindi': 1.3,
      'kitale': 1.0
    };
    
    const locationKey = location.toLowerCase();
    const locationMultiplier = locationMultipliers[locationKey as keyof typeof locationMultipliers] || 1.0;
    
    return Math.round(coverageAmount * baseRate * locationMultiplier);
  }
  
  static calculatePolicyDuration(): { startDate: Date; endDate: Date } {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6); // 6-month policies
    
    return { startDate, endDate };
  }
}