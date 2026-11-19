/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  ActionPlanResponse,
  calculateInversionRisk,
  classifyAqi,
  findCleanestVentilationWindow,
  HourlyForecastPoint,
  sanitizeText,
  simulateActionImpact,
  validateAskQuestion,
  validateCityQuery,
  validateCoordinates,
  validateHouseholdProfile,
} from '../src/shared/airQuality';

describe('AQI Classification & Thermal Inversion Physics', () => {
  it('classifies US AQI thresholds with explicit text labels and non-hue symbols', () => {
    expect(classifyAqi(32).level).toBe('Good');
    expect(classifyAqi(32).symbol).toBe('check');

    expect(classifyAqi(88).level).toBe('Moderate');
    expect(classifyAqi(125).level).toBe('Sensitive');
    expect(classifyAqi(178).level).toBe('Unhealthy');
    expect(classifyAqi(240).level).toBe('Very Unhealthy');
    expect(classifyAqi(350).level).toBe('Hazardous');
  });

  it('models severe thermal inversion when cold air, calm winds, and high PM2.5 coincide', () => {
    const severe = calculateInversionRisk({
      temperatureC: -3,
      windSpeedKmh: 3.5,
      pm25: 68,
      humidityPct: 82,
    });
    expect(severe.level).toBe('Severe');
    expect(severe.score).toBeGreaterThanOrEqual(65);

    const low = calculateInversionRisk({
      temperatureC: 16,
      windSpeedKmh: 24,
      pm25: 7,
      humidityPct: 45,
    });
    expect(low.level).toBe('Low');
    expect(low.score).toBeLessThan(35);
  });

  it('identifies the cleanest 2-hour ventilation window from hourly forecast data', () => {
    const hourly: HourlyForecastPoint[] = [
      { timeIso: '2026-11-19T08:00', hourLabel: '08:00', pm25: 52, pm10: 70, usAqi: 142, windSpeedKmh: 4, temperatureC: 0 },
      { timeIso: '2026-11-19T09:00', hourLabel: '09:00', pm25: 48, pm10: 66, usAqi: 132, windSpeedKmh: 5, temperatureC: 1 },
      { timeIso: '2026-11-19T13:00', hourLabel: '13:00', pm25: 14, pm10: 22, usAqi: 55, windSpeedKmh: 16, temperatureC: 6 },
      { timeIso: '2026-11-19T14:00', hourLabel: '14:00', pm25: 12, pm10: 20, usAqi: 50, windSpeedKmh: 18, temperatureC: 7 },
      { timeIso: '2026-11-19T19:00', hourLabel: '19:00', pm25: 61, pm10: 84, usAqi: 154, windSpeedKmh: 3, temperatureC: 1 },
    ];

    const window = findCleanestVentilationWindow(hourly);
    expect(window.startHour).toBe('13:00');
    expect(window.endHour).toBe('14:00');
    expect(window.avgPm25).toBe(13);
    expect(window.avgAqi).toBe(53);
  });
});

