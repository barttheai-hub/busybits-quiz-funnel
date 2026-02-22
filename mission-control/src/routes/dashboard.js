import { Router } from 'express';
import { db } from '../lib/db.js';
import { parseRows } from '../lib/store.js';

const router = Router();

router.get('/', (_req, res) => {
  const now = new Date();
  const tasks = parseRows(db.prepare(`SELECT * FROM tasks ORDER BY updated_at DESC`).all());

  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done').length;
  const active = tasks.filter(t => t.status !== 'Done').length;
  const byOwner = {
    Me: tasks.filter(t => t.owner === 'Me' && t.status !== 'Done').length,
    OpenClaw: tasks.filter(t => t.owner === 'OpenClaw' && t.status !== 'Done').length
  };

  const metrics = {
    activeTasks: active,
    overdueTasks: overdue,
    notesCount: db.prepare(`SELECT COUNT(1) c FROM notes`).get().c,
    resourcesCount: db.prepare(`SELECT COUNT(1) c FROM resources`).get().c,
    projectsCount: db.prepare(`SELECT COUNT(1) c FROM projects`).get().c
  };

  const recentActivity = parseRows(db.prepare(`SELECT * FROM activity ORDER BY created_at DESC LIMIT 20`).all());

  res.json({
    metrics,
    byOwner,
    recentActivity,
    todayTasks: tasks.filter(t => t.status !== 'Done').sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999')).slice(0, 20)
  });
});

export default router;
