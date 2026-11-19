/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HeatingSource = 'heat_pump' | 'natural_gas' | 'wood_or_coal' | 'district_heating';
export type CommuteMode = 'private_car' | 'public_transit' | 'carpool' | 'walk_or_bike' | 'remote_hybrid';
export type FiltrationSetup = 'none' | 'basic_hvac' | 'hepa_purifier' | 'diy_corsi_rosenthal';
export type HomeType = 'apartment' | 'detached_house' | 'townhouse';

export type AqiLevel =
  | 'Good'
  | 'Moderate'
  | 'Sensitive'
  | 'Unhealthy'
  | 'Very Unhealthy'
  | 'Hazardous';

export type InversionRiskLevel = 'Low' | 'Elevated' | 'Severe';

export interface HouseholdProfile {
  city: string;
  adults: number;
  children: number;
  seniors: number;
  respiratorySensitivity: boolean;
  homeType: HomeType;
  heatingSource: HeatingSource;
  commuteMode: CommuteMode;
  filtrationSetup: FiltrationSetup;
  lifestyleNotes: string;
}

export interface HourlyForecastPoint {
  timeIso: string;
  hourLabel: string;
  pm25: number;
  pm10: number;
  usAqi: number;
  windSpeedKmh: number;
  temperatureC: number;
}

export interface InversionRiskAssessment {
  level: InversionRiskLevel;
  score: number;
  summary: string;
  trappingMechanism: string;
}

export interface VentilationWindow {
  startHour: string;
  endHour: string;
  avgPm25: number;
  avgAqi: number;
  recommendation: string;
}

export interface AirQualitySnapshot {
  locationName: string;
  regionLabel: string;
  latitude: number;
  longitude: number;
  observedAtIso: string;
  usAqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  temperatureC: number;
  humidityPct: number;
  windSpeedKmh: number;
  inversionRisk: InversionRiskAssessment;
  cleanestWindow: VentilationWindow;
  hourly: HourlyForecastPoint[];
}

export interface RoutineStep {
  id: string;
  timeWindow: string;
  title: string;
  guidance: string;
  directImpact: string;
  pm25ExposureReductionPct: number;
  co2eSavedKg: number;
  pm25EmissionAvoidedGrams: number;
}

export interface IndoorHack {
  id: string;
  title: string;
  difficulty: 'Zero-Cost Habit' | 'Low-Cost DIY' | 'Equipment Upgrade';
  stepByStep: string;
  directImpact: string;
  pm25ExposureReductionPct: number;
  co2eSavedKg: number;
  pm25EmissionAvoidedGrams: number;
}

export interface SustainableAlternative {
  id: string;
  currentHabit: string;
  sustainableSwap: string;
  whyItHelps: string;
  directImpact: string;
  pm25ExposureReductionPct: number;
  co2eSavedKg: number;
  pm25EmissionAvoidedGrams: number;
}

export interface CommunityAction {
  id: string;
  title: string;
  whoCanJoin: string;
  actionSummary: string;
  collectiveImpact: string;
}

export interface ActionPlanResponse {
  generatedAtIso: string;
  advisoryHeadline: string;
  advisorySummary: string;
  whyLocationMatters: string;
  routines: RoutineStep[];
  indoorHacks: IndoorHack[];
  sustainableAlternatives: SustainableAlternative[];
  communityActions: CommunityAction[];
}

export interface AskQuestionResponse {
  answer: string;
  keyTakeaways: string[];
  directImpactNote: string;
  safeNextStep: string;
}

export interface ImpactSimulationResult {
  selectedCount: number;
  totalActionableCount: number;
  indoorExposureReductionPct: number;
  projectedIndoorPm25: number;
  co2eSavedDailyKg: number;
  co2eSavedMonthlyKg: number;
  pm25EmissionsAvoidedDailyGrams: number;
  dominantDriver: string;
}

export interface AqiClassification {
  level: AqiLevel;
  label: string;
  shortGuidance: string;
  textClass: string;
  surfaceClass: string;
  borderClass: string;
  barColor: string;
  symbol: 'check' | 'info' | 'alert' | 'warning';
}

