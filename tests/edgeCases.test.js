import { sanitizeImpactResult } from '../src/utils/gameLogic.js';
import { parseUserAction } from '../src/services/geminiClient.js';

describe('sanitizeImpactResult — malformed model output', () => {
  test('falls back to neutral values when every field is missing', () => {
    expect(sanitizeImpactResult({})).toEqual({
      impactScore: 0,
      category: 'unknown',
      remedy: 'Stand your ground!',
    });
  });

  test('falls back when fields are the wrong type entirely', () => {
    const result = sanitizeImpactResult({ impactScore: 'twelve', category: 42, remedy: null });
    expect(result.impactScore).toBe(0);
    expect(result.category).toBe('unknown');
    expect(result.remedy).toBe('Stand your ground!');
  });

  test('treats NaN/Infinity impact scores as neutral rather than propagating them', () => {
    expect(sanitizeImpactResult({ impactScore: NaN }).impactScore).toBe(0);
    expect(sanitizeImpactResult({ impactScore: Infinity }).impactScore).toBe(25);
  });

  test('handles a completely null/undefined payload without throwing', () => {
    expect(() => sanitizeImpactResult(null)).not.toThrow();
    expect(() => sanitizeImpactResult(undefined)).not.toThrow();
    expect(sanitizeImpactResult(null)).toEqual({
      impactScore: 0,
      category: 'unknown',
      remedy: 'Stand your ground!',
    });
  });
});

describe('parseUserAction — network and input edge cases', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('short-circuits on an empty string without calling fetch', async () => {
    global.fetch = jest.fn();
    const result = await parseUserAction('   ');
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.category).toBe('empty');
  });

  test('falls back gracefully when the proxy returns a non-OK status', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    const result = await parseUserAction('I drove to the store');
    expect(result).toEqual({ impactScore: 0, category: 'unknown', remedy: 'Stand your ground!' });
  });

  test('falls back gracefully when the network request itself rejects', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
    const result = await parseUserAction('I composted today');
    expect(result.impactScore).toBe(0);
    expect(result.category).toBe('unknown');
  });

  test('falls back gracefully when the proxy responds with malformed JSON shape', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ impactScore: 'not-a-number', category: null, remedy: undefined }),
    });
    const result = await parseUserAction('I unplugged my devices');
    expect(result.impactScore).toBe(0);
    expect(result.category).toBe('unknown');
    expect(result.remedy).toBe('Stand your ground!');
  });

  test('passes through a well-formed proxy response unchanged', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ impactScore: -8, category: 'transport', remedy: 'Try carpooling next time.' }),
    });
    const result = await parseUserAction('I drove alone across town');
    expect(result).toEqual({ impactScore: -8, category: 'transport', remedy: 'Try carpooling next time.' });
  });
});
