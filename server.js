import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import analyzeIntentHandler from './api/analyze-intent.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies (matches Vercel's req.body parsing)
app.use(express.json());

// Middleware to parse URL-encoded bodies (optional, for completeness)
app.use(express.urlencoded({ extended: true }));

/**
 * Static API Router:
 * Maps endpoint to the imported handler directly to avoid dynamic imports.
 */
app.post('/api/analyze-intent', analyzeIntentHandler);

// Fallback for non-existent API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// Serve static assets from the Vite dist/ directory
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback all other GET requests to index.html for client-side routing (single page app)
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running in production mode on port ${PORT}`);
  console.log(`Serving static files from: ${path.join(__dirname, 'dist')}`);
  console.log(`Routing API requests to: ${path.join(__dirname, 'api')}`);
});
