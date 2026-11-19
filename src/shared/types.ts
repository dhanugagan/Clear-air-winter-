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
  isSimulatedEpisode?: boolean;
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

export interface HouseholdEmissionDiagnostic {
  heatingSharePct: number;
  commuteSharePct: number;
  infiltrationSharePct: number;
  topExposureRisk: string;
  topEmissionSource: string;
  filtrationEfficiencyLabel: string;
}

export interface CommunityMultiplierResult {
  participatingHouseholds: number;
  adoptedCommunityCount: number;
  monthlyCo2eAvoidedKg: number;
  monthlyPm25AvoidedKg: number;
  cleanAirProtectedResidents: number;
}

export interface FamilySafetyDirective {
  id: string;
  domain: 'Outdoor Activity' | 'Commute & Masking' | 'Window Ventilation' | 'Indoor Filtration';
  status: 'Clear' | 'Caution' | 'Protect';
  directive: string;
  rationale: string;
}

export interface AdoptedImpactItem {
  id: string;
  category: 'Routine' | 'Indoor Hack' | 'Sustainable Swap';
  title: string;
  directImpact: string;
  pm25ExposureReductionPct: number;
  co2eSavedKg: number;
  pm25EmissionAvoidedGrams: number;
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
