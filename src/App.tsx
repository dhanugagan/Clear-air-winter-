/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { ActionPlanWorkspace } from './components/ActionPlanWorkspace';
import { AskAssistantPanel } from './components/AskAssistantPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HeroTelemetry } from './components/HeroTelemetry';
import { HouseholdConfigurator } from './components/HouseholdConfigurator';
import { ImpactSimulatorPanel } from './components/ImpactSimulatorPanel';
import { TopNav } from './components/TopNav';
import {
  fetchAirQualityByCityApi,
  fetchAirQualityByCoordsApi,
  generateActionPlanApi,
} from './services/apiClient';
import {
  ActionPlanResponse,
  AirQualitySnapshot,
  HouseholdProfile,
  createSevereSmogScenario,
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
  const [liveSnapshot, setLiveSnapshot] = useState<AirQualitySnapshot | null>(null);
  const [isSevereSmogMode, setIsSevereSmogMode] = useState<boolean>(false);
  const [isLoadingAir, setIsLoadingAir] = useState<boolean>(true);
  const [airError, setAirError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const [plan, setPlan] = useState<ActionPlanResponse | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [adoptedCommunityIds, setAdoptedCommunityIds] = useState<string[]>([]);

  const airAbortRef = useRef<AbortController | null>(null);

  const activeSnapshot = useMemo(() => {
    if (!liveSnapshot) return null;
    return isSevereSmogMode ? createSevereSmogScenario(liveSnapshot) : liveSnapshot;
  }, [liveSnapshot, isSevereSmogMode]);

  const loadCityAirQuality = useCallback(async (city: string) => {
    airAbortRef.current?.abort();
    const controller = new AbortController();
    airAbortRef.current = controller;

    setIsLoadingAir(true);
    setAirError(null);

    try {
      const nextSnapshot = await fetchAirQualityByCityApi(city, controller.signal);
      setLiveSnapshot(nextSnapshot);
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
          const nextSnapshot = await fetchAirQualityByCoordsApi(latitude, longitude);
          setLiveSnapshot(nextSnapshot);
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
      const nextPlan = await generateActionPlanApi(profile, activeSnapshot);
      setPlan(nextPlan);
      const defaults = [
        nextPlan.routines[0]?.id,
        nextPlan.indoorHacks[0]?.id,
        nextPlan.sustainableAlternatives[0]?.id,
      ].filter((id): id is string => Boolean(id));
      setSelectedActionIds(defaults);
      setAdoptedCommunityIds(nextPlan.communityActions[0]?.id ? [nextPlan.communityActions[0].id] : []);

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

  const handleToggleCommunityChoice = (id: string) => {
    setAdoptedCommunityIds((prev) =>
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
    () => simulateActionImpact(selectedActionIds, plan, activeSnapshot?.pm25 ?? 35),
    [selectedActionIds, plan, activeSnapshot?.pm25]
  );

  return (
    <ErrorBoundary>
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
              snapshot={activeSnapshot}
              profile={profile}
              isLoading={isLoadingAir}
              error={airError}
              isSevereSmogMode={isSevereSmogMode}
              onToggleSevereSmogMode={() => setIsSevereSmogMode((prev) => !prev)}
              onSelectCity={(city) => void loadCityAirQuality(city)}
              onUseCurrentLocation={handleUseCurrentLocation}
              isLocating={isLocating}
            />

            <HouseholdConfigurator
              profile={profile}
              snapshot={activeSnapshot}
              onChange={setProfile}
              onSubmit={() => void handleGeneratePlan()}
              isGenerating={isGeneratingPlan}
            />

            <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
              <ImpactSimulatorPanel
                impact={impact}
                plan={plan}
                selectedIds={selectedActionIds}
                outdoorPm25={activeSnapshot?.pm25 ?? 35}
                onSelectAll={handleSelectAll}
                onClearAll={() => setSelectedActionIds([])}
                hasPlan={Boolean(plan)}
              />
            </div>

            <ActionPlanWorkspace
              plan={plan}
              snapshot={activeSnapshot}
              profile={profile}
              impact={impact}
              isGenerating={isGeneratingPlan}
              error={planError}
              selectedIds={selectedActionIds}
              adoptedCommunityIds={adoptedCommunityIds}
              onToggleChoice={handleToggleChoice}
              onToggleCommunityChoice={handleToggleCommunityChoice}
              onGeneratePlan={() => void handleGeneratePlan()}
            />

            <AskAssistantPanel snapshot={activeSnapshot} profile={profile} />
          </main>

          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <p>ClearAir Winter — Environmental guidance for families and communities.</p>
              <p>Live atmospheric data sourced from Open-Meteo Air Quality &amp; Weather APIs.</p>
            </div>
          </footer>
        </div>
      </MotionConfig>
    </ErrorBoundary>
  );
}
