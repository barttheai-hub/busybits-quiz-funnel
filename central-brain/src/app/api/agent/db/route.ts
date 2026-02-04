import { NextResponse } from "next/server";
import { requireAgentKey } from "@/app/api/agent/_auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TABLES = new Set([
  "cb_tasks",
  "cb_notes",
  "cb_boards",
  "cb_board_columns",
  "cb_task_note_links",
  "cb_activity_log",
  "cb_kanban_columns",
  "cb_kanban_cards",
  "cb_invites",
]);

type DbOp =
  | { op: "select"; table: string; columns?: string; match?: Record<string, unknown>; limit?: number; order?: { column: string; ascending?: boolean } }
  | { op: "insert"; table: string; values: Record<string, unknown> | Record<string, unknown>[]; columns?: string }
  | { op: "update"; table: string; values: Record<string, unknown>; match: Record<string, unknown>; columns?: string }
  | { op: "delete"; table: string; match: Record<string, unknown>; columns?: string };

export async function POST(req: Request) {
  const auth = requireAgentKey(req);
  if (auth) return auth;

  const body = (await req.json().catch(() => null)) as DbOp | null;
  if (!body) return NextResponse.json({ error: "Missing JSON body" }, { status: 400 });

  if (!ALLOWED_TABLES.has(body.table)) {
    return NextResponse.json({ error: `Table not allowed: ${body.table}` }, { status: 403 });
  }

  try {
    const supabase = createSupabaseAdminClient();

    if (body.op === "select") {
      let q = supabase.from(body.table).select(body.columns || "*");
      if (body.match) q = q.match(body.match);
      if (body.order) q = q.order(body.order.column, { ascending: body.order.ascending ?? true });
      if (body.limit) q = q.limit(body.limit);
      const { data, error } = await q;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    if (body.op === "insert") {
      const { data, error } = await supabase.from(body.table).insert(body.values).select(body.columns || "*");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    if (body.op === "update") {
      const { data, error } = await supabase
        .from(body.table)
        .update(body.values)
        .match(body.match)
        .select(body.columns || "*");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    if (body.op === "delete") {
      const { data, error } = await supabase
        .from(body.table)
        .delete()
        .match(body.match)
        .select(body.columns || "*");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: "Invalid op" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
