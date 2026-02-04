import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/auth";
import { env } from "@/lib/env";

const ALLOWED_ROLES = new Set(["user", "admin"]);

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email ?? "";
  if (!isAdminEmail(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Admin service unavailable" }, { status: 503 });
  }
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("cb_invites")
    .select("id,email,role,created_at,accepted_at,created_by")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ invites: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = session.user.email ?? "";
  if (!isAdminEmail(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let payload: { email?: string; role?: string } = {};
  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    // ignore
  }

  const inviteEmail = String(payload.email ?? "").trim().toLowerCase();
  const role = String(payload.role ?? "user").trim().toLowerCase();

  if (!inviteEmail) return NextResponse.json({ error: "Email is required" }, { status: 400 });
  if (!ALLOWED_ROLES.has(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Admin service unavailable" }, { status: 503 });
  }
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("cb_invites")
    .insert({
      email: inviteEmail,
      role,
      created_by: session.user.id,
    })
    .select("id,email,role,created_at,accepted_at,created_by")
    .single();

  if (error) {
    if (error.message.toLowerCase().includes("duplicate")) {
      return NextResponse.json({ error: "Invite already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ invite: data });
}
