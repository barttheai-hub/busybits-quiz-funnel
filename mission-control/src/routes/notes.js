import { Router } from 'express';
import { db } from '../lib/db.js';
import { addActivity, nowIso, parseRow, parseRows, uid } from '../lib/store.js';
import { optionalId, str, tags } from '../lib/validate.js';

const router = Router();

router.get('/', (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase();
  const projectId = req.query.projectId?.toString();
  let rows = db.prepare(`SELECT * FROM notes ORDER BY updated_at DESC`).all();
  let notes = parseRows(rows);
  if (q) notes = notes.filter(n => `${n.title} ${n.content} ${(n.tags || []).join(' ')}`.toLowerCase().includes(q));
  if (projectId) notes = notes.filter(n => n.projectId === projectId);
  res.json(notes);
});

router.post('/', (req, res, next) => {
  try {
    const note = {
      id: uid('note'),
      title: str(req.body.title, { field: 'title', min: 1, max: 180, required: true }),
      content: str(req.body.content ?? '', { field: 'content', max: 20000 }) ?? '',
      tags: tags(req.body.tags),
      projectId: optionalId(req.body.projectId, { field: 'projectId' }),
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    db.prepare(`INSERT INTO notes (id,title,content,tags_json,project_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?)`)
      .run(note.id, note.title, note.content, JSON.stringify(note.tags), note.projectId, note.createdAt, note.updatedAt);
    addActivity('note.created', `Created note: ${note.title}`, { noteId: note.id });
    res.status(201).json(note);
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = db.prepare(`SELECT * FROM notes WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Note not found' });
    const base = parseRow(existing);
    const updated = {
      ...base,
      ...(req.body.title !== undefined ? { title: str(req.body.title, { field: 'title', min: 1, max: 180, required: true }) } : {}),
      ...(req.body.content !== undefined ? { content: str(req.body.content ?? '', { field: 'content', max: 20000 }) ?? '' } : {}),
      ...(req.body.tags !== undefined ? { tags: tags(req.body.tags) } : {}),
      ...(req.body.projectId !== undefined ? { projectId: optionalId(req.body.projectId, { field: 'projectId' }) } : {}),
      updatedAt: nowIso()
    };
    db.prepare(`UPDATE notes SET title=?, content=?, tags_json=?, project_id=?, updated_at=? WHERE id=?`)
      .run(updated.title, updated.content, JSON.stringify(updated.tags || []), updated.projectId || null, updated.updatedAt, req.params.id);
    addActivity('note.updated', `Updated note: ${updated.title}`, { noteId: req.params.id });
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare(`SELECT * FROM notes WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Note not found' });
  const note = parseRow(existing);
  db.prepare(`DELETE FROM notes WHERE id = ?`).run(req.params.id);
  addActivity('note.deleted', `Deleted note: ${note.title}`, { noteId: note.id });
  res.json({ ok: true });
});

export default router;
