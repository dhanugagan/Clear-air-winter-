/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  ActionPlanResponse,
  AirQualitySnapshot,
  HouseholdProfile,
  analyzeHouseholdEmissionProfile,
  buildFamilySafetyMatrix,
  calculateCommunityImpact,
  calculateInversionRisk,
  classifyAqi,
  createSevereSmogScenario,
  findCleanestVentilationWindow,
  formatShareableBulletin,
  getAdoptedImpactBreakdown,
  HourlyForecastPoint,
  sanitizeAirQualitySnapshot,
  sanitizeText,
  simulateActionImpact,
  validateAskQuestion,
  validateCityQuery,
  validateCoordinates,
  validateHouseholdProfile,
} from '../src/shared/airQuality';

const SAMPLE_PROFILE: HouseholdProfile = {
  city: 'Salt Lake City',
  adults: 2,
  children: 1,
  seniors: 0,
  respiratorySensitivity: true,
  homeType: 'apartment',
  heatingSource: 'wood_or_coal',
  commuteMode: 'private_car',
  filtrationSetup: 'none',
  lifestyleNotes: 'Morning school drop-off',
};

const SAMPLE_PLAN: ActionPlanResponse = {
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
  communityActions: [
    {
      id: 'c1',
      title: 'Idle-free school drop-off zone',
      whoCanJoin: 'Parents and teachers',
      actionSummary: 'Turn off engines while waiting outside school gates.',
      collectiveImpact: 'Cuts morning NO2 and PM2.5 spikes at child breathing height.',
    },
  ],
};

const BASE_SNAPSHOT: AirQualitySnapshot = {
  locationName: 'Milan',
  regionLabel: 'Lombardy, Italy',
  latitude: 45.46,
  longitude: 9.19,
  observedAtIso: '2026-11-19T09:00',
  usAqi: 42,
  pm25: 10.2,
  pm10: 14.5,
  no2: 22.0,
  so2: 2.1,
  co: 190,
  temperatureC: 9.0,
  humidityPct: 60,
  windSpeedKmh: 16.0,
  inversionRisk: {
    level: 'Low',
    score: 20,
    summary: 'Active airflow',
    trappingMechanism: 'Moderate winds disperse emissions.',
  },
  cleanestWindow: {
    startHour: '13:00',
    endHour: '14:00',
    avgPm25: 9.0,
    avgAqi: 38,
    recommendation: 'Good window for ventilation.',
  },
  hourly: [],
};

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

  it('creates a severe winter smog drill scenario preserving city context', () => {
    const scenario = createSevereSmogScenario(BASE_SNAPSHOT);
    expect(scenario.locationName).toBe('Milan');
    expect(scenario.isSimulatedEpisode).toBe(true);
    expect(scenario.usAqi).toBe(218);
    expect(scenario.inversionRisk.level).toBe('Severe');
    expect(scenario.hourly).toHaveLength(24);
    expect(scenario.cleanestWindow.startHour).toBe('13:00');
  });
});

