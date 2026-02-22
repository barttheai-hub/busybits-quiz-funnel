import { Router } from 'express';
import { db } from '../lib/db.js';
import { addActivity, nowIso, parseRow, parseRows, uid } from '../lib/store.js';
import { dateYmd, oneOf, optionalId, str } from '../lib/validate.js';

const router = Router();

router.get('/', (req, res) => {
  const owner = req.query.owner?.toString();
  const status = req.query.status?.toString();
  let tasks = parseRows(db.prepare(`SELECT * FROM tasks ORDER BY updated_at DESC`).all());
  if (owner) tasks = tasks.filter(t => t.owner === owner);
  if (status) tasks = tasks.filter(t => t.status === status);
  res.json(tasks);
});

router.post('/', (req, res, next) => {
  try {
    const task = {
      id: uid('task'),
      title: str(req.body.title, { field: 'title', min: 1, max: 180, required: true }),
      description: str(req.body.description ?? '', { field: 'description', max: 2000 }) ?? '',
      owner: oneOf(req.body.owner || 'Me', ['Me', 'OpenClaw'], { field: 'owner', required: true }),
      status: oneOf(req.body.status || 'To Do', ['To Do', 'In Progress', 'Done'], { field: 'status', required: true }),
      priority: oneOf(req.body.priority || 'Medium', ['High', 'Medium', 'Low'], { field: 'priority', required: true }),
      dueDate: dateYmd(req.body.dueDate, { field: 'dueDate' }),
      projectId: optionalId(req.body.projectId, { field: 'projectId' }),
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    db.prepare(`INSERT INTO tasks (id,title,description,owner,status,priority,due_date,project_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(task.id, task.title, task.description, task.owner, task.status, task.priority, task.dueDate, task.projectId, task.createdAt, task.updatedAt);
    addActivity('task.created', `Created task: ${task.title}`, { taskId: task.id });
    res.status(201).json(task);
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    const prev = parseRow(existing);
    const updated = {
      ...prev,
      ...(req.body.title !== undefined ? { title: str(req.body.title, { field: 'title', min: 1, max: 180, required: true }) } : {}),
      ...(req.body.description !== undefined ? { description: str(req.body.description ?? '', { field: 'description', max: 2000 }) ?? '' } : {}),
      ...(req.body.owner !== undefined ? { owner: oneOf(req.body.owner, ['Me', 'OpenClaw'], { field: 'owner', required: true }) } : {}),
      ...(req.body.status !== undefined ? { status: oneOf(req.body.status, ['To Do', 'In Progress', 'Done'], { field: 'status', required: true }) } : {}),
      ...(req.body.priority !== undefined ? { priority: oneOf(req.body.priority, ['High', 'Medium', 'Low'], { field: 'priority', required: true }) } : {}),
      ...(req.body.dueDate !== undefined ? { dueDate: dateYmd(req.body.dueDate, { field: 'dueDate' }) } : {}),
      ...(req.body.projectId !== undefined ? { projectId: optionalId(req.body.projectId, { field: 'projectId' }) } : {}),
      updatedAt: nowIso()
    };
    db.prepare(`UPDATE tasks SET title=?,description=?,owner=?,status=?,priority=?,due_date=?,project_id=?,updated_at=? WHERE id=?`)
      .run(updated.title, updated.description, updated.owner, updated.status, updated.priority, updated.dueDate, updated.projectId, updated.updatedAt, req.params.id);
    if (prev.status !== updated.status) addActivity('task.status', `Task moved: ${updated.title} -> ${updated.status}`, { taskId: updated.id });
    else addActivity('task.updated', `Updated task: ${updated.title}`, { taskId: updated.id });
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Task not found' });
  const task = parseRow(existing);
  db.prepare(`DELETE FROM tasks WHERE id = ?`).run(req.params.id);
  addActivity('task.deleted', `Deleted task: ${task.title}`, { taskId: task.id });
  res.json({ ok: true });
});

export default router;
