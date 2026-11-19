/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { HourlyForecastPoint, VentilationWindow, classifyAqi } from '../shared/airQuality';

interface SmogTimelineChartProps {
  hourly: HourlyForecastPoint[];
  cleanestWindow: VentilationWindow;
}

export function SmogTimelineChart({ hourly, cleanestWindow }: SmogTimelineChartProps) {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  if (!hourly.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Hourly dispersion forecast is currently unavailable for this station.
      </div>
    );
  }

  const maxPm25 = Math.max(45, ...hourly.map((point) => point.pm25));
  const activePoint = hourly[Math.min(activeIndex, hourly.length - 1)];
  const activeClass = classifyAqi(activePoint.usAqi);

  return (
    <section
      aria-label="24-hour winter smog dispersion forecast"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-900">
            24-Hour PM2.5 &amp; Smog Dispersion Curve
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Inspect hourly particulate levels to time errands and brief cross-ventilation. Cleanest window:{' '}
            <span className="font-mono font-semibold text-teal-800 tabular-nums">
              {cleanestWindow.startHour}–{cleanestWindow.endHour}
            </span>
          </p>
        </div>

        {/* Live keyboard/hover readout */}
        <div
          aria-live="polite"
          className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700 font-mono tabular-nums"
        >
          <span>
            <strong className="font-semibold text-slate-900">{activePoint.hourLabel}</strong>
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>PM2.5: {activePoint.pm25} µg/m³</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>US AQI: {activePoint.usAqi} ({activeClass.level})</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>Wind: {activePoint.windSpeedKmh} km/h</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>{activePoint.temperatureC}°C</span>
        </div>
      </div>

      {/* Interactive animated bar chart */}
      <div className="mt-5">
        <div
          role="list"
          aria-label="Hourly PM2.5 readings"
          className="grid grid-cols-12 gap-1.5 sm:grid-cols-[repeat(24,minmax(0,1fr))] sm:gap-1 items-end h-36 pt-4"
        >
          {hourly.slice(0, 24).map((point, index) => {
            const heightPct = Math.max(12, Math.round((point.pm25 / maxPm25) * 100));
            const aqiMeta = classifyAqi(point.usAqi);
            const isSelected = index === activeIndex;
            const isCleanest =
              point.hourLabel === cleanestWindow.startHour || point.hourLabel === cleanestWindow.endHour;

            return (
              <div key={point.timeIso} role="listitem" className="flex h-full flex-col items-center justify-end">
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`${point.hourLabel}: PM2.5 ${point.pm25} micrograms per cubic meter, AQI ${point.usAqi}, ${aqiMeta.level}`}
                  aria-pressed={isSelected}
                  className={`group relative flex w-full items-end justify-center rounded-t transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-teal-700 ${
                    isSelected ? 'scale-y-105' : 'hover:opacity-90'
                  }`}
                  style={{ height: '100%' }}
                >
                  <motion.span
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.35, delay: index * 0.015, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: isCleanest ? '#0f766e' : aqiMeta.barColor,
                      transformOrigin: 'bottom',
                    }}
                    className={`block w-full rounded-t-sm ${
                      isSelected ? 'ring-2 ring-slate-900 ring-offset-1' : 'opacity-85'
                    }`}
                  />
                </button>
                <span className="mt-2 text-[10px] font-mono text-slate-500 tabular-nums">
                  {index % 4 === 0 ? point.hourLabel.slice(0, 2) : ''}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600">
          <span>WHO 24h PM2.5 guideline: 15 µg/m³</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-xs bg-teal-700" aria-hidden="true" />
            Highlighted cleanest 2h window
          </span>
        </div>
      </div>
    </section>
  );
}