describe('Household Impact Simulator', () => {
  const samplePlan: ActionPlanResponse = {
    generatedAtIso: '2026-11-19T08:00:00Z',
    advisoryHeadline: 'Keep windows sealed until 13:00 and prioritize HEPA circulation.',
    advisorySummary: 'Morning thermal inversion traps particulates at street level.',
    whyLocationMatters: 'Valley topography slows morning dispersion.',
    routines: [
      {
        id: 'r1',
        timeWindow: '07:30–09:00',
        title: 'Shift outdoor errands to afternoon window',
        guidance: 'Avoid brisk outdoor activity during peak morning rush.',
        directImpact: 'Cuts inhaled fine particulate dose during peak inversion.',
        pm25ExposureReductionPct: 25,
        co2eSavedKg: 1.5,
        pm25EmissionAvoidedGrams: 0.8,
      },
    ],
    indoorHacks: [
      {
        id: 'h1',
        title: 'Run continuous HEPA purifier in bedroom',
        difficulty: 'Low-Cost DIY',
        stepByStep: 'Place unit away from walls on medium continuous setting.',
        directImpact: 'Captures fine aerosols before deep lung inhalation.',
        pm25ExposureReductionPct: 40,
        co2eSavedKg: 0.0,
        pm25EmissionAvoidedGrams: 0.0,
      },
    ],
    sustainableAlternatives: [
      {
        id: 'a1',
        currentHabit: 'Solo cold-start car trips',
        sustainableSwap: 'Batch errands or ride rail transit',
        whyItHelps: 'Cold engines emit peak winter particulates in the first 3 km.',
        directImpact: 'Eliminates cold-start tailpipe exhaust near schools.',
        pm25ExposureReductionPct: 10,
        co2eSavedKg: 3.2,
        pm25EmissionAvoidedGrams: 2.4,
      },
    ],
    communityActions: [],
  };

  it('uses diminishing-returns physics and sums daily CO2e and PM2.5 savings', () => {
    const result = simulateActionImpact(['r1', 'h1', 'a1'], samplePlan, 50);
    // 1 - (0.75 * 0.60 * 0.90) = 1 - 0.405 = 59.5% -> rounded 60%
    expect(result.indoorExposureReductionPct).toBe(60);
    expect(result.selectedCount).toBe(3);
    expect(result.totalActionableCount).toBe(3);
    expect(result.co2eSavedDailyKg).toBe(4.7);
    expect(result.pm25EmissionsAvoidedDailyGrams).toBe(3.2);
    expect(result.projectedIndoorPm25).toBeLessThan(32.5);
  });

  it('returns zero mitigation when no actions are selected', () => {
    const result = simulateActionImpact([], samplePlan, 40);
    expect(result.indoorExposureReductionPct).toBe(0);
    expect(result.co2eSavedDailyKg).toBe(0);
    expect(result.projectedIndoorPm25).toBe(26);
  });
});

describe('Security & Input Validation', () => {
  it('sanitizes control characters and HTML angle brackets', () => {
    expect(sanitizeText('Milan <script>alert(1)</script>\n\t', 50)).toBe('Milan scriptalert(1)/script');
  });

  it('validates city queries and rejects invalid inputs', () => {
    expect(validateCityQuery('Salt Lake City')).toEqual({ ok: true, city: 'Salt Lake City' });
    expect(validateCityQuery('A').ok).toBe(false);
    expect(validateCityQuery('City; DROP TABLE users;').ok).toBe(false);
  });

  it('validates geographic coordinates within bounds', () => {
    expect(validateCoordinates(40.7608, -111.891)).toEqual({ ok: true, lat: 40.761, lon: -111.891 });
    expect(validateCoordinates(120, 10).ok).toBe(false);
    expect(validateCoordinates('abc', 10).ok).toBe(false);
  });

  it('validates household profile enums and clamps numeric counts', () => {
    const valid = validateHouseholdProfile({
      city: 'Denver',
      adults: 99,
      children: -2,
      seniors: 1,
      respiratorySensitivity: true,
      homeType: 'apartment',
      heatingSource: 'heat_pump',
      commuteMode: 'public_transit',
      filtrationSetup: 'hepa_purifier',
      lifestyleNotes: 'Early shift',
    });
    expect(valid.ok).toBe(true);
    if (valid.ok) {
      expect(valid.profile.adults).toBe(12);
      expect(valid.profile.children).toBe(0);
    }

    const invalidEnum = validateHouseholdProfile({
      city: 'Denver',
      homeType: 'castle',
      heatingSource: 'heat_pump',
      commuteMode: 'public_transit',
      filtrationSetup: 'hepa_purifier',
    });
    expect(invalidEnum.ok).toBe(false);
  });

  it('enforces minimum length on assistant questions', () => {
    expect(validateAskQuestion('Hi').ok).toBe(false);
    expect(validateAskQuestion('Is it safe to run outdoors today?').ok).toBe(true);
  });
});
