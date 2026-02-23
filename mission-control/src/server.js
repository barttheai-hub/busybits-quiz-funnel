import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import notesRouter from './routes/notes.js';
import tasksRouter from './routes/tasks.js';
import projectsRouter from './routes/projects.js';
import resourcesRouter from './routes/resources.js';
import activityRouter from './routes/activity.js';
import dashboardRouter from './routes/dashboard.js';
import focusRouter from './routes/focus.js';
import { migrate } from './lib/db.js';

const app = express();
const PORT = process.env.PORT || 8787;
const API_TOKEN = process.env.API_TOKEN || 'change-me';
const TOKEN_MAP = (() => {
  try {
    return JSON.parse(process.env.API_TOKENS_JSON || '{}');
  } catch {
    return {};
  }
})();

migrate();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    const token = req.headers['x-api-token'];
    const userFromMap = token && TOKEN_MAP[token] ? TOKEN_MAP[token] : null;
    if (!userFromMap && token !== API_TOKEN) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid API token' } });
    }
    req.auth = userFromMap || { name: 'Legacy Token', role: 'owner' };
  }
  next();
});

app.use((req, _res, next) => {
  if (!req.path.startsWith('/api/')) return next();
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next();
  if (!req.is('application/json')) {
    const err = new Error('Content-Type must be application/json');
    err.status = 415;
    return next(err);
  }
  next();
});

app.get('/health', (_, res) => res.json({ ok: true }));
app.get('/api/auth/me', (req, res) => res.json({ user: req.auth || null }));

app.use('/api/notes', notesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/activity', activityRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/focus', focusRouter);

app.use('/', express.static(path.resolve(process.cwd(), 'web')));

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: {
      code: status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
      message: err.message || 'Unexpected error'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Mission Control running on http://localhost:${PORT}`);
});
