import { Router } from 'express';
import { db } from '../lib/db.js';
import { addActivity, nowIso, parseRow, parseRows, uid } from '../lib/store.js';
import { optionalId, str } from '../lib/validate.js';

const router = Router();

router.get('/', (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase();
  let resources = parseRows(db.prepare(`SELECT * FROM resources ORDER BY updated_at DESC`).all());
  if (q) resources = resources.filter(r => `${r.title} ${r.type} ${r.preview}`.toLowerCase().includes(q));
  res.json(resources);
});

router.post('/', (req, res, next) => {
  try {
    const resource = {
      id: uid('res'),
      title: str(req.body.title, { field: 'title', min: 1, max: 220, required: true }),
      type: str(req.body.type || 'doc', { field: 'type', min: 1, max: 60, required: true }),
      preview: str(req.body.preview ?? '', { field: 'preview', max: 4000 }) ?? '',
      url: str(req.body.url ?? '', { field: 'url', max: 2000 }) ?? '',
      projectId: optionalId(req.body.projectId, { field: 'projectId' }),
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    db.prepare(`INSERT INTO resources (id,title,type,preview,url,project_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`)
      .run(resource.id, resource.title, resource.type, resource.preview, resource.url, resource.projectId, resource.createdAt, resource.updatedAt);
    addActivity('resource.created', `Added resource: ${resource.title}`, { resourceId: resource.id });
    res.status(201).json(resource);
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = db.prepare(`SELECT * FROM resources WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Resource not found' });
    const prev = parseRow(existing);
    const updated = {
      ...prev,
      ...(req.body.title !== undefined ? { title: str(req.body.title, { field: 'title', min: 1, max: 220, required: true }) } : {}),
      ...(req.body.type !== undefined ? { type: str(req.body.type, { field: 'type', min: 1, max: 60, required: true }) } : {}),
      ...(req.body.preview !== undefined ? { preview: str(req.body.preview ?? '', { field: 'preview', max: 4000 }) ?? '' } : {}),
      ...(req.body.url !== undefined ? { url: str(req.body.url ?? '', { field: 'url', max: 2000 }) ?? '' } : {}),
      ...(req.body.projectId !== undefined ? { projectId: optionalId(req.body.projectId, { field: 'projectId' }) } : {}),
      updatedAt: nowIso()
    };
    db.prepare(`UPDATE resources SET title=?,type=?,preview=?,url=?,project_id=?,updated_at=? WHERE id=?`)
      .run(updated.title, updated.type, updated.preview, updated.url, updated.projectId, updated.updatedAt, req.params.id);
    addActivity('resource.updated', `Updated resource: ${updated.title}`, { resourceId: updated.id });
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare(`SELECT * FROM resources WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Resource not found' });
  const row = parseRow(existing);
  db.prepare(`DELETE FROM resources WHERE id = ?`).run(req.params.id);
  addActivity('resource.deleted', `Deleted resource: ${row.title}`, { resourceId: row.id });
  res.json({ ok: true });
});

export default router;
