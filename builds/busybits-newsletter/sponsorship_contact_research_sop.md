# BusyBits Sponsorship Contact Research SOP (45-min Sprint)

## Goal
Turn the outreach tracker into verified partner contacts fast so sponsorship emails can be sent same-day.

## Input
- `builds/busybits-newsletter/sponsorship_contact_research_queue.csv`

## Output columns to fill
- `contact_name`
- `contact_email`
- `source_url`
- `notes`
- `status` (`Verified` or `No Contact Found`)

## Workflow (per company, ~1 min each)
1. Open `linkedin_search_url` and identify likely role owner (Partnerships/Growth/Marketing).
2. Open `sponsorship_search_url` and check official partner/sponsor page.
3. Open `email_search_url` and find publicly listed partnerships inbox.
4. Fill best contact and source link in the CSV.
5. Mark row `Verified` when deliverable.

## Prioritization
1. Do all `P1` first.
2. Then `P2`.
3. Leave `P3` for second pass.

## Handoff
After research pass:
- Filter CSV by `status=Verified`
- Move verified contacts into send queue
- Start outreach with template mapped in `sponsorship_outreach_tracker.csv`
