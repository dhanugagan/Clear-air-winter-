/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionPlanWorkspace } from '../src/components/ActionPlanWorkspace';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { HeroTelemetry } from '../src/components/HeroTelemetry';
import { HouseholdConfigurator } from '../src/components/HouseholdConfigurator';
import { ImpactSimulatorPanel } from '../src/components/ImpactSimulatorPanel';
import { TopNav } from '../src/components/TopNav';
import {
  ActionPlanResponse,
  AirQualitySnapshot,
  HouseholdProfile,
  simulateActionImpact,
} from '../src/shared/airQuality';

afterEach(() => {
  cleanup();
});

const PROFILE: HouseholdProfile = {
  city: 'Salt Lake City',
  adults: 2,
  children: 1,
  seniors: 0,
  respiratorySensitivity: true,
  homeType: 'apartment',
  heatingSource: 'natural_gas',
  commuteMode: 'private_car',
  filtrationSetup: 'basic_hvac',
  lifestyleNotes: '',
};

const SNAPSHOT: AirQualitySnapshot = {
  locationName: 'Salt Lake City',
  regionLabel: 'Utah, United States',
  latitude: 40.76,
  longitude: -111.89,
  observedAtIso: '2026-11-19T08:00',
  usAqi: 158,
  pm25: 68.2,
  pm10: 84.0,
  no2: 49.0,
  so2: 5.0,
  co: 520,
  temperatureC: -2.0,
  humidityPct: 82,
  windSpeedKmh: 3.1,
  inversionRisk: {
    level: 'Severe',
    score: 88,
    summary: 'Strong cold-air trapping likely near street level',
    trappingMechanism: 'Calm winds and cold air trap emissions in the basin.',
  },
  cleanestWindow: {
    startHour: '14:00',
    endHour: '15:00',
    avgPm25: 38.0,
    avgAqi: 107,
    recommendation: 'Keep windows closed and run HEPA filtration.',
  },
  hourly: [
    { timeIso: '2026-11-19T08:00', hourLabel: '08:00', pm25: 68.2, pm10: 84, usAqi: 158, windSpeedKmh: 3.1, temperatureC: -2 },
    { timeIso: '2026-11-19T14:00', hourLabel: '14:00', pm25: 38.0, pm10: 50, usAqi: 107, windSpeedKmh: 9.0, temperatureC: 2 },
  ],
};

const PLAN: ActionPlanResponse = {
  generatedAtIso: '2026-11-19T08:15:00Z',
  advisoryHeadline: 'Move morning errands indoors and activate continuous air cleaning.',
  advisorySummary: 'Thermal inversion is concentrating particulates.',
  whyLocationMatters: 'Basin valley geometry slows winter airflow.',
  routines: [
    {
      id: 'r1',
      timeWindow: '07:30–09:00',
      title: 'Delay outdoor exercise until 14:00',
      guidance: 'Avoid brisk morning activity along arterial roads.',
      directImpact: 'Reduces morning fine particulate inhalation.',
      pm25ExposureReductionPct: 22,
      co2eSavedKg: 1.4,
      pm25EmissionAvoidedGrams: 0.7,
    },
  ],
  indoorHacks: [
    {
      id: 'h1',
      title: 'Assemble MERV-13 box fan purifier',
      difficulty: 'Low-Cost DIY',
      stepByStep: 'Tape a 20x20 MERV-13 filter to a box fan for living room circulation.',
      directImpact: 'Cuts indoor PM2.5 concentration rapidly.',
      pm25ExposureReductionPct: 45,
      co2eSavedKg: 0,
      pm25EmissionAvoidedGrams: 0,
    },
  ],
  sustainableAlternatives: [
    {
      id: 'a1',
      currentHabit: 'Solo morning car commute',
      sustainableSwap: 'Light rail or neighborhood carpool',
      whyItHelps: 'Eliminates cold-start winter exhaust.',
      directImpact: 'Lowers neighborhood NO2 and tailpipe PM2.5.',
      pm25ExposureReductionPct: 10,
      co2eSavedKg: 3.4,
      pm25EmissionAvoidedGrams: 2.1,
    },
  ],
  communityActions: [
    {
      id: 'c1',
      title: 'School idle-free zone',
      whoCanJoin: 'Parents and school staff',
      actionSummary: 'Turn off engines while waiting in pickup lanes.',
      collectiveImpact: 'Cuts child-height exhaust spikes.',
    },
  ],
};

