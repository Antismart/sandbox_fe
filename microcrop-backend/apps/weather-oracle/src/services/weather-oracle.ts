import { WeatherXMService } from './weatherxm';
import { db } from '@microcrop/database';
import { getLocationCoordinates } from '@microcrop/shared';
import { BlockchainService } from '../../../api/src/services/blockchain';
import cron from 'node-cron';

export class EnhancedWeatherOracleService {
  private weatherXM: WeatherXMService;
  private blockchain: BlockchainService;

  constructor() {
    this.weatherXM = new WeatherXMService(process.env.WEATHERXM_API_KEY!);
    this.blockchain = new BlockchainService();
    this.startWeatherCollection();
  }

  startWeatherCollection() {
    console.log('🕐 Scheduling enhanced weather data collection with blockchain...');
    
    // Collect weather data every hour and submit to blockchain
    cron.schedule('0 * * * *', async () => {
      console.log('🌦️  Collecting weather data and submitting to blockchain...');
      await this.collectAndSubmitWeatherData();
    });

    // Check for trigger conditions every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      await this.checkTriggerConditions();
    });

    console.log('✅ Enhanced weather collection with blockchain scheduled');
  }

  async collectAndSubmitWeatherData() {
    try {
      // Get all unique policy locations
      const locations = await db.policy.findMany({
        where: { status: 'active' },
        select: { location: true },
        distinct: ['location']
      });

      console.log(`🌍 Collecting weather for ${locations.length} locations and submitting to blockchain`);

      for (const { location } of locations) {
        await this.collectLocationWeatherWithBlockchain(location);
      }
    } catch (error) {
      console.error('Enhanced weather collection error:', error);
    }
  }

  async collectLocationWeatherWithBlockchain(location: string) {
    try {
      const coordinates = getLocationCoordinates(location);
      if (!coordinates) {
        console.log(`⚠️  No coordinates found for ${location}`);
        return;
      }

      // Find nearest WeatherXM station
      const station = await this.weatherXM.findNearestStation(
        coordinates.lat, 
        coordinates.lon
      );

      if (!station) {
        console.log(`⚠️  No WeatherXM station found near ${location}`);
        return;
      }

      // Get current weather
      const weather = await this.weatherXM.getCurrentWeather(station.id);

      // Step 1: Store in database
      const weatherData = await db.weatherData.create({
        data: {
          location: location,
          timestamp: new Date(weather.timestamp), // Already ISO8601 string
          temperature: weather.temperature,
          rainfall: weather.precipitation_rate, // Using precipitation_rate for current rainfall
          humidity: weather.humidity,
          windSpeed: weather.wind_speed,
          source: 'weatherxm',
          rawData: weather as any // Cast to satisfy Prisma Json type
        }
      });

      // Step 2: Submit to blockchain oracle
      try {
        const blockchainTx = await this.blockchain.submitWeatherDataToBlockchain(weatherData.id);
        console.log(`✅ Weather data for ${location} stored and submitted to blockchain: ${blockchainTx}`);
      } catch (blockchainError) {
        console.error(`⚠️  Failed to submit weather data to blockchain for ${location}:`, blockchainError);
        // Continue even if blockchain submission fails
      }

      console.log(`📊 ${location}: ${weather.temperature}°C, ${weather.precipitation_rate}mm/h`);

    } catch (error) {
      console.error(`Error collecting enhanced weather for ${location}:`, error);
    }
  }

  async checkTriggerConditions() {
    // Get active policies
    const policies = await db.policy.findMany({
      where: { 
        status: 'active',
        flowPolicyId: { not: null } // Only check policies that exist on blockchain
      },
      include: { farmer: true }
    });

    console.log(`🔍 Checking trigger conditions for ${policies.length} blockchain policies`);

    for (const policy of policies) {
      await this.checkPolicyTriggersWithBlockchain(policy);
    }
  }

  async checkPolicyTriggersWithBlockchain(policy: any) {
    // Get weather data for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weatherData = await db.weatherData.findMany({
      where: {
        location: policy.location,
        timestamp: { gte: sevenDaysAgo }
      },
      orderBy: { timestamp: 'desc' }
    });

    if (weatherData.length === 0) return;

    // Check drought condition
    const totalRainfall = weatherData.reduce((sum: any, data: { rainfall: any; }) => sum + data.rainfall, 0);
    
    if (totalRainfall < 5.0) {
      await this.triggerClaimWithBlockchain(policy, 'drought', {
        totalRainfall,
        period: '7days',
        weatherData: weatherData.slice(0, 5)
      });
    }

    // Check extreme heat condition
    const recentTemps = weatherData.slice(0, 3);
    if (recentTemps.length === 3 && recentTemps.every((data: { temperature: number; }) => data.temperature > 35)) {
      await this.triggerClaimWithBlockchain(policy, 'extreme_heat', {
        temperatures: recentTemps.map((d: { temperature: any; }) => d.temperature),
        weatherData: recentTemps
      });
    }
  }

  async triggerClaimWithBlockchain(policy: any, triggerType: string, triggerData: any) {
    // Check if claim already exists
    const existingClaim = await db.claim.findFirst({
      where: {
        policyId: policy.id,
        status: { in: ['pending', 'approved', 'paid'] }
      }
    });

    if (existingClaim) return; // Don't create duplicate claims

    // Calculate payout based on trigger type and policy
    const payoutAmount = this.calculatePayout(policy, triggerType, triggerData);

    // Create claim in database
    const claim = await db.claim.create({
      data: {
        policyId: policy.id,
        triggerCondition: `${triggerType}: ${JSON.stringify(triggerData)}`,
        triggerData: triggerData,
        payoutAmount: payoutAmount,
        status: 'approved' // Auto-approve weather-triggered claims
      }
    });

    console.log(`🚨 Blockchain claim triggered for policy ${policy.id}: ${triggerType} - KES ${payoutAmount/100}`);

    // Process payout through enhanced payment processor (will handle blockchain + onramper)
    try {
      // This would typically be called by a separate service or queue
      // For now, we'll log that it's ready for processing
      console.log(`💰 Claim ${claim.id} ready for blockchain payout processing`);
    } catch (error) {
      console.error('Claim processing error:', error);
    }
  }

  private calculatePayout(policy: any, triggerType: string, triggerData: any): number {
    const payoutPercentages = {
      drought: 0.8,        // 80% of coverage
      extreme_heat: 0.6,   // 60% of coverage
      flood: 0.9,          // 90% of coverage
      hail: 0.7            // 70% of coverage
    };

    const percentage = payoutPercentages[triggerType as keyof typeof payoutPercentages] || 0.5;
    return Math.round(policy.coverageAmount * percentage);
  }
}