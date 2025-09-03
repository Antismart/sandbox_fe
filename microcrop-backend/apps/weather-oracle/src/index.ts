import dotenv from 'dotenv';
import { EnhancedWeatherOracleService } from './services/weather-oracle';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🌦️  Starting Weather Oracle Service...');
  
  if (!process.env.WEATHERXM_API_KEY) {
    console.error('❌ WEATHERXM_API_KEY is required');
    process.exit(1);
  }

  try {
    const weatherOracle = new EnhancedWeatherOracleService();
    console.log('✅ Weather Oracle Service started successfully');
    
    // Keep the process running
    process.on('SIGTERM', () => {
      console.log('🛑 Weather Oracle Service shutting down...');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start Weather Oracle Service:', error);
    process.exit(1);
  }
}

main().catch(console.error);