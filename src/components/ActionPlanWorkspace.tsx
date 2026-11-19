/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KeyboardEvent, useRef, useState } from 'react';
import { Home, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import {
  ActionPlanResponse,
  AirQualitySnapshot,
  HouseholdProfile,
  ImpactSimulationResult,
} from '../shared/airQuality';
import { ActionChoiceCard } from './ActionChoiceCard';
import { CommunityMultiplierPanel } from './CommunityMultiplierPanel';

type PlanTab = 'routines' | 'indoor' | 'alternatives' | 'community';

interface ActionPlanWorkspaceProps {
  plan: ActionPlanResponse | null;
  snapshot: AirQualitySnapshot | null;
  profile: HouseholdProfile;
  impact: ImpactSimulationResult;
  isGenerating: boolean;
  error: string | null;
  selectedIds: string[];
  adoptedCommunityIds: string[];
  onToggleChoice: (id: string) => void;
  onToggleCommunityChoice: (id: string) => void;
  onGeneratePlan: () => void;
}

export function ActionPlanWorkspace({
  plan,
  snapshot,
  profile,
  impact,
  isGenerating,
  error,
  selectedIds,
  adoptedCommunityIds,
  onToggleChoice,
  onToggleCommunityChoice,
  onGeneratePlan,
}: ActionPlanWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<PlanTab>('routines');
  const [indoorImageFailed, setIndoorImageFailed] = useState(false);

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedSet = new Set(selectedIds);

  const tabs: Array<{ id: PlanTab; label: string; count: number }> = [
    { id: 'routines', label: 'Low-Emission Routines', count: plan?.routines.length ?? 0 },
    { id: 'indoor', label: 'Indoor Air Hacks', count: plan?.indoorHacks.length ?? 0 },
    {
      id: 'alternatives',
      label: 'Sustainable Swaps',
      count: plan?.sustainableAlternatives.length ?? 0,
    },
    { id: 'community', label: 'Community Actions', count: plan?.communityActions.length ?? 0 },
  ];

  const handleTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = tabs.length - 1;

    if (nextIndex !== null) {
      e.preventDefault();
      setActiveTab(tabs[nextIndex].id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <section
      id="action-plan"
      aria-labelledby="action-plan-heading"
      className="scroll-mt-20 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="action-plan-heading" className="font-display text-2xl font-bold text-slate-900">
              Tailored Winter Clean-Air Plan
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Review routines, indoor filtration steps, sustainable alternatives, and neighborhood
              coordination designed for your location and lifestyle.
            </p>
          </div>
          {plan && (
            <span className="text-xs font-mono text-slate-600 tabular-nums whitespace-nowrap">
              Generated{' '}
              {new Date(plan.generatedAtIso).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
          >
            <p className="font-semibold">Unable to generate personalized plan</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {isGenerating && (
          <div role="status" aria-live="polite" aria-label="Generating personalized plan" className="mt-6 space-y-4">
            <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="h-44 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-44 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>
        )}

        {!isGenerating && !plan && (
          <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-display text-lg font-semibold text-slate-900">
                Ready to tailor your household air plan
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Adjust your home heating, commute, and filtration setup above, then generate a
                location-specific winter smog plan with measurable health and emission impacts.
              </p>
            </div>
            <button
              type="button"
              onClick={onGeneratePlan}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>Generate Tailored Action Plan</span>
            </button>
          </div>
        )}

        {!isGenerating && plan && (
          <div className="mt-6 space-y-6" aria-live="polite">
            <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-5">
              <h3 className="font-display text-lg font-bold text-slate-900">
                {plan.advisoryHeadline}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {plan.advisorySummary}
              </p>
              <p className="mt-2.5 text-xs leading-relaxed text-teal-900">
                <strong className="font-semibold">Local atmospheric link:</strong>{' '}
                {plan.whyLocationMatters}
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Action plan categories"
              className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1.5"
            >
              {tabs.map((tab, index) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    ref={(el) => {
                      tabRefs.current[index] = el;
                    }}
                    id={`plan-tab-${tab.id}`}
                    role="tab"
                    type="button"
                    aria-selected={isActive}
                    aria-controls={`plan-panel-${tab.id}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setActiveTab(tab.id)}
                    onKeyDown={(e) => handleTabKeyDown(e, index)}
                    className={`min-h-[40px] flex-1 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                );
              })}
            </div>

            {activeTab === 'routines' && (
              <motion.div
                key="routines"
                id="plan-panel-routines"
                role="tabpanel"
                aria-labelledby="plan-tab-routines"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                {plan.routines.map((routine) => (
                  <ActionChoiceCard
                    key={routine.id}
                    kind="routine"
                    kicker={routine.timeWindow}
                    metricSummary={`-${routine.pm25ExposureReductionPct}% exposure · -${routine.co2eSavedKg} kg CO₂e`}
                    title={routine.title}
                    body={routine.guidance}
                    directImpact={routine.directImpact}
                    adopted={selectedSet.has(routine.id)}
                    adoptLabel="Adopt Routine"
                    adoptedLabel="Adopted in Plan"
                    onToggle={() => onToggleChoice(routine.id)}
                  />
                ))}
              </motion.div>
            )}

            {activeTab === 'indoor' && (
              <motion.div
                key="indoor"
                id="plan-panel-indoor"
                role="tabpanel"
                aria-labelledby="plan-tab-indoor"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start"
              >
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 lg:col-span-4">
                  {!indoorImageFailed ? (
                    <img
                      src="/src/assets/images/clean_indoor_sanctuary_1795075924533.jpg"
                      alt="Warm winter living room with sealed timber windows and minimalist HEPA air purifier"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={() => setIndoorImageFailed(true)}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center bg-slate-100 p-6 text-center">
                      <Home className="h-8 w-8 text-teal-700" aria-hidden="true" />
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        Clean-Air Sanctuary Protocol
                      </p>
                    </div>
                  )}
                  <div className="border-t border-slate-200 bg-white p-4">
                    <h4 className="font-display text-sm font-bold text-slate-900">
                      Create one verified Clean-Air Room
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      Keeping one sleeping or living zone tightly sealed with continuous HEPA
                      or MERV-13 circulation reduces overnight fine particle dose dramatically.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-8">
                  {plan.indoorHacks.map((hack) => (
                    <ActionChoiceCard
                      key={hack.id}
                      kind="indoor"
                      kicker={hack.difficulty}
                      metricSummary={`-${hack.pm25ExposureReductionPct}% indoor PM2.5`}
                      title={hack.title}
                      body={hack.stepByStep}
                      directImpact={hack.directImpact}
                      adopted={selectedSet.has(hack.id)}
                      adoptLabel="Apply Indoor Hack"
                      adoptedLabel="Adopted in Plan"
                      onToggle={() => onToggleChoice(hack.id)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'alternatives' && (
              <motion.div
                key="alternatives"
                id="plan-panel-alternatives"
                role="tabpanel"
                aria-labelledby="plan-tab-alternatives"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 gap-4 md:grid-cols-3"
              >
                {plan.sustainableAlternatives.map((alt) => (
                  <ActionChoiceCard
                    key={alt.id}
                    kind="alternative"
                    kicker="Habit Swap"
                    metricSummary={`-${alt.co2eSavedKg} kg CO₂e · -${alt.pm25EmissionAvoidedGrams}g PM2.5`}
                    crossedOutText={alt.currentHabit}
                    title={alt.sustainableSwap}
                    body={alt.whyItHelps}
                    directImpact={alt.directImpact}
                    adopted={selectedSet.has(alt.id)}
                    adoptLabel="Adopt Alternative"
                    adoptedLabel="Swap Adopted"
                    onToggle={() => onToggleChoice(alt.id)}
                  />
                ))}
              </motion.div>
            )}

            {activeTab === 'community' && (
              <motion.div
                key="community"
                id="plan-panel-community"
                role="tabpanel"
                aria-labelledby="plan-tab-community"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              >
                <CommunityMultiplierPanel
                  plan={plan}
                  snapshot={snapshot}
                  profile={profile}
                  impact={impact}
                  adoptedCommunityIds={adoptedCommunityIds}
                  onToggleCommunityChoice={onToggleCommunityChoice}
                />
              </motion.div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
