import { Router } from 'express';
import { db } from '../lib/db.js';
import { parseRows } from '../lib/store.js';

const router = Router();

router.get('/', (req, res) => {
  const limit = Math.max(1, Math.min(Number(req.query.limit || 50), 200));
  const rows = db.prepare(`SELECT * FROM activity ORDER BY created_at DESC LIMIT ?`).all(limit);
  res.json(parseRows(rows));
});

export default router;
