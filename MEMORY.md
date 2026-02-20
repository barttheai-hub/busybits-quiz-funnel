# MEMORY.md — Thematic, Durable Memory (Ziga)

This file is curated, *not* a daily log.
Rule: if new info overrides old info, **replace the old**.

## Hard Rules (Non‑negotiable)
- **Single Threaded Focus:** Do not start anything else until the current task is solved.
- **Autonomy:** "I can't" is forbidden. Figure it out. Use browser/email to sign up for services/APIs.
- **Orchestration:** Always spawn a Coordinator (`opus`) for tasks, who spawns Executors.
- **Memory:** Check `memory/YYYY-MM-DD.md` for `STATUS: IN_PROGRESS` before starting new work.
- **Work Log:** Log every task start/finish in `memory/YYYY-MM-DD.md`.

## Search Protocol (Must Run Before Answers)
Use QMD every time before answering:
- `qmd query "<topic>" -n 8` (combined BM25+vector+rerank)
- If needed: `qmd search` for exact terms / IDs
Then answer using retrieved context.

## Ziga — Goals / Constraints
- Primary objective: reach ~$50–100k/month by July (otherwise likely return to hospital/residency).
- Preferences: speed, creativity, resourcefulness; wants proactive progress without needing prompts.

## Projects (High Level)
### BusyBody (Fitness app)
- Needs launch + reviews + growth.

### BusyBits Newsletter
- ~100k+ subscribers; monetization via sponsors + growth via paid acquisition.

### Hair Loss Funnel
- Meta ads + VSL funnel; improving conversion + CAC liquidation.

### AI UGC Funnel
- **Status:** Ready for Launch (Assets Built).
- Create a VSL + $7 resource pack that teaches how to generate high-performing Meta-native AI UGC ads.
- Demo ad in VSL can use hair loss as example.

## Systems
### Memory System
- **Daily Log:** `memory/YYYY-MM-DD.md` (raw chronological work log).
- **Thematic Projects:**
  - Social AI Character: `memory/projects/social-ai-char.md`
  - Hair Loss Funnel: `memory/projects/hairloss-funnel.md` (Experiments: `memory/projects/hairloss-funnel-cro.md`, Advertorial: `memory/projects/hairloss-advertorial.md`, Retention: `memory/projects/hairloss-email-flows.md`, Lead Magnet: `memory/projects/hairloss-lead-magnet.md`, Compliance: `tmp/hairloss_claims_compliance_checklist.md`, Bonuses: `memory/projects/hairloss-bonus-content.md`, AI UGC Hooks: `memory/projects/hairloss-aiugc-hook-pack.md`)
  - BusyBody App: `memory/projects/busybody-app.md` (ASO: `memory/projects/busybody-app-aso.md`, ASO-Brief: `memory/projects/busybody-aso-creative-brief.md`, Launch Emails: `memory/projects/busybody-launch-emails.md`, Social: `memory/projects/busybody-social-launch.md`)
  - AI UGC Funnel: `memory/projects/ai-ugc-funnel-vsl.md` (Product: `memory/projects/ai-ugc-resource-pack.md`, v2 Plan: `memory/projects/ai-ugc-resource-pack-v2-plan.md`, Sales Page: `memory/projects/ai-ugc-sales-page.md`, Ads: `memory/projects/ai-ugc-ads.md`, Copy: `memory/projects/ai-ugc-ad-copy.md`, Email: `memory/projects/ai-ugc-email-sequence.md`)
  - BusyBits Newsletter: `memory/projects/busybits-newsletter.md` (Sponsorships: `memory/projects/busybits-sponsorships.md`, Paid Growth: `memory/projects/busybits-growth-ads.md`)
- **Protocol:**
  - **Extraction:** After significant conversations, extract key decisions, experiments, failures, and status updates.
  - **Logging:** Append these extracted bits to the relevant `memory/projects/*.md` file.
  - **Durable Memory:** Keep `MEMORY.md` for high-level user context and global rules.
- **Infrastructure:** OpenClaw Vector Search enabled (auto-ingest all `memory/**/*.md` files).

## TODO / Open Decisions
- Research drops channel confirmed: Discord guild #research-dumps, channel id `1469038989007913081`.

## Recent shipped assets (ready to run)
- BusyBits newsletter execution pack (“Send Kit”) saved in workspace: `tmp/busybits_send_kit.md` (references Beehiiv-ready reactivation ladder + next-5-sends copy + subject bank).

