# ClearAir Winter — Urban Air Quality Assistant

ClearAir Winter is a full-stack GenAI-powered assistant designed to help families and communities navigate severe winter smog and urban air pollution. It combines live atmospheric and weather telemetry with tailored household guidance—covering low-emission daily routines, indoor air quality hacks, sustainable lifestyle alternatives, and neighborhood community actions—while clearly quantifying the direct impact of every choice.

---

## Problem Statement Alignment

| Requirement | Implementation in ClearAir Winter |
| --- | --- |
| **Navigate severe winter smog & urban air pollution** | Live Open-Meteo AQI, PM2.5, PM10, NO₂, SO₂, CO, wind, and temperature telemetry paired with a **Thermal Inversion Risk Index**, **Immediate Family Safety Matrix**, **24-Hour Dispersion Curve**, **Cleanest 2-Hour Window** finder, and an interactive **Severe Smog Drill (AQI 218)** mode. |
| **Low-emission daily routines** | GenAI-generated chronological schedules (`gemini-4-hydrogen` with strict JSON schema) aligned to hourly dispersion valleys and school/commute timing. |
| **Indoor air quality hacks** | Tiered protocols (*Zero-Cost Habit*, *Low-Cost DIY* Corsi-Rosenthal box, *Equipment Upgrade*) with step-by-step filtration and kitchen ventilation physics. |
| **Sustainable alternatives tailored to location & lifestyle** | Household diagnostic engine (`analyzeHouseholdEmissionProfile`) attributing heating, commute, and infiltration risk, feeding tailored swaps into the Gemini planner. |
| **Clearly explain direct impact of choices** | Every card states the causal mechanism (`directImpact`), and the interactive **Choice Impact Simulator** renders a **Direct Causal Breakdown** table alongside before/after indoor PM2.5 ($\mu\text{g/m}^3$), exposure reduction (%), $\text{CO}_2\text{e}$ avoided (kg), and direct PM2.5 smoke prevented (g). |
| **Empower families & communities** | **Community Clean-Air Multiplier** scales collective impact across 5–50 participating households and exports/copies a ready-to-share **Neighborhood Clean-Air Bulletin**. |

---

## Architecture

```text
├── server.ts                         # Full-stack Express + Vite server entry point (port 3000) + graceful shutdown
├── eslint.config.js                  # Strict ESLint + TypeScript + React Hooks + jsx-a11y rules
├── server/
│   ├── app.ts                        # Express router, security headers, rate limiter, DI support
│   └── services/
│       ├── airQualityService.ts      # Open-Meteo integration + bounded TtlCache
│       └── geminiService.ts          # Server-side @google/genai client with schema & runtime sanitization
├── src/
│   ├── shared/
│   │   ├── types.ts                  # Core domain TypeScript interfaces & contracts
│   │   ├── airPhysics.ts             # AQI classification, inversion model, diagnostics, & impact math
│   │   ├── validation.ts             # Input/snapshot sanitization, allowlist validation, & bounds clamping
│   │   └── airQuality.ts             # Unified domain module barrel export
│   ├── services/apiClient.ts         # Typed frontend fetch client with AbortSignal support
│   ├── components/
│   │   ├── ErrorBoundary.tsx         # Resilient React error boundary
│   │   ├── TopNav.tsx                # 3-zone accessible navigation header + mobile disclosure
│   │   ├── TelemetryMetricStrip.tsx  # Modular AQI, PM2.5, thermal inversion, & ventilation metrics
│   │   ├── HeroTelemetry.tsx         # City search, GPS, Severe Smog Drill, & live telemetry deck
│   │   ├── FamilySafetyMatrix.tsx    # Immediate outdoor, masking, window, & filtration directives
│   │   ├── SmogTimelineChart.tsx     # Keyboard-navigable 24h dispersion curve with Motion animations
│   │   ├── HouseholdConfigurator.tsx # Household profile form & live emission diagnostic strip
│   │   ├── ImpactSimulatorPanel.tsx  # Animated exposure/emission simulator & causal breakdown table
│   │   ├── ActionChoiceCard.tsx      # Modular accessible action card primitive
│   │   ├── CommunityMultiplierPanel.tsx # Neighborhood collective impact & bulletin export
│   │   ├── ActionPlanWorkspace.tsx   # WAI-ARIA keyboard-navigable tabbed plan workspace
│   │   └── AskAssistantPanel.tsx     # Context-aware Clean-Air Advisor Q&A
│   └── App.tsx                       # Root orchestrator wrapped in ErrorBoundary & MotionConfig
└── tests/
    ├── airQuality.test.ts            # Unit tests for physics, diagnostics, safety matrix, & sanitization
    ├── api.test.ts                   # Express route, security header, rate limiter, & cache tests
    ├── apiClient.test.ts             # Frontend HTTP client & error-fallback unit tests
    ├── services.test.ts              # Open-Meteo parsing, caching, Gemini sanitization & retry tests
    └── components.test.tsx           # React Testing Library UI, keyboard a11y, & ErrorBoundary tests
```

