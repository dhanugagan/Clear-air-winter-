/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionPlanResponse,
  AdoptedImpactItem,
  AirQualitySnapshot,
  AqiClassification,
  CommuteMode,
  CommunityMultiplierResult,
  FamilySafetyDirective,
  FiltrationSetup,
  HeatingSource,
  HourlyForecastPoint,
  HouseholdEmissionDiagnostic,
  HouseholdProfile,
  ImpactSimulationResult,
  InversionRiskAssessment,
  VentilationWindow,
} from './types.ts';

/**
 * Classifies US AQI into accessible severity levels paired with explicit symbols and text.
 */
export function classifyAqi(usAqi: number): AqiClassification {
  const safeAqi = Number.isFinite(usAqi) ? Math.max(0, Math.round(usAqi)) : 0;

  if (safeAqi <= 50) {
    return {
      level: 'Good',
      label: 'Good Air Quality',
      shortGuidance: 'Ideal window for outdoor movement and cross-ventilating indoor rooms.',
      textClass: 'text-emerald-900',
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
      textClass: 'text-amber-900',
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
      textClass: 'text-orange-900',
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
      textClass: 'text-rose-900',
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
      textClass: 'text-red-950',
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

/**
 * Estimates winter thermal inversion trapping risk from temperature, wind, PM2.5, and humidity.
 */
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

/**
 * Scans 24-hour particulate forecasts to locate the cleanest 2-hour airing/errand window.
 */
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

/**
 * Generates a realistic severe winter smog stress-test scenario anchored to the active city.
 */
export function createSevereSmogScenario(baseSnapshot: AirQualitySnapshot): AirQualitySnapshot {
  const scenarioHourly: HourlyForecastPoint[] = Array.from({ length: 24 }, (_, hour) => {
    const label = `${String(hour).padStart(2, '0')}:00`;
    const morningRush = hour >= 6 && hour <= 10 ? 1.25 : 1;
    const eveningHearth = hour >= 18 && hour <= 22 ? 1.32 : 1;
    const afternoonDip = hour >= 13 && hour <= 15 ? 0.62 : 1;
    const pm25 = Math.round(145 * morningRush * eveningHearth * afternoonDip * 10) / 10;
    const pm10 = Math.round(pm25 * 1.38 * 10) / 10;
    const usAqi = Math.min(295, Math.round(pm25 * 1.35 + 18));
    const windSpeedKmh = hour >= 13 && hour <= 15 ? 6.5 : 2.6;
    const temperatureC = hour >= 12 && hour <= 15 ? -1.5 : -5.0;

    return {
      timeIso: `2026-11-19T${label}`,
      hourLabel: label,
      pm25,
      pm10,
      usAqi,
      windSpeedKmh,
      temperatureC,
    };
  });

  const inversionRisk = calculateInversionRisk({
    temperatureC: -4.5,
    windSpeedKmh: 2.6,
    pm25: 168.4,
    humidityPct: 86,
  });

  return {
    ...baseSnapshot,
    usAqi: 218,
    pm25: 168.4,
    pm10: 232.0,
    no2: 94.2,
    so2: 18.6,
    co: 1180,
    temperatureC: -4.5,
    humidityPct: 86,
    windSpeedKmh: 2.6,
    inversionRisk,
    cleanestWindow: findCleanestVentilationWindow(scenarioHourly),
    hourly: scenarioHourly,
    isSimulatedEpisode: true,
  };
}

/**
 * Attributes household smog risk shares across heating, commuting, and indoor filtration.
 */
export function analyzeHouseholdEmissionProfile(
  profile: HouseholdProfile,
  snapshot: AirQualitySnapshot | null
): HouseholdEmissionDiagnostic {
  const heatingWeights: Record<HeatingSource, number> = {
    wood_or_coal: 55,
    natural_gas: 28,
    district_heating: 18,
    heat_pump: 10,
  };
  const commuteWeights: Record<CommuteMode, number> = {
    private_car: 45,
    carpool: 24,
    public_transit: 12,
    remote_hybrid: 8,
    walk_or_bike: 4,
  };
  const infiltrationWeights: Record<FiltrationSetup, number> = {
    none: 44,
    basic_hvac: 28,
    diy_corsi_rosenthal: 14,
    hepa_purifier: 10,
  };

  const hRaw = heatingWeights[profile.heatingSource];
  const cRaw = commuteWeights[profile.commuteMode];
  const iRaw = infiltrationWeights[profile.filtrationSetup];
  const total = hRaw + cRaw + iRaw;

  const heatingSharePct = Math.round((hRaw / total) * 100);
  const commuteSharePct = Math.round((cRaw / total) * 100);
  const infiltrationSharePct = Math.max(0, 100 - heatingSharePct - commuteSharePct);

  const topEmissionSource =
    profile.heatingSource === 'wood_or_coal'
      ? 'Solid-fuel hearth & wood smoke (high direct PM2.5)'
      : profile.commuteMode === 'private_car'
        ? 'Cold-start vehicle trips during morning inversion'
        : profile.heatingSource === 'natural_gas'
          ? 'Indoor gas stove NO₂ & combustion heating'
          : 'Low baseline combustion footprint';

  const outdoorPm = snapshot?.pm25 ?? 35;
  const topExposureRisk =
    profile.filtrationSetup === 'none' && outdoorPm >= 25
      ? 'Unfiltered outdoor PM2.5 seepage & indoor cooking peaks'
      : profile.respiratorySensitivity || profile.children > 0 || profile.seniors > 0
        ? 'Sensitive lung exposure during dawn & evening rush hours'
        : 'Peak roadside & indoor cooking particle spikes';

  const filtrationEfficiencyLabel =
    profile.filtrationSetup === 'hepa_purifier'
      ? 'High (~85–95% single-room capture)'
      : profile.filtrationSetup === 'diy_corsi_rosenthal'
        ? 'High (~80–90% high-CADR capture)'
        : profile.filtrationSetup === 'basic_hvac'
          ? 'Low (~20–35% for fine PM2.5)'
          : 'None (0% active capture)';

  return {
    heatingSharePct,
    commuteSharePct,
    infiltrationSharePct,
    topExposureRisk,
    topEmissionSource,
    filtrationEfficiencyLabel,
  };
}

/**
 * Simulates combined indoor exposure reduction and emission savings using diminishing-returns physics.
 */
export function simulateActionImpact(
  selectedIds: ReadonlyArray<string>,
  plan: ActionPlanResponse | null,
  baselineOutdoorPm25: number
): ImpactSimulationResult {
  const safeOutdoorPm25 = Number.isFinite(baselineOutdoorPm25) ? Math.max(1, baselineOutdoorPm25) : 35;
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
 * Scales household impact across participating neighborhood households.
 */
export function calculateCommunityImpact(
  impact: ImpactSimulationResult,
  participatingHouseholds: number,
  adoptedCommunityCount: number,
  householdMembersCount: number
): CommunityMultiplierResult {
  const safeHouseholds = Math.max(1, Math.min(500, Math.round(participatingHouseholds)));
  const safeMembers = Math.max(1, Math.round(householdMembersCount));
  const bonusFactor = 1 + Math.min(3, Math.max(0, adoptedCommunityCount)) * 0.12;

  const monthlyCo2eAvoidedKg = Math.round(impact.co2eSavedMonthlyKg * safeHouseholds * bonusFactor);
  const monthlyPm25AvoidedKg =
    Math.round(((impact.pm25EmissionsAvoidedDailyGrams * 30 * safeHouseholds * bonusFactor) / 1000) * 100) /
    100;

  return {
    participatingHouseholds: safeHouseholds,
    adoptedCommunityCount: Math.max(0, adoptedCommunityCount),
    monthlyCo2eAvoidedKg,
    monthlyPm25AvoidedKg,
    cleanAirProtectedResidents: safeHouseholds * safeMembers,
  };
}

/**
 * Formats a concise, plain-text neighborhood clean-air bulletin for copying or download.
 */
export function formatShareableBulletin(params: {
  snapshot: AirQualitySnapshot;
  plan: ActionPlanResponse;
  impact: ImpactSimulationResult;
  community: CommunityMultiplierResult;
}): string {
  const { snapshot, plan, impact, community } = params;
  const aqiMeta = classifyAqi(snapshot.usAqi);

  return [
    `ClearAir Winter Neighborhood Bulletin — ${snapshot.locationName}`,
    `Status: US AQI ${snapshot.usAqi} (${aqiMeta.label}) | PM2.5: ${snapshot.pm25} µg/m³ | Inversion Risk: ${snapshot.inversionRisk.level}`,
    `Cleanest 2h Ventilation Window: ${snapshot.cleanestWindow.startHour}–${snapshot.cleanestWindow.endHour} (Est. ${snapshot.cleanestWindow.avgPm25} µg/m³)`,
    '',
    `Advisory: ${plan.advisoryHeadline}`,
    plan.advisorySummary,
    '',
    'Top Household & Neighborhood Priorities:',
    ...plan.routines.slice(0, 2).map((r) => `- [${r.timeWindow}] ${r.title}: ${r.directImpact}`),
    ...plan.indoorHacks.slice(0, 2).map((h) => `- [Indoor] ${h.title}: ${h.directImpact}`),
    ...plan.communityActions.slice(0, 2).map((c) => `- [Community] ${c.title}: ${c.collectiveImpact}`),
    '',
    `Measured Impact (${community.participatingHouseholds} participating households):`,
    `- Indoor PM2.5 Exposure Cut: -${impact.indoorExposureReductionPct}% (projected ${impact.projectedIndoorPm25} µg/m³ indoors)`,
    `- Monthly Neighborhood CO2e Avoided: ${community.monthlyCo2eAvoidedKg} kg`,
    `- Monthly Direct PM2.5 Smoke Prevented: ${community.monthlyPm25AvoidedKg} kg`,
  ].join('\n');
}

/**
 * Produces four immediate household safety directives calibrated to live AQI and vulnerabilities.
 */
export function buildFamilySafetyMatrix(
  snapshot: AirQualitySnapshot,
  profile: HouseholdProfile
): FamilySafetyDirective[] {
  const hasVulnerable =
    profile.respiratorySensitivity || profile.children > 0 || profile.seniors > 0;
  const aqi = snapshot.usAqi;
  const highSmog = aqi > 150 || (hasVulnerable && aqi > 100);
  const moderateSmog = aqi > 75 || (hasVulnerable && aqi > 50);

  return [
    {
      id: 'outdoor',
      domain: 'Outdoor Activity',
      status: highSmog ? 'Protect' : moderateSmog ? 'Caution' : 'Clear',
      directive: highSmog
        ? 'Move brisk exercise & play indoors'
        : moderateSmog
          ? `Time short outings for ${snapshot.cleanestWindow.startHour}–${snapshot.cleanestWindow.endHour}`
          : 'Normal outdoor activity safe',
      rationale: highSmog
        ? `At US AQI ${aqi}, deep breathing outdoors multiplies fine particle lung deposition.`
        : moderateSmog
          ? 'Sensitive family members benefit from shifting walks away from rush-hour inversion peaks.'
          : `Current dispersion keeps street-level PM2.5 (${snapshot.pm25} µg/m³) within safer bounds.`,
    },
    {
      id: 'masking',
      domain: 'Commute & Masking',
      status: aqi > 150 ? 'Protect' : aqi > 100 || (hasVulnerable && aqi > 75) ? 'Caution' : 'Clear',
      directive:
        aqi > 150
          ? 'Fitted N95 / KF94 for all outdoor transit'
          : aqi > 100 || (hasVulnerable && aqi > 75)
            ? 'N95 / KN95 recommended on busy corridors'
            : 'No respirator needed; favor transit/walk',
      rationale:
        aqi > 100
          ? 'Well-fitted electrostatic respirators filter >94% of sub-2.5 µm combustion aerosols.'
          : 'Avoid idling engines during school drop-offs to keep local roadside NO₂ low.',
    },
    {
      id: 'ventilation',
      domain: 'Window Ventilation',
      status: aqi > 120 ? 'Protect' : aqi > 65 ? 'Caution' : 'Clear',
      directive:
        aqi > 120
          ? 'Keep exterior windows tightly sealed'
          : `Brief 10-min airing at ${snapshot.cleanestWindow.startHour}–${snapshot.cleanestWindow.endHour}`,
      rationale:
        aqi > 120
          ? `Outdoor PM2.5 (${snapshot.pm25} µg/m³) exceeds safe airing limits; seal drafts with door sweeps.`
          : `Opening opposite windows briefly during ${snapshot.cleanestWindow.startHour} refreshes CO₂ with minimal smog entry.`,
    },
    {
      id: 'filtration',
      domain: 'Indoor Filtration',
      status: highSmog || profile.filtrationSetup === 'none' ? 'Protect' : moderateSmog ? 'Caution' : 'Clear',
      directive:
        profile.filtrationSetup === 'none'
          ? 'Add HEPA or DIY Corsi-Rosenthal unit'
          : highSmog
            ? 'Run HEPA on High continuously; HVAC recirculate'
            : 'Run purifier on Medium during cooking/evenings',
      rationale:
        profile.filtrationSetup === 'none'
          ? 'Without active MERV-13/HEPA capture, indoor PM2.5 settles at ~65% of outdoor winter smog.'
          : 'Continuous air changes cut bedroom fine particulates overnight by 50–85%.',
    },
  ];
}

/**
 * Returns the itemized direct causal breakdown for all currently adopted household choices.
 */
export function getAdoptedImpactBreakdown(
  selectedIds: ReadonlyArray<string>,
  plan: ActionPlanResponse | null
): AdoptedImpactItem[] {
  if (!plan || !selectedIds.length) return [];
  const selectedSet = new Set(selectedIds);

  const items: AdoptedImpactItem[] = [];
  for (const r of plan.routines) {
    if (selectedSet.has(r.id)) {
      items.push({
        id: r.id,
        category: 'Routine',
        title: r.title,
        directImpact: r.directImpact,
        pm25ExposureReductionPct: r.pm25ExposureReductionPct,
        co2eSavedKg: r.co2eSavedKg,
        pm25EmissionAvoidedGrams: r.pm25EmissionAvoidedGrams,
      });
    }
  }
  for (const h of plan.indoorHacks) {
    if (selectedSet.has(h.id)) {
      items.push({
        id: h.id,
        category: 'Indoor Hack',
        title: h.title,
        directImpact: h.directImpact,
        pm25ExposureReductionPct: h.pm25ExposureReductionPct,
        co2eSavedKg: h.co2eSavedKg,
        pm25EmissionAvoidedGrams: h.pm25EmissionAvoidedGrams,
      });
    }
  }
  for (const s of plan.sustainableAlternatives) {
    if (selectedSet.has(s.id)) {
      items.push({
        id: s.id,
        category: 'Sustainable Swap',
        title: s.sustainableSwap,
        directImpact: s.directImpact,
        pm25ExposureReductionPct: s.pm25ExposureReductionPct,
        co2eSavedKg: s.co2eSavedKg,
        pm25EmissionAvoidedGrams: s.pm25EmissionAvoidedGrams,
      });
    }
  }
  return items;
}
