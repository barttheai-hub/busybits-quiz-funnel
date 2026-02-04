"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type KanbanColumn = {
  id: string;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
};

export type KanbanCard = {
  id: string;
  column_id: string;
  item_type: "note" | "task";
  item_id: string;
  position: number;
  created_at: string;
  updated_at: string;
};

export type NoteSummary = {
  id: string;
  title: string;
  updated_at?: string;
};

export type TaskSummary = {
  id: string;
  title: string;
  status: string;
  updated_at?: string;
};

const DEFAULT_COLUMNS = ["Backlog", "Doing", "Done"];

export default function KanbanClient({
  initialColumns,
  initialCards,
  initialNotes,
  initialTasks,
}: {
  initialColumns: KanbanColumn[];
  initialCards: KanbanCard[];
  initialNotes: NoteSummary[];
  initialTasks: TaskSummary[];
}) {
  const router = useRouter();
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
  const [cards, setCards] = useState<KanbanCard[]>(initialCards);
  const [notes, setNotes] = useState<NoteSummary[]>(initialNotes);
  const [tasks, setTasks] = useState<TaskSummary[]>(initialTasks);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [columnTitleById, setColumnTitleById] = useState<Record<string, string>>({});
  const [cardTypeByColumn, setCardTypeByColumn] = useState<Record<string, "note" | "task">>({});
  const [cardItemByColumn, setCardItemByColumn] = useState<Record<string, string>>({});
  const [busyColumnId, setBusyColumnId] = useState<string | null>(null);
  const [busyCardId, setBusyCardId] = useState<string | null>(null);
  const [creatingColumn, setCreatingColumn] = useState(false);
  const [creatingDefaults, setCreatingDefaults] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setColumns(initialColumns), [initialColumns]);
  useEffect(() => setCards(initialCards), [initialCards]);
  useEffect(() => setNotes(initialNotes), [initialNotes]);
  useEffect(() => setTasks(initialTasks), [initialTasks]);

  const orderedColumns = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position),
    [columns]
  );

  const noteById = useMemo(() => {
    const map: Record<string, NoteSummary> = {};
    notes.forEach((note) => {
      map[note.id] = note;
    });
    return map;
  }, [notes]);

  const taskById = useMemo(() => {
    const map: Record<string, TaskSummary> = {};
    tasks.forEach((task) => {
      map[task.id] = task;
    });
    return map;
  }, [tasks]);

  const cardsByColumn = useMemo(() => {
    const grouped: Record<string, KanbanCard[]> = {};
    cards.forEach((card) => {
      if (!grouped[card.column_id]) grouped[card.column_id] = [];
      grouped[card.column_id].push(card);
    });

    Object.values(grouped).forEach((list) => {
      list.sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    });

    return grouped;
  }, [cards]);

  function columnTitleValue(column: KanbanColumn) {
    return columnTitleById[column.id] ?? column.title;
  }

  async function createColumn(titleOverride?: string) {
    const title = (titleOverride ?? newColumnTitle).trim();
    if (!title) return;

    setCreatingColumn(true);
    setError("");

    try {
      const res = await fetch("/api/kanban/columns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = (await res.json()) as { column?: KanbanColumn; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create column");
      if (data.column) {
        setColumns((prev) => [...prev, data.column!]);
        setNewColumnTitle("");
        setColumnTitleById((prev) => ({ ...prev, [data.column!.id]: data.column!.title }));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create column");
    } finally {
      setCreatingColumn(false);
    }
  }

  async function seedDefaultColumns() {
    setCreatingDefaults(true);
    setError("");

    try {
      for (const title of DEFAULT_COLUMNS) {
        // skip if already exists
        if (columns.some((c) => c.title.toLowerCase() === title.toLowerCase())) continue;
        await createColumn(title);
      }
    } finally {
      setCreatingDefaults(false);
    }
  }

  async function renameColumn(column: KanbanColumn) {
    const nextTitle = columnTitleValue(column).trim();
    if (!nextTitle) {
      setError("Column title is required");
      return;
    }

    setBusyColumnId(column.id);
    setError("");

    try {
      const res = await fetch(`/api/kanban/columns/${column.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: nextTitle }),
      });
      const data = (await res.json()) as { column?: KanbanColumn; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to rename column");
      if (data.column) {
        setColumns((prev) => prev.map((c) => (c.id === column.id ? data.column! : c)));
        setColumnTitleById((prev) => ({ ...prev, [column.id]: data.column!.title }));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename column");
    } finally {
      setBusyColumnId(null);
    }
  }

  async function deleteColumn(column: KanbanColumn) {
    if (!confirm(`Delete column "${column.title}" and all cards in it?`)) return;

    setBusyColumnId(column.id);
    setError("");
    const prevColumns = columns;
    const prevCards = cards;

    setColumns((prev) => prev.filter((c) => c.id !== column.id));
    setCards((prev) => prev.filter((card) => card.column_id !== column.id));

    try {
      const res = await fetch(`/api/kanban/columns/${column.id}`, { method: "DELETE" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to delete column");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete column");
      setColumns(prevColumns);
      setCards(prevCards);
    } finally {
      setBusyColumnId(null);
    }
  }

  async function createCard(column: KanbanColumn) {
    const type = cardTypeByColumn[column.id] ?? "task";
    const itemId = (cardItemByColumn[column.id] ?? "").trim();

    if (!itemId) {
      setError("Pick a note or task to add.");
      return;
    }

    setBusyColumnId(column.id);
    setError("");

    try {
      const res = await fetch("/api/kanban/cards", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ column_id: column.id, item_type: type, item_id: itemId }),
      });
      const data = (await res.json()) as { card?: KanbanCard; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to add card");
      if (data.card) {
        setCards((prev) => [...prev, data.card!]);
        setCardItemByColumn((prev) => ({ ...prev, [column.id]: "" }));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add card");
    } finally {
      setBusyColumnId(null);
    }
  }

  async function removeCard(card: KanbanCard) {
    if (!confirm("Remove this card from the board?")) return;
    setBusyCardId(card.id);
    setError("");
    const prev = cards;
    setCards((items) => items.filter((c) => c.id !== card.id));

    try {
      const res = await fetch(`/api/kanban/cards/${card.id}`, { method: "DELETE" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to remove card");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove card");
      setCards(prev);
    } finally {
      setBusyCardId(null);
    }
  }

  async function moveCard(card: KanbanCard, direction: "left" | "right") {
    const idx = orderedColumns.findIndex((c) => c.id === card.column_id);
    const targetIndex = direction === "left" ? idx - 1 : idx + 1;
    const target = orderedColumns[targetIndex];
    if (!target) return;

    setBusyCardId(card.id);
    setError("");

    const prev = cards;
    const nextPosition =
      Math.max(
        0,
        ...cards.filter((c) => c.column_id === target.id).map((c) => c.position)
      ) + 1;

    setCards((items) =>
      items.map((c) =>
        c.id === card.id ? { ...c, column_id: target.id, position: nextPosition } : c
      )
    );

    try {
      const res = await fetch(`/api/kanban/cards/${card.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ column_id: target.id }),
      });
      const data = (await res.json()) as { card?: KanbanCard; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to move card");
      if (data.card) {
        setCards((items) => items.map((c) => (c.id === card.id ? data.card! : c)));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move card");
      setCards(prev);
    } finally {
      setBusyCardId(null);
    }
  }

  const hasColumns = orderedColumns.length > 0;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {error ? <div className="cb-error">{error}</div> : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <input
          className="cb-input"
          placeholder="New column title"
          value={newColumnTitle}
          onChange={(e) => setNewColumnTitle(e.target.value)}
          style={{ flex: "1 1 240px" }}
        />
        <button
          className="cb-btn cb-btn-primary"
          onClick={() => void createColumn()}
          disabled={creatingColumn || !newColumnTitle.trim()}
        >
          {creatingColumn ? "Adding…" : "Add column"}
        </button>
        {!hasColumns ? (
          <button
            className="cb-btn cb-btn-secondary"
            onClick={() => void seedDefaultColumns()}
            disabled={creatingDefaults}
          >
            {creatingDefaults ? "Creating…" : "Create default columns"}
          </button>
        ) : null}
      </div>

      {!hasColumns ? (
        <div style={{ border: "1px dashed rgba(255,255,255,0.14)", borderRadius: 16, padding: 18, opacity: 0.9 }}>
          <div style={{ fontWeight: 650, marginBottom: 6 }}>No columns yet</div>
          <div style={{ fontSize: 13, opacity: 0.72, lineHeight: 1.5 }}>
            Add your first column or generate the default set.
          </div>
        </div>
      ) : (
        <div className="cb-kanban-board">
          {orderedColumns.map((column, index) => {
            const cardsForColumn = cardsByColumn[column.id] ?? [];
            const selectedType = cardTypeByColumn[column.id] ?? "task";
            const options = selectedType === "note" ? notes : tasks;

            return (
              <div key={column.id} className="cb-kanban-column">
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      className="cb-input"
                      value={columnTitleValue(column)}
                      onChange={(e) =>
                        setColumnTitleById((prev) => ({ ...prev, [column.id]: e.target.value }))
                      }
                      style={{ fontWeight: 600 }}
                    />
                    <button
                      className="cb-btn cb-btn-secondary"
                      style={{ padding: "10px 12px" }}
                      disabled={busyColumnId === column.id}
                      onClick={() => void renameColumn(column)}
                    >
                      Save
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div className="cb-subtle">{cardsForColumn.length} cards</div>
                    <button
                      className="cb-btn cb-btn-secondary"
                      style={{ padding: "8px 10px" }}
                      disabled={busyColumnId === column.id}
                      onClick={() => void deleteColumn(column)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  {cardsForColumn.length === 0 ? (
                    <div className="cb-subtle" style={{ padding: "8px 0" }}>
                      Add a note or task below.
                    </div>
                  ) : (
                    cardsForColumn.map((card) => {
                      const item = card.item_type === "note" ? noteById[card.item_id] : taskById[card.item_id];
                      const title = item?.title ?? "Missing item";
                      const status = card.item_type === "task" ? taskById[card.item_id]?.status : null;

                      return (
                        <div key={card.id} className="cb-kanban-card">
                          <div style={{ display: "grid", gap: 6 }}>
                            <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{title}</div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <span className="cb-pill">{card.item_type === "note" ? "Note" : "Task"}</span>
                              {status ? <span className={`cb-status cb-status-${status}`}>{status}</span> : null}
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              className="cb-btn cb-btn-secondary"
                              style={{ padding: "8px 10px" }}
                              onClick={() => void moveCard(card, "left")}
                              disabled={busyCardId === card.id || index === 0}
                            >
                              ←
                            </button>
                            <button
                              className="cb-btn cb-btn-secondary"
                              style={{ padding: "8px 10px" }}
                              onClick={() => void moveCard(card, "right")}
                              disabled={busyCardId === card.id || index === orderedColumns.length - 1}
                            >
                              →
                            </button>
                            <button
                              className="cb-btn cb-btn-secondary"
                              style={{ padding: "8px 10px" }}
                              onClick={() => void removeCard(card)}
                              disabled={busyCardId === card.id}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="cb-kanban-add">
                  <div style={{ display: "grid", gap: 8 }}>
                    <select
                      className="cb-input"
                      value={selectedType}
                      onChange={(e) => {
                        const nextType = e.target.value === "note" ? "note" : "task";
                        setCardTypeByColumn((prev) => ({ ...prev, [column.id]: nextType }));
                        setCardItemByColumn((prev) => ({ ...prev, [column.id]: "" }));
                      }}
                    >
                      <option value="task">Task</option>
                      <option value="note">Note</option>
                    </select>

                    <select
                      className="cb-input"
                      value={cardItemByColumn[column.id] ?? ""}
                      onChange={(e) =>
                        setCardItemByColumn((prev) => ({ ...prev, [column.id]: e.target.value }))
                      }
                      disabled={options.length === 0}
                    >
                      <option value="">
                        {options.length === 0
                          ? selectedType === "note"
                            ? "No notes yet"
                            : "No tasks yet"
                          : `Select a ${selectedType}`}
                      </option>
                      {options.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title || item.id}
                        </option>
                      ))}
                    </select>

                    <button
                      className="cb-btn cb-btn-primary"
                      onClick={() => void createCard(column)}
                      disabled={busyColumnId === column.id}
                    >
                      {busyColumnId === column.id ? "Adding…" : "Add card"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
