/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import {
  ActionPlanResponse,
  ImpactSimulationResult,
  getAdoptedImpactBreakdown,
} from '../shared/airQuality';

interface ImpactSimulatorPanelProps {
  impact: ImpactSimulationResult;
  plan: ActionPlanResponse | null;
  selectedIds: ReadonlyArray<string>;
  outdoorPm25: number;
  onSelectAll: () => void;
  onClearAll: () => void;
  hasPlan: boolean;
}

export function ImpactSimulatorPanel({
  impact,
  plan,
  selectedIds,
  outdoorPm25,
  onSelectAll,
  onClearAll,
  hasPlan,
}: ImpactSimulatorPanelProps) {
  const baselineIndoor = Math.round(outdoorPm25 * 0.65 * 10) / 10;
  const breakdown = getAdoptedImpactBreakdown(selectedIds, plan);

  return (
    <section
      aria-labelledby="impact-simulator-heading"
      className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white sm:p-8"
    >
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-teal-300">
            Interactive Choice Impact Simulator
          </p>
          <h2
            id="impact-simulator-heading"
            className="mt-1 font-display text-xl font-bold tracking-wide text-white sm:text-2xl"
          >
            Direct effect of your selected household actions
          </h2>
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

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-slate-300">Indoor PM2.5 Exposure Cut</p>
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
          <p className="text-xs text-slate-300">Greenhouse Gas Avoided</p>
          <motion.p
            key={impact.co2eSavedDailyKg}
            initial={{ opacity: 0.5, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 font-mono text-3xl font-bold text-white tabular-nums"
          >
            {impact.co2eSavedDailyKg}{' '}
            <span className="text-sm font-normal text-slate-300">kg CO₂e/day</span>
          </motion.p>
          <p className="mt-1 text-xs text-slate-300 font-mono tabular-nums">
            ~{impact.co2eSavedMonthlyKg} kg CO₂e avoided per winter month
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-300">Direct PM2.5 Emissions Prevented</p>
          <motion.p
            key={impact.pm25EmissionsAvoidedDailyGrams}
            initial={{ opacity: 0.5, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 font-mono text-3xl font-bold text-white tabular-nums"
          >
            {impact.pm25EmissionsAvoidedDailyGrams}{' '}
            <span className="text-sm font-normal text-slate-300">g/day</span>
          </motion.p>
          <p className="mt-1 text-xs text-slate-300">
            Less street &amp; chimney smoke trapped in your neighborhood
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-300">Active Choices &amp; Primary Lever</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-white tabular-nums">
            {impact.selectedCount} / {impact.totalActionableCount}
          </p>
          <p className="mt-1 text-xs text-slate-300 line-clamp-2">
            Top impact: {impact.dominantDriver}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>Projected Indoor Filtration &amp; Avoidance Protection</span>
          <span className="font-mono tabular-nums text-teal-300">
            {impact.indoorExposureReductionPct}% of 92% practical physical ceiling
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Projected indoor particulate exposure reduction"
          aria-valuenow={impact.indoorExposureReductionPct}
          aria-valuemin={0}
          aria-valuemax={92}
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800"
        >
          <motion.div
            className="h-full rounded-full bg-teal-400"
            initial={false}
            animate={{
              width: `${Math.min(100, Math.round((impact.indoorExposureReductionPct / 92) * 100))}%`,
            }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* Direct Causal Breakdown Table */}
      {breakdown.length > 0 && (
        <div className="mt-6 border-t border-slate-800 pt-5">
          <h3 className="font-display text-sm font-semibold text-teal-200">
            Why Your Adopted Choices Work (Direct Causal Breakdown)
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-300">
                  <th scope="col" className="py-2 pr-4 font-medium">Choice</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Category</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Direct Physical Mechanism</th>
                  <th scope="col" className="py-2 text-right font-medium font-mono">Measurable Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {breakdown.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 pr-4 font-medium text-white">{item.title}</td>
                    <td className="py-2.5 pr-4 text-slate-300 whitespace-nowrap">{item.category}</td>
                    <td className="py-2.5 pr-4 text-slate-300">{item.directImpact}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-teal-300 whitespace-nowrap">
                      -{item.pm25ExposureReductionPct}% exp · -{item.co2eSavedKg} kg CO₂e
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
