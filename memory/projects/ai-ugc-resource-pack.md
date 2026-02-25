# AI UGC Resource Pack ($7 Offer) - Content Assets
**Status:** BUILT (2026-02-18)
**Assets:**
-   **Landing Page:** `builds/ai-ugc-funnel/index.html`
-   **Product:** `builds/ai-ugc-funnel/AI_UGC_Resource_Pack.md`

## 1. Research Agent Prompt (System Prompt)
**Goal:** Analyze a product and generate 5 viral hooks based on competitor angles and deep psychological triggers.

```markdown
# Role
You are a Direct Response Marketing Researcher with 10 years of experience in Meta/TikTok creative strategy.

# Input
- Product Name: {{product_name}}
- Target Audience: {{target_audience}}
- Main Benefit: {{main_benefit}}
- Competitor/Reference URL (optional): {{url}}

# Task
Analyze the input and generate 5 distinct video ad hooks.
Each hook must target a specific "Unaware" or "Problem Aware" state.

# Hook Frameworks to Use:
1.  **The "Us vs Them" Split:** "Stop using [Competitor Mechanism]. It [Negative Side Effect]."
2.  **The "Secret" Reveal:** "The industry doesn't want you to know about [Mechanism]."
3.  **The "Visual Proof" (Demo):** "Watch what happens when I apply [Product] to [Problem Area]."
4.  **The "Skeptic" Angle:** "I thought this was a scam until [Specific Result]."
5.  **The "Life Hack":** "If you have [Problem], you need to try this [Timeframe] hack."

# Output Format
For each hook, provide:
- **Headline:** The text on screen (max 5 words).
- **Visual Concept:** What is happening in the first 3 seconds? (Be specific).
- **First Line of Audio:** What the voiceover says immediately.
- **Psychological Trigger:** Why this stops the scroll (e.g., Fear, Greed, Curiosity, Vanity).
```

---

## 2. Direct Response Script Template (The "Golden Thread")
**Goal:** A fill-in-the-blank structure that ensures every ad hits the necessary persuasion points.

### Structure
**Scene 1: The Pattern Interrupt (0:00-0:03)**
*   **Visual:** High contrast, movement, or something weird.
*   **Audio:** A controversial statement or a direct question to the viewer's pain.
*   **Text Overlay:** Big, bold claim.

**Scene 2: The Agitation (0:03-0:10)**
*   **Visual:** Show the problem in high definition (e.g., messy room, thinning hair, slow computer).
*   **Audio:** "You've tried [Old Solution A] and [Old Solution B], but they just [Failure Point]."
*   **Feeling:** Frustration.

**Scene 3: The Mechanism (0:10-0:20)**
*   **Visual:** Introduce the product. Show it being used clearly.
*   **Audio:** "That's why [Product Name] is different. It uses [Unique Mechanism] to [Core Benefit] without [Common Objection]."
*   **Logic:** This is the "Aha!" moment.

**Scene 4: The Proof (0:20-0:35)**
*   **Visual:** Time-lapse, before/after, or a "live" test.
*   **Audio:** "Just look at these results. In [Timeframe], I went from [Bad State] to [Good State]."
*   **Social Proof:** "Over [Number] people are already using this."

**Scene 5: The CTA (0:35-0:45)**
*   **Visual:** Product shot with a "Shop Now" button graphic or arrow.
*   **Audio:** "If you want to [Benefit], click the link below and try it risk-free for [Guarantee Period]."
*   **Urgency:** "Stock is limited" / "Discount ending soon" (Optional).

---

## 3. Visual Consistency Guide (Mini-SOP)
**Goal:** Keep AI characters looking the same across different generated scenes.

1.  **Seed Selection:** Always start with a high-quality "Base Image" of your character.
2.  **Seed Locking:** In your AI tool (Midjourney/Runway/Pika), use the `--cref` (Character Reference) tag pointing to your Base Image URL.
    *   *Example:* `--cref [URL]` `--cw 100` (Character Weight 100 for maximum likeness).
3.  **Prompt Structure:** Keep the character description identical in every prompt.
    *   *Bad:* "A man running."
    *   *Good:* "[Character Name], 30 year old male, short beard, blue t-shirt, running in a park."
4.  **Lighting Match:** Define lighting in every prompt (e.g., "Natural sunlight, soft shadows").
5.  **Motion Control:** Use low motion settings (1-3) for talking heads to avoid facial distortion. Use high motion (5-7) for B-roll where the face is less visible.

---

## 4. n8n Workflow Logic (Conceptual)
**Trigger:** User submits a form with "Product URL" + "Target Audience".

**Node 1: Scrape & Summarize**
*   **Tool:** HTTP Request (GET) -> HTML to Markdown -> LLM Summarize.
*   **Output:** Key benefits, pain points, pricing.

**Node 2: Hook Generation**
*   **Tool:** LLM (Claude/GPT).
*   **Input:** Summary from Node 1 + "Research Agent Prompt".
*   **Output:** 5 JSON objects (Hooks).

**Node 3: Script Writing**
*   **Tool:** LLM.
*   **Input:** Selected Hook + "Direct Response Script Template".
*   **Output:** Full script with timestamps and visual cues.

**Node 4: Asset Generation (Optional/Advanced)**
*   **Tool:** Image Gen API (DALL-E 3 / Midjourney) for storyboard frames.
*   **Tool:** Voice Gen API (ElevenLabs) for VO.

**Output:** Deliver a Google Doc or Notion Page with the Strategy & Script.
