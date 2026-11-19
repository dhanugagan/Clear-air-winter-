/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Wind } from 'lucide-react';
import { AirQualitySnapshot, AqiClassification } from '../shared/airQuality';

interface TelemetryMetricStripProps {
  snapshot: AirQualitySnapshot | null;
  aqiMeta: AqiClassification | null;
}

export function TelemetryMetricStrip({ snapshot, aqiMeta }: TelemetryMetricStripProps) {
  return (
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
  );
}
