import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  GMAIL_CLIENT_ID: z.string().optional(),
  GMAIL_CLIENT_SECRET: z.string().optional(),
  GMAIL_REDIRECT_URI: z.string().url().optional(),
  APP_ALLOWED_EMAILS: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  AGENT_API_KEY: z.string().min(20).optional(),
});

export const env = schema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET,
  GMAIL_REDIRECT_URI: process.env.GMAIL_REDIRECT_URI,
  APP_ALLOWED_EMAILS: process.env.APP_ALLOWED_EMAILS,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  AGENT_API_KEY: process.env.AGENT_API_KEY,
});
