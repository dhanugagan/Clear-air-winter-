/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'node:http';
import { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApiApp, createRateLimiter } from '../server/app';
import { TtlCache } from '../server/services/airQualityService';
import {
  ActionPlanResponse,
  AirQualitySnapshot,
  AskQuestionResponse,
} from '../src/shared/airQuality';

const MOCK_SNAPSHOT: AirQualitySnapshot = {
  locationName: 'Milan',
  regionLabel: 'Lombardy, Italy',
  latitude: 45.46,
  longitude: 9.19,
  observedAtIso: '2026-11-19T09:00',
  usAqi: 132,
  pm25: 48.2,
  pm10: 66.1,
  no2: 52.0,
  so2: 4.0,
  co: 410,
  temperatureC: 1.2,
  humidityPct: 84,
  windSpeedKmh: 3.4,
  inversionRisk: {
    level: 'Severe',
    score: 78,
    summary: 'Strong cold-air trapping likely near street level',
    trappingMechanism: 'Calm winds and cold surface air create a thermal lid.',
  },
  cleanestWindow: {
    startHour: '13:00',
    endHour: '14:00',
    avgPm25: 29.0,
    avgAqi: 87,
    recommendation: 'Relative dip in smog; keep outings brief.',
  },
  hourly: [],
};

const MOCK_PLAN: ActionPlanResponse = {
  generatedAtIso: '2026-11-19T09:05:00Z',
  advisoryHeadline: 'Seal windows during morning inversion and run indoor HEPA filtration.',
  advisorySummary: 'PM2.5 is elevated due to calm valley winds.',
  whyLocationMatters: 'Cold air pools in the Po Valley basin.',
  routines: [
    {
      id: 'r1',
      timeWindow: '13:00–14:00',
      title: 'Time essential errands to afternoon dip',
      guidance: 'Schedule dog walks and quick errands during peak mixing.',
      directImpact: 'Lowers inhaled PM2.5 by ~20%.',
      pm25ExposureReductionPct: 20,
      co2eSavedKg: 1.2,
      pm25EmissionAvoidedGrams: 0.9,
    },
  ],
  indoorHacks: [
    {
      id: 'h1',
      title: 'Create one clean-air bedroom',
      difficulty: 'Zero-Cost Habit',
      stepByStep: 'Close door and seal window gaps with rolled towels.',
      directImpact: 'Reduces overnight particulate infiltration.',
      pm25ExposureReductionPct: 30,
      co2eSavedKg: 0,
      pm25EmissionAvoidedGrams: 0,
    },
  ],
  sustainableAlternatives: [
    {
      id: 'a1',
      currentHabit: 'Short solo car trips',
      sustainableSwap: 'Metro transit pass',
      whyItHelps: 'Avoids cold-start urban exhaust.',
      directImpact: 'Prevents tailpipe PM2.5 near residential streets.',
      pm25ExposureReductionPct: 8,
      co2eSavedKg: 2.9,
      pm25EmissionAvoidedGrams: 1.8,
    },
  ],
  communityActions: [
    {
      id: 'c1',
      title: 'School drop-off idle-free pledge',
      whoCanJoin: 'Local parents',
      actionSummary: 'Turn off engines while waiting outside school gates.',
      collectiveImpact: 'Cuts morning hotspot NO2 and PM2.5.',
    },
  ],
};

const MOCK_ANSWER: AskQuestionResponse = {
  answer: 'Delay outdoor walks until 13:00 when winds rise slightly.',
  keyTakeaways: ['Keep windows sealed this morning', 'Run range hood when cooking'],
  directImpactNote: 'Avoids peak morning inversion exposure.',
  safeNextStep: 'Set purifier to medium continuous speed.',
};

describe('TtlCache & Rate Limiter Efficiency', () => {
  it('expires stale entries and caps maximum entry count', () => {
    const cache = new TtlCache<string>(2);
    cache.set('a', '1', 5000);
    cache.set('b', '2', 5000);
    cache.set('c', '3', 5000);

    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBe('2');
    expect(cache.get('c')).toBe('3');

    cache.set('expired', 'x', -10);
    expect(cache.get('expired')).toBeNull();
  });

  it('enforces sliding-window rate limits with HTTP 429', async () => {
    const miniApp = express();
    miniApp.use(createRateLimiter(2, 60_000));
    miniApp.get('/limited', (_req, res) => res.json({ ok: true }));

    const server = http.createServer(miniApp);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const addr = server.address() as AddressInfo;
    const url = `http://127.0.0.1:${addr.port}/limited`;

    try {
      expect((await fetch(url)).status).toBe(200);
      expect((await fetch(url)).status).toBe(200);
      expect((await fetch(url)).status).toBe(429);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
    }
  });
});

