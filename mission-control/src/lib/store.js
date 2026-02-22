import { db } from './db.js';

export function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function addActivity(type, message, payload = {}) {
  const stmt = db.prepare(`INSERT INTO activity (id,type,message,payload_json,created_at) VALUES (?,?,?,?,?)`);
  stmt.run(uid('act'), type, message, JSON.stringify(payload || {}), nowIso());

  const prune = db.prepare(`DELETE FROM activity WHERE id IN (
    SELECT id FROM activity ORDER BY created_at DESC LIMIT -1 OFFSET 500
  )`);
  prune.run();
}

export function parseRow(row) {
  if (!row) return row;
  const out = { ...row };
  if ('created_at' in out) { out.createdAt = out.created_at; delete out.created_at; }
  if ('updated_at' in out) { out.updatedAt = out.updated_at; delete out.updated_at; }
  if ('due_date' in out) { out.dueDate = out.due_date; delete out.due_date; }
  if ('project_id' in out) { out.projectId = out.project_id; delete out.project_id; }
  if ('tags_json' in out) { out.tags = JSON.parse(out.tags_json || '[]'); delete out.tags_json; }
  if ('payload_json' in out) { out.payload = JSON.parse(out.payload_json || '{}'); delete out.payload_json; }
  return out;
}

export function parseRows(rows) {
  return rows.map(parseRow);
}
