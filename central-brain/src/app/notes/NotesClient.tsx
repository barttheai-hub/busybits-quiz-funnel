"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type Note = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
};

type LinkedTask = {
  id: string;
  title: string;
  status: string | null;
};

function formatDate(ts: string) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function NotesClient({ initialNotes }: { initialNotes: Note[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [selectedId, setSelectedId] = useState<string | null>(initialNotes[0]?.id ?? null);
  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dirty, setDirty] = useState(false);

  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [linkedTasks, setLinkedTasks] = useState<LinkedTask[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linkBusyId, setLinkBusyId] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => setNotes(initialNotes), [initialNotes]);

  const selected = useMemo(() => notes.find((n) => n.id === selectedId) ?? null, [notes, selectedId]);

  useEffect(() => {
    // when selection changes, load into editor
    if (!selected) {
      setTitle("");
      setBody("");
      setDirty(false);
      return;
    }
    setTitle(selected.title);
    setBody(selected.body ?? "");
    setDirty(false);
  }, [selectedId, selected]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      const inField = tag === "input" || tag === "textarea";

      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.altKey && !inField) {
        e.preventDefault();
        void createNote();
      }

      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void save();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, title, body, dirty, notes]);

  useEffect(() => {
    let cancelled = false;
    async function loadLinkedTasks(noteId: string) {
      setLinksLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/task-note-links/by-note/${noteId}`);
        const data = (await res.json()) as { tasks?: LinkedTask[]; error?: string };
        if (!res.ok || data.error) throw new Error(data.error ?? "Failed to load linked tasks");
        if (!cancelled) setLinkedTasks(data.tasks ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load linked tasks");
      } finally {
        if (!cancelled) setLinksLoading(false);
      }
    }

    if (selectedId) {
      void loadLinkedTasks(selectedId);
    } else {
      setLinkedTasks([]);
    }

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => (n.title + " " + (n.body ?? "")).toLowerCase().includes(q));
  }, [notes, search]);

  async function createNote() {
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Untitled", body: "" }),
      });
      const data = (await res.json()) as { note?: Note; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create note");
      if (data.note) {
        setNotes((prev) => [data.note!, ...prev]);
        setSelectedId(data.note.id);
        setTimeout(() => titleRef.current?.focus(), 50);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setCreating(false);
    }
  }

  async function save() {
    if (!selected) return;

    const nextTitle = title.trim();
    if (!nextTitle) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/notes/${selected.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: nextTitle, body }),
      });
      const data = (await res.json()) as { note?: Note; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to save");

      if (data.note) {
        setNotes((prev) => prev.map((n) => (n.id === selected.id ? data.note! : n)));
        setDirty(false);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(note: Note) {
    if (!confirm(`Delete note "${note.title}"?`)) return;

    setBusyId(note.id);
    setError("");
    const prev = notes;

    setNotes((n) => n.filter((x) => x.id !== note.id));
    if (selectedId === note.id) setSelectedId(null);

    try {
      const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to delete");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setNotes(prev);
    } finally {
      setBusyId(null);
    }
  }

  async function detachTask(taskId: string) {
    if (!selected) return;
    setLinkBusyId(taskId);
    setError("");

    try {
      const res = await fetch("/api/task-note-links", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ task_id: taskId, note_id: selected.id }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to detach task");
      setLinkedTasks((prev) => prev.filter((t) => t.id !== taskId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to detach task");
    } finally {
      setLinkBusyId(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {error ? <div className="cb-error">{error}</div> : null}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button className="cb-btn cb-btn-primary" onClick={createNote} disabled={creating}>
          {creating ? "Creating…" : "New note (N)"}
        </button>

        <input
          ref={searchRef}
          className="cb-input"
          style={{ flex: "1 1 260px" }}
          placeholder="Search… (press /)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button className="cb-btn cb-btn-secondary" onClick={save} disabled={!selected || saving || !dirty}>
          {saving ? "Saving…" : "Save (⌘/Ctrl+Enter)"}
        </button>
      </div>

      <div className="cb-grid-2" style={{ alignItems: "start" }}>
        <div style={{ display: "grid", gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ border: "1px dashed rgba(255,255,255,0.14)", borderRadius: 16, padding: 18, opacity: 0.9 }}>
              <div style={{ fontWeight: 650, marginBottom: 6 }}>No notes</div>
              <div style={{ fontSize: 13, opacity: 0.72, lineHeight: 1.5 }}>Create one.</div>
            </div>
          ) : (
            filtered.map((n) => (
              <button
                key={n.id}
                className="cb-btn cb-btn-secondary"
                style={{
                  textAlign: "left",
                  justifyContent: "space-between",
                  display: "flex",
                  gap: 10,
                  padding: 12,
                  borderRadius: 16,
                  borderColor: n.id === selectedId ? "rgba(99,102,241,0.55)" : "rgba(255,255,255,0.10)",
                  boxShadow: n.id === selectedId ? "0 0 0 4px rgba(99,102,241,0.18)" : "none",
                }}
                onClick={() => {
                  if (dirty && !confirm("Discard unsaved changes?")) return;
                  setSelectedId(n.id);
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 650, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{
                    n.title
                  }</div>
                  <div style={{ fontSize: 12, opacity: 0.72, marginTop: 6 }}>{formatDate(n.updated_at)}</div>
                </div>

                <button
                  className="cb-btn cb-btn-secondary"
                  style={{ padding: "8px 10px" }}
                  disabled={busyId === n.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    void remove(n);
                  }}
                >
                  Delete
                </button>
              </button>
            ))
          )}
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 16, padding: 14 }}>
          {selected ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div className="cb-label">Title</div>
              <input
                ref={titleRef}
                className="cb-input"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setDirty(true);
                }}
              />

              <div className="cb-label">Body</div>
              <textarea
                className="cb-input"
                style={{ minHeight: 240, resize: "vertical" }}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setDirty(true);
                }}
              />

              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  paddingTop: 10,
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>Linked tasks</div>
                {linksLoading ? (
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Loading…</div>
                ) : linkedTasks.length === 0 ? (
                  <div style={{ fontSize: 12, opacity: 0.7 }}>None yet</div>
                ) : (
                  <div style={{ display: "grid", gap: 6 }}>
                    {linkedTasks.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 12,
                          padding: "8px 10px",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {t.title || t.id}
                          </div>
                          {t.status ? (
                            <div style={{ marginTop: 6 }}>
                              <span className="cb-pill">{t.status}</span>
                            </div>
                          ) : null}
                        </div>
                        <button
                          className="cb-btn cb-btn-secondary"
                          style={{ padding: "6px 10px" }}
                          disabled={linkBusyId === t.id}
                          onClick={() => void detachTask(t.id)}
                        >
                          Detach
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ fontSize: 12, opacity: 0.72 }}>
                {dirty ? "Unsaved changes" : "Saved"}
              </div>
            </div>
          ) : (
            <div style={{ opacity: 0.72, fontSize: 13, lineHeight: 1.5 }}>
              Select a note to edit, or create a new one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
