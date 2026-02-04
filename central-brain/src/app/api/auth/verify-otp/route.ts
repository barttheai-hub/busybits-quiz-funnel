import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAllowedEmail } from "@/lib/auth";
import { getRequestIp, rateLimit } from "@/lib/rateLimit";

async function getInviteId(email: string) {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.from("cb_invites").select("id,accepted_at").eq("email", email).maybeSingle();
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let email = "";
  let token = "";

  try {
    const body = (await req.json()) as { email?: string; token?: string };
    email = String(body.email ?? "").trim();
    token = String(body.token ?? "").trim();
  } catch {
    // ignore
  }

  if (!email || !token) {
    return NextResponse.json({ error: "Missing email or code" }, { status: 400 });
  }

  const ip = getRequestIp(req);
  const limiter = rateLimit({
    key: `verify-otp:${ip}:${email.toLowerCase() || "unknown"}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: limiter.retryAfter },
      { status: 429, headers: { "retry-after": String(limiter.retryAfter) } }
    );
  }

  let invite = null as { id: string; accepted_at: string | null } | null;
  if (!isAllowedEmail(email)) {
    invite = await getInviteId(email);
    if (!invite) return NextResponse.json({ error: "Email not allowed" }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();

  // Support two inputs:
  // 1) numeric code (usually 6-8 digits) -> verifyOtp type=email
  // 2) full magic-link URL pasted from email -> extract token_hash + type=magiclink
  let verifyError: { message: string } | null = null;

  if (token.startsWith("http://") || token.startsWith("https://")) {
    try {
      const url = new URL(token);
      const token_hash = url.searchParams.get("token_hash") || "";
      // Supabase sometimes uses `type=magiclink` or `type=signup` etc
      const typeParam = (url.searchParams.get("type") || "magiclink").toLowerCase();
      const type: "email" | "magiclink" | "signup" | "invite" | "recovery" | "email_change" =
        typeParam === "email" ||
        typeParam === "magiclink" ||
        typeParam === "signup" ||
        typeParam === "invite" ||
        typeParam === "recovery" ||
        typeParam === "email_change"
          ? (typeParam as "email" | "magiclink" | "signup" | "invite" | "recovery" | "email_change")
          : "magiclink";
      if (!token_hash) {
        return NextResponse.json(
          { error: "Invalid link: missing token_hash" },
          { status: 400 }
        );
      }
      const { error } = await supabase.auth.verifyOtp({ email, token_hash, type });
      if (error) verifyError = { message: error.message };
    } catch {
      return NextResponse.json({ error: "Invalid link" }, { status: 400 });
    }
  } else {
    const cleaned = token.replace(/\D/g, "");
    const { error } = await supabase.auth.verifyOtp({ email, token: cleaned, type: "email" });
    if (error) verifyError = { message: error.message };
  }

  if (verifyError) {
    return NextResponse.json(
      { error: `${verifyError.message}. Try pasting the email's Log In link instead of the code.` },
      { status: 400 }
    );
  }
  if (invite && !invite.accepted_at) {
    try {
      const admin = createSupabaseAdminClient();
      await admin.from("cb_invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);
    } catch {
      // ignore
    }
  }
  return NextResponse.json({ ok: true });
}
