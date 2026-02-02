import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

function isAllowedEmail(email: string) {
  const allowed = (env.APP_ALLOWED_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return allowed.length === 0 ? true : allowed.includes(email.toLowerCase());
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return NextResponse.redirect(new URL("/login", req.url));

  if (!isAllowedEmail(email)) {
    return new NextResponse("Email not allowed.", { status: 403 });
  }

  const supabase = createSupabaseServerClient();
  const origin = new URL(req.url).origin;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.redirect(new URL("/login?sent=1", req.url));
}
