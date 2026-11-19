/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  askAirQualityAdvisorApi,
  fetchAirQualityByCityApi,
  fetchAirQualityByCoordsApi,
  generateActionPlanApi,
} from '../src/services/apiClient';
import { AirQualitySnapshot, HouseholdProfile } from '../src/shared/airQuality';

const PROFILE: HouseholdProfile = {
  city: 'Salt Lake City',
  adults: 2,
  children: 1,
  seniors: 0,
  respiratorySensitivity: true,
  homeType: 'apartment',
  heatingSource: 'natural_gas',
  commuteMode: 'private_car',
  filtrationSetup: 'basic_hvac',
  lifestyleNotes: '',
};

const SNAPSHOT: AirQualitySnapshot = {
  locationName: 'Salt Lake City',
  regionLabel: 'Utah, United States',
  latitude: 40.76,
  longitude: -111.89,
  observedAtIso: '2026-11-19T08:00',
  usAqi: 158,
  pm25: 68.2,
  pm10: 84,
  no2: 49,
  so2: 5,
  co: 520,
  temperatureC: -2,
  humidityPct: 82,
  windSpeedKmh: 3.1,
  inversionRisk: {
    level: 'Severe',
    score: 88,
    summary: 'Strong trapping',
    trappingMechanism: 'Calm winds and cold air trap emissions.',
  },
  cleanestWindow: {
    startHour: '14:00',
    endHour: '15:00',
    avgPm25: 38,
    avgAqi: 107,
    recommendation: 'Run HEPA filtration.',
  },
  hourly: [],
};

describe('apiClient Frontend HTTP Wrappers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches air quality by encoded city query', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(SNAPSHOT), { status: 200 })
    );

    const data = await fetchAirQualityByCityApi('Salt Lake City');
    expect(data.locationName).toBe('Salt Lake City');
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/air-quality?city=Salt%20Lake%20City',
      expect.objectContaining({ signal: undefined })
    );
  });

  it('fetches air quality by geographic coordinates', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(SNAPSHOT), { status: 200 })
    );

    const data = await fetchAirQualityByCoordsApi(40.76, -111.89);
    expect(data.usAqi).toBe(158);
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/air-quality/coords?lat=40.76&lon=-111.89',
      expect.objectContaining({ signal: undefined })
    );
  });

  it('posts household profile to generateActionPlanApi and surfaces server errors', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            generatedAtIso: '2026-11-19T08:15:00Z',
            advisoryHeadline: 'Run HEPA indoors',
            advisorySummary: 'Morning inversion active',
            whyLocationMatters: 'Basin valley',
            routines: [],
            indoorHacks: [],
            sustainableAlternatives: [],
            communityActions: [],
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 })
      );

    const plan = await generateActionPlanApi(PROFILE, SNAPSHOT);
    expect(plan.advisoryHeadline).toBe('Run HEPA indoors');

    await expect(generateActionPlanApi(PROFILE, SNAPSHOT)).rejects.toThrow('Rate limit exceeded');
  });

  it('posts questions to askAirQualityAdvisorApi and handles malformed JSON fallbacks', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            answer: 'Wait until 14:00.',
            keyTakeaways: ['Cleanest window starts 14:00'],
            directImpactNote: 'Avoids peak PM2.5.',
            safeNextStep: 'Wear N95 outdoors.',
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(new Response('<html>502 Bad Gateway</html>', { status: 502 }));

    const answer = await askAirQualityAdvisorApi('Safe to jog?', PROFILE, SNAPSHOT);
    expect(answer.answer).toBe('Wait until 14:00.');

    await expect(askAirQualityAdvisorApi('Safe to jog?', PROFILE, SNAPSHOT)).rejects.toThrow(
      'Could not retrieve an answer.'
    );
  });
});