---

## Engineering Standards

### Code Quality
- Strict TypeScript (`"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`) plus ESLint (`@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`) across client, server, and test suites.
- Clean separation of concerns: split shared domain modules (`src/shared/types.ts`, `airPhysics.ts`, `validation.ts`), typed HTTP client (`src/services/apiClient.ts`), backend services (`server/services/*`), modular React components (`TelemetryMetricStrip`, `ActionChoiceCard`, `CommunityMultiplierPanel`, `FamilySafetyMatrix`), and resilient `ErrorBoundary`.

### Security
- **Server-Side AI Execution**: All `@google/genai` calls execute strictly on the Express backend; `GEMINI_API_KEY` is never exposed to client bundles.
- **Validation & Sanitization**: Allowlist regexes, enum validation, length limits, coordinate bounds, `sanitizeAirQualitySnapshot` request clamping, runtime Gemini output sanitization (`sanitizeActionPlanPayload`, `sanitizeAskPayload`), and HTML/control-character stripping on every endpoint.
- **Abuse & Header Hardening**: `32kb` JSON body limit, sliding-window AI endpoint rate limiter (`429`), `Cache-Control: no-store` on personalized AI routes, disabled `x-powered-by`, and `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-DNS-Prefetch-Control`, `X-Permitted-Cross-Domain-Policies`, and `Cross-Origin-Resource-Policy` headers.

### Efficiency
- Bounded `TtlCache` (60-minute geocoding cache, 5-minute environmental snapshot cache) prevents redundant upstream API calls.
- Client `AbortController` cancellation and server `AbortSignal.timeout(8000)` eliminate stale race conditions.
- Compositor-only `motion/react` animations (`transform`, `opacity`).

### Accessibility (WCAG AA/AAA)
- Enforced statically via `eslint-plugin-jsx-a11y` and verified dynamically with React Testing Library.
- Strict `h1 -> h2 -> h3 -> h4` heading hierarchy with zero skipped levels.
- Semantic landmarks, skip-to-main-content link, accessible mobile navigation disclosure (`aria-expanded`), full WAI-ARIA `tablist`/`tab`/`tabpanel` keyboard navigation (`ArrowLeft`, `ArrowRight`, `Home`, `End`), keyboard-navigable 24-hour dispersion bars, `role="progressbar"`, `aria-live="polite"` feedback regions, non-hue-only status indicators, and `<MotionConfig reducedMotion="user">`.

---

## Automated Testing & Verification

```bash
npm test        # Runs Vitest unit, service, API integration, and React UI/a11y suites
npm run lint    # Runs strict tsc --noEmit and ESLint + jsx-a11y static verification
npm run build   # Builds optimized Vite production bundle
```

---

## Local Development

1. Install dependencies: `npm install`
2. Configure `GEMINI_API_KEY` in environment variables or AI Studio Secrets.
3. Start the full-stack server on port `3000`: `npm run dev`
