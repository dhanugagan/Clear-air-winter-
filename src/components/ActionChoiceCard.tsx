/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Check, Clock, Leaf, Plus, ShieldCheck } from 'lucide-react';

interface ActionChoiceCardProps {
  kind: 'routine' | 'indoor' | 'alternative';
  kicker: string;
  metricSummary: string;
  title: string;
  body: string;
  crossedOutText?: string;
  directImpact: string;
  adopted: boolean;
  adoptLabel: string;
  adoptedLabel: string;
  onToggle: () => void;
}

export function ActionChoiceCard({
  kind,
  kicker,
  metricSummary,
  title,
  body,
  crossedOutText,
  directImpact,
  adopted,
  adoptLabel,
  adoptedLabel,
  onToggle,
}: ActionChoiceCardProps) {
  return (
    <article
      className={`flex flex-col justify-between rounded-xl border p-5 transition-colors ${
        adopted ? 'border-teal-300 bg-teal-50/35' : 'border-slate-200 bg-white'
      }`}
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5 font-mono font-medium text-teal-800">
            {kind === 'routine' && <Clock className="h-3.5 w-3.5" aria-hidden="true" />}
            {kind === 'alternative' && <Leaf className="h-3.5 w-3.5" aria-hidden="true" />}
            <span>{kicker}</span>
          </span>
          <span className="font-mono tabular-nums">{metricSummary}</span>
        </div>

        {crossedOutText && (
          <p className="mt-2 text-xs text-slate-600">
            Instead of: <span className="line-through">{crossedOutText}</span>
          </p>
        )}

        <h4 className="mt-2 font-display text-base font-bold text-slate-900">{title}</h4>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{body}</p>
        <p className="mt-3 border-t border-slate-100 pt-2.5 text-xs leading-relaxed text-slate-600">
          <strong className="font-semibold text-slate-900">Direct impact:</strong> {directImpact}
        </p>
      </div>

      <div className="mt-4">
        <button
          type="button"
          aria-pressed={adopted}
          onClick={onToggle}
          className={`inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            adopted
              ? 'border-teal-700 bg-teal-700 text-white hover:bg-teal-800'
              : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
          }`}
        >
          {adopted ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              <span>{adoptedLabel}</span>
            </>
          ) : (
            <>
              {kind === 'indoor' ? (
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{adoptLabel}</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}