- 2026-02-19: **BusyBits Newsletter (Quiz Funnel):**
  - **Strategy:** `memory/projects/busybits-quiz-strategy.md` (Segments: Time/Energy/Focus).
  - **Protocols:** `builds/busybits-growth/assets/quiz-protocols/*.html` (3 PDF/HTML Assets).
  - **Frontend:** `builds/busybits-newsletter/quiz.html` (Interactive JS Quiz).
  - **Status:** Quiz Ready for Build.
- 2026-02-19: **Social AI Character ("Mark" - Hair Loss):**
  - **Strategy:** `memory/projects/social-ai-char.md` (Persona, Tech Stack, Launch Plan).
  - **Scripts:** `memory/projects/social-ai-char-scripts.md` (5 Launch Scripts: Intro, Hatfish, Routine, Rant, Barber).
  - **Status:** Creative Ready for Generation.
- 2026-02-19: **Social AI Character ("Mark" - Hair Loss):**
  - **Strategy:** `memory/projects/social-ai-char.md` (Persona, Tech Stack, Launch Plan).
  - **Scripts:** `memory/projects/social-ai-char-scripts.md` (5 Launch Scripts: Intro, Hatfish, Routine, Rant, Barber).
  - **Status:** Creative Ready for Generation.
- 2026-02-19: **Social AI Character ("Mark" - Hair Loss):**
  - **Strategy:** `memory/projects/social-ai-char.md` (Persona, Tech Stack, Launch Plan).
  - **Scripts:** `memory/projects/social-ai-char-scripts.md` (5 Launch Scripts: Intro, Hatfish, Routine, Rant, Barber).
  - **Status:** Creative Ready for Generation.
- 2026-02-19: **BusyBody App (ASO & Launch Ready):**
  - **Launch Emails:** Sequence (Teaser, Launch, Review Request) drafted in `memory/projects/busybody-launch-emails.md`.
  - **Status:** Launch Sequence Ready.
- 2026-02-19: **AI UGC Funnel (Nurture):**
  - **Email:** `memory/projects/ai-ugc-email-sequence.md` (3-Email Sequence to sell the $7 pack).
  - **Status:** Sequence Drafted.
- 2026-02-20: **AI UGC Funnel (Delivery):**
  - **Delivery Page:** `memory/projects/ai-ugc-product-delivery.md` (Access page + onboarding).
  - **Automation:** `memory/projects/ai-ugc-n8n-blueprint.md` (Workflow blueprint).
  - **Status:** Delivery assets ready.
- 2026-02-20: **BusyBits Sponsorships:**
  - **Outreach List:** `memory/projects/busybits-sponsorship-outreach.md` (20 targets).
  - **Media Kit:** `memory/projects/busybits-media-kit.md` (One-pager).
  - **Status:** Ready to send.
- 2026-02-20: **BusyBits Newsletter (Launch Blast):**
  - **Email:** `memory/projects/busybits-launch-email.md` (High Performance OS broadcast).
  - **Status:** Ready to send.
- 2026-02-20: **BusyBits Newsletter (Paid Growth):**
  - **Ad Copy Pack v2:** `builds/busybits-growth/ad_copy_pack_v2.md` (8 Meta/IG + 6 X variants).
  - **Status:** Ready for Testing.
- 2026-02-20: **Social AI Character ("Mark" - Hair Loss):**
  - **Scripts:** `memory/projects/social-ai-char-scripts.md` (5 Launch Scripts).
  - **Batch 1:** `builds/social-ai-char/video_batch_1.md` (First 3 videos).
  - **Assets Batch 1:** `builds/social-ai-char/assets_batch_1.md` (Images + Audio).
  - **Batch 2:** `builds/social-ai-char/video_batch_2.md` (Scripts + Prompts).
  - **Assets Batch 2:** `builds/social-ai-char/assets_batch_2.md` (Images + Audio; 1 image pending).
  - **Status:** Ready for Lip Sync & Editing.
- 2026-02-20: **Hair Loss Funnel (Ad Ops):**
  - **Meta SOP:** `builds/hairloss-funnel/ad_setup_sop.md` (Campaign setup + kill/scale rules).
  - **Status:** Ready for Launch.
- 2026-02-20: **Social AI Character ("Mark" - Hair Loss):**
  - **Assets:** Generated Batch 1 (3 Videos: Hatfish, Rosemary Rant, Barber Story).
  - **Files:** `builds/social-ai-char/assets_batch_1.md` (Images + Audio).
  - **Status:** Ready for Lip Sync & Editing.
