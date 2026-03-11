# ACTIVE TASKS – STATE MACHINE

*Single Source of Truth for Autonomous Work*

## Rules
1.  **Single Active Task:** Only ONE task can be `In Progress` at a time.
2.  **DoD is Law:** A task is not done until the `DoD` is met AND the `Test Plan` passes.
3.  **Archive on Done:** When a task is `Done`, move it to `memory/tasks-archive/YYYY-MM.md`.

## Current Tasks (Priority Order)

### 1. Build Meta Ads Creative Generator Tool (Local) ✅ DONE
- **Status:** Done
- **Started:** 2026-03-10
- **Completed:** 2026-03-10
- **Goal:** Build a CLI/web tool that generates Meta ad creative variations (headlines, body copy, CTAs) for Hair Loss and AI UGC funnels
- **DoD:**
  1. ✅ Tool accepts input: product name, hook angle, target audience
  2. ✅ Generates 5 headline variations (compliant with Meta policies)
  3. ✅ Generates 3 body copy variations (different lengths: short/medium/long)
  4. ✅ Generates 3 CTA variations
  5. ✅ Outputs formatted for direct use in Meta Ads Manager
  6. ✅ Includes compliance check for restricted claims (health/fitness)
- **Test Plan:**
  1. ✅ Run tool with "Hair Loss" + "Problem Aware" angle → verify 5 headlines generated
  2. ✅ Run tool with "AI UGC" + "Solution Aware" angle → verify copy variations output
  3. ✅ Check compliance filter → verify "cure" or "guarantee" flags as risky
  4. ✅ Verify output format is copy-paste ready for Meta Ads
- **Evidence:**
  - Tool location: `tools/ad-creative-generator/`
  - Test results: 7/7 passed
  - Sample output: `tools/ad-creative-generator/output/ad-creative-aiugc-1773159351308.json`
  - Usage: `node bin/generate.js --product="hairloss" --angle="problem-aware"`
- **Assets Created:**
  - `tools/ad-creative-generator/bin/generate.js` (CLI entry point)
  - `tools/ad-creative-generator/lib/compliance.js` (Red flag checker)
  - `tools/ad-creative-generator/templates/index.js` (Hook templates)
  - `tools/ad-creative-generator/test/test.js` (Test suite)

### 2. Deploy BusyBits Quiz Funnel (GitHub Pages FREE) 🔄 IN PROGRESS
- **Status:** In Progress
- **Started:** 2026-03-11
- **RetryCount:** 0
- **Goal:** Deploy quiz funnel to GitHub Pages (free, no CC required) to drive newsletter signups
- **DoD:**
  1. ✅ Quiz.html ready for static hosting (no server-side requirements)
  2. GitHub repo created/updated for Pages deployment
  3. Protocol pages (Time/Energy/Focus) included
  4. Beehiiv integration via client-side redirect + UTM params
  5. End-to-end signup test passes
- **Test Plan:**
  1. Navigate to GitHub Pages URL → page loads <2s
  2. Complete quiz flow → results page displays correctly
  3. Click signup → Beehiiv form opens with bottleneck UTM param
  4. Submit email → subscriber tagged in Beehiiv
  5. Verify segmentation → UTM parameter captured
- **Assets to Deploy:**
  - `builds/busybits-newsletter/quiz.html` (Main quiz interface)
  - `builds/busybits-newsletter/assets/quiz-protocols/` (3 upsell pages: Time/Energy/Focus)
  - GitHub Pages config (`_config.yml` or `.github/workflows/pages.yml`)
- **Next Step:** Create GitHub repo, modify quiz for Beehiiv redirect integration, push to gh-pages branch
- **Blocker:** None (GitHub Pages is free, uses existing git auth)

### 2. Launch AI UGC Funnel to Production
- **Status:** Blocked:CC
- **Started:** 2026-03-09
- **RetryCount:** 0
- **Goal:** Deploy the AI UGC $7 resource pack funnel to a live payment-enabled environment
- **DoD:**
  1. Landing page deployed to Netlify/Vercel with custom domain
  2. Stripe payment integration active (Buy Button/Checkout)
  3. Product delivery automation working (n8n or Gumroad)
  4. End-to-end purchase test completed successfully
  5. Tracking pixels firing (Meta Pixel, Google Analytics)
