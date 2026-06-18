import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies (matches Vercel's req.body parsing)
app.use(express.json());

// Middleware to parse URL-encoded bodies (optional, for completeness)
app.use(express.urlencoded({ extended: true }));

/**
 * Dynamic API Router:
 * Automatically maps any request to /api/:endpoint to the matching serverless
 * function file in the api/ directory, adapting request/response objects.
 */
app.all('/api/:endpoint', async (req, res) => {
  const endpoint = req.params.endpoint;
  
  // Basic security check to prevent directory traversal attacks
  const safeEndpoint = endpoint.replace(/[^a-zA-Z0-9-_]/g, '');
  if (!safeEndpoint || safeEndpoint !== endpoint) {
    return res.status(400).json({ error: 'Invalid API endpoint name' });
  }

  try {
    const handlerPath = path.join(__dirname, 'api', `${safeEndpoint}.js`);
    // Dynamic import needs a file:// URL on Windows for absolute paths
    const fileUrl = new URL(`file://${handlerPath}`);
    const { default: handler } = await import(fileUrl.href);

    if (typeof handler === 'function') {
      // Execute the serverless handler
      await handler(req, res);
    } else {
      res.status(500).json({ error: `API module '${safeEndpoint}' does not export a default handler function.` });
    }
  } catch (error) {
    console.error(`Error executing api/${safeEndpoint}.js:`, error);
    // Determine if it is a 404 (file not found) or a 500 (internal execution error)
    if (error.code === 'ERR_MODULE_NOT_FOUND' || error.message.includes('Cannot find module')) {
      res.status(404).json({ error: `API endpoint '/api/${safeEndpoint}' not found.` });
    } else {
      res.status(500).json({ error: 'Internal Server Error executing API endpoint.' });
    }
  }
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
