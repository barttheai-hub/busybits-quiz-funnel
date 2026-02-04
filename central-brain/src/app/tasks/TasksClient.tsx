"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type Board = {
  id: string;
  title: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Column = {
  id: string;
  board_id: string;
  title: string;
  position: number;
  created_at?: string;
  updated_at?: string;
};

export type Task = {
  id: string;
  title: string;
  notes: string | null;
  status: "todo" | "doing" | "done" | "blocked";
  priority: number;
  due_at: string | null;
  board_id: string | null;
  column_id: string | null;
  position: number;
  assignee: "ziga" | "bart" | null;
  recurrence_rule: "daily" | "weekly" | "monthly" | "yearly" | null;
  recurrence_interval: number | null;
  created_at: string;
  updated_at: string;
};

type NoteSummary = {
  id: string;
  title: string;
};

const STATUSES: Array<Task["status"]> = ["todo", "doing", "blocked", "done"];
const ASSIGNEES = [
  { value: "", label: "Unassigned" },
  { value: "ziga", label: "Ziga" },
  { value: "bart", label: "Bart" },
];
const RECURRENCES = [
  { value: "", label: "No recurrence" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

function formatDue(dueAt: string | null) {
  if (!dueAt) return null;
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function toDateInputValue(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function toDatePayload(value: string) {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return new Date(`${normalized}T12:00:00`).toISOString();
}

export default function TasksClient({
  initialBoards,
  initialColumns,
  initialTasks,
  initialBoardId,
}: {
  initialBoards: Board[];
  initialColumns: Column[];
  initialTasks: Task[];
  initialBoardId: string | null;
}) {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>(initialBoards);
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(initialBoardId);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [busyBoardId, setBusyBoardId] = useState<string | null>(null);
  const [busyColumnId, setBusyColumnId] = useState<string | null>(null);
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [creatingColumn, setCreatingColumn] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [boardTitle, setBoardTitle] = useState("");
  const [boardTitleById, setBoardTitleById] = useState<Record<string, string>>({});
  const [columnTitle, setColumnTitle] = useState("");
  const [columnTitleById, setColumnTitleById] = useState<Record<string, string>>({});
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskColumnId, setNewTaskColumnId] = useState<string>("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("2");
  const [newTaskRecurrence, setNewTaskRecurrence] = useState<string>("");
  const [newTaskRecurrenceInterval, setNewTaskRecurrenceInterval] = useState("1");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string>("");
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [openAttachId, setOpenAttachId] = useState<string | null>(null);
  const [selectedNoteByTask, setSelectedNoteByTask] = useState<Record<string, string>>({});
  const [noteIdByTask, setNoteIdByTask] = useState<Record<string, string>>({});
  const [linkedNotesByTask, setLinkedNotesByTask] = useState<Record<string, NoteSummary[]>>({});
  const [linkBusyByTask, setLinkBusyByTask] = useState<Record<string, boolean>>({});
  const [linksLoadingByTask, setLinksLoadingByTask] = useState<Record<string, boolean>>({});
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const addRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => setBoards(initialBoards), [initialBoards]);
  useEffect(() => setColumns(initialColumns), [initialColumns]);
  useEffect(() => setTasks(initialTasks), [initialTasks]);
  useEffect(() => setSelectedBoardId(initialBoardId), [initialBoardId]);

  useEffect(() => {
    let cancelled = false;
    async function loadNotes() {
      setNotesLoading(true);
      setError("");
      try {
        const res = await fetch("/api/notes");
        const data = (await res.json()) as { notes?: NoteSummary[]; error?: string };
        if (!res.ok || data.error) throw new Error(data.error ?? "Failed to load notes");
        if (!cancelled) setNotes(data.notes ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load notes");
      } finally {
        if (!cancelled) setNotesLoading(false);
      }
    }
    void loadNotes();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadLinksForTask(taskId: string) {
      setLinksLoadingByTask((prev) => ({ ...prev, [taskId]: true }));
      try {
        const res = await fetch(`/api/task-note-links/by-task/${taskId}`);
        const data = (await res.json()) as { notes?: NoteSummary[]; error?: string };
        if (!res.ok || data.error) throw new Error(data.error ?? "Failed to load linked notes");
        if (!cancelled) {
          setLinkedNotesByTask((prev) => ({ ...prev, [taskId]: data.notes ?? [] }));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load linked notes");
      } finally {
        if (!cancelled) {
          setLinksLoadingByTask((prev) => ({ ...prev, [taskId]: false }));
        }
      }
    }

    const ids = tasks.map((t) => t.id);
    ids.forEach((id) => void loadLinksForTask(id));
    return () => {
      cancelled = true;
    };
  }, [tasks]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      const inField = tag === "input" || tag === "textarea";

      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.altKey && !inField) {
        e.preventDefault();
        addRef.current?.focus();
      }

      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!selectedBoardId && boards.length > 0) {
      const defaultBoard = boards.find((b) => b.is_default) ?? boards[0];
      setSelectedBoardId(defaultBoard?.id ?? null);
    }
  }, [boards, selectedBoardId]);

  useEffect(() => {
    if (!selectedBoardId) return;
    const boardColumns = columns.filter((c) => c.board_id === selectedBoardId);
    if (boardColumns.length > 0) {
      setNewTaskColumnId((prev) => prev || boardColumns[0].id);
    }
  }, [columns, selectedBoardId]);

  function updateBoardUrl(boardId: string | null) {
    const basePath = "/tasks";
    const params = new URLSearchParams();
    if (boardId) params.set("board", boardId);
    const next = params.toString() ? `${basePath}?${params.toString()}` : basePath;

    // Use Next router state (not window.history) so router.refresh() uses the correct URL params.
    router.replace(next);
  }

  async function loadBoard(boardId: string) {
    setError("");
    try {
      const [columnsRes, tasksRes] = await Promise.all([
        fetch(`/api/boards/${boardId}/columns`).then((r) => r.json()),
        fetch(`/api/tasks?board_id=${boardId}`).then((r) => r.json()),
      ]);

      if (columnsRes.error) throw new Error(columnsRes.error);
      if (tasksRes.error) throw new Error(tasksRes.error);

      setColumns(columnsRes.columns ?? []);
      setTasks(tasksRes.tasks ?? []);
      setSelectedBoardId(boardId);
      updateBoardUrl(boardId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load board");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => (t.title + " " + (t.notes ?? "")).toLowerCase().includes(q));
  }, [tasks, search]);

  const allowReorder = search.trim() === "";

  const duplicateColumnTitles = useMemo(() => {
    if (!selectedBoardId) return [] as string[];
    const boardColumns = [...columns]
      .filter((c) => c.board_id === selectedBoardId)
      .sort((a, b) => a.position - b.position);

    const seen = new Set<string>();
    const dups = new Set<string>();
    for (const c of boardColumns) {
      const key = c.title.trim().toLowerCase();
      if (!key) continue;
      if (seen.has(key)) dups.add(c.title);
      seen.add(key);
    }
    return Array.from(dups);
  }, [columns, selectedBoardId]);

  const orderedColumns = useMemo(() => {
    if (!selectedBoardId) return [];
    const boardColumns = [...columns]
      .filter((c) => c.board_id === selectedBoardId)
      .sort((a, b) => a.position - b.position);

    // Hide duplicate titles (case-insensitive). This prevents confusing UIs when the DB already has duplicates.
    const seen = new Set<string>();
    const deduped: Column[] = [];
    for (const c of boardColumns) {
      const key = c.title.trim().toLowerCase();
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(c);
    }
    return deduped;
  }, [columns, selectedBoardId]);

  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    filtered.forEach((task) => {
      if (!task.column_id) return;
      if (!grouped[task.column_id]) grouped[task.column_id] = [];
      grouped[task.column_id].push(task);
    });
    Object.values(grouped).forEach((list) => {
      list.sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    });
    return grouped;
  }, [filtered]);

  async function createBoard(e: React.FormEvent) {
    e.preventDefault();
    const title = boardTitle.trim();
    if (!title) return;

    setCreatingBoard(true);
    setError("");
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, seed_default_columns: true }),
      });
      const data = (await res.json()) as { board?: Board; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create board");
      if (data.board) {
        setBoards((prev) => [...prev, data.board!]);
        setBoardTitle("");
        await loadBoard(data.board.id);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create board");
    } finally {
      setCreatingBoard(false);
    }
  }

  async function updateBoard(board: Board) {
    const title = (boardTitleById[board.id] ?? board.title).trim();
    if (!title) return;

    setBusyBoardId(board.id);
    setError("");
    try {
      const res = await fetch(`/api/boards/${board.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = (await res.json()) as { board?: Board; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to update board");
      if (data.board) {
        setBoards((prev) => prev.map((b) => (b.id === board.id ? data.board! : b)));
        setBoardTitleById((prev) => ({ ...prev, [board.id]: data.board!.title }));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update board");
    } finally {
      setBusyBoardId(null);
    }
  }

  async function setDefaultBoard(board: Board) {
    setBusyBoardId(board.id);
    setError("");
    try {
      const res = await fetch(`/api/boards/${board.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ is_default: true }),
      });
      const data = (await res.json()) as { board?: Board; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to set default board");
      if (data.board) {
        setBoards((prev) => prev.map((b) => ({ ...b, is_default: b.id === data.board!.id })));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default board");
    } finally {
      setBusyBoardId(null);
    }
  }

  async function deleteBoard(board: Board) {
    if (!confirm(`Delete board "${board.title}"?`)) return;
    setBusyBoardId(board.id);
    setError("");

    const prevBoards = boards;
    setBoards((prev) => prev.filter((b) => b.id !== board.id));
    try {
      const res = await fetch(`/api/boards/${board.id}`, { method: "DELETE" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to delete board");
      const nextBoard = prevBoards.find((b) => b.id !== board.id) ?? null;
      if (nextBoard) {
        await loadBoard(nextBoard.id);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete board");
      setBoards(prevBoards);
    } finally {
      setBusyBoardId(null);
    }
  }

  async function createColumn(e: React.FormEvent) {
    e.preventDefault();
    const title = columnTitle.trim();
    if (!title || !selectedBoardId) return;

    setCreatingColumn(true);
    setError("");
    try {
      const res = await fetch(`/api/boards/${selectedBoardId}/columns`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = (await res.json()) as { column?: Column; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create column");
      if (data.column) {
        setColumns((prev) => [...prev, data.column!]);
        setColumnTitle("");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create column");
    } finally {
      setCreatingColumn(false);
    }
  }

  async function updateColumn(column: Column) {
    const title = (columnTitleById[column.id] ?? column.title).trim();
    if (!title) return;

    setBusyColumnId(column.id);
    setError("");
    try {
      const res = await fetch(`/api/board-columns/${column.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = (await res.json()) as { column?: Column; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to update column");
      if (data.column) {
        setColumns((prev) => prev.map((c) => (c.id === column.id ? data.column! : c)));
        setColumnTitleById((prev) => ({ ...prev, [column.id]: data.column!.title }));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update column");
    } finally {
      setBusyColumnId(null);
    }
  }

  async function deleteColumn(column: Column) {
    if (!confirm(`Delete column "${column.title}"?`)) return;
    setBusyColumnId(column.id);
    setError("");
    const prevColumns = columns;
    const prevTasks = tasks;
    setColumns((prev) => prev.filter((c) => c.id !== column.id));
    setTasks((prev) => prev.filter((t) => t.column_id !== column.id));
    try {
      const res = await fetch(`/api/board-columns/${column.id}`, { method: "DELETE" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to delete column");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete column");
      setColumns(prevColumns);
      setTasks(prevTasks);
    } finally {
      setBusyColumnId(null);
    }
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title || !selectedBoardId) return;

    setCreatingTask(true);
    setError("");
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          board_id: selectedBoardId,
          column_id: newTaskColumnId || orderedColumns[0]?.id || null,
          assignee: newTaskAssignee || null,
          due_at: newTaskDue ? toDatePayload(newTaskDue) : null,
          priority: Number(newTaskPriority) || 2,
          recurrence_rule: newTaskRecurrence || null,
          recurrence_interval: newTaskRecurrenceInterval || 1,
        }),
      });
      const data = (await res.json()) as { task?: Task; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create task");
      if (data.task) setTasks((prev) => [...prev, data.task!]);
      setNewTaskTitle("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setCreatingTask(false);
    }
  }

  async function updateTask(task: Task, updates: Partial<Task> & { create_next?: boolean }) {
    setBusyTaskId(task.id);
    setError("");
    const prev = tasks;
    setTasks((items) => items.map((t) => (t.id === task.id ? { ...t, ...updates } : t)));

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = (await res.json()) as { task?: Task; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to update");
      if (data.task) {
        setTasks((items) => items.map((t) => (t.id === task.id ? data.task! : t)));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
      setTasks(prev);
    } finally {
      setBusyTaskId(null);
    }
  }

  async function deleteTask(task: Task) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    setBusyTaskId(task.id);
    setError("");
    const prev = tasks;
    setTasks((items) => items.filter((t) => t.id !== task.id));
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to delete");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setTasks(prev);
    } finally {
      setBusyTaskId(null);
    }
  }

  async function completeTask(task: Task) {
    await updateTask(task, { status: "done", create_next: Boolean(task.recurrence_rule) });
  }

  async function moveTaskToColumn(task: Task, columnId: string) {
    setTasks((prev) => {
      const sourceColumnId = task.column_id;
      const sourceList = prev
        .filter((t) => t.column_id === sourceColumnId && t.id !== task.id)
        .sort((a, b) => a.position - b.position);
      const targetList = prev
        .filter((t) => t.column_id === columnId && t.id !== task.id)
        .sort((a, b) => a.position - b.position);

      const updated: Record<string, Task> = {};
      sourceList.forEach((t, idx) => {
        updated[t.id] = { ...t, position: idx + 1 };
      });
      targetList.forEach((t, idx) => {
        updated[t.id] = { ...t, position: idx + 1 };
      });
      updated[task.id] = { ...task, column_id: columnId, position: targetList.length + 1 };

      const nextTasks = prev.map((t) => updated[t.id] ?? t);
      const taskOrder = [
        ...sourceList.map((t) => ({ id: t.id, column_id: t.column_id, position: updated[t.id].position })),
        ...targetList.map((t) => ({ id: t.id, column_id: t.column_id, position: updated[t.id].position })),
        { id: task.id, column_id: columnId, position: updated[task.id].position },
      ];
      void persistReorder(taskOrder);
      return nextTasks;
    });
  }

  async function persistReorder(updates: Array<{ id: string; column_id: string | null; position: number }>) {
    if (updates.length === 0) return;
    try {
      await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          updates: updates.map((update) => ({
            ...update,
            board_id: selectedBoardId,
          })),
        }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder tasks");
    }
  }

  function applyReorder(taskId: string, targetColumnId: string, targetIndex: number) {
    if (!allowReorder) return;
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId);
      if (!task) return prev;
      const sourceColumnId = task.column_id;
      if (!sourceColumnId) return prev;

      const byColumn = new Map<string, Task[]>();
      prev.forEach((t) => {
        if (!t.column_id) return;
        if (!byColumn.has(t.column_id)) byColumn.set(t.column_id, []);
        byColumn.get(t.column_id)!.push(t);
      });

      const sourceList = [...(byColumn.get(sourceColumnId) ?? [])].sort(
        (a, b) => a.position - b.position
      );
      const targetList =
        sourceColumnId === targetColumnId
          ? sourceList
          : [...(byColumn.get(targetColumnId) ?? [])].sort((a, b) => a.position - b.position);

      const moving = sourceList.find((t) => t.id === taskId);
      if (!moving) return prev;
      const nextSource = sourceList.filter((t) => t.id !== taskId);
      const nextTarget = targetList.filter((t) => t.id !== taskId);
      const insertIndex = Math.max(0, Math.min(targetIndex, nextTarget.length));
      nextTarget.splice(insertIndex, 0, { ...moving, column_id: targetColumnId });

      const updated: Record<string, Task> = {};
      nextSource.forEach((t, idx) => {
        updated[t.id] = { ...t, position: idx + 1 };
      });
      nextTarget.forEach((t, idx) => {
        updated[t.id] = { ...t, position: idx + 1, column_id: targetColumnId };
      });

      const nextTasks = prev.map((t) => updated[t.id] ?? t);
      const updatesPayload =
        sourceColumnId === targetColumnId
          ? nextTarget.map((t) => ({ id: t.id, column_id: targetColumnId, position: updated[t.id].position }))
          : [
              ...nextSource.map((t) => ({
                id: t.id,
                column_id: t.column_id,
                position: updated[t.id].position,
              })),
              ...nextTarget.map((t) => ({
                id: t.id,
                column_id: targetColumnId,
                position: updated[t.id].position,
              })),
            ];
      void persistReorder(updatesPayload);
      return nextTasks;
    });
  }

  async function attachNote(task: Task) {
    const manual = (noteIdByTask[task.id] ?? "").trim();
    const selected = (selectedNoteByTask[task.id] ?? "").trim();
    const noteId = manual || selected;
    if (!noteId) {
      setError("Select a note or enter a note id to attach");
      return;
    }

    setLinkBusyByTask((prev) => ({ ...prev, [task.id]: true }));
    setError("");

    try {
      const res = await fetch("/api/task-note-links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ task_id: task.id, note_id: noteId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to attach note");
      setNoteIdByTask((prev) => ({ ...prev, [task.id]: "" }));
      await fetch(`/api/task-note-links/by-task/${task.id}`)
        .then((r) => r.json())
        .then((d: { notes?: NoteSummary[] }) => {
          setLinkedNotesByTask((prev) => ({ ...prev, [task.id]: d.notes ?? [] }));
        });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to attach note");
    } finally {
      setLinkBusyByTask((prev) => ({ ...prev, [task.id]: false }));
    }
  }

  async function detachNote(taskId: string, noteId: string) {
    setLinkBusyByTask((prev) => ({ ...prev, [taskId]: true }));
    setError("");

    try {
      const res = await fetch("/api/task-note-links", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ task_id: taskId, note_id: noteId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to detach note");
      setLinkedNotesByTask((prev) => ({
        ...prev,
        [taskId]: (prev[taskId] ?? []).filter((n) => n.id !== noteId),
      }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to detach note");
    } finally {
      setLinkBusyByTask((prev) => ({ ...prev, [taskId]: false }));
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {error ? <div className="cb-error">{error}</div> : null}

      <div className="cb-board-top">
        {duplicateColumnTitles.length > 0 ? (
          <div className="cb-error" style={{ marginBottom: 10 }}>
            Duplicate columns detected ({duplicateColumnTitles.join(", ")}). New duplicates are now blocked; extra
            duplicates may need deleting.
          </div>
        ) : null}

        <div className="cb-board-header">
          <div style={{ display: "grid", gap: 6 }}>
            <div className="cb-label">Board</div>
            <select
              className="cb-input"
              value={selectedBoardId ?? ""}
              onChange={(e) => {
                const nextId = e.target.value;
                if (nextId) void loadBoard(nextId);
              }}
            >
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.title} {board.is_default ? "• default" : ""}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={createBoard} className="cb-board-form">
            <input
              className="cb-input"
              placeholder="New board title"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
            />
            <button className="cb-btn cb-btn-primary" type="submit" disabled={creatingBoard || !boardTitle.trim()}>
              {creatingBoard ? "Creating…" : "Add board"}
            </button>
          </form>
        </div>

        {selectedBoardId ? (
          <div className="cb-board-actions">
            {boards
              .filter((b) => b.id === selectedBoardId)
              .map((board) => (
                <div key={board.id} className="cb-board-action-row">
                  <input
                    className="cb-input"
                    value={boardTitleById[board.id] ?? board.title}
                    onChange={(e) => setBoardTitleById((prev) => ({ ...prev, [board.id]: e.target.value }))}
                  />
                  <button
                    className="cb-btn cb-btn-secondary"
                    onClick={() => void updateBoard(board)}
                    disabled={busyBoardId === board.id}
                  >
                    Save
                  </button>
                  {!board.is_default ? (
                    <button
                      className="cb-btn cb-btn-secondary"
                      onClick={() => void setDefaultBoard(board)}
                      disabled={busyBoardId === board.id}
                    >
                      Set default
                    </button>
                  ) : (
                    <span className="cb-pill">Default</span>
                  )}
                  <button
                    className="cb-btn cb-btn-secondary"
                    onClick={() => void deleteBoard(board)}
                    disabled={busyBoardId === board.id}
                  >
                    Delete
                  </button>
                </div>
              ))}
          </div>
        ) : null}
      </div>

      <div className="cb-board-search">
        <input
          ref={searchRef}
          className="cb-input"
          placeholder="Search tasks… (press /)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <form className="cb-board-new" onSubmit={createTask}>
        <input
          ref={addRef}
          className="cb-input"
          placeholder="New task title… (press N anywhere)"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
        />
        <select
          className="cb-input"
          value={newTaskColumnId}
          onChange={(e) => setNewTaskColumnId(e.target.value)}
          disabled={orderedColumns.length === 0}
        >
          {orderedColumns.length === 0 ? <option value="">No columns yet</option> : null}
          {orderedColumns.map((column) => (
            <option key={column.id} value={column.id}>
              {column.title}
            </option>
          ))}
        </select>
        <select className="cb-input" value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)}>
          {ASSIGNEES.map((assignee) => (
            <option key={assignee.value} value={assignee.value}>
              {assignee.label}
            </option>
          ))}
        </select>
        <input className="cb-input" type="date" value={newTaskDue} onChange={(e) => setNewTaskDue(e.target.value)} />
        <select className="cb-input" value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)}>
          <option value="1">P1</option>
          <option value="2">P2</option>
          <option value="3">P3</option>
        </select>
        <select
          className="cb-input"
          value={newTaskRecurrence}
          onChange={(e) => setNewTaskRecurrence(e.target.value)}
        >
          {RECURRENCES.map((recurrence) => (
            <option key={recurrence.value} value={recurrence.value}>
              {recurrence.label}
            </option>
          ))}
        </select>
        <input
          className="cb-input"
          type="number"
          min={1}
          value={newTaskRecurrenceInterval}
          onChange={(e) => setNewTaskRecurrenceInterval(e.target.value)}
          placeholder="Interval"
        />
        <button className="cb-btn cb-btn-primary" type="submit" disabled={creatingTask || !newTaskTitle.trim()}>
          {creatingTask ? "Adding…" : "Add task"}
        </button>
      </form>

      <form className="cb-board-new" onSubmit={createColumn}>
        <input
          className="cb-input"
          placeholder="New column title"
          value={columnTitle}
          onChange={(e) => setColumnTitle(e.target.value)}
        />
        <button
          className="cb-btn cb-btn-secondary"
          type="submit"
          disabled={creatingColumn || !columnTitle.trim() || !selectedBoardId}
        >
          {creatingColumn ? "Adding…" : "Add column"}
        </button>
      </form>

      {orderedColumns.length === 0 ? (
        <div className="cb-empty">
          <div style={{ fontWeight: 650, marginBottom: 6 }}>No columns yet</div>
          <div style={{ fontSize: 13, opacity: 0.72, lineHeight: 1.5 }}>
            Create a column to start organizing tasks.
          </div>
        </div>
      ) : (
        <div className="cb-board-columns">
          {orderedColumns.map((column) => {
            const tasksForColumn = tasksByColumn[column.id] ?? [];
            return (
              <div
                key={column.id}
                className="cb-board-column"
                onDragOver={(e) => {
                  if (allowReorder) e.preventDefault();
                }}
                onDrop={(e) => {
                  if (!allowReorder) return;
                  e.preventDefault();
                  const taskId = e.dataTransfer.getData("text/plain");
                  if (taskId) applyReorder(taskId, column.id, tasksForColumn.length);
                  setDraggingTaskId(null);
                }}
              >
                <div className="cb-board-column-header">
                  <div style={{ display: "grid", gap: 8 }}>
                    <input
                      className="cb-input"
                      value={columnTitleById[column.id] ?? column.title}
                      onChange={(e) =>
                        setColumnTitleById((prev) => ({ ...prev, [column.id]: e.target.value }))
                      }
                    />
                    <div className="cb-subtle">{tasksForColumn.length} cards</div>
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <button
                      className="cb-btn cb-btn-secondary"
                      onClick={() => void updateColumn(column)}
                      disabled={busyColumnId === column.id}
                    >
                      Save
                    </button>
                    <button
                      className="cb-btn cb-btn-secondary"
                      onClick={() => void deleteColumn(column)}
                      disabled={busyColumnId === column.id}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="cb-board-cards">
                  {tasksForColumn.length === 0 ? (
                    <div className="cb-subtle">Drop tasks here.</div>
                  ) : (
                    tasksForColumn.map((task, index) => (
                      <div
                        key={task.id}
                        className={`cb-board-card${draggingTaskId === task.id ? " is-dragging" : ""}`}
                        draggable={allowReorder}
                        onDragStart={(e) => {
                          if (!allowReorder) return;
                          setDraggingTaskId(task.id);
                          e.dataTransfer.setData("text/plain", task.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => setDraggingTaskId(null)}
                        onDragOver={(e) => {
                          if (allowReorder) e.preventDefault();
                        }}
                        onDrop={(e) => {
                          if (!allowReorder) return;
                          e.preventDefault();
                          const taskId = e.dataTransfer.getData("text/plain");
                          if (taskId) applyReorder(taskId, column.id, index);
                          setDraggingTaskId(null);
                        }}
                      >
                        <div style={{ display: "grid", gap: 6 }}>
                          <div style={{ fontWeight: 650, lineHeight: 1.3 }}>{task.title}</div>
                          <div className="cb-task-meta">
                            {task.assignee ? (
                              <span className="cb-pill">{task.assignee === "ziga" ? "Ziga" : "Bart"}</span>
                            ) : null}
                            {task.due_at ? <span className="cb-pill">Due {formatDue(task.due_at)}</span> : null}
                            <span className="cb-pill">P{task.priority}</span>
                            {task.recurrence_rule ? (
                              <span className="cb-pill">
                                {task.recurrence_rule} ×{task.recurrence_interval ?? 1}
                              </span>
                            ) : null}
                            <span className={`cb-status cb-status-${task.status}`}>{task.status}</span>
                          </div>
                        </div>

                        <div className="cb-board-card-actions">
                          <button
                            className="cb-btn cb-btn-secondary"
                            onClick={() => setEditingTaskId((prev) => (prev === task.id ? null : task.id))}
                          >
                            {editingTaskId === task.id ? "Close" : "Edit"}
                          </button>
                          <button
                            className="cb-btn cb-btn-secondary"
                            onClick={() => void completeTask(task)}
                            disabled={busyTaskId === task.id}
                          >
                            Done
                          </button>
                          <button
                            className="cb-btn cb-btn-secondary"
                            onClick={() => void deleteTask(task)}
                            disabled={busyTaskId === task.id}
                          >
                            Delete
                          </button>
                        </div>

                        {editingTaskId === task.id ? (
                          <div className="cb-board-card-edit">
                            <div className="cb-board-edit-grid">
                              <select
                                className="cb-input"
                                value={task.column_id ?? ""}
                                onChange={(e) => {
                                  const nextColumnId = e.target.value;
                                  if (nextColumnId && nextColumnId !== task.column_id) {
                                    void moveTaskToColumn(task, nextColumnId);
                                  }
                                }}
                              >
                                {orderedColumns.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.title}
                                  </option>
                                ))}
                              </select>

                              <select
                                className="cb-input"
                                value={task.assignee ?? ""}
                                onChange={(e) =>
                                  void updateTask(task, {
                                    assignee: (e.target.value || null) as "ziga" | "bart" | null,
                                  })
                                }
                              >
                                {ASSIGNEES.map((assignee) => (
                                  <option key={assignee.value} value={assignee.value}>
                                    {assignee.label}
                                  </option>
                                ))}
                              </select>
                              <input
                                className="cb-input"
                                type="date"
                                value={toDateInputValue(task.due_at)}
                                onChange={(e) => void updateTask(task, { due_at: toDatePayload(e.target.value) })}
                              />
                              <select
                                className="cb-input"
                                value={task.recurrence_rule ?? ""}
                                onChange={(e) =>
                                  void updateTask(task, {
                                    recurrence_rule: (e.target.value || null) as
                                      | "daily"
                                      | "weekly"
                                      | "monthly"
                                      | "yearly"
                                      | null,
                                  })
                                }
                              >
                                {RECURRENCES.map((recurrence) => (
                                  <option key={recurrence.value} value={recurrence.value}>
                                    {recurrence.label}
                                  </option>
                                ))}
                              </select>
                              <input
                                className="cb-input"
                                type="number"
                                min={1}
                                value={task.recurrence_interval ?? 1}
                                onChange={(e) =>
                                  void updateTask(task, { recurrence_interval: Number(e.target.value) || 1 })
                                }
                              />
                              <select
                                className="cb-input"
                                value={task.status}
                                onChange={(e) => void updateTask(task, { status: e.target.value as Task["status"] })}
                              >
                                {STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                              <select
                                className="cb-input"
                                value={task.column_id ?? ""}
                                onChange={(e) => void moveTaskToColumn(task, e.target.value)}
                              >
                                {orderedColumns.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.title}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="cb-board-card-actions">
                              <button
                                className="cb-btn cb-btn-secondary"
                                onClick={() => applyReorder(task.id, column.id, Math.max(0, index - 1))}
                                disabled={!allowReorder}
                              >
                                ↑
                              </button>
                              <button
                                className="cb-btn cb-btn-secondary"
                                onClick={() =>
                                  applyReorder(task.id, column.id, Math.min(tasksForColumn.length, index + 1))
                                }
                                disabled={!allowReorder}
                              >
                                ↓
                              </button>
                            </div>

                            <div
                              style={{
                                borderTop: "1px solid rgba(255,255,255,0.08)",
                                paddingTop: 10,
                                display: "grid",
                                gap: 8,
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>Attach note</div>
                                <button
                                  className="cb-btn cb-btn-secondary"
                                  style={{ padding: "8px 10px" }}
                                  onClick={() => setOpenAttachId((prev) => (prev === task.id ? null : task.id))}
                                >
                                  {openAttachId === task.id ? "Close" : "Attach note"}
                                </button>
                              </div>

                              {openAttachId === task.id ? (
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    void attachNote(task);
                                  }}
                                  style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}
                                >
                                  <select
                                    className="cb-input"
                                    value={selectedNoteByTask[task.id] ?? ""}
                                    onChange={(e) =>
                                      setSelectedNoteByTask((prev) => ({ ...prev, [task.id]: e.target.value }))
                                    }
                                    style={{ flex: "1 1 220px" }}
                                    disabled={notesLoading || linkBusyByTask[task.id]}
                                  >
                                    <option value="">{notesLoading ? "Loading notes…" : "Select a note"}</option>
                                    {notes.map((n) => (
                                      <option key={n.id} value={n.id}>
                                        {n.title || n.id}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    className="cb-input"
                                    placeholder="Or paste note id"
                                    value={noteIdByTask[task.id] ?? ""}
                                    onChange={(e) =>
                                      setNoteIdByTask((prev) => ({ ...prev, [task.id]: e.target.value }))
                                    }
                                    style={{ flex: "1 1 200px" }}
                                    disabled={linkBusyByTask[task.id]}
                                  />
                                  <button
                                    className="cb-btn cb-btn-primary"
                                    type="submit"
                                    disabled={linkBusyByTask[task.id]}
                                    style={{ padding: "10px 12px" }}
                                  >
                                    {linkBusyByTask[task.id] ? "Attaching…" : "Attach"}
                                  </button>
                                </form>
                              ) : null}

                              <div style={{ display: "grid", gap: 6 }}>
                                <div style={{ fontSize: 12, opacity: 0.7 }}>Attached notes</div>
                                {linksLoadingByTask[task.id] ? (
                                  <div style={{ fontSize: 12, opacity: 0.7 }}>Loading…</div>
                                ) : (linkedNotesByTask[task.id] ?? []).length === 0 ? (
                                  <div style={{ fontSize: 12, opacity: 0.7 }}>None yet</div>
                                ) : (
                                  <div style={{ display: "grid", gap: 6 }}>
                                    {(linkedNotesByTask[task.id] ?? []).map((n) => (
                                      <div
                                        key={n.id}
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
                                        <div
                                          style={{
                                            minWidth: 0,
                                            fontSize: 13,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                          }}
                                        >
                                          {n.title || n.id}
                                        </div>
                                        <button
                                          className="cb-btn cb-btn-secondary"
                                          style={{ padding: "6px 10px" }}
                                          disabled={linkBusyByTask[task.id]}
                                          onClick={() => void detachNote(task.id, n.id)}
                                        >
                                          Detach
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
