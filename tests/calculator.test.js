import {
  clamp,
  applyImpactToHealth,
  applyImpactToPollution,
  classifyHealth,
  sanitizeImpactResult,
} from '../src/utils/gameLogic.js';

describe('clamp', () => {
  test('keeps values within the default 0-100 range', () => {
    expect(clamp(150)).toBe(100);
    expect(clamp(-20)).toBe(0);
    expect(clamp(42)).toBe(42);
  });

  test('respects custom min/max bounds', () => {
    expect(clamp(30, -25, 25)).toBe(25);
    expect(clamp(-30, -25, 25)).toBe(-25);
  });
});

describe('applyImpactToHealth', () => {
  test('adds a positive impact score to current health', () => {
    expect(applyImpactToHealth(50, 10)).toBe(60);
  });

  test('subtracts a negative impact score from current health', () => {
    expect(applyImpactToHealth(50, -15)).toBe(35);
  });

  test('never exceeds 100', () => {
    expect(applyImpactToHealth(95, 25)).toBe(100);
  });

  test('never drops below 0', () => {
    expect(applyImpactToHealth(5, -25)).toBe(0);
  });
});

describe('applyImpactToPollution', () => {
  test('builds pollution faster than it clears (asymmetric mechanic)', () => {
    const afterBadAction = applyImpactToPollution(20, -10);
    const afterGoodAction = applyImpactToPollution(20, 10);
    expect(afterBadAction).toBe(35); // 20 + 10 * 1.5
    expect(afterGoodAction).toBe(15); // 20 - 10 * 0.5
  });

  test('a neutral (zero) impact score leaves pollution unchanged', () => {
    expect(applyImpactToPollution(40, 0)).toBe(40);
  });

  test('stays within 0-100 bounds at the extremes', () => {
    expect(applyImpactToPollution(95, -25)).toBe(100);
    expect(applyImpactToPollution(5, 25)).toBe(0);
  });
});

describe('classifyHealth', () => {
  test('classifies the three health bands at their boundaries', () => {
    expect(classifyHealth(100)).toBe('thriving');
    expect(classifyHealth(75)).toBe('thriving');
    expect(classifyHealth(74)).toBe('strained');
    expect(classifyHealth(40)).toBe('strained');
    expect(classifyHealth(39)).toBe('critical');
    expect(classifyHealth(0)).toBe('critical');
  });
});

describe('sanitizeImpactResult', () => {
  test('passes through a well-formed result', () => {
    expect(sanitizeImpactResult({ impactScore: 12, category: 'transport', remedy: 'Nice work.' })).toEqual({
      impactScore: 12,
      category: 'transport',
      remedy: 'Nice work.',
    });
  });

  test('clamps an out-of-range impact score to ±25', () => {
    expect(sanitizeImpactResult({ impactScore: 999, category: 'x', remedy: 'y' }).impactScore).toBe(25);
    expect(sanitizeImpactResult({ impactScore: -999, category: 'x', remedy: 'y' }).impactScore).toBe(-25);
  });
});
