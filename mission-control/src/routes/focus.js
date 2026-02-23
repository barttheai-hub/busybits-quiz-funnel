import { Router } from 'express';
import { db } from '../lib/db.js';
import { parseRows } from '../lib/store.js';

const router = Router();

function priorityScore(priority) {
  if (priority === 'High') return 3;
  if (priority === 'Medium') return 2;
  return 1;
}

function statusScore(status) {
  if (status === 'In Progress') return 3;
  if (status === 'To Do') return 2;
  return 0;
}

function dueDateScore(dueDate) {
  if (!dueDate) return 0;
  const now = new Date();
  const due = new Date(`${dueDate}T23:59:59`);
  const days = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (Number.isNaN(days)) return 0;
  if (days < 0) return 4;
  if (days <= 1) return 3;
  if (days <= 3) return 2;
  if (days <= 7) return 1;
  return 0;
}

function healthScore(health) {
  // Current projects schema uses Green/Yellow/Red; keep legacy aliases for compatibility.
  if (health === 'Red' || health === 'At Risk') return 3;
  if (health === 'Yellow' || health === 'Watch') return 2;
  if (health === 'Green' || health === 'Healthy') return 1;
  return 0;
}

function stalenessScore(updatedAt, status) {
  if (!updatedAt || status === 'Done') return 0;
  const updated = new Date(updatedAt);
  if (Number.isNaN(updated.getTime())) return 0;
  const hours = (Date.now() - updated.getTime()) / (1000 * 60 * 60);
  if (hours >= 72) return 3;
  if (hours >= 48) return 2;
  if (hours >= 24) return 1;
  return 0;
}

router.get('/', (req, res) => {
  const owner = typeof req.query.owner === 'string' ? req.query.owner.trim() : '';
  const includeDone = req.query.includeDone === 'true';
  const limit = Number.isFinite(Number(req.query.limit)) ? Math.min(Math.max(Number(req.query.limit), 1), 50) : 10;

  const tasks = parseRows(db.prepare(`SELECT * FROM tasks ORDER BY updated_at DESC`).all())
    .filter(t => includeDone || t.status !== 'Done')
    .filter(t => !owner || t.owner === owner);
  const projects = parseRows(db.prepare(`SELECT * FROM projects`).all());

  const projectMap = new Map(projects.map(p => [p.id, p]));

  const ranked = tasks
    .map(task => {
      const project = task.projectId ? projectMap.get(task.projectId) : null;
      const stale = stalenessScore(task.updatedAt, task.status);
      const score =
        priorityScore(task.priority) * 4 +
        statusScore(task.status) * 2 +
        dueDateScore(task.dueDate) * 3 +
        healthScore(project?.health) +
        stale * 2;

      return {
        ...task,
        score,
        scoreBreakdown: {
          priority: priorityScore(task.priority) * 4,
          status: statusScore(task.status) * 2,
          dueDate: dueDateScore(task.dueDate) * 3,
          projectHealth: healthScore(project?.health),
          stale: stale * 2
        },
        project: project
          ? { id: project.id, name: project.name, status: project.status, health: project.health }
          : null,
        recommendation: score >= 22
          ? 'Do now'
          : score >= 16
            ? 'Start in this block'
            : 'Schedule'
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.dueDate && b.dueDate) return String(a.dueDate).localeCompare(String(b.dueDate));
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    });

  res.json({
    generatedAt: new Date().toISOString(),
    filters: { owner: owner || null, includeDone, limit },
    top: ranked[0] || null,
    queue: ranked.slice(0, limit)
  });
});

export default router;
