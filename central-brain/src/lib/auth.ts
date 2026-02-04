import { env } from "@/lib/env";

function parseEmails(value: string | undefined | null) {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedEmail(email: string) {
  const allowed = parseEmails(env.APP_ALLOWED_EMAILS);
  return allowed.length === 0 ? true : allowed.includes(email.toLowerCase());
}

export function isAdminEmail(email: string) {
  const admins = parseEmails(env.ADMIN_EMAILS);
  return admins.length === 0 ? false : admins.includes(email.toLowerCase());
}
