export interface WeatherReading {
  location: string;
  timestamp: Date;
  temperature: number;
  rainfall: number;
  humidity?: number;
  windSpeed?: number;
  source: string;
}

export interface WeatherAlert {
  location: string;
  alertType: 'drought' | 'flood' | 'hail' | 'extreme_heat';
  severity: 'low' | 'medium' | 'high';
  description: string;
  triggeredAt: Date;
}

export interface WeatherXMStation {
  id: string;
  name: string;
  cellIndex: string;
  location: {
    lat: number;
    lon: number;
    elevation: number;
  };
  createdAt: string;
}

export interface WeatherXMReading {
  timestamp: string; // ISO8601 datetime
  temperature: number;
  feels_like: number;
  dew_point: number;
  precipitation_rate: number;
  precipitation_accumulated: number;
  humidity: number;
  wind_speed: number;
  wind_gust: number;
  wind_direction: number;
  uv_index: number;
  pressure: number;
  solar_irradiance: number;
  icon: string;
  location?: {
    lat: number;
    lon: number;
    elevation: number;
  };
}