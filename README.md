# ClearAir Winter — Urban Air Quality Assistant

ClearAir Winter is a full-stack GenAI-powered assistant designed to help families and communities navigate severe winter smog and urban air pollution. It combines live atmospheric and weather telemetry with tailored household guidance—covering low-emission daily routines, indoor air quality hacks, sustainable lifestyle swaps, and community actions—while clearly quantifying the direct impact of every choice.

---

## Key Capabilities & Problem Statement Alignment

1. **Live Local Air & Winter Inversion Telemetry**
   - Integrates real-time **Open-Meteo Geocoding, Air Quality, and Weather APIs** (US AQI, PM2.5, PM10, NO₂, SO₂, CO, temperature, humidity, and wind speed).
   - Computes a physical **Thermal Inversion Risk Index** explaining why cold air and calm winds trap winter smog near street level.
   - Scans the next 24 hours to identify the **Cleanest 2-Hour Window** for brief cross-ventilation or essential outdoor errands.

2. **Tailored GenAI Household Action Plans (`gemini-4-hydrogen`)**
   - Adapts recommendations to household composition (adults, children, older adults, asthma/respiratory sensitivity), home structure, heating/cooking fuel, daily commute, and indoor filtration setup.
   - Generates structured, science-grounded guidance across four categories:
     - **Low-Emission Daily Routines**: Timing errands and school runs around dispersion curves.
     - **Indoor Air Quality Hacks**: Zero-cost habits, DIY Corsi-Rosenthal box setups, and HEPA/MERV-13 protocols.
     - **Sustainable Alternatives**: Practical heating, cooking, and transit swaps with clear causal mechanisms.
     - **Community Actions**: Collective neighborhood steps such as school idle-free zones and shared clean-air spaces.

3. **Interactive Impact Simulator**
   - Families toggle individual routines, indoor hacks, and sustainable swaps to see immediate updates to:
     - **Indoor PM2.5 Exposure Cut (%)** and projected indoor concentration ($\mu\text{g/m}^3$) using a bounded diminishing-returns physical model.
     - **Daily & Monthly $\text{CO}_2\text{e}$ Avoided (kg)**.
     - **Direct Particulate Emissions Prevented (g PM2.5/day)**.

4. **Context-Aware Clean-Air Advisor Q&A**
   - Lets households ask targeted follow-up questions grounded in their city's live telemetry and home configuration.

---

## Architecture

```text
├── server.ts                        # Full-stack Express + Vite server entry point (port 3000)
├── server/
│   ├── app.ts                       # Express API router, security headers, strict validation
│   └── services/
│       ├── airQualityService.ts     # Open-Meteo integration + bounded TTL caching
│       └── geminiService.ts         # Server-side @google/genai client with responseSchema & retries
├── src/
│   ├── shared/airQuality.ts         # Pure domain physics, impact simulator, & validators
│   ├── components/
│   │   ├── TopNav.tsx               # 3-zone accessible navigation header
│   │   ├── HeroTelemetry.tsx        # Location search, GPS lookup, & live metrics
│   │   ├── SmogTimelineChart.tsx    # Interactive 24h dispersion curve with Motion animations
│   │   ├── HouseholdConfigurator.tsx# Accessible household & lifestyle form
│   │   ├── ImpactSimulatorPanel.tsx # Animated exposure & emission impact calculator
│   │   ├── ActionPlanWorkspace.tsx  # Tabbed action plan with interactive choice adoption
│   │   └── AskAssistantPanel.tsx    # Context-aware Q&A advisor
│   └── App.tsx                      # Root orchestrator with MotionConfig reducedMotion="user"
└── tests/
    ├── airQuality.test.ts           # Unit tests for physics, impact math, & sanitization
    └── api.test.ts                  # Express route, security header, & cache tests
```

---

## Security & Privacy Controls

- **Server-Side AI Execution**: All `@google/genai` calls execute exclusively on the Express backend (`server/services/geminiService.ts`); `GEMINI_API_KEY` is never exposed to client bundles.
- **Strict Input Validation & Sanitization**: City names, geographic coordinates, household profiles, and user questions are validated against strict allowlists, length limits, and numeric bounds (`src/shared/airQuality.ts`), stripping control characters and angle brackets.
- **Prompt Framing Hardening**: Untrusted user inputs are serialized into delimited JSON payloads rather than interpolated directly into system instructions.
- **HTTP Hardening**: Express disables `x-powered-by`, enforces a `32kb` JSON body limit, and sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, and `Permissions-Policy`.

---

## Efficiency & Performance

- **Bounded TTL Caching**: `TtlCache` caches geocoding lookups (60 min) and environmental snapshots (5 min) with a strict entry cap to prevent redundant upstream API calls and unbounded memory growth.
- **Request Cancellation & Timeouts**: Client fetches use `AbortController` to cancel superseded city lookups, and server upstream requests enforce `AbortSignal.timeout(8000)`.
- **Compositor-Only Animations**: UI transitions via `motion/react` animate only `transform` and `opacity` for 60fps rendering.

---

## Accessibility (WCAG AA)

- **Keyboard & Screen-Reader Ready**: Semantic landmarks (`<header>`, `<main>`, `<nav>`, `<section>`, `<footer>`), skip-to-content link, `role="tablist"` / `role="tab"`, `aria-pressed` toggles, and `aria-live="polite"` status updates.
- **Non-Hue-Only Signaling**: Every AQI and inversion risk level pairs semantic color with explicit text labels and icons.
- **Motion Sensitivity**: Wrapped in `<MotionConfig reducedMotion="user">` alongside `@media (prefers-reduced-motion: reduce)`.
- **Touch Targets & Contrast**: Minimum `40px–44px` interactive controls and high-contrast slate/teal typography with tabular numerals (`tabular-nums`).

---

## Automated Testing & Verification

Run the test suite, TypeScript type-check, and production build:

```bash
npm test        # Runs Vitest unit and API integration tests
npm run lint    # Runs tsc --noEmit type checking
npm run build   # Builds optimized Vite production bundle
```

---

## Local Development

1. Install dependencies: `npm install`
2. Set `GEMINI_API_KEY` in your environment or AI Studio Secrets panel.
3. Start the full-stack server on port `3000`: `npm run dev`
