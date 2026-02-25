# BusyBits Quiz Funnel - Deployment Checklist (Pre-Flight)

**Status:** Code Complete & Tested Locally.

## 1. Hosting (Netlify/Vercel)
- [ ] Drag & Drop `builds/busybits-newsletter` to Netlify.
- [ ] Verify `index.html` loads cleanly.
- [ ] Verify `quiz.html` loads cleanly.
- [ ] Click through to all 3 protocols (`Time_Protocol.html`, etc).

## 2. Webhook Configuration
- [ ] Create `POST` Webhook in n8n/Zapier/Make.
- [ ] Update `WEBHOOK_URL` in `quiz.html` (Line ~123).
- [ ] **TEST:** Submit the form with a test email (`test@test.com`).
- [ ] Verify payload received: `{email, segment, source, timestamp}`.

## 3. Email Service Provider (Beehiiv)
- [ ] Create Custom Field: `bottleneck` (Text).
- [ ] Create Tags: `quiz-time`, `quiz-energy`, `quiz-focus`.
- [ ] **Automation:** Ensure Webhook -> Beehiiv adds the correct tag.

## 4. Analytics (Meta Pixel)
- [ ] Add Pixel Base Code to `<head>` of `quiz.html`.
- [ ] Add `fbq('track', 'ViewContent');` to `quiz.html`.
- [ ] Add `fbq('track', 'Lead');` inside `submitQuiz()` function (Success block).
- [ ] Verify events with "Meta Pixel Helper" chrome extension.

## 5. Mobile QA
- [ ] Open on iPhone (Safari).
- [ ] Open on Android (Chrome).
- [ ] Check button sizes (finger tap targets).
- [ ] Check keyboard overlap on email input.

## 6. Launch
- [ ] Update Instagram Bio Link.
- [ ] Update Twitter Bio Link.
- [ ] Turn on Meta Ads (Ad Set 1: Silent Killer).
