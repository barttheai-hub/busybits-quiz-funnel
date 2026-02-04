import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";
import { ensureDefaultBoard } from "@/lib/boards";

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

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const boardId = req.nextUrl.searchParams.get("board_id");
  let query = supabase
    .from("cb_tasks")
    .select("id,title,notes,status,priority,due_at,board_id,column_id,position,assignee,recurrence_rule,recurrence_interval,created_at,updated_at")
    .eq("user_id", session.user.id)
    .order("position", { ascending: true });

  if (boardId) {
    query = query.eq("board_id", boardId);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getRequestIp(req);
  const limiter = rateLimit({
    key: `tasks-post:${session.user.id || ip}`,
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: limiter.retryAfter },
      { status: 429, headers: { "retry-after": String(limiter.retryAfter) } }
    );
  }

  let body: {
    title?: string;
    notes?: string | null;
    status?: string;
    priority?: number | string;
    due_at?: string | null;
    board_id?: string | null;
    column_id?: string | null;
    assignee?: string | null;
    recurrence_rule?: string | null;
    recurrence_interval?: number | string | null;
  } = {};

  try {
    body = (await req.json()) as typeof body;
  } catch {
    // ignore
  }

  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const status = body.status ? String(body.status).trim() : undefined;
  if (status && !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const priority = parsePriority(body.priority);
  if (priority === null) return NextResponse.json({ error: "Invalid priority" }, { status: 400 });

  const dueAt = parseDueAt(body.due_at);
  if (dueAt === null) return NextResponse.json({ error: "Invalid due date" }, { status: 400 });

  const assignee = body.assignee === null || body.assignee === undefined ? undefined : String(body.assignee).trim();
  if (assignee && !ALLOWED_ASSIGNEES.has(assignee)) {
    return NextResponse.json({ error: "Invalid assignee" }, { status: 400 });
  }

  const recurrenceRule =
    body.recurrence_rule === null || body.recurrence_rule === undefined
      ? undefined
      : String(body.recurrence_rule).trim();
  if (recurrenceRule && !ALLOWED_RECURRENCE.has(recurrenceRule)) {
    return NextResponse.json({ error: "Invalid recurrence rule" }, { status: 400 });
  }

  const recurrenceInterval = parseRecurrenceInterval(body.recurrence_interval);
  if (recurrenceInterval === null) {
    return NextResponse.json({ error: "Invalid recurrence interval" }, { status: 400 });
  }

  if (recurrenceRule && !dueAt) {
    return NextResponse.json({ error: "Recurring tasks need a due date" }, { status: 400 });
  }

  // Cast to any here to avoid TS "excessively deep" instantiation from Supabase's complex generics.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { boards, defaultBoard, columns } = await ensureDefaultBoard(supabase as any, session.user.id);
  const boardId = body.board_id ?? defaultBoard?.id ?? boards[0]?.id ?? null;

  let columnId = body.column_id ?? null;
  if (!columnId && boardId) {
    const { data: boardColumns } = await supabase
      .from("cb_board_columns")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("board_id", boardId)
      .order("position", { ascending: true })
      .limit(1);
    columnId = boardColumns?.[0]?.id ?? columns?.[0]?.id ?? null;
  }

  let position = 1;
  if (columnId) {
    const { data: rows } = await supabase
      .from("cb_tasks")
      .select("position")
      .eq("user_id", session.user.id)
      .eq("column_id", columnId)
      .order("position", { ascending: false })
      .limit(1);
    position = (rows?.[0]?.position ?? 0) + 1;
  }

  const { data, error } = await supabase
    .from("cb_tasks")
    .insert({
      user_id: session.user.id,
      title,
      notes: body.notes ?? null,
      status: status ?? undefined,
      priority: priority ?? undefined,
      due_at: dueAt ?? undefined,
      board_id: boardId,
      column_id: columnId,
      position,
      assignee: assignee ?? undefined,
      recurrence_rule: recurrenceRule ?? undefined,
      recurrence_interval: recurrenceInterval ?? undefined,
    })
    .select("id,title,notes,status,priority,due_at,board_id,column_id,position,assignee,recurrence_rule,recurrence_interval,created_at,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logActivity(supabase, {
    userId: session.user.id,
    entityType: "task",
    entityId: data.id,
    action: "create",
    metadata: { title: data.title, status: data.status },
  });
  return NextResponse.json({ task: data });
}
