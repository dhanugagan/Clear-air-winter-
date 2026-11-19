/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { NextFunction, Request, Response } from 'express';
import {
  ActionPlanResponse,
  AirQualitySnapshot,
  AskQuestionResponse,
  HouseholdProfile,
  sanitizeAirQualitySnapshot,
  validateAskQuestion,
  validateCityQuery,
  validateCoordinates,
  validateHouseholdProfile,
} from '../src/shared/airQuality.ts';
import {
  fetchAirQualityByCity,
  fetchAirQualityByCoords,
} from './services/airQualityService.ts';
import {
  answerAirQualityQuestion,
  generateActionPlan,
} from './services/geminiService.ts';

export interface ApiDependencies {
  fetchByCity: (city: string) => Promise<AirQualitySnapshot>;
  fetchByCoords: (lat: number, lon: number) => Promise<AirQualitySnapshot>;
  generatePlan: (profile: HouseholdProfile, snapshot: AirQualitySnapshot) => Promise<ActionPlanResponse>;
  askQuestion: (
    question: string,
    profile: HouseholdProfile,
    snapshot: AirQualitySnapshot
  ) => Promise<AskQuestionResponse>;
}

const DEFAULT_DEPS: ApiDependencies = {
  fetchByCity: fetchAirQualityByCity,
  fetchByCoords: fetchAirQualityByCoords,
  generatePlan: generateActionPlan,
  askQuestion: answerAirQualityQuestion,
};

/**
 * Bounded sliding-window rate limiter to protect AI routes from bursts.
 */
export function createRateLimiter(maxRequests = 30, windowMs = 5 * 60 * 1000) {
  const hits = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.socket.remoteAddress || 'local';
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((ts) => now - ts < windowMs);

    if (recent.length >= maxRequests) {
      res.status(429).json({
        error: 'Rate limit exceeded for AI assistant requests. Please wait a moment and try again.',
      });
      return;
    }

    recent.push(now);
    if (hits.size > 500) {
      const oldestKey = hits.keys().next().value;
      if (oldestKey !== undefined) hits.delete(oldestKey);
    }
    hits.set(key, recent);
    next();
  };
}

/**
 * Builds the Express API application with hardened security headers and dependency injection.
 */
export function createApiApp(overrides: Partial<ApiDependencies> = {}): express.Express {
  const deps: ApiDependencies = { ...DEFAULT_DEPS, ...overrides };
  const app = express();
  const aiRateLimit = createRateLimiter(30, 5 * 60 * 1000);

  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    next();
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'clearair-winter-api',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/air-quality', async (req: Request, res: Response) => {
    const check = validateCityQuery(req.query.city);
    if (!check.ok) {
      res.status(400).json({ error: check.error });
      return;
    }
    try {
      const snapshot = await deps.fetchByCity(check.city);
      res.json(snapshot);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to fetch air quality data.';
      const status = message.includes('Could not locate') ? 404 : 502;
      res.status(status).json({ error: message });
    }
  });

  app.get('/api/air-quality/coords', async (req: Request, res: Response) => {
    const check = validateCoordinates(req.query.lat, req.query.lon);
    if (!check.ok) {
      res.status(400).json({ error: check.error });
      return;
    }
    try {
      const snapshot = await deps.fetchByCoords(check.lat, check.lon);
      res.json(snapshot);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to fetch local coordinates air data.';
      res.status(502).json({ error: message });
    }
  });

  app.post('/api/assistant/plan', aiRateLimit, async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const body = req.body as Record<string, unknown> | undefined;
    const profileCheck = validateHouseholdProfile(body?.profile);
    if (!profileCheck.ok) {
      res.status(400).json({ error: profileCheck.error });
      return;
    }

    try {
      const sanitizedSnapshot = sanitizeAirQualitySnapshot(body?.airQuality);
      const snapshot = sanitizedSnapshot ?? (await deps.fetchByCity(profileCheck.profile.city));

      const plan = await deps.generatePlan(profileCheck.profile, snapshot);
      res.json(plan);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate action plan.';
      const status = message.includes('GEMINI_API_KEY') ? 503 : 502;
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/assistant/ask', aiRateLimit, async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const body = req.body as Record<string, unknown> | undefined;
    const questionCheck = validateAskQuestion(body?.question);
    if (!questionCheck.ok) {
      res.status(400).json({ error: questionCheck.error });
      return;
    }
    const profileCheck = validateHouseholdProfile(body?.profile);
    if (!profileCheck.ok) {
      res.status(400).json({ error: profileCheck.error });
      return;
    }

    try {
      const sanitizedSnapshot = sanitizeAirQualitySnapshot(body?.airQuality);
      const snapshot = sanitizedSnapshot ?? (await deps.fetchByCity(profileCheck.profile.city));

      const answer = await deps.askQuestion(
        questionCheck.question,
        profileCheck.profile,
        snapshot
      );
      res.json(answer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to answer question.';
      const status = message.includes('GEMINI_API_KEY') ? 503 : 502;
      res.status(status).json({ error: message });
    }
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(400).json({ error: err.message || 'Malformed JSON request payload.' });
  });

  return app;
}
