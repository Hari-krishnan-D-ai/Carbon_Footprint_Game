// Runs on the Vercel/Netlify edge or Node runtime — never in the browser.
// Reads GEMINI_API_KEY / GEMINI_MODEL from server-side env vars only.
import { sanitizeImpactResult } from '../src/utils/gameLogic.js';

const SYSTEM_PROMPT = `You are an analytical scoring engine for a gamified sustainability app. Evaluate the user's statement regarding their carbon footprint. Note that "bike" refers to a gasoline-powered motorbike/motorcycle (increases footprint, negative impact score), whereas "bicycle" refers to a green human-powered action (positive impact score). Calculate an impactScore between -25 (severe negative environmental impact) and +25 (highly positive environmental impact). Categorize the action. If the action has a negative impact (harmful environmental intent): (1) For travel/fossil fuel related harm (e.g. motorbikes, cars), the remedy MUST start with the phrase "The CO2 ghost is coming for you!". (2) For waste, diet, agricultural, or garbage harm, reference "CH4" (Methane) in the remedy. (3) For soil, fertilizer, or agricultural chemical harm, reference "N2O" (Nitrous Oxide) in the remedy. (4) For industrial, refrigeration, cooling (like AC), or electronics harm, reference "SF6", "NF3", or "HFCs" in the remedy. Provide a single-sentence remedy or encouragement (under 15 words) written from the perspective of an urgent Barbarian guard, using modern terms (e.g. "bicycle", "bus", "train", "electric vehicle") instead of childish or fantasy metaphors like "iron horse". Expected JSON schema: {"impactScore": number, "category": "travel" | "energy" | "diet" | "waste" | "general", "remedy": string}`;

const FALLBACK_RESPONSE = {
  impactScore: 0,
  category: 'error',
  remedy: 'Network anomaly. Keep defending the village!',
};

const GENERATION_CONFIG = {
  responseMimeType: 'application/json',
  responseSchema: {
    type: 'object',
    properties: {
      impactScore: {
        type: 'integer',
        description: 'integer from -25 to 25 representing the sustainability impact',
      },
      category: {
        type: 'string',
        description: 'the category of action: travel, energy, diet, waste, or general',
      },
      remedy: {
        type: 'string',
        description: 'one short, encouraging remedy suggestion under 15 words written in the persona of an urgent Barbarian guard',
      },
    },
    required: ['impactScore', 'category', 'remedy'],
  },
  maxOutputTokens: 500,
  temperature: 0.2,
  thinkingConfig: {
    thinkingBudget: 0,
  },
};

const clampScore = (value) => Math.max(-25, Math.min(25, Math.round(Number(value) || 0)));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  const { userText } = req.body || {};
  if (typeof userText !== 'string' || !userText.trim()) {
    return res.status(400).json({ error: 'userText is required' });
  }
  const safeUserText = userText.trim().slice(0, 500);

  const geminiApiKey = process.env.GEMINI_API_KEY?.replace(/["'\r\n]/g, '').trim();
  const rawModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const geminiModel = rawModel.replace(/["'\r\n]/g, '').trim();

  if (!geminiApiKey) {
    console.error('Missing GEMINI_API_KEY in environment variables.');
    return res.status(500).json(FALLBACK_RESPONSE);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: safeUserText }],
            },
          ],
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          generationConfig: GENERATION_CONFIG,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} ${response.statusText}: ${errText}`);
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const rawContent = parts.find((p) => p.text)?.text;
    if (!rawContent) throw new Error('Empty response from Gemini API');

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      throw new Error('Model response was not valid JSON');
    }

    const sanitized = sanitizeImpactResult(parsed);

    return res.status(200).json({
      impactScore: clampScore(sanitized.impactScore),
      category: typeof sanitized.category === 'string' ? sanitized.category.slice(0, 60) : 'unknown',
      remedy: typeof sanitized.remedy === 'string' ? sanitized.remedy.slice(0, 200) : FALLBACK_RESPONSE.remedy,
    });
  } catch (error) {
    console.error('Proxy execution error:', error);
    return res.status(500).json(FALLBACK_RESPONSE);
  }
}