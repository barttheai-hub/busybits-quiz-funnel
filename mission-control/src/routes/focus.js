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
  if (health === 'At Risk') return 3;
  if (health === 'Watch') return 2;
  if (health === 'Healthy') return 1;
  return 0;
}

router.get('/', (_req, res) => {
  const tasks = parseRows(db.prepare(`SELECT * FROM tasks ORDER BY updated_at DESC`).all())
    .filter(t => t.status !== 'Done');
  const projects = parseRows(db.prepare(`SELECT * FROM projects`).all());

  const projectMap = new Map(projects.map(p => [p.id, p]));

  const ranked = tasks
    .map(task => {
      const project = task.projectId ? projectMap.get(task.projectId) : null;
      const score =
        priorityScore(task.priority) * 4 +
        statusScore(task.status) * 2 +
        dueDateScore(task.dueDate) * 3 +
        healthScore(project?.health);

      return {
        ...task,
        score,
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
    .sort((a, b) => b.score - a.score);

  res.json({
    generatedAt: new Date().toISOString(),
    top: ranked[0] || null,
    queue: ranked.slice(0, 10)
  });
});

export default router;
