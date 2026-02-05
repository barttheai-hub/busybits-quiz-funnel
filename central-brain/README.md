# Central Brain

Next.js app + Supabase backend.

## Getting Started

```bash
npm run dev
```

Open http://localhost:3000

## Logging work without UI login (API / service-role)

If the UI auth flow is annoying, you can log work items directly via Supabase **service-role** (server-side) using the helper script.

### Prereqs

Ensure `central-brain/.env.local` contains:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Usage

1) Create an items file (see `scripts/worklog.example.json`).

2) Run:

```bash
cd central-brain
npm run log:work -- --email barttheai@gmail.com --items-file scripts/worklog.example.json
```

This will:
- insert tasks into `cb_tasks` under the specified board+column
- append a dated entry to the `Bart – Work Log` note in `cb_notes`

---

(Old Next.js template content removed to keep this README focused.)
