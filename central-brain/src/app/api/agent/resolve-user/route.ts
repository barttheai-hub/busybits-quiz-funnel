import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAgentKey } from "@/app/api/agent/_auth";
import { env } from "@/lib/env";

function parseAllowedEmails(s?: string) {
  return (s || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(req: Request) {
  const auth = requireAgentKey(req);
  if (auth) return auth;

  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const allowed = new Set([...parseAllowedEmails(env.APP_ALLOWED_EMAILS), ...parseAllowedEmails(env.ADMIN_EMAILS)]);
  if (allowed.size > 0 && !allowed.has(email)) {
    return NextResponse.json({ error: "Email not allowed" }, { status: 403 });
  }

  try {
    const supabase = createSupabaseAdminClient();

    // supabase-js versions differ; use listUsers and match email.
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000, page: 1 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const user = data?.users?.find((u) => (u.email || "").toLowerCase() === email);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ userId: user.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
