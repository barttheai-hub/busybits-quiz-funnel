# Deployment Guide: BusyBits Quiz Funnel

## 1. Hosting
This is a static site (HTML/JS/CSS). You can host it anywhere.
- **Netlify:** Drag and drop the `builds/busybits-newsletter` folder.
- **Vercel:** Connect GitHub repo, set root to this folder.
- **GitHub Pages:** Push to `gh-pages` branch.

## 2. Lead Magnet Delivery (Now Instant + Fail-Open)
The lead magnet is delivered directly on `thank-you.html` so conversions are not blocked by email/webhook outages.

### Configure in `index.html`
- `WEBHOOK_URL` (optional) — paste your n8n/Make/Zapier endpoint to push subscribers into Beehiiv.
- If left empty, the flow still works: user is redirected to `thank-you.html` and gets immediate PDF access.

### Configure in `thank-you.html`
- `ASSET_URL` — set this to your final hosted PDF URL.
  - Default currently points to `assets/High_Performance_OS_CEO_Edition.pdf` (already included in this folder).

## 3. Optional Webhook Payload
When configured, `index.html` sends this JSON (with attribution fields when present in URL params):

```json
{
  "email": "user@example.com",
  "source": "busybits_lead_magnet_v1",
  "timestamp": "2026-02-24T10:00:00.000Z",
  "page_url": "https://yourdomain.com/?utm_source=meta&utm_campaign=quiz",
  "referrer": "https://m.facebook.com/",
  "utm_source": "meta",
  "utm_medium": "paid_social",
  "utm_campaign": "quiz",
  "utm_content": "video_1",
  "utm_term": "founder_sleep"
}
```

`thank-you.html` also preserves UTM params on the PDF download URL for cleaner ad-platform attribution.

## 4. Automation Workflow (n8n/Make)
1. **Trigger:** Webhook (receive JSON).
2. **Action:** Beehiiv API -> Create/Update Subscriber.
   - Email: `{{email}}`
   - Tag: `lead-magnet-hpos`
   - Source field: `busybits_lead_magnet_v1`
3. **Action (Optional):** Add to welcome automation sequence.

## 5. Result Pages
- Main opt-in page: `index.html`
- Confirmation + instant asset page: `thank-you.html`
- Quiz + segmented assets (optional):
  - `quiz.html`
  - `assets/quiz-protocols/Time_Protocol.html`
  - `assets/quiz-protocols/Energy_Protocol.html`
  - `assets/quiz-protocols/Focus_Protocol.html`

## 6. Launch QA
- Submit test email from desktop + mobile.
- Confirm redirect to `thank-you.html`.
- Confirm PDF opens from Download button.
- If webhook configured, confirm subscriber appears in Beehiiv.
