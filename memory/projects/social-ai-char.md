# Social AI Character Strategy (Project: "Mark")

**Objective:** Create a consistent, relatable AI influencer to be the "Face" of the Hair Loss brand on TikTok/Instagram Reels.
**Goal:** Drive organic traffic to the VSL funnel without constant paid ad spend.
**Target Audience:** Men 25-45, suffering from hair loss, skeptical of "salesy" ads.

---

## 1. The Persona: "Mark"
**Backstory:**
Mark is a 32-year-old software engineer (or architect) living in a city.
He started losing his hair at 26. Tried everything. Almost got a transplant.
Then he found the "Dormancy Protocol" (Peptides).
Now he documents his "journey" (even though he's AI, the story is based on real customer data).

**Vibe:**
-   Relatable, not a model.
-   Slightly cynical/funny about the hair loss industry.
-   "Bro to Bro" advice. No medical jargon.

**Visual Identity (Midjourney):**
-   **Prompt:** `Portrait of a 32 year old man, short beard, messy dark hair (thick but receding slightly at temples), wearing a grey hoodie, sitting in a modern apartment, soft lighting, shot on 35mm --ar 9:16`
-   **Consistency:** Use `--cref` (Character Reference) with a master "Seed Image" to keep his face identical across every video.

**Voice (ElevenLabs):**
-   **Model:** "Adam" or "Antony" (Deep, calm, slightly raspy).
-   **Tone:** Conversational. Not "Announcer Voice". Use pauses (`...`) and hesitations (`um`, `like`) in the script to sound real.

---

## 2. Content Pillars (The "Content Matrix")

### Pillar A: "The Struggle" (Relatability)
*Skits about the pain of losing hair.*
-   **Concept:** "Windy Day Anxiety" (Mark holding his hat).
-   **Concept:** "The Barber Chair Sweat" (Dreading the mirror).
-   **Concept:** "Dating App Photos" (Hatfishing vs Reality).

### Pillar B: "The Experiment" (Process)
*Documenting the regrowth journey (simulated).*
-   **Concept:** "Day 1 vs Day 30 vs Day 90" (Time-lapse).
-   **Concept:** "My Morning Routine" (Massage -> Serum -> Coffee).
-   **Concept:** "The Pinch Test" (Teaching the audience how to check tension).

### Pillar C: "Myth Busting" (Education)
*Reacting to bad advice.*
-   **Concept:** Duet with a "Rosemary Oil" video. "Stop putting salad dressing on your head."
-   **Concept:** Reacting to "Turkish Hair Transplant" horror stories. "Why I cancelled my flight to Istanbul."

---

## 3. Tech Stack & Workflow (SOP)

### Step 1: Scripting (Claude/GPT)
-   Input: Viral Hook + Educational Point.
-   Output: 30-second script with visual cues.

### Step 2: Visual Generation (Midjourney/Runway)
-   **A-Roll (Talking Head):** Generate Mark looking at camera. Animate with **HeyGen** or **Hedra** (Lip Sync).
-   **B-Roll (Action):** Generate Mark applying serum, walking, working. Use **Runway Gen-3** or **Luma Dream Machine** for motion.

### Step 3: Audio (ElevenLabs)
-   Generate VO. Add background noise (coffee shop, street) to make it sound "in the wild", not studio.

### Step 4: Editing (CapCut)
-   Stitch A-Roll + B-Roll.
-   Add "Alex Hormozi style" captions (yellow/white, bold).
-   Add trending audio (low volume).

---

## 4. Launch Plan (The "Blitz")
**Week 1:**
-   Post 3x/day.
-   Focus on Pillar A (Relatability) to build an audience.
-   No hard selling. Just "I found something that works."

**Week 2:**
-   Introduce Pillar B (The Solution).
-   Link in Bio: "The Protocol I Use" (Direct to VSL).
-   Start replying to comments with video replies.

**KPIs:**
-   **Views:** 10k/video avg.
-   **Engagement:** Comments asking "What is it?" (This is the buy signal).
-   **CTR:** 1% Click-through to VSL.

## 5. Assets & Progress (2026-02-20)
**Batch 1 (Launch Videos):**
-   **Status:** Scripts, Voiceover (TTS), and Base Images Generated.
-   **Asset Location:** `builds/social-ai-char/assets_batch_1.md`
-   **Content:**
    1.  **Hatfish Confession** (Identity/Relatability)
    2.  **Rosemary Oil Rant** (Myth Busting)
    3.  **Barber Story** (Social Proof)
-   **Next:** Run Lip Sync (Hedra/Runway) -> Edit -> Post.

## 6. Batch 2 (2026-02-20)
**Scripts + Prompts:** `builds/social-ai-char/video_batch_2.md`
**Assets:** `builds/social-ai-char/assets_batch_2.md`
**Status:** Images + Audio generated (1 image pending due to quota).
**Next:** Generate missing clean image for Video 4; lip sync + edit.
