/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ImpactSimulationResult } from '../shared/airQuality';

interface ImpactSimulatorPanelProps {
  impact: ImpactSimulationResult;
  outdoorPm25: number;
  onSelectAll: () => void;
  onClearAll: () => void;
  hasPlan: boolean;
}

export function ImpactSimulatorPanel({
  impact,
  outdoorPm25,
  onSelectAll,
  onClearAll,
  hasPlan,
}: ImpactSimulatorPanelProps) {
  const baselineIndoor = Math.round(outdoorPm25 * 0.65 * 10) / 10;

  return (
    <section
      aria-label="Direct household impact simulator"
      className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white sm:p-8"
    >
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-teal-300">
            Interactive Choice Impact Simulator
          </p>
          <h3 className="mt-1 font-display text-xl font-bold tracking-wide text-white sm:text-2xl">
            Direct effect of your selected household actions
          </h3>
          <p className="mt-1 text-sm text-slate-300">
            Toggle routines, indoor hacks, and sustainable swaps below to compare exposure and
            emissions before vs. after action.
          </p>
        </div>

        {hasPlan && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onSelectAll}
              className="min-h-[36px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition-colors hover:bg-slate-700 whitespace-nowrap"
            >
              Adopt All ({impact.totalActionableCount})
            </button>
            <button
              type="button"
              onClick={onClearAll}
              className="min-h-[36px] rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 whitespace-nowrap"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* 4-Column Quantitative Comparison */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-slate-400">Indoor PM2.5 Exposure Cut</p>
          <motion.p
            key={impact.indoorExposureReductionPct}
            initial={{ opacity: 0.5, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 font-mono text-3xl font-bold text-teal-300 tabular-nums"
          >
            -{impact.indoorExposureReductionPct}%
          </motion.p>
          <p className="mt-1 text-xs text-slate-300 font-mono tabular-nums">
            {baselineIndoor} → {impact.projectedIndoorPm25} µg/m³ indoors
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">Greenhouse Gas Avoided</p>
          <motion.p
            key={impact.co2eSavedDailyKg}
            initial={{ opacity: 0.5, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 font-mono text-3xl font-bold text-white tabular-nums"
          >
            {impact.co2eSavedDailyKg} <span className="text-sm font-normal text-slate-400">kg CO₂e/day</span>
          </motion.p>
          <p className="mt-1 text-xs text-slate-300 font-mono tabular-nums">
            ~{impact.co2eSavedMonthlyKg} kg CO₂e avoided per winter month
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">Direct PM2.5 Emissions Prevented</p>
          <motion.p
            key={impact.pm25EmissionsAvoidedDailyGrams}
            initial={{ opacity: 0.5, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 font-mono text-3xl font-bold text-white tabular-nums"
          >
            {impact.pm25EmissionsAvoidedDailyGrams} <span className="text-sm font-normal text-slate-400">g/day</span>
          </motion.p>
          <p className="mt-1 text-xs text-slate-300">
            Less street &amp; chimney smoke trapped in your neighborhood
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">Active Choices &amp; Primary Lever</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-white tabular-nums">
            {impact.selectedCount} / {impact.totalActionableCount}
          </p>
          <p className="mt-1 text-xs text-slate-300 line-clamp-2">
            Top impact: {impact.dominantDriver}
          </p>
        </div>
      </div>

      {/* Animated Progress Track */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Projected Indoor Filtration &amp; Avoidance Protection</span>
          <span className="font-mono tabular-nums text-teal-300">
            {impact.indoorExposureReductionPct}% of 92% practical physical ceiling
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-teal-400"
            initial={false}
            animate={{ width: `${Math.min(100, Math.round((impact.indoorExposureReductionPct / 92) * 100))}%` }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
    </section>
  );
}
