/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { ActionPlanWorkspace } from './components/ActionPlanWorkspace';
import { AskAssistantPanel } from './components/AskAssistantPanel';
import { HeroTelemetry } from './components/HeroTelemetry';
import { HouseholdConfigurator } from './components/HouseholdConfigurator';
import { ImpactSimulatorPanel } from './components/ImpactSimulatorPanel';
import { TopNav } from './components/TopNav';
import {
  ActionPlanResponse,
  AirQualitySnapshot,
  HouseholdProfile,
  simulateActionImpact,
} from './shared/airQuality';

const INITIAL_PROFILE: HouseholdProfile = {
  city: 'Salt Lake City',
  adults: 2,
  children: 1,
  seniors: 0,
  respiratorySensitivity: true,
  homeType: 'apartment',
  heatingSource: 'natural_gas',
  commuteMode: 'private_car',
  filtrationSetup: 'basic_hvac',
  lifestyleNotes: 'Morning school run around 7:45 AM; looking for low-cost indoor protection.',
};

export default function App() {
  const [profile, setProfile] = useState<HouseholdProfile>(INITIAL_PROFILE);
  const [snapshot, setSnapshot] = useState<AirQualitySnapshot | null>(null);
  const [isLoadingAir, setIsLoadingAir] = useState<boolean>(true);
  const [airError, setAirError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const [plan, setPlan] = useState<ActionPlanResponse | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);

  const airAbortRef = useRef<AbortController | null>(null);

  const loadCityAirQuality = useCallback(async (city: string) => {
    airAbortRef.current?.abort();
    const controller = new AbortController();
    airAbortRef.current = controller;

    setIsLoadingAir(true);
    setAirError(null);

    try {
      const response = await fetch(`/api/air-quality?city=${encodeURIComponent(city)}`, {
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not load air quality readings.');
      }
      const nextSnapshot = data as AirQualitySnapshot;
      setSnapshot(nextSnapshot);
      setProfile((prev) => ({ ...prev, city: nextSnapshot.locationName }));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setAirError(error instanceof Error ? error.message : 'Unable to reach air quality service.');
    } finally {
      setIsLoadingAir(false);
    }
  }, []);

  useEffect(() => {
    void loadCityAirQuality(INITIAL_PROFILE.city);
    return () => {
      airAbortRef.current?.abort();
    };
  }, [loadCityAirQuality]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setAirError('Browser geolocation is unavailable. Enter your city name instead.');
      return;
    }
    setIsLocating(true);
    setAirError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `/api/air-quality/coords?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`
          );
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Could not retrieve local coordinates.');
          }
          const nextSnapshot = data as AirQualitySnapshot;
          setSnapshot(nextSnapshot);
          setProfile((prev) => ({ ...prev, city: nextSnapshot.locationName }));
        } catch (error) {
          setAirError(error instanceof Error ? error.message : 'Unable to load GPS air telemetry.');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setAirError('Location permission denied. Enter a city name to view local air quality.');
      },
      { timeout: 8000 }
    );
  };

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    setPlanError(null);

    try {
      const response = await fetch('/api/assistant/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          airQuality: snapshot,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate personalized plan.');
      }
      const nextPlan = data as ActionPlanResponse;
      setPlan(nextPlan);
      // Pre-select the top routine and top indoor hack so families immediately see measurable impact
      const defaults = [
        nextPlan.routines[0]?.id,
        nextPlan.indoorHacks[0]?.id,
        nextPlan.sustainableAlternatives[0]?.id,
      ].filter((id): id is string => Boolean(id));
      setSelectedActionIds(defaults);

      document.getElementById('action-plan')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      setPlanError(error instanceof Error ? error.message : 'Unable to generate action plan.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleToggleChoice = (id: string) => {
    setSelectedActionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (!plan) return;
    setSelectedActionIds([
      ...plan.routines.map((r) => r.id),
      ...plan.indoorHacks.map((h) => h.id),
      ...plan.sustainableAlternatives.map((s) => s.id),
    ]);
  };

  const impact = useMemo(
    () => simulateActionImpact(selectedActionIds, plan, snapshot?.pm25 ?? 35),
    [selectedActionIds, plan, snapshot?.pm25]
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-teal-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>

        <TopNav onGeneratePlan={() => void handleGeneratePlan()} isGenerating={isGeneratingPlan} />

        <main id="main-content">
          <HeroTelemetry
            snapshot={snapshot}
            isLoading={isLoadingAir}
            error={airError}
            onSelectCity={(city) => void loadCityAirQuality(city)}
            onUseCurrentLocation={handleUseCurrentLocation}
            isLocating={isLocating}
          />

          <HouseholdConfigurator
            profile={profile}
            onChange={setProfile}
            onSubmit={() => void handleGeneratePlan()}
            isGenerating={isGeneratingPlan}
          />

          <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
            <ImpactSimulatorPanel
              impact={impact}
              outdoorPm25={snapshot?.pm25 ?? 35}
              onSelectAll={handleSelectAll}
              onClearAll={() => setSelectedActionIds([])}
              hasPlan={Boolean(plan)}
            />
          </div>

          <ActionPlanWorkspace
            plan={plan}
            isGenerating={isGeneratingPlan}
            error={planError}
            selectedIds={selectedActionIds}
            onToggleChoice={handleToggleChoice}
            onGeneratePlan={() => void handleGeneratePlan()}
          />

          <AskAssistantPanel snapshot={snapshot} profile={profile} />
        </main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>ClearAir Winter — Environmental guidance for families and communities.</p>
            <p>Live atmospheric data sourced from Open-Meteo Air Quality &amp; Weather APIs.</p>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
