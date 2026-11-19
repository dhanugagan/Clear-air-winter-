/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  Check,
  Clock,
  Home,
  Leaf,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ActionPlanResponse } from '../shared/airQuality';

type PlanTab = 'routines' | 'indoor' | 'alternatives' | 'community';

interface ActionPlanWorkspaceProps {
  plan: ActionPlanResponse | null;
  isGenerating: boolean;
  error: string | null;
  selectedIds: string[];
  onToggleChoice: (id: string) => void;
  onGeneratePlan: () => void;
}

export function ActionPlanWorkspace({
  plan,
  isGenerating,
  error,
  selectedIds,
  onToggleChoice,
  onGeneratePlan,
}: ActionPlanWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<PlanTab>('routines');
  const [indoorImageFailed, setIndoorImageFailed] = useState(false);

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

  return (
    <section
      id="action-plan"
      aria-labelledby="action-plan-heading"
      className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="action-plan-heading" className="font-display text-2xl font-bold text-slate-900">
              Tailored Winter Clean-Air Plan
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Review routines, indoor filtration steps, and sustainable alternatives designed for
              your location and lifestyle.
            </p>
          </div>
          {plan && (
            <span className="text-xs font-mono text-slate-500 tabular-nums whitespace-nowrap">
              Generated {new Date(plan.generatedAtIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
          >
            <p className="font-semibold">Unable to generate personalized plan</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* Loading Skeleton State */}
        {isGenerating && (
          <div aria-live="polite" aria-busy="true" className="mt-6 space-y-4">
            <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="h-44 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-44 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>
        )}

        {/* Empty State */}
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

        {/* Populated Plan View */}
        {!isGenerating && plan && (
          <div className="mt-6 space-y-6" aria-live="polite">
            {/* Advisory Overview */}
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

            {/* Segmented Tab Controls */}
            <div
              role="tablist"
              aria-label="Action plan categories"
              className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1.5"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    type="button"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id)}
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

            {/* Tab Panel Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'routines' && (
                <motion.div
                  key="routines"
                  role="tabpanel"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-1 gap-4 md:grid-cols-2"
                >
                  {plan.routines.map((routine) => {
                    const adopted = selectedSet.has(routine.id);
                    return (
                      <article
                        key={routine.id}
                        className={`flex flex-col justify-between rounded-xl border p-5 transition-colors ${
                          adopted
                            ? 'border-teal-300 bg-teal-50/35'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1.5 font-mono font-medium text-teal-800">
                              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                              {routine.timeWindow}
                            </span>
                            <span className="font-mono tabular-nums">
                              -{routine.pm25ExposureReductionPct}% exposure · -{routine.co2eSavedKg} kg CO₂e
                            </span>
                          </div>
                          <h4 className="mt-2 font-display text-base font-bold text-slate-900">
                            {routine.title}
                          </h4>
                          <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                            {routine.guidance}
                          </p>
                          <p className="mt-3 border-t border-slate-100 pt-2.5 text-xs leading-relaxed text-slate-600">
                            <strong className="font-semibold text-slate-900">Direct impact:</strong>{' '}
                            {routine.directImpact}
                          </p>
                        </div>

                        <div className="mt-4">
                          <button
                            type="button"
                            aria-pressed={adopted}
                            onClick={() => onToggleChoice(routine.id)}
                            className={`inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                              adopted
                                ? 'border-teal-700 bg-teal-700 text-white hover:bg-teal-800'
                                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            {adopted ? (
                              <>
                                <Check className="h-4 w-4" aria-hidden="true" />
                                <span>Adopted in Plan</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                <span>Adopt Routine</span>
                              </>
                            )}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </motion.div>
              )}

              {activeTab === 'indoor' && (
                <motion.div
                  key="indoor"
                  role="tabpanel"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start"
                >
                  {/* Editorial Indoor Air Sanctuary Visual */}
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 lg:col-span-4">
                    {!indoorImageFailed ? (
                      <img
                        src="/src/assets/images/clean_indoor_sanctuary_1795075924533.jpg"
                        alt="Warm winter living room with sealed timber windows and minimalist HEPA air purifier"
                        referrerPolicy="no-referrer"
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
                    <div className="p-4 bg-white border-t border-slate-200">
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
                    {plan.indoorHacks.map((hack) => {
                      const adopted = selectedSet.has(hack.id);
                      return (
                        <article
                          key={hack.id}
                          className={`flex flex-col justify-between rounded-xl border p-5 transition-colors ${
                            adopted
                              ? 'border-teal-300 bg-teal-50/35'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                              <span className="font-medium text-teal-800">{hack.difficulty}</span>
                              <span className="font-mono tabular-nums">
                                -{hack.pm25ExposureReductionPct}% indoor PM2.5
                              </span>
                            </div>
                            <h4 className="mt-2 font-display text-base font-bold text-slate-900">
                              {hack.title}
                            </h4>
                            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                              {hack.stepByStep}
                            </p>
                            <p className="mt-3 border-t border-slate-100 pt-2.5 text-xs leading-relaxed text-slate-600">
                              <strong className="font-semibold text-slate-900">Direct impact:</strong>{' '}
                              {hack.directImpact}
                            </p>
                          </div>

                          <div className="mt-4">
                            <button
                              type="button"
                              aria-pressed={adopted}
                              onClick={() => onToggleChoice(hack.id)}
                              className={`inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                                adopted
                                  ? 'border-teal-700 bg-teal-700 text-white hover:bg-teal-800'
                                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                              }`}
                            >
                              {adopted ? (
                                <>
                                  <Check className="h-4 w-4" aria-hidden="true" />
                                  <span>Adopted in Plan</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                                  <span>Apply Indoor Hack</span>
                                </>
                              )}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === 'alternatives' && (
                <motion.div
                  key="alternatives"
                  role="tabpanel"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-1 gap-4 md:grid-cols-3"
                >
                  {plan.sustainableAlternatives.map((alt) => {
                    const adopted = selectedSet.has(alt.id);
                    return (
                      <article
                        key={alt.id}
                        className={`flex flex-col justify-between rounded-xl border p-5 transition-colors ${
                          adopted
                            ? 'border-teal-300 bg-teal-50/35'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1 font-medium text-teal-800">
                              <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
                              Habit Swap
                            </span>
                            <span className="font-mono tabular-nums">
                              -{alt.co2eSavedKg} kg CO₂e · -{alt.pm25EmissionAvoidedGrams}g PM2.5
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">
                            Instead of: <span className="line-through">{alt.currentHabit}</span>
                          </p>
                          <h4 className="mt-1 font-display text-base font-bold text-slate-900">
                            {alt.sustainableSwap}
                          </h4>
                          <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                            {alt.whyItHelps}
                          </p>
                          <p className="mt-3 border-t border-slate-100 pt-2.5 text-xs leading-relaxed text-slate-600">
                            <strong className="font-semibold text-slate-900">Direct impact:</strong>{' '}
                            {alt.directImpact}
                          </p>
                        </div>

                        <div className="mt-4">
                          <button
                            type="button"
                            aria-pressed={adopted}
                            onClick={() => onToggleChoice(alt.id)}
                            className={`inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                              adopted
                                ? 'border-teal-700 bg-teal-700 text-white hover:bg-teal-800'
                                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            {adopted ? (
                              <>
                                <Check className="h-4 w-4" aria-hidden="true" />
                                <span>Swap Adopted</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                <span>Adopt Alternative</span>
                              </>
                            )}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </motion.div>
              )}

              {activeTab === 'community' && (
                <motion.div
                  key="community"
                  role="tabpanel"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-1 gap-4 md:grid-cols-3"
                >
                  {plan.communityActions.map((action) => (
                    <article
                      key={action.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5"
                    >
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-800">
                          <Users className="h-3.5 w-3.5" aria-hidden="true" />
                          {action.whoCanJoin}
                        </span>
                        <h4 className="mt-2 font-display text-base font-bold text-slate-900">
                          {action.title}
                        </h4>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                          {action.actionSummary}
                        </p>
                      </div>
                      <p className="mt-4 border-t border-slate-100 pt-2.5 text-xs leading-relaxed text-slate-600">
                        <strong className="font-semibold text-slate-900">Neighborhood effect:</strong>{' '}
                        {action.collectiveImpact}
                      </p>
                    </article>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
