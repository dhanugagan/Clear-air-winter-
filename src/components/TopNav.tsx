/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Menu, Wind, X } from 'lucide-react';

interface TopNavProps {
  onGeneratePlan: () => void;
  isGenerating: boolean;
}

const NAV_LINKS = [
  { href: '#overview', label: 'Overview' },
  { href: '#household', label: 'Household' },
  { href: '#action-plan', label: 'Action Plan' },
  { href: '#ask-assistant', label: 'Ask Advisor' },
];

export function TopNav({ onGeneratePlan, isGenerating }: TopNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="py-1.5 hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Single primary action button + mobile navigation disclosure */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onGeneratePlan}
            disabled={isGenerating}
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {isGenerating ? 'Building Plan...' : 'Generate Plan'}
          </button>

          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          id="mobile-nav-menu"
          aria-label="Mobile navigation"
          className="border-t border-slate-200 bg-white px-4 py-3 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block min-h-[44px] rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
