import axios from 'axios';
import { WeatherXMStation, WeatherXMReading } from '@microcrop/shared';

export class WeatherXMService {
  private baseURL = 'https://pro.weatherxm.com/api/v1';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}) {
    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Accept': 'application/json',
        },
        params
      });
      return response.data;
    } catch (error: any) {
      console.error('WeatherXM API Error:', error.response?.data || error.message);
      throw new Error(`WeatherXM API request failed: ${error.message}`);
    }
  }

  // Get all stations in a specific region (radius in meters, not km)
  async getStationsInRegion(lat: number, lon: number, radius: number = 50000): Promise<WeatherXMStation[]> {
    return this.makeRequest('/stations/near', {
      lat,
      lon,
      radius // radius in meters
    });
  }

  // Get all stations
  async getAllStations(): Promise<WeatherXMStation[]> {
    return this.makeRequest('/stations');
  }

  // Get current weather data from a station (latest observation)
  async getCurrentWeather(stationId: string): Promise<WeatherXMReading> {
    const response = await this.makeRequest(`/stations/${stationId}/latest`);
    return {
      ...response.observation,
      location: response.location
    };
  }

  // Get historical weather data for a specific date
  async getHistoricalWeather(
    stationId: string, 
    date: Date
  ): Promise<WeatherXMReading[]> {
    const dateString = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const response = await this.makeRequest(`/stations/${stationId}/history`, {
      date: dateString
    });
    return response.observations || [];
  }

  // Find nearest station to coordinates
  async findNearestStation(lat: number, lon: number): Promise<WeatherXMStation | null> {
    const stations = await this.getStationsInRegion(lat, lon, 100000); // 100km radius in meters
    if (stations.length === 0) return null;

    // Calculate distances and return nearest
    let nearest = stations[0];
    let minDistance = this.calculateDistance(lat, lon, nearest.location.lat, nearest.location.lon);

    for (const station of stations) {
      const distance = this.calculateDistance(lat, lon, station.location.lat, station.location.lon);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = station;
      }
    }

    return nearest;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}