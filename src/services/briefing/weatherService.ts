/**
 * Weather Service
 * Fetches weather data from OpenWeatherMap API
 */

import { logger } from '@/services/logger';
import type { WeatherData } from './types';

const OPENWEATHERMAP_API_KEY = import.meta.env.VITE_OPENWEATHERMAP_API_KEY as string | undefined;

interface OpenWeatherResponse {
  name: string;
  main: {
    temp: number;
    humidity: number;
    temp_min: number;
    temp_max: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
}

function mapWeatherCondition(weatherId: number): WeatherData['condition'] {
  // OpenWeatherMap weather condition codes
  // https://openweathermap.org/weather-conditions
  if (weatherId >= 200 && weatherId < 300) return 'stormy'; // Thunderstorm
  if (weatherId >= 300 && weatherId < 400) return 'rainy'; // Drizzle
  if (weatherId >= 500 && weatherId < 600) return 'rainy'; // Rain
  if (weatherId >= 600 && weatherId < 700) return 'snowy'; // Snow
  if (weatherId >= 700 && weatherId < 800) return 'foggy'; // Atmosphere (fog, mist)
  if (weatherId === 800) return 'sunny'; // Clear
  if (weatherId === 801 || weatherId === 802) return 'partly_cloudy'; // Few/Scattered clouds
  if (weatherId >= 803) return 'cloudy'; // Broken/Overcast clouds
  return 'partly_cloudy';
}

export async function fetchWeather(
  lat: number,
  lng: number,
  unit: 'C' | 'F' = 'F'
): Promise<WeatherData | null> {
  if (!OPENWEATHERMAP_API_KEY) {
    logger.warn('WeatherService', 'OpenWeatherMap API key not configured');
    return null;
  }

  try {
    const units = unit === 'C' ? 'metric' : 'imperial';
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=${units}&appid=${OPENWEATHERMAP_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data: OpenWeatherResponse = await response.json();
    const weather = data.weather[0];

    return {
      location: data.name,
      temperature: Math.round(data.main.temp),
      temperatureUnit: unit,
      condition: mapWeatherCondition(weather.id),
      conditionText: weather.description,
      humidity: data.main.humidity,
      high: Math.round(data.main.temp_max),
      low: Math.round(data.main.temp_min),
      icon: weather.icon,
    };
  } catch (error) {
    logger.error('WeatherService', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

// Get weather icon emoji based on condition
export function getWeatherEmoji(condition: WeatherData['condition']): string {
  const emojis: Record<WeatherData['condition'], string> = {
    sunny: '☀️',
    cloudy: '☁️',
    partly_cloudy: '⛅',
    rainy: '🌧️',
    snowy: '🌨️',
    stormy: '⛈️',
    foggy: '🌫️',
    windy: '💨',
  };
  return emojis[condition] || '🌤️';
}

