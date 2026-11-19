/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AirQualitySnapshot,
  CommuteMode,
  FiltrationSetup,
  HeatingSource,
  HomeType,
  HouseholdProfile,
  InversionRiskLevel,
} from './types.ts';

/**
 * Strips ASCII control characters, normalizes whitespace, removes angle brackets,
 * and truncates strings to a safe maximum length.
 */
export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  let cleaned = '';
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 32 || code === 127) {
      cleaned += ' ';
    } else if (value[i] !== '<' && value[i] !== '>') {
      cleaned += value[i];
    }
  }
  return cleaned.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

const VALID_HOME_TYPES: ReadonlySet<HomeType> = new Set(['apartment', 'detached_house', 'townhouse']);
const VALID_HEATING: ReadonlySet<HeatingSource> = new Set([
  'heat_pump',
  'natural_gas',
  'wood_or_coal',
  'district_heating',
]);
const VALID_COMMUTE: ReadonlySet<CommuteMode> = new Set([
  'private_car',
  'public_transit',
  'carpool',
  'walk_or_bike',
  'remote_hybrid',
]);
const VALID_FILTRATION: ReadonlySet<FiltrationSetup> = new Set([
  'none',
  'basic_hvac',
  'hepa_purifier',
  'diy_corsi_rosenthal',
]);
const VALID_INVERSION_LEVELS: ReadonlySet<InversionRiskLevel> = new Set([
  'Low',
  'Elevated',
  'Severe',
]);

function clampNumber(raw: unknown, fallback: number, min: number, max: number, decimals = 1): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  const clamped = Math.min(max, Math.max(min, n));
  const factor = Math.pow(10, decimals);
  return Math.round(clamped * factor) / factor;
}

function clampInt(raw: unknown, fallback: number, min: number, max: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Validates and sanitizes a city query string.
 */
export function validateCityQuery(raw: unknown): { ok: true; city: string } | { ok: false; error: string } {
  const city = sanitizeText(raw, 80);
  if (city.length < 2) {
    return { ok: false, error: 'Please enter a valid city name (at least 2 characters).' };
  }
  if (!/^[\p{L}\p{N}\s,.'-]+$/u.test(city)) {
    return { ok: false, error: 'City name contains unsupported characters.' };
  }
  return { ok: true, city };
}

/**
 * Validates latitude and longitude bounds.
 */
export function validateCoordinates(
  rawLat: unknown,
  rawLon: unknown
): { ok: true; lat: number; lon: number } | { ok: false; error: string } {
  const lat = typeof rawLat === 'number' ? rawLat : Number(rawLat);
  const lon = typeof rawLon === 'number' ? rawLon : Number(rawLon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, error: 'Latitude and longitude must be valid numbers.' };
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return { ok: false, error: 'Coordinates are out of geographic bounds.' };
  }
  return { ok: true, lat: Math.round(lat * 1000) / 1000, lon: Math.round(lon * 1000) / 1000 };
}

/**
 * Validates and clamps a HouseholdProfile payload submitted by clients.
 */
export function validateHouseholdProfile(
  raw: unknown
): { ok: true; profile: HouseholdProfile } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Household profile must be a JSON object.' };
  }
  const obj = raw as Record<string, unknown>;
  const cityCheck = validateCityQuery(obj.city);
  if (!cityCheck.ok) {
    return { ok: false, error: cityCheck.error };
  }

  const homeType = obj.homeType as HomeType;
  const heatingSource = obj.heatingSource as HeatingSource;
  const commuteMode = obj.commuteMode as CommuteMode;
  const filtrationSetup = obj.filtrationSetup as FiltrationSetup;

  if (!VALID_HOME_TYPES.has(homeType)) {
    return { ok: false, error: 'Invalid home type selection.' };
  }
  if (!VALID_HEATING.has(heatingSource)) {
    return { ok: false, error: 'Invalid heating source selection.' };
  }
  if (!VALID_COMMUTE.has(commuteMode)) {
    return { ok: false, error: 'Invalid commute mode selection.' };
  }
  if (!VALID_FILTRATION.has(filtrationSetup)) {
    return { ok: false, error: 'Invalid air filtration selection.' };
  }

  return {
    ok: true,
    profile: {
      city: cityCheck.city,
      adults: clampInt(obj.adults, 2, 1, 12),
      children: clampInt(obj.children, 0, 0, 12),
      seniors: clampInt(obj.seniors, 0, 0, 12),
      respiratorySensitivity: Boolean(obj.respiratorySensitivity),
      homeType,
      heatingSource,
      commuteMode,
      filtrationSetup,
      lifestyleNotes: sanitizeText(obj.lifestyleNotes ?? '', 280),
    },
  };
}

