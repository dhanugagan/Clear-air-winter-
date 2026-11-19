/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'node:http';
import { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApiApp } from '../server/app';
import { TtlCache } from '../server/services/airQualityService';

describe('TtlCache Efficiency & Bounding', () => {
  it('expires stale entries and caps maximum entry count', () => {
    const cache = new TtlCache<string>(2);
    cache.set('a', '1', 5000);
    cache.set('b', '2', 5000);
    cache.set('c', '3', 5000);

    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBe('2');
    expect(cache.get('c')).toBe('3');

    cache.set('expired', 'x', -10);
    expect(cache.get('expired')).toBeNull();
  });
});

describe('Express API Security & Validation Contracts', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApiApp();
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('returns healthy status and security headers on /api/health', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(res.headers.get('x-powered-by')).toBeNull();

    const body = (await res.json()) as { status: string; service: string };
    expect(body.status).toBe('ok');
    expect(body.service).toBe('clearair-winter-api');
  });

  it('rejects invalid city queries with HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/api/air-quality?city=x`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('at least 2 characters');
  });

  it('rejects out-of-range coordinates with HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/api/air-quality/coords?lat=999&lon=10`);
    expect(res.status).toBe(400);
  });

  it('rejects malformed profile payloads on POST /api/assistant/plan', async () => {
    const res = await fetch(`${baseUrl}/api/assistant/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: {
          city: 'Milan',
          homeType: 'invalid_type',
        },
      }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBeTruthy();
  });

  it('rejects empty questions on POST /api/assistant/ask', async () => {
    const res = await fetch(`${baseUrl}/api/assistant/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'no',
        profile: {
          city: 'Milan',
          adults: 2,
          children: 0,
          seniors: 0,
          respiratorySensitivity: false,
          homeType: 'apartment',
          heatingSource: 'heat_pump',
          commuteMode: 'public_transit',
          filtrationSetup: 'hepa_purifier',
          lifestyleNotes: '',
        },
      }),
    });
    expect(res.status).toBe(400);
  });
});
