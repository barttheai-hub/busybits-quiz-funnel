import { Router } from 'express';
import { db } from '../lib/db.js';
import { addActivity, nowIso, parseRows, parseRow, uid } from '../lib/store.js';
import { oneOf, str } from '../lib/validate.js';

const router = Router();

router.get('/', (_req, res) => {
  const projects = parseRows(db.prepare(`SELECT * FROM projects ORDER BY updated_at DESC`).all()).map(p => ({
    ...p,
    taskCount: db.prepare(`SELECT COUNT(1) c FROM tasks WHERE project_id = ?`).get(p.id).c,
    noteCount: db.prepare(`SELECT COUNT(1) c FROM notes WHERE project_id = ?`).get(p.id).c,
    resourceCount: db.prepare(`SELECT COUNT(1) c FROM resources WHERE project_id = ?`).get(p.id).c
  }));
  res.json(projects);
});

router.post('/', (req, res, next) => {
  try {
    const project = {
      id: uid('proj'),
      name: str(req.body.name, { field: 'name', min: 1, max: 160, required: true }),
      status: oneOf(req.body.status || 'Active', ['Active', 'Paused', 'Done'], { field: 'status', required: true }),
      health: oneOf(req.body.health || 'Green', ['Green', 'Yellow', 'Red'], { field: 'health', required: true }),
      description: str(req.body.description ?? '', { field: 'description', max: 2000 }) ?? '',
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    db.prepare(`INSERT INTO projects (id,name,status,health,description,created_at,updated_at) VALUES (?,?,?,?,?,?,?)`)
      .run(project.id, project.name, project.status, project.health, project.description, project.createdAt, project.updatedAt);
    addActivity('project.created', `Created project: ${project.name}`, { projectId: project.id });
    res.status(201).json(project);
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Project not found' });
    const prev = parseRow(existing);
    const updated = {
      ...prev,
      ...(req.body.name !== undefined ? { name: str(req.body.name, { field: 'name', min: 1, max: 160, required: true }) } : {}),
      ...(req.body.status !== undefined ? { status: oneOf(req.body.status, ['Active', 'Paused', 'Done'], { field: 'status', required: true }) } : {}),
      ...(req.body.health !== undefined ? { health: oneOf(req.body.health, ['Green', 'Yellow', 'Red'], { field: 'health', required: true }) } : {}),
      ...(req.body.description !== undefined ? { description: str(req.body.description ?? '', { field: 'description', max: 2000 }) ?? '' } : {}),
      updatedAt: nowIso()
    };
    db.prepare(`UPDATE projects SET name=?,status=?,health=?,description=?,updated_at=? WHERE id=?`)
      .run(updated.name, updated.status, updated.health, updated.description, updated.updatedAt, req.params.id);
    addActivity('project.updated', `Updated project: ${updated.name}`, { projectId: req.params.id });
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });
  const removed = parseRow(existing);
  db.prepare(`DELETE FROM projects WHERE id = ?`).run(req.params.id);
  db.prepare(`UPDATE tasks SET project_id = NULL WHERE project_id = ?`).run(req.params.id);
  db.prepare(`UPDATE notes SET project_id = NULL WHERE project_id = ?`).run(req.params.id);
  db.prepare(`UPDATE resources SET project_id = NULL WHERE project_id = ?`).run(req.params.id);
  addActivity('project.deleted', `Deleted project: ${removed.name}`, { projectId: removed.id });
  res.json({ ok: true });
});

export default router;
