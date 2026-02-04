import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { title?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // ignore
  }

  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const { data: last } = await supabase
    .from("cb_kanban_columns")
    .select("position")
    .eq("user_id", session.user.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (last?.position ?? 0) + 1;

  const { data, error } = await supabase
    .from("cb_kanban_columns")
    .insert({ user_id: session.user.id, title, position })
    .select("id,title,position,created_at,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ column: data });
}
