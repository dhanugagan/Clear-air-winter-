/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Check, Copy, Download, Plus, Users } from 'lucide-react';
import {
  ActionPlanResponse,
  AirQualitySnapshot,
  HouseholdProfile,
  ImpactSimulationResult,
  calculateCommunityImpact,
  formatShareableBulletin,
} from '../shared/airQuality';

const COMMUNITY_SCALE_OPTIONS = [5, 15, 30, 50];

interface CommunityMultiplierPanelProps {
  plan: ActionPlanResponse;
  snapshot: AirQualitySnapshot | null;
  profile: HouseholdProfile;
  impact: ImpactSimulationResult;
  adoptedCommunityIds: string[];
  onToggleCommunityChoice: (id: string) => void;
}

export function CommunityMultiplierPanel({
  plan,
  snapshot,
  profile,
  impact,
  adoptedCommunityIds,
  onToggleCommunityChoice,
}: CommunityMultiplierPanelProps) {
  const [neighborhoodHouseholds, setNeighborhoodHouseholds] = useState<number>(15);
  const [bulletinStatus, setBulletinStatus] = useState<string>('');

  const communitySet = new Set(adoptedCommunityIds);
  const householdSize = profile.adults + profile.children + profile.seniors;
  const communityMultiplier = calculateCommunityImpact(
    impact,
    neighborhoodHouseholds,
    adoptedCommunityIds.length,
    householdSize
  );

  const handleCopyBulletin = async () => {
    if (!snapshot) return;
    const text = formatShareableBulletin({
      snapshot,
      plan,
      impact,
      community: communityMultiplier,
    });
    try {
      await navigator.clipboard.writeText(text);
      setBulletinStatus('Neighborhood bulletin copied to clipboard.');
      setTimeout(() => setBulletinStatus(''), 3000);
    } catch {
      setBulletinStatus('Clipboard unavailable. Use Download Bulletin instead.');
    }
  };

  const handleDownloadBulletin = () => {
    if (!snapshot) return;
    const text = formatShareableBulletin({
      snapshot,
      plan,
      impact,
      community: communityMultiplier,
    });
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clearair-${snapshot.locationName.toLowerCase().replace(/\s+/g, '-')}-bulletin.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setBulletinStatus('Neighborhood bulletin downloaded as text file.');
    setTimeout(() => setBulletinStatus(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Community Multiplier &amp; Neighborhood Clean-Air Bulletin
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              See how neighborhood-wide adoption compounds local smog reduction, then share a crisp
              clean-air alert with schools, HOAs, or neighbors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Participating neighborhood households">
            <span className="text-xs font-medium text-slate-700">Participating homes:</span>
            {COMMUNITY_SCALE_OPTIONS.map((count) => (
              <button
                key={count}
                type="button"
                aria-pressed={neighborhoodHouseholds === count}
                onClick={() => setNeighborhoodHouseholds(count)}
                className={`min-h-[36px] rounded-md px-3 py-1 text-xs font-mono font-semibold transition-colors tabular-nums ${
                  neighborhoodHouseholds === count
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-600">Residents Protected</p>
            <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {communityMultiplier.cleanAirProtectedResidents} people
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Monthly Neighborhood CO₂e Avoided</p>
            <p className="mt-1 font-mono text-2xl font-bold text-teal-800 tabular-nums">
              {communityMultiplier.monthlyCo2eAvoidedKg} kg
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Monthly Direct Smoke Prevented</p>
            <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {communityMultiplier.monthlyPm25AvoidedKg} kg PM2.5
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!snapshot}
            onClick={() => void handleCopyBulletin()}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Copy Shareable Bulletin</span>
          </button>
          <button
            type="button"
            disabled={!snapshot}
            onClick={handleDownloadBulletin}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Download Bulletin (.txt)</span>
          </button>
          <span aria-live="polite" className="text-xs font-medium text-teal-800">
            {bulletinStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plan.communityActions.map((action) => {
          const joined = communitySet.has(action.id);
          return (
            <article
              key={action.id}
              className={`flex flex-col justify-between rounded-xl border p-5 transition-colors ${
                joined ? 'border-teal-300 bg-teal-50/35' : 'border-slate-200 bg-white'
              }`}
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
                <p className="mt-4 border-t border-slate-100 pt-2.5 text-xs leading-relaxed text-slate-600">
                  <strong className="font-semibold text-slate-900">Neighborhood effect:</strong>{' '}
                  {action.collectiveImpact}
                </p>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  aria-pressed={joined}
                  onClick={() => onToggleCommunityChoice(action.id)}
                  className={`inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    joined
                      ? 'border-teal-700 bg-teal-700 text-white hover:bg-teal-800'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {joined ? (
                    <>
                      <Check className="h-4 w-4" aria-hidden="true" />
                      <span>Organizing Locally</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      <span>Pledge Community Action</span>
                    </>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
