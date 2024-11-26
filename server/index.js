import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { iRacing } from 'node-iracing';
import serveStatic from 'serve-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Initialize iRacing client
const iracing = new iRacing();

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Serve static files from the dist directory
app.use(serveStatic(join(dirname(__dirname), 'dist')));

// API routes
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    await iracing.login(username, password);
    req.session.isAuthenticated = true;
    res.json({ success: true });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

app.get('/api/recent-races', async (req, res) => {
  try {
    if (!req.session.isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const results = await iracing.getRecentRaces();
    res.json(results);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch recent races' });
  }
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(join(dirname(__dirname), 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});