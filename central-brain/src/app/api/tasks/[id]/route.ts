import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";

const ALLOWED_STATUSES = new Set(["todo", "doing", "done", "blocked"]);
const ALLOWED_ASSIGNEES = new Set(["ziga", "bart"]);
const ALLOWED_RECURRENCE = new Set(["daily", "weekly", "monthly", "yearly"]);

function parsePriority(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 3) return null;
  return parsed;
}

function parseDueAt(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function parseRecurrenceInterval(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return null;
  return parsed;
}

function nextRecurringDue(dueAt: string, rule: string, interval: number) {
  const current = new Date(dueAt);
  if (Number.isNaN(current.getTime())) return null;
  const next = new Date(current);
  switch (rule) {
    case "daily":
      next.setDate(next.getDate() + interval);
      break;
    case "weekly":
      next.setDate(next.getDate() + interval * 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + interval);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + interval);
      break;
    default:
      return null;
  }
  return next.toISOString();
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    title?: string;
    notes?: string | null;
    status?: string;
    priority?: number | string;
    due_at?: string | null;
    board_id?: string | null;
    column_id?: string | null;
    position?: number | string;
    assignee?: string | null;
    recurrence_rule?: string | null;
    recurrence_interval?: number | string | null;
    create_next?: boolean;
  } = {};

  try {
    body = (await req.json()) as typeof body;
  } catch {
    // ignore
  }

  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = String(body.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    updates.title = title;
  }

  if (body.notes !== undefined) {
    const notes = body.notes === null ? null : String(body.notes).trim();
    updates.notes = notes === "" ? null : notes;
  }

  if (body.status !== undefined) {
    const status = String(body.status ?? "").trim();
    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = status;
  }

  if (body.priority !== undefined) {
    const priority = parsePriority(body.priority);
    if (priority === null) return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    updates.priority = priority;
  }

  if (body.due_at !== undefined) {
    const dueAt = parseDueAt(body.due_at);
    if (dueAt === null) return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
    updates.due_at = dueAt ?? null;
  }

  if (body.board_id !== undefined) {
    updates.board_id = body.board_id ? String(body.board_id) : null;
  }

  if (body.column_id !== undefined) {
    updates.column_id = body.column_id ? String(body.column_id) : null;
  }

  if (body.position !== undefined) {
    const position = Number(body.position);
    if (!Number.isInteger(position) || position < 1) {
      return NextResponse.json({ error: "Invalid position" }, { status: 400 });
    }
    updates.position = position;
  }

  if (body.assignee !== undefined) {
    const assignee =
      body.assignee === null || body.assignee === "" ? null : String(body.assignee ?? "").trim();
    if (assignee && !ALLOWED_ASSIGNEES.has(assignee)) {
      return NextResponse.json({ error: "Invalid assignee" }, { status: 400 });
    }
    updates.assignee = assignee;
  }

  if (body.recurrence_rule !== undefined) {
    const rule =
      body.recurrence_rule === null || body.recurrence_rule === ""
        ? null
        : String(body.recurrence_rule ?? "").trim();
    if (rule && !ALLOWED_RECURRENCE.has(rule)) {
      return NextResponse.json({ error: "Invalid recurrence rule" }, { status: 400 });
    }
    updates.recurrence_rule = rule;
  }

  if (body.recurrence_interval !== undefined) {
    const interval = parseRecurrenceInterval(body.recurrence_interval);
    if (interval === null) return NextResponse.json({ error: "Invalid recurrence interval" }, { status: 400 });
    updates.recurrence_interval = interval ?? 1;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("cb_tasks")
    .select(
      "id,title,status,notes,priority,due_at,board_id,column_id,position,assignee,recurrence_rule,recurrence_interval"
    )
    .eq("id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  const effectiveRule =
    updates.recurrence_rule !== undefined ? updates.recurrence_rule : existing?.recurrence_rule ?? null;
  const effectiveDue = updates.due_at !== undefined ? updates.due_at : existing?.due_at ?? null;
  const effectiveInterval =
    updates.recurrence_interval !== undefined ? updates.recurrence_interval : existing?.recurrence_interval ?? 1;

  const nextDue =
    effectiveRule && effectiveDue && body.create_next
      ? nextRecurringDue(String(effectiveDue), String(effectiveRule), Number(effectiveInterval))
      : null;

  if (effectiveRule && !effectiveDue) {
    return NextResponse.json({ error: "Recurring tasks need a due date" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("cb_tasks")
    .update(updates)
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select(
      "id,title,notes,status,priority,due_at,board_id,column_id,position,assignee,recurrence_rule,recurrence_interval,created_at,updated_at"
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const hasNonStatusUpdates = Object.keys(updates).some((key) => key !== "status");
  const statusChanged = updates.status !== undefined && existing?.status !== data.status;

  if (statusChanged) {
    await logActivity(supabase, {
      userId: session.user.id,
      entityType: "task",
      entityId: data.id,
      action: "status_change",
      metadata: { title: data.title, from: existing?.status ?? null, to: data.status },
    });
  }

  if (hasNonStatusUpdates) {
    await logActivity(supabase, {
      userId: session.user.id,
      entityType: "task",
      entityId: data.id,
      action: "update",
      metadata: { title: data.title, status: data.status },
    });
  }

  if (statusChanged && data.status === "done" && nextDue) {
    const { data: positionRows } = await supabase
      .from("cb_tasks")
      .select("position")
      .eq("user_id", session.user.id)
      .eq("column_id", data.column_id)
      .order("position", { ascending: false })
      .limit(1);
    const nextPosition = (positionRows?.[0]?.position ?? 0) + 1;

    const { data: nextTask } = await supabase
      .from("cb_tasks")
      .insert({
        user_id: session.user.id,
        title: data.title,
        notes: data.notes ?? null,
        status: "todo",
        priority: data.priority ?? 2,
        due_at: nextDue,
        board_id: data.board_id ?? null,
        column_id: data.column_id ?? null,
        position: nextPosition,
        assignee: data.assignee ?? null,
        recurrence_rule: data.recurrence_rule ?? null,
        recurrence_interval: data.recurrence_interval ?? 1,
      })
      .select("id,title,status,due_at")
      .single();

    if (nextTask) {
      await logActivity(supabase, {
        userId: session.user.id,
        entityType: "task",
        entityId: nextTask.id,
        action: "recur",
        metadata: { title: nextTask.title, due_at: nextTask.due_at },
      });
    }
  }
  return NextResponse.json({ task: data });
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabase
    .from("cb_tasks")
    .select("id,title,status,board_id,column_id")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  const { error } = await supabase.from("cb_tasks").delete().eq("id", id).eq("user_id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logActivity(supabase, {
    userId: session.user.id,
    entityType: "task",
    entityId: id,
    action: "delete",
    metadata: { title: existing?.title ?? null, status: existing?.status ?? null },
  });
  return NextResponse.json({ ok: true });
}
