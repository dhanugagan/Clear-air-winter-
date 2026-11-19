/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FormEvent, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  Info,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  ThermometerSnowflake,
  Wind,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AirQualitySnapshot, HouseholdProfile, classifyAqi } from '../shared/airQuality';
import { FamilySafetyMatrix } from './FamilySafetyMatrix';
import { SmogTimelineChart } from './SmogTimelineChart';

const WINTER_CITIES = [
  'Salt Lake City',
  'Milan',
  'Denver',
  'Lahore',
  'Seoul',
  'Ulaanbaatar',
];

interface HeroTelemetryProps {
  snapshot: AirQualitySnapshot | null;
  profile: HouseholdProfile;
  isLoading: boolean;
  error: string | null;
  isSevereSmogMode: boolean;
  onToggleSevereSmogMode: () => void;
  onSelectCity: (city: string) => void;
  onUseCurrentLocation: () => void;
  isLocating: boolean;
}

function StatusGlyph({ symbol, className }: { symbol: 'check' | 'info' | 'alert' | 'warning'; className: string }) {
  if (symbol === 'check') return <CheckCircle2 className={className} aria-hidden="true" />;
  if (symbol === 'info') return <Info className={className} aria-hidden="true" />;
  if (symbol === 'alert') return <AlertTriangle className={className} aria-hidden="true" />;
  return <ShieldAlert className={className} aria-hidden="true" />;
}