export function classifyAqi(usAqi: number): AqiClassification {
  const safeAqi = Number.isFinite(usAqi) ? Math.max(0, Math.round(usAqi)) : 0;

  if (safeAqi <= 50) {
    return {
      level: 'Good',
      label: 'Good Air Quality',
      shortGuidance: 'Ideal window for outdoor movement and cross-ventilating indoor rooms.',
      textClass: 'text-emerald-800',
      surfaceClass: 'bg-emerald-50',
      borderClass: 'border-emerald-200',
      barColor: '#15803d',
      symbol: 'check',
    };
  }
  if (safeAqi <= 100) {
    return {
      level: 'Moderate',
      label: 'Moderate Haze',
      shortGuidance: 'Generally tolerable; sensitive households should shorten vigorous roadside exercise.',
      textClass: 'text-amber-800',
      surfaceClass: 'bg-amber-50',
      borderClass: 'border-amber-200',
      barColor: '#b45309',
      symbol: 'info',
    };
  }
  if (safeAqi <= 150) {
    return {
      level: 'Sensitive',
      label: 'Unhealthy for Sensitive Groups',
      shortGuidance: 'Children, older adults, and asthma households should limit prolonged outdoor exertion.',
      textClass: 'text-orange-800',
      surfaceClass: 'bg-orange-50',
      borderClass: 'border-orange-200',
      barColor: '#c2410c',
      symbol: 'alert',
    };
  }
  if (safeAqi <= 200) {
    return {
      level: 'Unhealthy',
      label: 'Unhealthy Winter Smog',
      shortGuidance: 'Keep windows sealed, run indoor filtration continuously, and avoid burning solid fuels.',
      textClass: 'text-rose-800',
      surfaceClass: 'bg-rose-50',
      borderClass: 'border-rose-200',
      barColor: '#be123c',
      symbol: 'warning',
    };
  }
  if (safeAqi <= 300) {
    return {
      level: 'Very Unhealthy',
      label: 'Very Unhealthy Smog Episode',
      shortGuidance: 'Move all family exercise indoors, wear N95/KF94 masks outdoors, and run clean-air rooms.',
      textClass: 'text-red-900',
      surfaceClass: 'bg-red-50',
      borderClass: 'border-red-300',
      barColor: '#991b1b',
      symbol: 'warning',
    };
  }
  return {
    level: 'Hazardous',
    label: 'Hazardous Air Emergency',
    shortGuidance: 'Strict indoor shelter recommended with continuous HEPA filtration and zero combustion.',
    textClass: 'text-red-950',
    surfaceClass: 'bg-red-100',
    borderClass: 'border-red-400',
    barColor: '#7f1d1d',
    symbol: 'warning',
  };
}

export function calculateInversionRisk(params: {
  temperatureC: number;
  windSpeedKmh: number;
  pm25: number;
  humidityPct: number;
}): InversionRiskAssessment {
  const { temperatureC, windSpeedKmh, pm25, humidityPct } = params;

  let score = 0;
  if (temperatureC <= 2) score += 35;
  else if (temperatureC <= 8) score += 22;
  else if (temperatureC <= 14) score += 10;

  if (windSpeedKmh <= 6) score += 35;
  else if (windSpeedKmh <= 12) score += 20;
  else if (windSpeedKmh <= 18) score += 8;

  if (pm25 >= 55) score += 25;
  else if (pm25 >= 25) score += 15;
  else if (pm25 >= 12) score += 7;

  if (humidityPct >= 75) score += 5;

  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));

  if (clampedScore >= 65) {
    return {
      level: 'Severe',
      score: clampedScore,
      summary: 'Strong cold-air trapping likely near street level',
      trappingMechanism:
        'Calm winds and cold surface air create a thermal lid that prevents tailpipe and heating smoke from rising.',
    };
  }
  if (clampedScore >= 35) {
    return {
      level: 'Elevated',
      score: clampedScore,
      summary: 'Slow dispersion; evening and dawn smog buildup expected',
      trappingMechanism:
        'Light winds only partially mix urban emissions; pollution spikes typically occur during morning and evening commutes.',
    };
  }
  return {
    level: 'Low',
    score: clampedScore,
    summary: 'Active airflow is dispersing surface particulates',
    trappingMechanism:
      'Stronger winds or milder air mixing help dilute fine particulates rather than concentrating them at breathing height.',
  };
}

export function findCleanestVentilationWindow(hourly: HourlyForecastPoint[]): VentilationWindow {
  if (!hourly.length) {
    return {
      startHour: '13:00',
      endHour: '15:00',
      avgPm25: 0,
      avgAqi: 0,
      recommendation: 'Monitor hourly air readings before opening windows.',
    };
  }

  if (hourly.length === 1) {
    const point = hourly[0];
    return {
      startHour: point.hourLabel,
      endHour: point.hourLabel,
      avgPm25: Math.round(point.pm25 * 10) / 10,
      avgAqi: Math.round(point.usAqi),
      recommendation:
        point.usAqi <= 100
          ? 'Brief 10-minute cross-ventilation is reasonable during this window.'
          : 'Keep windows closed and rely on mechanical filtration instead of natural airing.',
    };
  }

  let bestIndex = 0;
  let bestAvgPm25 = Number.POSITIVE_INFINITY;

  for (let i = 0; i < hourly.length - 1; i++) {
    const pairAvg = (hourly[i].pm25 + hourly[i + 1].pm25) / 2;
    if (pairAvg < bestAvgPm25) {
      bestAvgPm25 = pairAvg;
      bestIndex = i;
    }
  }

  const first = hourly[bestIndex];
  const second = hourly[bestIndex + 1];
  const avgAqi = Math.round((first.usAqi + second.usAqi) / 2);
  const roundedPm25 = Math.round(bestAvgPm25 * 10) / 10;

  const recommendation =
    avgAqi <= 75
      ? `Lowest outdoor PM2.5 window (${roundedPm25} µg/m³). Good time for brief 10-minute airing or essential outdoor errands.`
      : avgAqi <= 125
        ? `Relative dip in smog (${roundedPm25} µg/m³), though haze persists. Keep outings short and resume HEPA filtration indoors.`
        : `Even the cleanest window remains elevated (${roundedPm25} µg/m³). Keep windows sealed and run indoor air cleaning continuously.`;

  return {
    startHour: first.hourLabel,
    endHour: second.hourLabel,
    avgPm25: roundedPm25,
    avgAqi,
    recommendation,
  };
}

