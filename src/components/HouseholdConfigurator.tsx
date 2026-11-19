/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sparkles } from 'lucide-react';
import {
  AirQualitySnapshot,
  CommuteMode,
  FiltrationSetup,
  HeatingSource,
  HomeType,
  HouseholdProfile,
  analyzeHouseholdEmissionProfile,
} from '../shared/airQuality';

interface HouseholdConfiguratorProps {
  profile: HouseholdProfile;
  snapshot: AirQualitySnapshot | null;
  onChange: (next: HouseholdProfile) => void;
  onSubmit: () => void;
  isGenerating: boolean;
}

export function HouseholdConfigurator({
  profile,
  snapshot,
  onChange,
  onSubmit,
  isGenerating,
}: HouseholdConfiguratorProps) {
  const updateField = <K extends keyof HouseholdProfile>(key: K, value: HouseholdProfile[K]) => {
    onChange({ ...profile, [key]: value });
  };

  const diagnostic = analyzeHouseholdEmissionProfile(profile, snapshot);

  return (
    <section
      id="household"
      aria-labelledby="household-heading"
      className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="household-heading" className="font-display text-2xl font-bold text-slate-900">
              Tailor guidance to your household &amp; lifestyle
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Tell the assistant how your family heats, travels, and ventilates so recommendations
              target your real emission and exposure sources.
            </p>
          </div>
          <span className="text-xs text-slate-600 whitespace-nowrap">
            Active city: <strong className="font-semibold text-slate-900">{profile.city}</strong>
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="mt-6 space-y-6"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="adults-input" className="block text-xs font-medium text-slate-700">
                Adults in home
              </label>
              <input
                id="adults-input"
                type="number"
                min={1}
                max={12}
                value={profile.adults}
                onChange={(e) => updateField('adults', Math.max(1, Number(e.target.value) || 1))}
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-mono text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="children-input" className="block text-xs font-medium text-slate-700">
                Children (under 18)
              </label>
              <input
                id="children-input"
                type="number"
                min={0}
                max={12}
                value={profile.children}
                onChange={(e) => updateField('children', Math.max(0, Number(e.target.value) || 0))}
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-mono text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="seniors-input" className="block text-xs font-medium text-slate-700">
                Older adults (65+)
              </label>
              <input
                id="seniors-input"
                type="number"
                min={0}
                max={12}
                value={profile.seniors}
                onChange={(e) => updateField('seniors', Math.max(0, Number(e.target.value) || 0))}
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-mono text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <label className="flex min-h-[44px] w-full cursor-pointer items-center gap-3 rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={profile.respiratorySensitivity}
                  onChange={(e) => updateField('respiratorySensitivity', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-400 text-teal-700 focus:ring-teal-700"
                />
                <span className="font-medium">Asthma / respiratory sensitivity</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="home-type-select" className="block text-xs font-medium text-slate-700">
                Home structure
              </label>
              <select
                id="home-type-select"
                value={profile.homeType}
                onChange={(e) => updateField('homeType', e.target.value as HomeType)}
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              >
                <option value="apartment">Apartment / Condo</option>
                <option value="townhouse">Townhouse / Duplex</option>
                <option value="detached_house">Detached House</option>
              </select>
            </div>

            <div>
              <label htmlFor="heating-select" className="block text-xs font-medium text-slate-700">
                Primary winter heating &amp; stove
              </label>
              <select
                id="heating-select"
                value={profile.heatingSource}
                onChange={(e) => updateField('heatingSource', e.target.value as HeatingSource)}
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              >
                <option value="natural_gas">Natural Gas Furnace / Stove</option>
                <option value="heat_pump">Electric Heat Pump / Induction</option>
                <option value="wood_or_coal">Wood Stove / Fireplace / Solid Fuel</option>
                <option value="district_heating">District / Central Radiator</option>
              </select>
            </div>

            <div>
              <label htmlFor="commute-select" className="block text-xs font-medium text-slate-700">
                Daily commute &amp; school run
              </label>
              <select
                id="commute-select"
                value={profile.commuteMode}
                onChange={(e) => updateField('commuteMode', e.target.value as CommuteMode)}
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              >
                <option value="private_car">Private Car (Gasoline / Diesel)</option>
                <option value="public_transit">Bus / Rail / Metro Transit</option>
                <option value="carpool">Neighborhood Carpool / EV</option>
                <option value="walk_or_bike">Walking / Cycling</option>
                <option value="remote_hybrid">Work From Home / Hybrid</option>
              </select>
            </div>

            <div>
              <label htmlFor="filtration-select" className="block text-xs font-medium text-slate-700">
                Current indoor filtration
              </label>
              <select
                id="filtration-select"
                value={profile.filtrationSetup}
                onChange={(e) => updateField('filtrationSetup', e.target.value as FiltrationSetup)}
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              >
                <option value="none">No air purifier yet</option>
                <option value="basic_hvac">Standard HVAC Filter Only</option>
                <option value="hepa_purifier">Portable HEPA Purifier(s)</option>
                <option value="diy_corsi_rosenthal">DIY Corsi-Rosenthal Box</option>
              </select>
            </div>
          </div>

          {/* Live Household Exposure & Source Diagnostic Strip */}
          <div className="grid grid-cols-1 gap-4 border-y border-slate-100 py-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-slate-600">Household Risk Share Breakdown</p>
              <p className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                Heating {diagnostic.heatingSharePct}% · Commute {diagnostic.commuteSharePct}% ·
                Infiltration {diagnostic.infiltrationSharePct}%
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">Primary Local Emission Driver</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{diagnostic.topEmissionSource}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">Indoor Filtration Baseline</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {diagnostic.filtrationEfficiencyLabel}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="lifestyle-notes-input" className="block text-xs font-medium text-slate-700">
                Optional routine notes (school hours, outdoor exercise, pet walks, drafty windows)
              </label>
              <input
                id="lifestyle-notes-input"
                type="text"
                maxLength={280}
                value={profile.lifestyleNotes}
                onChange={(e) => updateField('lifestyleNotes', e.target.value)}
                placeholder="e.g., 7:45 AM school drop-off, afternoon dog walk, older apartment windows"
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-teal-700 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>{isGenerating ? 'Analyzing Local Smog...' : 'Build Tailored Action Plan'}</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