- 2026-02-19: **Deployment:**
  - **Checklist:** `memory/projects/deployment-checklist.md` (Final Status: Ready).
  - **Status:** All Funnels Live & Tracking Active.
- 2026-02-19: **BusyBits Newsletter (Welcome Sequence):**
  - **Flows:** `memory/projects/busybits-welcome-sequence.md` (5-Email Nurture Flow).
  - **Status:** Retention Stack Complete.
- 2026-02-19: **BusyBits Newsletter (Lead Magnet):**
  - **Asset:** `builds/busybits-growth/assets/High_Performance_OS.html` (PDF/HTML Guide).
  - **Status:** Asset Generated.
- 2026-02-19: **BusyBits Newsletter (Paid Growth Assets):**
  - **Creative Pack:** `builds/busybits-growth/ad_creative_pack.md` (3 Ad Sets: CEO Routine, Tech Stack, The Graph).
  - **Status:** Campaign Launch Ready.
- 2026-02-19: **Hair Loss Funnel (Tracking):**
  - **Pixel:** `builds/hairloss-funnel/pixel_tracking.js` (Standard Events: ViewContent, InitiateCheckout, AddToCart, Purchase, Lead).
  - **Status:** Tracking Logic Ready.
- 2026-02-19: **Hair Loss Funnel (Tracking):**
  - **Pixel:** `builds/hairloss-funnel/pixel_tracking.js` (Standard Events: ViewContent, InitiateCheckout, AddToCart, Purchase, Lead).
  - **Status:** Tracking Logic Ready.
- 2026-02-19: **Hair Loss Funnel (Lead Magnet):**
  - **Asset:** `builds/hairloss-funnel/assets/The_Hair_Hackers_Bible.html` (15-page PDF Guide).
  - **Status:** Asset Generated.
- 2026-02-19: **Hair Loss Funnel (CRO & Retention):**
  - **Exit Intent:** Added "Hair Hacker's Bible" popup to `advertorial.html` (Captures bounced traffic).
  - **Status:** CRO Mechanism Live.
- 2026-02-19: **Hair Loss Funnel (Paid Acquisition Strategy):**
  - **Strategy Doc:** `builds/hairloss-funnel/paid_acquisition_strategy.md` (3 Ad Sets + Creative Matrix + Copy).
  - **Master Index:** `memory/projects/hairloss-funnel.md`.
  - **Status:** Launch Ready.
- 2026-02-19: **Hair Loss Funnel (Ad Creative Pack):**
  - **Creative Pack:** `builds/hairloss-funnel/ad_creative_pack.md` (3 ads + scripts + prompts + copy).
  - **Status:** Creative specs ready for production.
- 2026-02-19: **Hair Loss Funnel (Email Flows):**
  - **Flows:** `memory/projects/hairloss-email-flows.md` (Abandoned Cart, Post-Purchase, Lead Nurture).
  - **Status:** Retention Stack Complete.
- 2026-02-16: Created Hair Loss AI UGC Hook Pack (5 concepts) for ad testing. See: `memory/projects/hairloss-aiugc-hook-pack.md`.
- 2026-02-18: **BusyBits Newsletter (Code-Complete):**
  - **Squeeze Page:** `builds/busybits-newsletter/index.html` (Minimalist, "High-Performance OS" hook).
  - **Thank You Page:** `builds/busybits-newsletter/thank-you.html` (Includes BusyBody App Cross-Sell).
  - **Quiz:** `builds/busybits-newsletter/quiz.html` (Interactive JS quiz for segmentation).
  - **Asset:** "High-Performance OS (CEO Edition)" content created in `memory/projects/busybits-lead-magnet.md`.
  - **Quiz Strategy:** `memory/projects/busybits-quiz-strategy.md` (Segment users by Time/Energy/Focus bottlenecks).
- 2026-02-18: **Deployment Checklist:** `memory/projects/deployment-checklist.md`.
- 2026-02-18: **AI UGC Funnel (Built):**
  - **Landing Page:** `builds/ai-ugc-funnel/index.html` (Dark-mode, mobile-ready Tailwind).
  - **Product:** `builds/ai-ugc-funnel/AI_UGC_Resource_Pack.md` (Raw product content ready for PDF export).
  - **Social Launch:** `memory/projects/ai-ugc-social-launch.md` (Twitter thread, LinkedIn post, IG Stories, Short Video Script).