export function simulateActionImpact(
  selectedIds: ReadonlyArray<string>,
  plan: ActionPlanResponse | null,
  baselineOutdoorPm25: number
): ImpactSimulationResult {
  const safeOutdoorPm25 = Number.isFinite(baselineOutdoorPm25) ? Math.max(1, baselineOutdoorPm25) : 35;
  // Unmitigated indoor infiltration baseline during winter closed-window conditions (~65% of outdoor PM2.5)
  const unmitigatedIndoorPm25 = safeOutdoorPm25 * 0.65;

  if (!plan) {
    return {
      selectedCount: 0,
      totalActionableCount: 0,
      indoorExposureReductionPct: 0,
      projectedIndoorPm25: Math.round(unmitigatedIndoorPm25 * 10) / 10,
      co2eSavedDailyKg: 0,
      co2eSavedMonthlyKg: 0,
      pm25EmissionsAvoidedDailyGrams: 0,
      dominantDriver: 'Generate a personalized plan to simulate household impact.',
    };
  }

  const actionableItems = [
    ...plan.routines.map((r) => ({ ...r, kind: 'routine' as const })),
    ...plan.indoorHacks.map((h) => ({ ...h, kind: 'indoor' as const })),
    ...plan.sustainableAlternatives.map((s) => ({
      ...s,
      title: s.sustainableSwap,
      kind: 'alternative' as const,
    })),
  ];

  const selectedSet = new Set(selectedIds);
  const chosen = actionableItems.filter((item) => selectedSet.has(item.id));

  // Multiplicative diminishing-returns model so combined exposure reduction never exceeds physical 92% ceiling
  let remainingExposureFactor = 1;
  let co2eSavedDailyKg = 0;
  let pm25EmissionsAvoidedDailyGrams = 0;
  let topItem: { title: string; score: number } | null = null;

  for (const item of chosen) {
    const pct = Math.min(75, Math.max(0, item.pm25ExposureReductionPct)) / 100;
    remainingExposureFactor *= 1 - pct;
    co2eSavedDailyKg += Math.max(0, item.co2eSavedKg);
    pm25EmissionsAvoidedDailyGrams += Math.max(0, item.pm25EmissionAvoidedGrams);

    const score = item.pm25ExposureReductionPct + item.co2eSavedKg * 4 + item.pm25EmissionAvoidedGrams * 2;
    if (!topItem || score > topItem.score) {
      topItem = { title: item.title, score };
    }
  }

  const rawReductionPct = (1 - remainingExposureFactor) * 100;
  const boundedReductionPct = Math.min(92, Math.round(rawReductionPct));
  const projectedIndoorPm25 =
    Math.round(unmitigatedIndoorPm25 * (1 - boundedReductionPct / 100) * 10) / 10;

  return {
    selectedCount: chosen.length,
    totalActionableCount: actionableItems.length,
    indoorExposureReductionPct: boundedReductionPct,
    projectedIndoorPm25,
    co2eSavedDailyKg: Math.round(co2eSavedDailyKg * 10) / 10,
    co2eSavedMonthlyKg: Math.round(co2eSavedDailyKg * 30),
    pm25EmissionsAvoidedDailyGrams: Math.round(pm25EmissionsAvoidedDailyGrams * 10) / 10,
    dominantDriver: topItem
      ? topItem.title
      : 'Select one or more actions below to quantify your household air and emission impact.',
  };
}

/**
 * Strip control characters and angle brackets to ensure clean, safe plain-text values.
 */
export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
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

function clampInt(raw: unknown, fallback: number, min: number, max: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

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

  const adults = clampInt(obj.adults, 2, 1, 12);
  const children = clampInt(obj.children, 0, 0, 12);
  const seniors = clampInt(obj.seniors, 0, 0, 12);

  return {
    ok: true,
    profile: {
      city: cityCheck.city,
      adults,
      children,
      seniors,
      respiratorySensitivity: Boolean(obj.respiratorySensitivity),
      homeType,
      heatingSource,
      commuteMode,
      filtrationSetup,
      lifestyleNotes: sanitizeText(obj.lifestyleNotes ?? '', 280),
    },
  };
}

export function validateAskQuestion(raw: unknown): { ok: true; question: string } | { ok: false; error: string } {
  const question = sanitizeText(raw, 400);
  if (question.length < 4) {
    return { ok: false, error: 'Please enter a question of at least 4 characters.' };
  }
  return { ok: true, question };
}
