import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 520 }}>
      <h1>Login</h1>
      {session ? (
        <p>Logged in as {session.user.email}</p>
      ) : (
        <form action="/auth/magiclink" method="post" style={{ display: "grid", gap: 12 }}>
          <label>
            Email
            <input
              name="email"
              type="email"
              required
              style={{ width: "100%", padding: 10, marginTop: 6 }}
              placeholder="you@example.com"
            />
          </label>
          <button type="submit" style={{ padding: 10 }}>Send magic link</button>
          <p style={{ opacity: 0.8, fontSize: 14 }}>
            This will send you a sign-in link (Supabase Auth). Only whitelisted emails will be allowed.
          </p>
        </form>
      )}
    </main>
  );
}
