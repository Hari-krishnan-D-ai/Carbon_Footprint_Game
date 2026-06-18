import { sanitizeImpactResult } from '../utils/gameLogic';

/**
 * The only network call the React app makes for intent parsing.
 * It always targets our own serverless /api/analyze-intent proxy — the Gemini API Key
 * is never present in frontend code or the browser bundle.
 */
export const parseUserAction = async (userText) => {
  const trimmed = typeof userText === 'string' ? userText.trim() : '';
  if (!trimmed) {
    return sanitizeImpactResult({ impactScore: 0, category: 'empty', remedy: 'Tell the village what you did.' });
  }

  try {
    const response = await fetch('/api/analyze-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userText: trimmed }),
    });

    if (!response.ok) throw new Error(`Proxy error: ${response.status}`);

    const data = await response.json();
    return sanitizeImpactResult(data);
  } catch (error) {
    console.error('Frontend boundary execution:', error);
    return sanitizeImpactResult({ impactScore: 0, category: 'unknown', remedy: 'Stand your ground!' });
  }
};
