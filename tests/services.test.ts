/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchAirQualityByCity,
  fetchAirQualityByCoords,
  geocodeCity,
} from '../server/services/airQualityService';
import { generateActionPlan } from '../server/services/geminiService';
import { AirQualitySnapshot, HouseholdProfile } from '../src/shared/airQuality';

const SAMPLE_PROFILE: HouseholdProfile = {
  city: 'Zurich',
  adults: 2,
  children: 0,
  seniors: 0,
  respiratorySensitivity: false,
  homeType: 'apartment',
  heatingSource: 'heat_pump',
  commuteMode: 'public_transit',
  filtrationSetup: 'hepa_purifier',
  lifestyleNotes: '',
};

const SAMPLE_SNAPSHOT: AirQualitySnapshot = {
  locationName: 'Zurich',
  regionLabel: 'Switzerland',
  latitude: 47.37,
  longitude: 8.54,
  observedAtIso: '2026-11-19T10:00',
  usAqi: 55,
  pm25: 14.2,
  pm10: 21.0,
  no2: 18.0,
  so2: 1.5,
  co: 200,
  temperatureC: 3.5,
  humidityPct: 70,
  windSpeedKmh: 9.0,
  inversionRisk: {
    level: 'Elevated',
    score: 42,
    summary: 'Slow dispersion',
    trappingMechanism: 'Light winds partially mix emissions.',
  },
  cleanestWindow: {
    startHour: '13:00',
    endHour: '14:00',
    avgPm25: 10.5,
    avgAqi: 44,
    recommendation: 'Brief airing safe.',
  },
  hourly: [],
};

describe('airQualityService Open-Meteo Integration & Caching', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('geocodes a city once and serves subsequent lookups from cache', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              name: 'Zurich',
              latitude: 47.3769,
              longitude: 8.5417,
              admin1: 'Zurich',
              country: 'Switzerland',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const first = await geocodeCity('Zurich');
    const second = await geocodeCity('zurich');

    expect(first.name).toBe('Zurich');
    expect(second.regionLabel).toBe('Zurich, Switzerland');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('throws clear error when geocoding returns no matches', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ results: [] }), { status: 200 })
    );

    await expect(geocodeCity('AtlantisNonexistent99')).rejects.toThrow('Could not locate');
  });

  it('combines Open-Meteo air quality and weather responses into snapshot', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('geocoding-api.open-meteo.com')) {
        return new Response(
          JSON.stringify({
            results: [{ name: 'Bern', latitude: 46.948, longitude: 7.447, country: 'Switzerland' }],
          }),
          { status: 200 }
        );
      }
      if (url.includes('air-quality-api.open-meteo.com')) {
        return new Response(
          JSON.stringify({
            current: {
              time: '2026-11-19T10:00',
              us_aqi: 112,
              pm2_5: 39.4,
              pm10: 54.0,
              nitrogen_dioxide: 42.1,
              sulphur_dioxide: 3.2,
              carbon_monoxide: 310,
            },
            hourly: {
              time: ['2026-11-19T10:00', '2026-11-19T11:00', '2026-11-19T12:00'],
              pm2_5: [39.4, 28.0, 22.0],
              pm10: [54.0, 40.0, 31.0],
              us_aqi: [112, 84, 71],
            },
          }),
          { status: 200 }
        );
      }
      return new Response(
        JSON.stringify({
          current: {
            temperature_2m: -1.5,
            relative_humidity_2m: 80,
            wind_speed_10m: 4.0,
          },
          hourly: {
            time: ['2026-11-19T10:00', '2026-11-19T11:00', '2026-11-19T12:00'],
            temperature_2m: [-1.5, 0.2, 1.8],
            wind_speed_10m: [4.0, 7.0, 11.0],
          },
        }),
        { status: 200 }
      );
    });

    const snapshot = await fetchAirQualityByCity('Bern');
    expect(snapshot.locationName).toBe('Bern');
    expect(snapshot.usAqi).toBe(112);
    expect(snapshot.pm25).toBe(39.4);
    expect(snapshot.inversionRisk.level).toBe('Severe');
    expect(snapshot.cleanestWindow.startHour).toBe('11:00');
    expect(snapshot.hourly).toHaveLength(3);
  });

  it('propagates upstream HTTP errors cleanly on coordinate fetch', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Upstream down', { status: 503 }));
    await expect(fetchAirQualityByCoords(10.123, 20.456)).rejects.toThrow('status 503');
  });
});

describe('geminiService Configuration Guards', () => {
  it('throws clear configuration error when GEMINI_API_KEY is absent', async () => {
    const previous = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      await expect(generateActionPlan(SAMPLE_PROFILE, SAMPLE_SNAPSHOT)).rejects.toThrow(
        'GEMINI_API_KEY is not configured'
      );
    } finally {
      if (previous !== undefined) {
        process.env.GEMINI_API_KEY = previous;
      }
    }
  });
});