/**
 * Validates and sanitizes a natural-language user question.
 */
export function validateAskQuestion(raw: unknown): { ok: true; question: string } | { ok: false; error: string } {
  const question = sanitizeText(raw, 400);
  if (question.length < 4) {
    return { ok: false, error: 'Please enter a question of at least 4 characters.' };
  }
  return { ok: true, question };
}

/**
 * Strictly sanitizes and bounds-checks an optional client-supplied AirQualitySnapshot
 * before passing it to server-side AI prompt context.
 */
export function sanitizeAirQualitySnapshot(raw: unknown): AirQualitySnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const locationName = sanitizeText(obj.locationName, 80);
  if (locationName.length < 2) return null;
  if (typeof obj.usAqi !== 'number' || typeof obj.pm25 !== 'number') return null;

  const invRaw = (obj.inversionRisk && typeof obj.inversionRisk === 'object'
    ? obj.inversionRisk
    : {}) as Record<string, unknown>;
  const winRaw = (obj.cleanestWindow && typeof obj.cleanestWindow === 'object'
    ? obj.cleanestWindow
    : {}) as Record<string, unknown>;

  const rawLevel = invRaw.level as InversionRiskLevel;
  const level: InversionRiskLevel = VALID_INVERSION_LEVELS.has(rawLevel) ? rawLevel : 'Elevated';

  return {
    locationName,
    regionLabel: sanitizeText(obj.regionLabel, 80) || 'Urban Station',
    latitude: clampNumber(obj.latitude, 0, -90, 90, 3),
    longitude: clampNumber(obj.longitude, 0, -180, 180, 3),
    observedAtIso: sanitizeText(obj.observedAtIso, 32) || new Date().toISOString(),
    usAqi: clampInt(obj.usAqi, 50, 0, 500),
    pm25: clampNumber(obj.pm25, 15, 0, 1000, 1),
    pm10: clampNumber(obj.pm10, 20, 0, 1500, 1),
    no2: clampNumber(obj.no2, 20, 0, 1000, 1),
    so2: clampNumber(obj.so2, 2, 0, 500, 1),
    co: clampNumber(obj.co, 200, 0, 20000, 0),
    temperatureC: clampNumber(obj.temperatureC, 0, -55, 55, 1),
    humidityPct: clampInt(obj.humidityPct, 60, 0, 100),
    windSpeedKmh: clampNumber(obj.windSpeedKmh, 5, 0, 200, 1),
    inversionRisk: {
      level,
      score: clampInt(invRaw.score, 50, 0, 100),
      summary: sanitizeText(invRaw.summary, 160) || 'Winter dispersion monitored',
      trappingMechanism:
        sanitizeText(invRaw.trappingMechanism, 260) ||
        'Local wind speed and temperature regulate particulate buildup.',
    },
    cleanestWindow: {
      startHour: sanitizeText(winRaw.startHour, 10) || '13:00',
      endHour: sanitizeText(winRaw.endHour, 10) || '15:00',
      avgPm25: clampNumber(winRaw.avgPm25, 15, 0, 1000, 1),
      avgAqi: clampInt(winRaw.avgAqi, 50, 0, 500),
      recommendation:
        sanitizeText(winRaw.recommendation, 220) ||
        'Monitor hourly air readings before opening windows.',
    },
    hourly: [],
    isSimulatedEpisode: Boolean(obj.isSimulatedEpisode),
  };
}