describe('Express API Security, Validation & Route Contracts', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApiApp({
      fetchByCity: async (city) => {
        if (city === 'UnknownCityXYZ') {
          throw new Error('Could not locate "UnknownCityXYZ". Try a nearby major city name.');
        }
        return { ...MOCK_SNAPSHOT, locationName: city };
      },
      fetchByCoords: async (lat, lon) => ({
        ...MOCK_SNAPSHOT,
        latitude: lat,
        longitude: lon,
      }),
      generatePlan: async () => MOCK_PLAN,
      askQuestion: async () => MOCK_ANSWER,
    });

    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('returns healthy status and security headers on /api/health', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(res.headers.get('x-powered-by')).toBeNull();

    const body = (await res.json()) as { status: string; service: string };
    expect(body.status).toBe('ok');
    expect(body.service).toBe('clearair-winter-api');
  });

  it('returns live air snapshot on valid GET /api/air-quality and 404 on unknown city', async () => {
    const okRes = await fetch(`${baseUrl}/api/air-quality?city=Milan`);
    expect(okRes.status).toBe(200);
    const data = (await okRes.json()) as AirQualitySnapshot;
    expect(data.locationName).toBe('Milan');
    expect(data.inversionRisk.level).toBe('Severe');

    const notFoundRes = await fetch(`${baseUrl}/api/air-quality?city=UnknownCityXYZ`);
    expect(notFoundRes.status).toBe(404);
  });

  it('returns air snapshot on valid coordinates GET /api/air-quality/coords', async () => {
    const res = await fetch(`${baseUrl}/api/air-quality/coords?lat=45.46&lon=9.19`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as AirQualitySnapshot;
    expect(data.latitude).toBe(45.46);
  });

  it('rejects invalid city queries and out-of-range coordinates with HTTP 400', async () => {
    const cityRes = await fetch(`${baseUrl}/api/air-quality?city=x`);
    expect(cityRes.status).toBe(400);

    const coordRes = await fetch(`${baseUrl}/api/air-quality/coords?lat=999&lon=10`);
    expect(coordRes.status).toBe(400);
  });

  it('generates structured action plan on valid POST /api/assistant/plan', async () => {
    const res = await fetch(`${baseUrl}/api/assistant/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: {
          city: 'Milan',
          adults: 2,
          children: 1,
          seniors: 0,
          respiratorySensitivity: true,
          homeType: 'apartment',
          heatingSource: 'natural_gas',
          commuteMode: 'private_car',
          filtrationSetup: 'basic_hvac',
          lifestyleNotes: 'Morning school drop-off',
        },
        airQuality: MOCK_SNAPSHOT,
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ActionPlanResponse;
    expect(body.advisoryHeadline).toContain('HEPA');
    expect(body.routines).toHaveLength(1);
    expect(body.indoorHacks).toHaveLength(1);
    expect(body.sustainableAlternatives).toHaveLength(1);
    expect(body.communityActions).toHaveLength(1);
  });

  it('answers contextual questions on valid POST /api/assistant/ask', async () => {
    const res = await fetch(`${baseUrl}/api/assistant/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'When is it safest to walk outdoors today?',
        profile: {
          city: 'Milan',
          adults: 2,
          children: 1,
          seniors: 0,
          respiratorySensitivity: true,
          homeType: 'apartment',
          heatingSource: 'natural_gas',
          commuteMode: 'public_transit',
          filtrationSetup: 'hepa_purifier',
          lifestyleNotes: '',
        },
        airQuality: MOCK_SNAPSHOT,
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as AskQuestionResponse;
    expect(body.answer).toContain('13:00');
    expect(body.keyTakeaways.length).toBeGreaterThan(0);
  });

  it('rejects malformed profile payloads and short questions with HTTP 400', async () => {
    const planRes = await fetch(`${baseUrl}/api/assistant/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: {
          city: 'Milan',
          homeType: 'invalid_type',
        },
      }),
    });
    expect(planRes.status).toBe(400);

    const askRes = await fetch(`${baseUrl}/api/assistant/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'no',
        profile: {
          city: 'Milan',
          adults: 2,
          children: 0,
          seniors: 0,
          respiratorySensitivity: false,
          homeType: 'apartment',
          heatingSource: 'heat_pump',
          commuteMode: 'public_transit',
          filtrationSetup: 'hepa_purifier',
          lifestyleNotes: '',
        },
      }),
    });
    expect(askRes.status).toBe(400);
  });
});
