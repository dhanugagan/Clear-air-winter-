/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AirQualitySnapshot,
  calculateInversionRisk,
  findCleanestVentilationWindow,
  HourlyForecastPoint,
} from '../../src/shared/airQuality.ts';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly maxEntries: number;

  constructor(maxEntries = 100) {
    this.maxEntries = maxEntries;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  clear(): void {
    this.store.clear();
  }
}

interface GeocodedLocation {
  name: string;
  regionLabel: string;
  latitude: number;
  longitude: number;
}

const geocodeCache = new TtlCache<GeocodedLocation>(150);
const airQualityCache = new TtlCache<AirQualitySnapshot>(150);

const GEOCODE_TTL_MS = 60 * 60 * 1000;
const AIR_QUALITY_TTL_MS = 5 * 60 * 1000;

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 8000): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`Upstream environmental API returned status ${response.status}`);
  }
  return (await response.json()) as T;
}

interface OpenMeteoGeocodePayload {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
  }>;
}

interface OpenMeteoAirPayload {
  current?: {
    time?: string;
    us_aqi?: number;
    pm2_5?: number;
    pm10?: number;
    nitrogen_dioxide?: number;
    sulphur_dioxide?: number;
    carbon_monoxide?: number;
  };
  hourly?: {
    time?: string[];
    pm2_5?: Array<number | null>;
    pm10?: Array<number | null>;
    us_aqi?: Array<number | null>;
  };
}

interface OpenMeteoWeatherPayload {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: Array<number | null>;
    wind_speed_10m?: Array<number | null>;
  };
}

export async function geocodeCity(city: string): Promise<GeocodedLocation> {
  const normalizedKey = city.toLowerCase();
  const cached = geocodeCache.get(normalizedKey);
  if (cached) return cached;

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=1&language=en&format=json`;
  const data = await fetchJsonWithTimeout<OpenMeteoGeocodePayload>(url);
  const first = data.results?.[0];

  if (!first) {
    throw new Error(`Could not locate "${city}". Try a nearby major city name.`);
  }

  const parts = [first.admin1, first.country].filter(Boolean);
  const location: GeocodedLocation = {
    name: first.name,
    regionLabel: parts.join(', ') || 'Urban Station',
    latitude: first.latitude,
    longitude: first.longitude,
  };
  geocodeCache.set(normalizedKey, location, GEOCODE_TTL_MS);
  return location;
}

function formatHourLabel(isoTime: string): string {
  const match = isoTime.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : isoTime.slice(-5);
}

export async function fetchAirQualityByCoords(
  latitude: number,
  longitude: number,
  locationMeta?: { name: string; regionLabel: string }
): Promise<AirQualitySnapshot> {
  const coordKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  const cached = airQualityCache.get(coordKey);
  if (cached) {
    return locationMeta
      ? {
          ...cached,
          locationName: locationMeta.name,
          regionLabel: locationMeta.regionLabel,
        }
      : cached;
  }

  const airUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}` +
    `&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide` +
    `&hourly=pm2_5,pm10,us_aqi&timezone=auto&forecast_days=2`;

  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m` +
    `&hourly=temperature_2m,wind_speed_10m&timezone=auto&forecast_days=2`;

  const [airData, weatherData] = await Promise.all([
    fetchJsonWithTimeout<OpenMeteoAirPayload>(airUrl),
    fetchJsonWithTimeout<OpenMeteoWeatherPayload>(weatherUrl),
  ]);

  const currentPm25 = Math.round((airData.current?.pm2_5 ?? 0) * 10) / 10;
  const currentPm10 = Math.round((airData.current?.pm10 ?? 0) * 10) / 10;
  const currentAqi = Math.round(airData.current?.us_aqi ?? 0);
  const currentTemp = Math.round((weatherData.current?.temperature_2m ?? 0) * 10) / 10;
  const currentHumidity = Math.round(weatherData.current?.relative_humidity_2m ?? 60);
  const currentWind = Math.round((weatherData.current?.wind_speed_10m ?? 5) * 10) / 10;

  const times = airData.hourly?.time ?? [];
  const currentIso = airData.current?.time ?? times[0] ?? new Date().toISOString();
  const startIndex = Math.max(
    0,
    times.findIndex((t) => t >= currentIso.slice(0, 13))
  );

  const hourly: HourlyForecastPoint[] = [];
  for (let i = startIndex; i < Math.min(times.length, startIndex + 24); i++) {
    hourly.push({
      timeIso: times[i],
      hourLabel: formatHourLabel(times[i]),
      pm25: Math.round((airData.hourly?.pm2_5?.[i] ?? currentPm25) * 10) / 10,
      pm10: Math.round((airData.hourly?.pm10?.[i] ?? currentPm10) * 10) / 10,
      usAqi: Math.round(airData.hourly?.us_aqi?.[i] ?? currentAqi),
      windSpeedKmh: Math.round((weatherData.hourly?.wind_speed_10m?.[i] ?? currentWind) * 10) / 10,
      temperatureC: Math.round((weatherData.hourly?.temperature_2m?.[i] ?? currentTemp) * 10) / 10,
    });
  }

  const inversionRisk = calculateInversionRisk({
    temperatureC: currentTemp,
    windSpeedKmh: currentWind,
    pm25: currentPm25,
    humidityPct: currentHumidity,
  });

  const cleanestWindow = findCleanestVentilationWindow(hourly);

  const snapshot: AirQualitySnapshot = {
    locationName: locationMeta?.name ?? `Coordinates ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
    regionLabel: locationMeta?.regionLabel ?? 'Local Sensor Grid',
    latitude,
    longitude,
    observedAtIso: currentIso,
    usAqi: currentAqi,
    pm25: currentPm25,
    pm10: currentPm10,
    no2: Math.round((airData.current?.nitrogen_dioxide ?? 0) * 10) / 10,
    so2: Math.round((airData.current?.sulphur_dioxide ?? 0) * 10) / 10,
    co: Math.round((airData.current?.carbon_monoxide ?? 0) * 10) / 10,
    temperatureC: currentTemp,
    humidityPct: currentHumidity,
    windSpeedKmh: currentWind,
    inversionRisk,
    cleanestWindow,
    hourly,
  };

  airQualityCache.set(coordKey, snapshot, AIR_QUALITY_TTL_MS);
  return snapshot;
}

export async function fetchAirQualityByCity(city: string): Promise<AirQualitySnapshot> {
  const geo = await geocodeCity(city);
  return fetchAirQualityByCoords(geo.latitude, geo.longitude, {
    name: geo.name,
    regionLabel: geo.regionLabel,
  });
}
