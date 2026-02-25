# AI UGC Resource Pack v2 - Prompt Library

This folder contains the copy-paste system prompts referenced in the n8n workflows.

---

## 1. Hook Generator Library
**File:** `prompts/hook_generator_library_20_patterns.md`

### Pattern 1: The "3 Mistakes"
"Stop doing [Common Action]. It's killing your [Desired Result]. Here are the 3 mistakes most people make..."

### Pattern 2: The "I Fired Them"
"I just fired my [Service Provider]. Here is why..."

### Pattern 3: The "Green Screen" Roast
"Look at this [Competitor Product]. It’s garbage because [Reason]. Here is what you should use instead..."

### Pattern 4: The "Us vs Them"
"Left side: [Old Way] ($$$ + Slow). Right side: [New Way] ($ + Fast)."

*(... 16 more patterns included in full file)*

---

## 2. Script Writer (Direct Response)
**File:** `prompts/script_prompt_hairloss_compliance_aware.md`

**Role:** Direct Response Copywriter
**Task:** Write a 45s video script.
**Constraints:**
- **No** "Guarantees" (Meta Policy).
- **No** "Before/After" assertions (e.g., "You will grow hair in 2 days").
- **Focus** on "Mechanism" and "User Experience".

**Structure:**
- 0-3s: Hook (Visual + Audio).
- 3-12s: Agitate the "Old Way" (Pain).
- 12-25s: Introduce "The Mechanism" (Logic).
- 25-35s: Social Proof / Results.
- 35-45s: CTA (Hard close).

---

## 3. Visual Consistency (Midjourney)
**File:** `prompts/nanobanana_frame_prompt_template.md`

**Master Prompt:**
`[Action Description], [Camera Angle], [Lighting] --cref [SEED_IMAGE_URL] --cw 100 --ar 9:16 --style raw --v 6.0`

**Scene Types:**
- **Selfie Mode:** `holding phone, pov, selfie angle, messy room background`.
- **Product Shot:** `close up hands holding product, macro lens, depth of field`.
- **Reaction:** `looking in mirror, surprised face, bathroom lighting`.

---

## 4. Voiceover Direction (ElevenLabs)
**File:** `prompts/elevenlabs_vo_direction_prompt.md`

**Settings:**
- Stability: 35%
- Similarity: 80%
- Style Exaggeration: 10%

**Tone Instructions:**
- "Read this like you are whispering a secret to a friend."
- "Read this with urgent energy, like you just discovered something."
- "Read this with authority, calm and deep."
