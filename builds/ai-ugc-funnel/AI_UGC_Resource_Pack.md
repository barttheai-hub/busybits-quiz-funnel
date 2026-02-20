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
*(Note: This is a placeholder for the actual JSON export file)*

**Nodes Included:**
1.  **Webhook:** Receives Product URL.
2.  **HTTP Request:** Scrapes page text.
3.  **OpenAI (GPT-4o):** Generates Research & Script.
4.  **Midjourney (API):** Generates Scenes (optional integration).
5.  **ElevenLabs:** Generates Voiceover.
6.  **Email:** Sends assets to user.

---

## Bonus: The "3-Minute" Ad Editor Checklist (CapCut)
1.  **Import:** Drag all AI clips + Voiceover into timeline.
2.  **Pacing:** Trim every clip to 2-4 seconds max. No lingering.
3.  **Captions:** Auto-generate captions. Font: "The Bold Font". Color: Yellow/White.
4.  **Music:** Add trending "Phonk" or Lo-Fi track at 10% volume.
5.  **Export:** 1080p, 30fps.