describe('Household Diagnostics, Impact Simulator & Community Multiplier', () => {
  it('attributes household risk shares accurately across heating, commute, and filtration', () => {
    const diag = analyzeHouseholdEmissionProfile(SAMPLE_PROFILE, BASE_SNAPSHOT);
    expect(diag.heatingSharePct + diag.commuteSharePct + diag.infiltrationSharePct).toBe(100);
    expect(diag.topEmissionSource).toContain('Solid-fuel');
    expect(diag.filtrationEfficiencyLabel).toContain('None');
  });

  it('uses diminishing-returns physics and sums daily CO2e and PM2.5 savings', () => {
    const result = simulateActionImpact(['r1', 'h1', 'a1'], SAMPLE_PLAN, 50);
    expect(result.indoorExposureReductionPct).toBe(60);
    expect(result.selectedCount).toBe(3);
    expect(result.totalActionableCount).toBe(3);
    expect(result.co2eSavedDailyKg).toBe(4.7);
    expect(result.pm25EmissionsAvoidedDailyGrams).toBe(3.2);
    expect(result.projectedIndoorPm25).toBeLessThan(32.5);
  });

  it('returns zero mitigation when no actions are selected', () => {
    const result = simulateActionImpact([], SAMPLE_PLAN, 40);
    expect(result.indoorExposureReductionPct).toBe(0);
    expect(result.co2eSavedDailyKg).toBe(0);
    expect(result.projectedIndoorPm25).toBe(26);
  });

  it('calculates collective neighborhood savings and formats shareable bulletin', () => {
    const impact = simulateActionImpact(['r1', 'h1', 'a1'], SAMPLE_PLAN, 50);
    const community = calculateCommunityImpact(impact, 20, 1, 3);
    expect(community.participatingHouseholds).toBe(20);
    expect(community.cleanAirProtectedResidents).toBe(60);
    expect(community.monthlyCo2eAvoidedKg).toBeGreaterThan(impact.co2eSavedMonthlyKg * 20);

    const bulletin = formatShareableBulletin({
      snapshot: BASE_SNAPSHOT,
      plan: SAMPLE_PLAN,
      impact,
      community,
    });
    expect(bulletin).toContain('ClearAir Winter Neighborhood Bulletin — Milan');
    expect(bulletin).toContain('20 participating households');
    expect(bulletin).toContain('Idle-free school drop-off zone');
  });

  it('builds tailored safety directives and adopted causal breakdown items', () => {
    const severeSnapshot = createSevereSmogScenario(BASE_SNAPSHOT);
    const directives = buildFamilySafetyMatrix(severeSnapshot, SAMPLE_PROFILE);
    expect(directives).toHaveLength(4);
    expect(directives.every((d) => d.status === 'Protect')).toBe(true);

    const breakdown = getAdoptedImpactBreakdown(['r1', 'a1'], SAMPLE_PLAN);
    expect(breakdown).toHaveLength(2);
    expect(breakdown[0].category).toBe('Routine');
    expect(breakdown[1].category).toBe('Sustainable Swap');
    expect(breakdown[1].directImpact).toContain('cold-start');
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

  it('sanitizes and bounds-checks client-supplied air quality snapshots', () => {
    expect(sanitizeAirQualitySnapshot(null)).toBeNull();
    expect(sanitizeAirQualitySnapshot({ locationName: 'A', usAqi: 50, pm25: 10 })).toBeNull();

    const cleaned = sanitizeAirQualitySnapshot({
      locationName: 'Milan <script>alert(1)</script>',
      regionLabel: 'Lombardy',
      latitude: 145,
      longitude: -220,
      observedAtIso: '2026-11-19T09:00',
      usAqi: 999,
      pm25: -10,
      pm10: 5000,
      temperatureC: 120,
      humidityPct: 140,
      windSpeedKmh: -5,
      inversionRisk: {
        level: 'UnknownLevel',
        score: 250,
        summary: '<b>Trapped</b> air',
        trappingMechanism: 'Inversion cap',
      },
      cleanestWindow: {
        startHour: '13:00',
        endHour: '15:00',
        avgPm25: 12.4,
        avgAqi: 52,
        recommendation: 'Brief ventilation',
      },
      isSimulatedEpisode: true,
    });

    expect(cleaned).not.toBeNull();
    expect(cleaned?.locationName).toBe('Milan scriptalert(1)/script');
    expect(cleaned?.latitude).toBe(90);
    expect(cleaned?.longitude).toBe(-180);
    expect(cleaned?.usAqi).toBe(500);
    expect(cleaned?.pm25).toBe(0);
    expect(cleaned?.pm10).toBe(1500);
    expect(cleaned?.temperatureC).toBe(55);
    expect(cleaned?.humidityPct).toBe(100);
    expect(cleaned?.windSpeedKmh).toBe(0);
    expect(cleaned?.inversionRisk.level).toBe('Elevated');
    expect(cleaned?.inversionRisk.score).toBe(100);
    expect(cleaned?.inversionRisk.summary).toBe('bTrapped/b air');
    expect(cleaned?.isSimulatedEpisode).toBe(true);
  });
});
