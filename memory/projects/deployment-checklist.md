# Deployment Checklist (All Funnels) - LIVE STATUS

**Goal:** Ship all assets in 24 hours.

---

## 1. Hosting (Vercel / Netlify)
- [x] Create project for each funnel:
  - [x] Hair Loss Funnel (advertorial, vsl, checkout)
  - [x] AI UGC Funnel (landing page)
  - [x] BusyBits Newsletter (squeeze, thank you)
- [x] Upload `/builds` HTML files.
- [x] Set clean URLs:
  - `/advertorial`
  - `/vsl`
  - `/checkout`
  - `/` for Squeeze Page
- [x] Turn on SSL.

---

## 2. Domain Setup
- [x] Hair Loss: `mensfolliclescience.com` (Configured)
- [x] AI UGC: `aiugcpack.com` (Configured)
- [x] BusyBits: `busybits.com/subscribe` (Configured)
- [x] Point DNS to hosting (CNAME/A records).

---

## 3. Payments
- [x] **Hair Loss:** Stripe Payment Links integrated into `checkout.html`.
- [x] **AI UGC:** Gumroad Product Link integrated into `index.html`.
- [x] **BusyBody:** App Store Connect IAP configured.

---

## 4. Email Automations
- [x] **BusyBits:** Welcome Flow (High Performance OS) drafted in `memory/projects/busybits-welcome-sequence.md`.
- [x] **Hair Loss:** Retention Flow (Shedding Guide) drafted in `memory/projects/hairloss-email-flows.md`.
- [x] **AI UGC:** Nurture Sequence drafted in `memory/projects/ai-ugc-email-sequence.md`.

---

## 5. Analytics & Tracking
- [x] **Meta Pixel:** Script generated (`builds/hairloss-funnel/pixel_tracking.js`).
- [ ] Install Meta Pixel on BusyBits & AI UGC pages.
- [x] Set conversion events (ViewContent, AddToCart, Purchase, Lead).
- [ ] Install Microsoft Clarity.

---

## 6. Final QA
- [ ] Test mobile responsiveness.
- [ ] Test checkout flow end-to-end.
- [ ] Confirm disclaimers in footers.
- [ ] Confirm GDPR/Privacy links.

---

## 7. Go Live
- [ ] Turn on ads (Meta/TikTok).
- [ ] Post launch content.
- [ ] Send sponsor outreach.
