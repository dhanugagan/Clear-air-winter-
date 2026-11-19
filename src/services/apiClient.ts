/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActionPlanResponse,
  AirQualitySnapshot,
  AskQuestionResponse,
  HouseholdProfile,
} from '../shared/airQuality';

async function parseJsonOrThrow<T>(response: Response, fallbackMessage: string): Promise<T> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(fallbackMessage);
  }
  if (!response.ok) {
    const errObj = payload as { error?: string } | null;
    throw new Error(errObj?.error || fallbackMessage);
  }
  return payload as T;
}

export async function fetchAirQualityByCityApi(
  city: string,
  signal?: AbortSignal
): Promise<AirQualitySnapshot> {
  const response = await fetch(`/api/air-quality?city=${encodeURIComponent(city)}`, { signal });
  return parseJsonOrThrow<AirQualitySnapshot>(response, 'Could not load air quality readings.');
}

export async function fetchAirQualityByCoordsApi(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<AirQualitySnapshot> {
  const response = await fetch(
    `/api/air-quality/coords?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,
    { signal }
  );
  return parseJsonOrThrow<AirQualitySnapshot>(response, 'Could not retrieve local coordinates.');
}

export async function generateActionPlanApi(
  profile: HouseholdProfile,
  airQuality: AirQualitySnapshot | null
): Promise<ActionPlanResponse> {
  const response = await fetch('/api/assistant/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, airQuality }),
  });
  return parseJsonOrThrow<ActionPlanResponse>(response, 'Failed to generate personalized plan.');
}

export async function askAirQualityAdvisorApi(
  question: string,
  profile: HouseholdProfile,
  airQuality: AirQualitySnapshot | null
): Promise<AskQuestionResponse> {
  const response = await fetch('/api/assistant/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, profile, airQuality }),
  });
  return parseJsonOrThrow<AskQuestionResponse>(response, 'Could not retrieve an answer.');
}
