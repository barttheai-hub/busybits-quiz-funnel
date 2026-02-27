# AI UGC Resource Pack - Product Content (v1)

**Format:** Digital Download (PDF + JSON + Notion Link).
**Price:** $7.
**Hosting:** Gumroad / Stripe.

---

## Part 1: The "Research Agent" (Prompt)
**Usage:** Copy/Paste into ChatGPT or Claude.
**Goal:** Generate 5 viral hooks from any product URL.

### The Prompt:
`Role: You are a world-class Direct Response Copywriter and Creative Strategist for Meta Ads.
Task: Analyze the product found at [INSERT URL].
Output: Identify the top 3 "Pain Points" and top 3 "Desires" of the target avatar.
Then, generate 5 "Scroll-Stopping" Video Hooks (0-3 seconds).
Constraints:
- Hooks must be visual or controversial.
- Use simple, 5th-grade language.
- Format as a table: | Hook Name | Visual Description | Audio Script |`

---

## Part 2: The "Direct Response" Script Template
**Structure:** The "PAS + P" Framework (Problem, Agitation, Solution, Proof).

### The Template:
**0:00 - 0:03 (Pattern Interrupt):**
[Visual of the #1 symptom or a weird mechanism]
Audio: "Stop [Action] if you want [Result]."

**0:03 - 0:10 (Agitation):**
[Visual of the struggle]
Audio: "Most people think [Common Belief], but actually [Truth]. That's why you're still [Pain Point]."

**0:10 - 0:25 (The Mechanism/Solution):**
[Visual of the Product in action]
Audio: "This is [Product Name]. It uses [Unique Mechanism] to fix [Root Cause] in just [Timeframe]."

**0:25 - 0:35 (Social Proof):**
[Visual of Results / Testimonial]
Audio: "I used it for [Time] and [Specific Result]. Just look at this."

**0:35 - 0:45 (CTA):**
[Visual of Offer]
Audio: "Try it risk-free for [Guarantee]. Link below."

---

## Part 3: The "Visual Consistency" SOP
**Goal:** Keep AI characters looking the same across multiple shots.

### The Secret: Seed Images & CREF
1.  **Generate your "Base Character" first.**
    *Prompt:* `Portrait of a [Age] year old [Gender], [Ethnicity], [Hair Style], wearing [Clothing], neutral background, cinematic lighting --ar 9:16`
2.  **Get the URL of that image.**
3.  **Use `--cref` (Character Reference) in Midjourney.**
    *New Prompt:* `[Action Scene Description] --cref [URL_OF_BASE_IMAGE] --cw 100 --ar 9:16`
    *(Note: `--cw 100` keeps the face/clothes identical. Use `--cw 0` to change clothes but keep face.)*

---

## Part 4: The n8n Workflow (JSON)
**File Included:** `ai_ugc_pipeline.json`
**How to Import:**
1.  Open your [n8n](https://n8n.io) instance.
2.  Go to **Workflows** > **Import from File**.
3.  Select the `ai_ugc_pipeline.json` file included in this pack.
4.  **Connect Your Accounts:**
    *   **OpenAI:** Add your API Key.
    *   **Google Sheets:** Authenticate and create a sheet with columns: `Date`, `Product URL`, `Hooks`, `Script`.
    *   **Email (SMTP):** Add your SMTP credentials (or use Gmail node).
5.  **Activate:** Turn the workflow switch to "Active".
6.  **Test:** Send a POST request to your webhook URL with `{ "url": "https://example.com", "email": "you@example.com" }`.

**Workflow Logic:**
1.  **Webhook:** Receives Product URL + Email.
2.  **Scraper:** Fetches page content.
3.  **AI Analyst (GPT-4o):** Extracts Pain Points & Desires.
4.  **Script Writer (GPT-4o):** Generates 5 Hooks + 1 Full Script.
5.  **Logger:** Saves data to Google Sheets.
6.  **Delivery:** Emails the scripts to you instantly.

---

## Bonus: The "3-Minute" Ad Editor Checklist (CapCut)
1.  **Import:** Drag all AI clips + Voiceover into timeline.
2.  **Pacing:** Trim every clip to 2-4 seconds max. No lingering.
3.  **Captions:** Auto-generate captions. Font: "The Bold Font". Color: Yellow/White.
4.  **Music:** Add trending "Phonk" or Lo-Fi track at 10% volume.
5.  **Export:** 1080p, 30fps.
