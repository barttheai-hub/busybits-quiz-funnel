import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAllowedEmail } from "@/lib/auth";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";

async function isInvitedEmail(email: string) {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.from("cb_invites").select("id").eq("email", email).maybeSingle();
    if (error) return false;
    return Boolean(data);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  let email = "";
  try {
    const body = (await req.json()) as { email?: string };
    email = String(body.email ?? "").trim();
  } catch {
    // ignore
  }

  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const ip = getRequestIp(req);
  const limiter = rateLimit({
    key: `send-otp:${ip}:${email.toLowerCase() || "unknown"}`,
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: limiter.retryAfter },
      { status: 429, headers: { "retry-after": String(limiter.retryAfter) } }
    );
  }

  if (!isAllowedEmail(email)) {
    const invited = await isInvitedEmail(email);
    if (!invited) return NextResponse.json({ error: "Email not allowed" }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  // NOTE: Omitting emailRedirectTo makes Supabase send a code (OTP) rather than a magic link.
  const { error } = await supabase.auth.signInWithOtp({ email });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
