#!/usr/bin/env node
/**
 * Log work items into Central Brain without interactive login.
 * Uses Supabase Service Role (server-side) to write into cb_notes + cb_tasks.
 *
 * Usage:
 *   node scripts/log-work-items.mjs --email barttheai@gmail.com --items-file /path/to/items.json
 *
 * items.json format:
 * {
 *   "noteTitle": "Bart – Work Log",
 *   "boardTitle": "Default board",
 *   "columnTitle": "Done",
 *   "assignee": "bart",
 *   "status": "done",
 *   "items": [
 *     {"title":"...","notes":"..."},
 *     ...
 *   ]
 * }
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

function arg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

function must(v, msg) {
  if (!v) {
    console.error(`ERROR: ${msg}`);
    process.exit(1);
  }
  return v;
}

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) continue;
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const [, k, v] = m;
    if (process.env[k] == null) process.env[k] = v;
  }
}

loadEnvLocal();

const email = must(arg("--email"), "Missing --email");
const itemsFile = must(arg("--items-file"), "Missing --items-file");

const url = must(process.env.NEXT_PUBLIC_SUPABASE_URL, "Missing NEXT_PUBLIC_SUPABASE_URL (set in .env.local)");
const serviceKey = must(process.env.SUPABASE_SERVICE_ROLE_KEY, "Missing SUPABASE_SERVICE_ROLE_KEY (set in .env.local)");

const payload = JSON.parse(fs.readFileSync(itemsFile, "utf8"));
const noteTitle = payload.noteTitle ?? "Bart – Work Log";
const boardTitle = payload.boardTitle ?? "Default board";
const columnTitle = payload.columnTitle ?? "Done";
const assignee = payload.assignee ?? "bart";
const status = payload.status ?? "done";
const items = payload.items ?? [];

if (!Array.isArray(items) || items.length === 0) {
  console.error("ERROR: items.json must contain a non-empty items array");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Resolve user_id for email
const { data: users, error: usersErr } = await supabase.auth.admin.listUsers({ perPage: 200 });
if (usersErr) throw usersErr;
const user = users.users.find((u) => (u.email || "").toLowerCase() === String(email).toLowerCase());
if (!user) {
  console.error(`ERROR: No Supabase auth user found for email: ${email}`);
  process.exit(1);
}
const user_id = user.id;

// Resolve board + column by title
const { data: boards, error: bErr } = await supabase
  .from("cb_boards")
  .select("id,title,is_default")
  .eq("user_id", user_id);
if (bErr) throw bErr;
const board = boards.find((b) => b.title === boardTitle) || boards.find((b) => b.is_default);
if (!board) {
  console.error(`ERROR: No board found for user. Wanted title='${boardTitle}', and no default board exists.`);
  process.exit(1);
}

const { data: cols, error: cErr } = await supabase
  .from("cb_board_columns")
  .select("id,board_id,title,position")
  .eq("user_id", user_id)
  .eq("board_id", board.id);
if (cErr) throw cErr;
const col = cols.find((c) => c.title === columnTitle) || cols.find((c) => c.title.toLowerCase() === columnTitle.toLowerCase());
if (!col) {
  console.error(`ERROR: No column found on board '${board.title}' with title '${columnTitle}'.`);
  process.exit(1);
}

// Compute next position within the board+column
const { data: lastPosRow, error: pErr } = await supabase
  .from("cb_tasks")
  .select("position")
  .eq("user_id", user_id)
  .eq("board_id", board.id)
  .eq("column_id", col.id)
  .order("position", { ascending: false })
  .limit(1);
if (pErr) throw pErr;
let position = (lastPosRow?.[0]?.position ?? 0) + 1;

// Insert tasks
const rows = items.map((it) => ({
  user_id,
  title: String(it.title ?? "").trim(),
  notes: String(it.notes ?? "").trim(),
  status,
  priority: Number.isFinite(it.priority) ? it.priority : 2,
  board_id: board.id,
  column_id: col.id,
  position: position++,
  assignee,
}));

for (const r of rows) {
  if (!r.title) {
    console.error("ERROR: Each item needs a non-empty title");
    process.exit(1);
  }
}

const { data: inserted, error: iErr } = await supabase
  .from("cb_tasks")
  .insert(rows)
  .select("id,title");
if (iErr) throw iErr;

// Upsert (append) note
const now = new Date().toISOString();
const noteBodyChunk = [`## ${now}`, ...items.map((it) => `- ${it.title}${it.notes ? `\n  - ${it.notes}` : ""}`), ""].join("\n");

// Find existing note by title
const { data: existingNotes, error: nErr } = await supabase
  .from("cb_notes")
  .select("id,title,body")
  .eq("user_id", user_id)
  .eq("title", noteTitle)
  .limit(1);
if (nErr) throw nErr;

if (existingNotes?.length) {
  const note = existingNotes[0];
  const newBody = `${note.body || ""}\n\n${noteBodyChunk}`.trim() + "\n";
  const { error: uErr } = await supabase
    .from("cb_notes")
    .update({ body: newBody })
    .eq("id", note.id)
    .eq("user_id", user_id);
  if (uErr) throw uErr;
  console.log(`OK: appended to note '${noteTitle}' (${note.id})`);
} else {
  const body = `# ${noteTitle}\n\n${noteBodyChunk}`;
  const { data: created, error: cErr2 } = await supabase
    .from("cb_notes")
    .insert({ user_id, title: noteTitle, body })
    .select("id");
  if (cErr2) throw cErr2;
  console.log(`OK: created note '${noteTitle}' (${created?.[0]?.id})`);
}

console.log("OK: inserted tasks:");
for (const t of inserted ?? []) console.log(`- ${t.id}\t${t.title}`);
