/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import {
  AirQualitySnapshot,
  FamilySafetyDirective,
  HouseholdProfile,
  buildFamilySafetyMatrix,
} from '../shared/airQuality';

interface FamilySafetyMatrixProps {
  snapshot: AirQualitySnapshot;
  profile: HouseholdProfile;
}

function DirectiveBadge({ status }: { status: FamilySafetyDirective['status'] }) {
  if (status === 'Clear') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Clear</span>
      </span>
    );
  }
  if (status === 'Caution') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Caution</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-800">
      <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
      <span>Protect</span>
    </span>
  );
}

export function FamilySafetyMatrix({ snapshot, profile }: FamilySafetyMatrixProps) {
  const directives = buildFamilySafetyMatrix(snapshot, profile);

  return (
    <section
      aria-labelledby="safety-matrix-heading"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div className="border-b border-slate-100 pb-4">
        <h2 id="safety-matrix-heading" className="font-display text-base font-semibold text-slate-900">
          Immediate Family Safety Matrix
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Calibrated to {snapshot.locationName} (US AQI {snapshot.usAqi}) and your household
          profile.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {directives.map((item) => (
          <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-600">{item.domain}</span>
              <DirectiveBadge status={item.status} />
            </div>
            <h3 className="mt-2 font-display text-sm font-bold text-slate-900">
              {item.directive}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{item.rationale}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
