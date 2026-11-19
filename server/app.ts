/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { NextFunction, Request, Response } from 'express';
import {
  AirQualitySnapshot,
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

function isSnapshotLike(raw: unknown): raw is AirQualitySnapshot {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Record<string, unknown>;
  return (
    typeof obj.locationName === 'string' &&
    typeof obj.usAqi === 'number' &&
    typeof obj.pm25 === 'number' &&
    typeof obj.temperatureC === 'number' &&
    typeof obj.windSpeedKmh === 'number' &&
    Boolean(obj.inversionRisk) &&
    Boolean(obj.cleanestWindow)
  );
}

export function createApiApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));

  // Hardened HTTP security headers compatible with iframe preview
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
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
      const snapshot = await fetchAirQualityByCity(check.city);
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
      const snapshot = await fetchAirQualityByCoords(check.lat, check.lon);
      res.json(snapshot);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to fetch local coordinates air data.';
      res.status(502).json({ error: message });
    }
  });

  app.post('/api/assistant/plan', async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown> | undefined;
    const profileCheck = validateHouseholdProfile(body?.profile);
    if (!profileCheck.ok) {
      res.status(400).json({ error: profileCheck.error });
      return;
    }

    try {
      const snapshot = isSnapshotLike(body?.airQuality)
        ? body.airQuality
        : await fetchAirQualityByCity(profileCheck.profile.city);

      const plan = await generateActionPlan(profileCheck.profile, snapshot);
      res.json(plan);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate action plan.';
      const status = message.includes('GEMINI_API_KEY') ? 503 : 502;
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/assistant/ask', async (req: Request, res: Response) => {
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
      const snapshot = isSnapshotLike(body?.airQuality)
        ? body.airQuality
        : await fetchAirQualityByCity(profileCheck.profile.city);

      const answer = await answerAirQualityQuestion(
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

  // Explicit JSON payload parse error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(400).json({ error: err.message || 'Malformed JSON request payload.' });
  });

  return app;
}
