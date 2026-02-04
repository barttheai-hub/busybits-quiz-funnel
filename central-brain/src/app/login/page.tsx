import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) redirect("/tasks");

  return <LoginClient />;
}