- **Test Plan:**
  1. Navigate to live URL → page loads <2s
  2. Click "Get Access" → Stripe checkout loads
  3. Complete test purchase → receipt received
  4. Check delivery → Resource pack delivered via email
  5. Verify tracking → Pixel events firing in Meta Events Manager
- **Assets to Deploy:**
  - `builds/ai-ugc-funnel/index.html` (Landing page)
  - `builds/ai-ugc-funnel/AI_UGC_Resource_Pack.md` (Product content)
  - `memory/projects/ai-ugc-product-delivery.md` (Delivery page spec)
  - `memory/projects/ai-ugc-n8n-blueprint.md` (Automation workflow)
- **Next Step:** Set up Stripe product + pricing, then deploy landing page to Netlify
- **Blocker:** Requires credit card for Stripe account. Awaiting Ziga approval/CC.

### 4. Build Sponsorship Outreach CRM Tool (Local) ✅ DONE
- **Status:** Done
- **Started:** 2026-03-10
- **Completed:** 2026-03-10
- **Goal:** Build a CLI tool to manage BusyBits newsletter sponsor outreach, track conversations, and automate follow-ups
- **DoD:**
  1. ✅ JSON-based CRM for sponsor companies (status, contact info, last contact date)
  2. ✅ Email template generator with personalization placeholders
  3. ✅ Follow-up reminder system (tracks sent emails, suggests next touch)
  4. ✅ Pipeline view (Prospect → Contacted → Negotiating → Closed → Live)
  5. ✅ Import existing sponsor list from `tmp/busybits_send_kit.md`
  6. ✅ Export ready-to-send email copy for each prospect
- **Test Plan:**
  1. ✅ Import top 5 sponsors → 5 sponsors loaded (Eight Sleep, Oura, Whoop, Levels, Apollo)
  2. ✅ Generate cold outreach email for Oura → personalization works (first name, company, hook)
  3. ✅ Mark follow-up sent → reminder auto-scheduled for +7 days
  4. ✅ Move sponsor through pipeline stages → status updates persist
  5. ✅ Export all pending follow-ups → actionable list generated
- **Evidence:**
  - Tool location: `tools/sponsorship-crm/`
  - Test results: 10/10 passed
  - Usage: `node bin/crm.js list` to view sponsors, `node bin/crm.js export` for ready-to-send emails
- **Assets Created:**
  - `bin/crm.js` (CLI entry point)
  - `lib/crm.js` (CRM data operations)
  - `lib/templates.js` (Email template engine)
  - `data/sponsors.json` (5 Tier 1 Health Tech sponsors imported)
  - `test/test.js` (10-test validation suite)

### 5. Build Email Sequence Generator Tool (Local) ✅ DONE
- **Status:** Done
- **Started:** 2026-03-10
- **Completed:** 2026-03-11
- **Goal:** Build a CLI tool that generates complete email sequences for BusyBits newsletter (welcome, nurture, reactivation)
- **DoD:**
  1. ✅ Generate 5-email welcome sequence for new subscribers
  2. ✅ Generate 3-email reactivation sequence for inactive subscribers
  3. ✅ Generate quiz-nurture sequence for quiz completers (Time/Energy/Focus variants)
  4. ✅ Personalization placeholders (first_name, signup_date, bottleneck_type)
  5. ✅ Beehiiv-compatible HTML output
  6. ✅ Subject line A/B test variants generated
- **Test Plan:**
  1. ✅ Run tool for "welcome" sequence → 5 emails generated with correct timing logic
  2. ✅ Run tool for "reactivation" → 3 emails with escalating urgency
  3. ✅ Run tool for "quiz-nurture" + Time bottleneck → personalized content
  4. ✅ Verify HTML output renders correctly in email preview
  5. ✅ Check all personalization placeholders are properly formatted
- **Evidence:**
  - Tool location: `tools/email-sequence-generator/`
  - Test results: 10/10 passed
  - Sample outputs: `tools/email-sequence-generator/output/welcome-sequence.html`
  - Usage: `node bin/generate.js --type=welcome --output=./emails.html`
- **Assets Created:**
  - `bin/generate.js` (CLI entry point)
  - `lib/templates.js` (Welcome, Reactivation, Quiz-Nurture templates)
  - `lib/generator.js` (HTML/JSON/Markdown formatters)
  - `lib/validator.js` (Input validation)
  - `test/test.js` (10-test validation suite)