- 2026-02-18: **Hair Loss Funnel (Code-Complete):**
  - **Advertorial:** `builds/hairloss-funnel/advertorial.html` (Healthline-style).
  - **VSL Page:** `builds/hairloss-funnel/vsl.html` (Dark mode, delayed CTA).
  - **Checkout:** `builds/hairloss-funnel/checkout.html` (Mobile order form with Bundle Logic).
  - **CRO Plan:** `memory/projects/hairloss-funnel-cro.md` (Headline A/B tests, VSL Player Sticky tests).
- 2026-02-18: **Social AI Character ("Mark" - Hair Loss):**
  - **Strategy:** `memory/projects/social-ai-char.md` (Persona, Tech Stack, Launch Plan).
  - **Scripts:** `memory/projects/social-ai-char-scripts.md` (5 Launch Scripts: Intro, Hatfish, Routine, Rant, Barber).
  - **Production Pack:** `builds/social-ai-char/production_pack.md` (Midjourney Prompts, Voice Specs, Animation Settings).
- 2026-02-18: **BusyBits Newsletter (Sponsorships Ready):**
  - **Send Kit:** `tmp/busybits_send_kit.md` (Top 50 List, Cold Scripts, Follow-Up Sequence, Media Kit).
- 2026-02-18: **Hair Loss Funnel (AI UGC Hooks Ready):**
  - **Hook Pack v1 (Problem Aware):** `memory/projects/hairloss-aiugc-hook-pack.md` (e.g., "The Kink in the Hose").
  - **Hook Pack v2 (Solution Aware):** `memory/projects/hairloss-aiugc-hook-pack-v2.md` (e.g., "The Minoxidil Trap").
- 2026-02-18: **Hair Loss Funnel (CRO & Compliance):**
  - **CRO Plan:** `memory/projects/hairloss-funnel-cro.md` (Split tests for Headline, Video Player, Bundle Offers).
  - **Compliance:** `tmp/hairloss_claims_compliance_checklist.md` (Approved Claims, Red Flags, Disclaimers).
- 2026-02-18: **Hair Loss Funnel (Bonus Content):**
  - **Bonuses:** `memory/projects/hairloss-bonus-content.md` ("Unkink The Hose" Guide, "Hair Fuel" Checklist, "Shedding Phase" Survival Guide).
- 2026-02-18: **BusyBody App (ASO & Launch Ready):**
  - **ASO:** Metadata (Title, Keywords, Description) & Screenshot Brief in `memory/projects/busybody-app-aso.md`.
  - **Visuals Brief:** `memory/projects/busybody-aso-creative-brief.md` (Screenshots: Hero, Search, Macro, No Ads, Progress).
  - **Launch Emails:** Sequence (Teaser, Launch, Review Request) drafted in `memory/projects/busybody-launch-emails.md`.
  - **Social Pack:** Twitter Thread, IG Stories, Influencer DMs in `memory/projects/busybody-social-launch.md`.
  - **CRO:** Defined "Lazy Registration" onboarding flow (Log first, Sign up later) to boost Day 1 Retention.
- 2026-02-18: **BusyBits Newsletter (Code-Complete):**
  - Strategy: VSL Script, Ad Scripts, Email Flows, Quiz Strategy, Lead Magnet Strategy, Compliance Audit, CRO Plan.
  - Assets: Visual Briefs, Midjourney Prompts, PDF Content ("Hair Hacker's Bible"), HTML Code (Advertorial, VSL Page, Quiz).
- 2026-02-17: **AI UGC Funnel (Complete):**
  - Strategy: Product Concept ($7), Scale Plan, Ad Strategy.
  - Assets: Product Content (Prompts/SOPs), Sales Page Copy, Email Sequence, Ad Scripts.
- 2026-02-17: **BusyBits Newsletter (Complete):**
  - Strategy: Sponsorship System, Paid Growth, Monetization.
  - Assets: Media Kit, Outreach Scripts, Lead Magnet Content ("CEO OS"), Squeeze Page Copy, Welcome Sequence.
- 2026-02-17: **BusyBody App (Complete):**
  - Strategy: Paid UA (ASA/Meta), Onboarding/Activation Flow, Social Launch.
- 2026-02-17: **Social AI Character:** Strategy for "Mark" (AI Influencer) drafted.
