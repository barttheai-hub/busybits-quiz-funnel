"use client";

import { useEffect, useRef, useState } from "react";

type NoteResult = {
  id: string;
  title: string;
  body: string | null;
  updated_at: string;
};

type TaskResult = {
  id: string;
  title: string;
  notes: string | null;
  status: string | null;
  priority: number | null;
  due_at: string | null;
  assignee?: string | null;
  recurrence_rule?: string | null;
  recurrence_interval?: number | null;
  board_id?: string | null;
  column_id?: string | null;
  board?: { title?: string | null } | null;
  column?: { title?: string | null } | null;
  updated_at: string;
};

type BoardResult = {
  id: string;
  title: string;
  is_default?: boolean;
  updated_at?: string;
};

function formatDate(ts: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function truncate(text: string, max = 160) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export default function SearchClient({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [notes, setNotes] = useState<NoteResult[]>([]);
  const [tasks, setTasks] = useState<TaskResult[]>([]);
  const [boards, setBoards] = useState<BoardResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialQuery) {
      void runSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      const inField = tag === "input" || tag === "textarea";

      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !inField) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function updateUrl(nextQuery: string) {
    const params = new URLSearchParams();
    if (nextQuery) params.set("q", nextQuery);
    const next = params.toString() ? `/search?${params.toString()}` : "/search";
    window.history.replaceState(null, "", next);
  }

  async function runSearch(value: string) {
    const nextQuery = value.trim();
    updateUrl(nextQuery);

    if (!nextQuery) {
      setNotes([]);
      setTasks([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(nextQuery)}`);
      const data = (await res.json()) as {
        notes?: NoteResult[];
        tasks?: TaskResult[];
        boards?: BoardResult[];
        error?: string;
      };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to search");
      setNotes(data.notes ?? []);
      setTasks(data.tasks ?? []);
      setBoards(data.boards ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search");
    } finally {
      setLoading(false);
    }
  }

  const notesCount = notes.length;
  const tasksCount = tasks.length;
  const boardsCount = boards.length;
  const totalCount = notesCount + tasksCount + boardsCount;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {error ? <div className="cb-error">{error}</div> : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch(query);
        }}
        style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
      >
        <input
          ref={inputRef}
          className="cb-input"
          style={{ flex: "1 1 320px" }}
          placeholder="Search notes + tasks… (press /)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="cb-btn cb-btn-primary" type="submit" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      <div className="cb-subtle">{query.trim() ? `${totalCount} results` : "Enter a query to search."}</div>

      <div style={{ display: "grid", gap: 18 }}>
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ fontWeight: 650 }}>Boards</div>
            <span className="cb-pill">{boardsCount}</span>
          </div>

          {boardsCount === 0 ? (
            <div className="cb-subtle">No boards found.</div>
          ) : (
            <div className="cb-task-list">
              {boards.map((board) => (
                <div key={board.id} className="cb-task-card">
                  <div style={{ fontWeight: 650 }}>{board.title}</div>
                  {board.is_default ? <div className="cb-subtle">Default board</div> : null}
                  {board.updated_at ? <div className="cb-subtle">Updated {formatDate(board.updated_at)}</div> : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ fontWeight: 650 }}>Notes</div>
            <span className="cb-pill">{notesCount}</span>
          </div>

          {notesCount === 0 ? (
            <div className="cb-subtle">No notes found.</div>
          ) : (
            <div className="cb-task-list">
              {notes.map((note) => (
                <div key={note.id} className="cb-task-card">
                  <div style={{ fontWeight: 650 }}>{note.title}</div>
                  {note.body ? <div style={{ fontSize: 13, opacity: 0.75 }}>{truncate(note.body)}</div> : null}
                  <div className="cb-subtle">Updated {formatDate(note.updated_at)}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ fontWeight: 650 }}>Tasks</div>
            <span className="cb-pill">{tasksCount}</span>
          </div>

          {tasksCount === 0 ? (
            <div className="cb-subtle">No tasks found.</div>
          ) : (
            <div className="cb-task-list">
              {tasks.map((task) => (
                <div key={task.id} className="cb-task-card">
                  <div style={{ fontWeight: 650 }}>{task.title}</div>
                  {task.notes ? <div style={{ fontSize: 13, opacity: 0.75 }}>{truncate(task.notes)}</div> : null}
                  <div className="cb-task-meta">
                    {task.status ? <span className={`cb-status cb-status-${task.status}`}>{task.status}</span> : null}
                    {task.due_at ? <span>Due {formatDate(task.due_at)}</span> : null}
                    {task.board?.title ? <span>Board {task.board.title}</span> : null}
                    {task.column?.title ? <span>Column {task.column.title}</span> : null}
                    <span>Updated {formatDate(task.updated_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
