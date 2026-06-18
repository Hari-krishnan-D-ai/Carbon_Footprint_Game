import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function devApiPlugin() {
  let envVars;

  return {
    name: 'carbon-clash-dev-api',
    configResolved(config) {
      envVars = loadEnv(config.mode, config.root, '');
    },
    configureServer(server) {
      server.middlewares.use('/api/analyze-intent', async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { Allow: 'POST', 'Content-Type': 'text/plain' });
          res.end('Method Not Allowed');
          return;
        }

        let body = '';
        for await (const chunk of req) body += chunk;
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON body' }));
          return;
        }

        const { userText } = parsed;
        if (typeof userText !== 'string' || !userText.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'userText is required' }));
          return;
        }

        const safeUserText = userText.trim().slice(0, 500);

        // Strip stray quotes / CRLF that Windows .env files sometimes inject
        const geminiApiKey = envVars.GEMINI_API_KEY?.replace(/["'\r\n]/g, '').trim();
        const rawModel = envVars.GEMINI_MODEL || 'gemini-2.5-flash';
        const geminiModel = rawModel.replace(/["'\r\n]/g, '').trim();

        const FALLBACK = {
          impactScore: 0,
          category: 'error',
          remedy: 'Network anomaly. Keep defending the village!',
        };

        if (!geminiApiKey) {
          console.error('[dev-api] Missing GEMINI_API_KEY in .env');
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(FALLBACK));
          return;
        }

        const SYSTEM_PROMPT = `You are an analytical scoring engine for a gamified sustainability app. Evaluate the user's statement regarding their carbon footprint. Note that "bike" refers to a gasoline-powered motorbike/motorcycle (increases footprint, negative impact score), whereas "bicycle" refers to a green human-powered action (positive impact score). Calculate an impactScore between -25 (severe negative environmental impact) and +25 (highly positive environmental impact). Categorize the action. If the action has a negative impact (harmful environmental intent): (1) For travel/fossil fuel related harm (e.g. motorbikes, cars), the remedy MUST start with the phrase "The CO2 ghost is coming for you!". (2) For waste, diet, agricultural, or garbage harm, reference "CH4" (Methane) in the remedy. (3) For soil, fertilizer, or agricultural chemical harm, reference "N2O" (Nitrous Oxide) in the remedy. (4) For industrial, refrigeration, cooling (like AC), or electronics harm, reference "SF6", "NF3", or "HFCs" in the remedy. Provide a single-sentence remedy or encouragement (under 15 words) written from the perspective of an urgent Barbarian guard, using modern terms (e.g. "bicycle", "bus", "train", "electric vehicle") instead of childish or fantasy metaphors like "iron horse". Expected JSON schema: {"impactScore": number, "category": "travel" | "energy" | "diet" | "waste" | "general", "remedy": string}`;

        try {
          console.log(`[dev-api] Calling model: ${geminiModel}`);

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
                generationConfig: {
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
                        description:
                          'the category of action: travel, energy, diet, waste, or general',
                      },
                      remedy: {
                        type: 'string',
                        description:
                          'one short, encouraging remedy suggestion under 15 words written in the persona of an urgent Barbarian guard',
                      },
                    },
                    required: ['impactScore', 'category', 'remedy'],
                  },
                  maxOutputTokens: 500,
                  temperature: 0.2,
                  thinkingConfig: {
                    thinkingBudget: 0, // disable thinking — fast scoring, no reasoning chain needed
                  },
                },
              }),
            }
          );

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API ${response.status} ${response.statusText}: ${errText}`);
          }

          const data = await response.json();

          // Find the first part that carries text — guards against multi-part thinking payloads
          const parts = data?.candidates?.[0]?.content?.parts ?? [];
          const rawContent = parts.find((p) => p.text)?.text;
          if (!rawContent) throw new Error('Empty model response');

          let result;
          try {
            result = JSON.parse(rawContent);
          } catch {
            throw new Error('Model response was not valid JSON');
          }

          const clamp = (v) => Math.max(-25, Math.min(25, Math.round(Number(v) || 0)));

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              impactScore: clamp(result.impactScore),
              category:
                typeof result.category === 'string' ? result.category.slice(0, 60) : 'unknown',
              remedy:
                typeof result.remedy === 'string'
                  ? result.remedy.slice(0, 200)
                  : FALLBACK.remedy,
            })
          );
        } catch (error) {
          console.error('[dev-api] Proxy error:', error.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(FALLBACK));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [devApiPlugin(), react()],
  server: {
    port: 5173,
  },
});