describe('UI Components & Accessibility Interactions', () => {
  it('toggles accessible mobile navigation menu in TopNav', () => {
    const onGenerate = vi.fn();
    render(<TopNav onGeneratePlan={onGenerate} isGenerating={false} />);

    const menuToggle = screen.getByRole('button', { name: 'Open navigation menu' });
    expect(menuToggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(menuToggle);
    expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Mobile navigation' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Generate Plan' }));
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('renders HeroTelemetry with FamilySafetyMatrix, city search, and Severe Smog Drill toggle', () => {
    const onSelectCity = vi.fn();
    const onToggleDrill = vi.fn();

    render(
      <MotionConfig reducedMotion="user">
        <HeroTelemetry
          snapshot={SNAPSHOT}
          profile={PROFILE}
          isLoading={false}
          error={null}
          isSevereSmogMode={false}
          onToggleSevereSmogMode={onToggleDrill}
          onSelectCity={onSelectCity}
          onUseCurrentLocation={vi.fn()}
          isLocating={false}
        />
      </MotionConfig>
    );

    expect(screen.getByText('Immediate Family Safety Matrix')).toBeInTheDocument();
    expect(screen.getByText('Move brisk exercise & play indoors')).toBeInTheDocument();

    const drillBtn = screen.getByRole('button', { name: 'Severe Smog Drill (AQI 218)' });
    expect(drillBtn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(drillBtn);
    expect(onToggleDrill).toHaveBeenCalledTimes(1);

    const cityInput = screen.getByLabelText('City or urban valley');
    fireEvent.change(cityInput, { target: { value: 'Milan' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check Air' }));
    expect(onSelectCity).toHaveBeenCalledWith('Milan');
  });

  it('updates HouseholdConfigurator diagnostics live when heating source changes', () => {
    const onChange = vi.fn();
    render(
      <HouseholdConfigurator
        profile={PROFILE}
        snapshot={SNAPSHOT}
        onChange={onChange}
        onSubmit={vi.fn()}
        isGenerating={false}
      />
    );

    expect(screen.getByText(/Heating 28%/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Primary winter heating/i), {
      target: { value: 'wood_or_coal' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ heatingSource: 'wood_or_coal' })
    );
  });

  it('supports WAI-ARIA keyboard arrow navigation across ActionPlanWorkspace tabs and toggles choices', () => {
    const onToggleChoice = vi.fn();
    const impact = simulateActionImpact(['r1'], PLAN, SNAPSHOT.pm25);

    render(
      <MotionConfig reducedMotion="user">
        <ActionPlanWorkspace
          plan={PLAN}
          snapshot={SNAPSHOT}
          profile={PROFILE}
          impact={impact}
          isGenerating={false}
          error={null}
          selectedIds={['r1']}
          adoptedCommunityIds={[]}
          onToggleChoice={onToggleChoice}
          onToggleCommunityChoice={vi.fn()}
          onGeneratePlan={vi.fn()}
        />
      </MotionConfig>
    );

    const routinesTab = screen.getByRole('tab', { name: /Low-Emission Routines/ });
    expect(routinesTab).toHaveAttribute('aria-selected', 'true');

    // Keyboard ArrowRight switches to Indoor Air Hacks tab
    fireEvent.keyDown(routinesTab, { key: 'ArrowRight' });
    const indoorTab = screen.getByRole('tab', { name: /Indoor Air Hacks/ });
    expect(indoorTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Assemble MERV-13 box fan purifier')).toBeInTheDocument();

    // Toggle indoor hack button
    fireEvent.click(screen.getByRole('button', { name: 'Apply Indoor Hack' }));
    expect(onToggleChoice).toHaveBeenCalledWith('h1');
  });

  it('renders Direct Causal Breakdown table inside ImpactSimulatorPanel', () => {
    const impact = simulateActionImpact(['r1', 'h1'], PLAN, SNAPSHOT.pm25);

    render(
      <MotionConfig reducedMotion="user">
        <ImpactSimulatorPanel
          impact={impact}
          plan={PLAN}
          selectedIds={['r1', 'h1']}
          outdoorPm25={SNAPSHOT.pm25}
          onSelectAll={vi.fn()}
          onClearAll={vi.fn()}
          hasPlan={true}
        />
      </MotionConfig>
    );

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(impact.indoorExposureReductionPct));
    expect(screen.getByText('Why Your Adopted Choices Work (Direct Causal Breakdown)')).toBeInTheDocument();
    expect(screen.getByText('Reduces morning fine particulate inhalation.')).toBeInTheDocument();
  });

  it('catches runtime errors cleanly inside ErrorBoundary', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const BrokenChild = () => {
      throw new Error('Telemetry rendering failure');
    };

    render(
      <ErrorBoundary>
        <BrokenChild />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Telemetry rendering failure');
    expect(screen.getByRole('button', { name: 'Reload Workspace' })).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