export function HeroTelemetry({
  snapshot,
  profile,
  isLoading,
  error,
  isSevereSmogMode,
  onToggleSevereSmogMode,
  onSelectCity,
  onUseCurrentLocation,
  isLocating,
}: HeroTelemetryProps) {
  const [cityInput, setCityInput] = useState(snapshot?.locationName ?? 'Salt Lake City');
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (snapshot?.locationName) {
      setCityInput(snapshot.locationName);
    }
  }, [snapshot?.locationName]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (cityInput.trim().length >= 2) {
      onSelectCity(cityInput.trim());
    }
  };

  const aqiMeta = snapshot ? classifyAqi(snapshot.usAqi) : null;

  return (
    <section id="overview" className="mx-auto max-w-7xl px-4 pt-8 pb-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-6"
        >
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-teal-800">
                Winter Atmospheric &amp; Household Guidance
              </p>

              <div
                role="group"
                aria-label="Air quality data mode"
                className="inline-flex rounded-lg bg-slate-100 p-1"
              >
                <button
                  type="button"
                  aria-pressed={!isSevereSmogMode}
                  onClick={() => {
                    if (isSevereSmogMode) onToggleSevereSmogMode();
                  }}
                  className={`min-h-[32px] rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    !isSevereSmogMode
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Live Data
                </button>
                <button
                  type="button"
                  aria-pressed={isSevereSmogMode}
                  onClick={() => {
                    if (!isSevereSmogMode) onToggleSevereSmogMode();
                  }}
                  className={`min-h-[32px] rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    isSevereSmogMode
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Severe Smog Drill (AQI 218)
                </button>
              </div>
            </div>

            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl [text-wrap:balance]">
              Navigate winter smog with clear, low-emission daily choices
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600">
              Check live particulate and thermal inversion conditions in your city, then build an
              actionable indoor and neighborhood plan tailored to how your household heats, commutes,
              and breathes.
            </p>

            <form onSubmit={handleSubmit} className="mt-6" aria-label="Select city for live air quality">
              <label htmlFor="city-search-input" className="block text-xs font-medium text-slate-700">
                City or urban valley
              </label>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />
                  <input
                    id="city-search-input"
                    type="text"
                    autoComplete="address-level2"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    placeholder="Enter city (e.g., Salt Lake City, Milan, Seoul)"
                    className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-teal-700 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60 whitespace-nowrap shrink-0"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>Check Air</span>
                </button>
                <button
                  type="button"
                  onClick={onUseCurrentLocation}
                  disabled={isLocating || isLoading}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 whitespace-nowrap shrink-0"
                >
                  <Compass className="h-4 w-4 text-teal-700" aria-hidden="true" />
                  <span>{isLocating ? 'Locating...' : 'Use GPS'}</span>
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Quick winter smog city presets">
              <span className="mr-1 text-xs text-slate-600">Winter benchmarks:</span>
              {WINTER_CITIES.map((city) => {
                const active = snapshot?.locationName.toLowerCase() === city.toLowerCase();
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setCityInput(city);
                      onSelectCity(city);
                    }}
                    className={`min-h-[36px] rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'border border-teal-300 bg-teal-50 text-teal-900'
                        : 'border border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4" aria-live="polite">
            {error ? (
              <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" aria-hidden="true" />
                <span>{error}</span>
              </div>
            ) : snapshot && aqiMeta ? (
              <div className={`flex items-start gap-3 rounded-lg border p-3.5 ${aqiMeta.surfaceClass} ${aqiMeta.borderClass}`}>
                <StatusGlyph symbol={aqiMeta.symbol} className={`mt-0.5 h-5 w-5 shrink-0 ${aqiMeta.textClass}`} />
                <div className="text-sm">
                  <p className={`font-semibold ${aqiMeta.textClass}`}>
                    {snapshot.locationName} ({snapshot.regionLabel}) — {aqiMeta.label}
                    {snapshot.isSimulatedEpisode ? ' (Severe Episode Drill)' : ''}
                  </p>
                  <p className="mt-0.5 text-slate-700">{aqiMeta.shortGuidance}</p>
                </div>
              </div>
            ) : (
              <div role="status" aria-label="Loading local air quality" className="h-14 animate-pulse rounded-lg bg-slate-100" />
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="relative min-h-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 lg:col-span-6"
        >
          {!imageFailed ? (
            <img
              src="/src/assets/images/winter_city_inversion_1795075925329.jpg"
              alt="Winter urban valley showing sunlit upper mountain ridges above a cool thermal inversion haze layer"
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover lg:h-full"
            />
          ) : (
            <div className="flex h-full min-h-[280px] w-full flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-center text-slate-200">
              <ThermometerSnowflake className="h-10 w-10 text-teal-400" aria-hidden="true" />
              <p className="mt-3 font-display text-lg font-semibold">Winter Thermal Inversion Layer</p>
              <p className="mt-1 max-w-sm text-sm text-slate-300">
                Cold surface air traps urban particulates beneath warmer air aloft.
              </p>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <p className="text-xs font-medium text-teal-200">
              Why winter smog lingers
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-100 sm:text-base">
              {snapshot
                ? snapshot.inversionRisk.trappingMechanism
                : 'During cold, calm mornings, warm air aloft acts like a lid over urban valleys, concentrating heating smoke and vehicle exhaust at breathing height.'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Full-Width 4-Column Live Telemetry Strip */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-600">US AQI</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-3xl font-bold text-slate-900 tabular-nums">
              {snapshot ? snapshot.usAqi : '—'}
            </span>
            <span className="text-xs font-medium text-slate-700">
              {aqiMeta ? aqiMeta.level : 'Loading'}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600 font-mono tabular-nums">
            NO₂ {snapshot ? `${snapshot.no2} µg/m³` : '—'} · PM10 {snapshot ? `${snapshot.pm10} µg/m³` : '—'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-600">Fine Particulates (PM2.5)</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-bold text-slate-900 tabular-nums">
              {snapshot ? snapshot.pm25 : '—'}
            </span>
            <span className="font-mono text-xs text-slate-600">µg/m³</span>
          </div>
          <p className="mt-2 text-xs text-slate-600 font-mono tabular-nums">
            {snapshot
              ? `${(snapshot.pm25 / 15).toFixed(1)}× WHO 24h guideline (15 µg/m³)`
              : 'Measuring fine particulates'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-600">Thermal Inversion Risk</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-display text-2xl font-bold text-slate-900">
              {snapshot ? snapshot.inversionRisk.level : '—'}
            </span>
            <span className="font-mono text-xs text-slate-600 tabular-nums">
              {snapshot ? `Index ${snapshot.inversionRisk.score}/100` : ''}
            </span>
          </div>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-600 font-mono tabular-nums">
            <Wind className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
            {snapshot ? `${snapshot.temperatureC}°C · Wind ${snapshot.windSpeedKmh} km/h` : 'Calculating'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-600">Cleanest 2-Hour Window</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-bold text-teal-800 tabular-nums">
              {snapshot
                ? `${snapshot.cleanestWindow.startHour}–${snapshot.cleanestWindow.endHour}`
                : '—'}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600 font-mono tabular-nums">
            {snapshot
              ? `Est. ${snapshot.cleanestWindow.avgPm25} µg/m³ · AQI ${snapshot.cleanestWindow.avgAqi}`
              : 'Scanning 24h forecast'}
          </p>
        </div>
      </div>

      {snapshot && (
        <div className="mt-6 space-y-6">
          <FamilySafetyMatrix snapshot={snapshot} profile={profile} />
          <SmogTimelineChart hourly={snapshot.hourly} cleanestWindow={snapshot.cleanestWindow} />
        </div>
      )}
    </section>
  );
}
