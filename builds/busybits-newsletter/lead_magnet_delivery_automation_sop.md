# BusyBits Lead Magnet Delivery Automation SOP

## Goal
Ensure every signup gets immediate on-page download + backup email delivery, even when webhook endpoint is temporarily down.

## What changed in `index.html`
- Supports runtime webhook injection via:
  - `?webhook=https://...` query param
  - `window.BUSYBITS_WEBHOOK_URL`
  - `localStorage.busybits_webhook_url`
  - hardcoded `STATIC_WEBHOOK_URL`
- Failed webhook submissions are queued in `localStorage` (`busybits_pending_leads`) and retried automatically on next page load.
- Thank-you page now reflects real delivery state (`webhook-ok`, `queued-retry`, `download-only`).

## Recommended n8n flow
1. **Webhook (POST)**
2. **IF email exists + valid regex**
3. **Beehiiv node**: add/subscribe user with source + attribution fields
4. **Email node (Resend/SMTP)**: send backup email with lead magnet link
5. **Respond** with `200 {"ok":true}`

## Payload fields sent
- `email`
- `source`
- `timestamp`
- `page_url`
- `referrer`
- Attribution keys: `utm_*`, `fbclid`, `gclid`, `ttclid`, first/last touch metadata

## Fast deploy
- Set webhook via query param while testing:
  - `https://<site>/index.html?webhook=https://<n8n-webhook-url>`
- Once validated, move URL to `window.BUSYBITS_WEBHOOK_URL` in hosting config or hardcode `STATIC_WEBHOOK_URL`.

## Validation checklist
- Submit test email with webhook online -> thank-you shows backup email confirmation
- Disable webhook temporarily -> thank-you shows queued retry
- Re-open page with webhook restored -> queue flushes automatically
