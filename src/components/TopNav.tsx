/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Wind } from 'lucide-react';

interface TopNavProps {
  onGeneratePlan: () => void;
  isGenerating: boolean;
}

export function TopNav({ onGeneratePlan, isGenerating }: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3 sm:px-6 lg:px-8">
        {/* Zone 1: Single-element brand wordmark */}
        <a
          href="#overview"
          className="inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          <Wind className="h-5 w-5 text-teal-700" aria-hidden="true" />
          <span>ClearAir</span>
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a
            href="#overview"
            className="py-1.5 hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Overview
          </a>
          <a
            href="#household"
            className="py-1.5 hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Household
          </a>
          <a
            href="#action-plan"
            className="py-1.5 hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Action Plan
          </a>
          <a
            href="#ask-assistant"
            className="py-1.5 hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Ask Advisor
          </a>
        </nav>

        {/* Zone 3: Single primary action button */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onGeneratePlan}
            disabled={isGenerating}
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {isGenerating ? 'Building Plan...' : 'Generate Plan'}
          </button>
        </div>
      </div>
    </header>
  );
}
