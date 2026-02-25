# Hair Loss Funnel - n8n Automation (Full V2 Pipeline)

## Overview
This n8n workflow replaces the manual "Copy-Paste" process for the AI UGC Resource Pack v2. It automates:
1.  **Research:** Scrapes product URL -> Extracts pain points/mechanisms.
2.  **Hooks:** Generates 5 viral hook options.
3.  **Script:** Writes a compliance-aware direct response script.
4.  **Visuals:** Generates Midjourney/Kling prompts for each scene.
5.  **Voice:** Generates ElevenLabs audio.
6.  **Package:** Zips everything into a delivery folder.

## Node Map (Conceptual)

### 1. Trigger (Webhook)
- **Input:** `{ "product_url": "...", "avatar": "...", "offer_name": "..." }`
- **Method:** POST

### 2. Research Agent (Perplexity/OpenAI)
- **Prompt:** "Analyze [URL]. Extract: 1) Core Pain, 2) Unique Mechanism, 3) Old Way vs New Way."
- **Output:** JSON object with research data.

### 3. Hook Generator (OpenAI)
- **Prompt:** "Using [Research], generate 5 hooks based on [Hook Patterns Library]. Output JSON."
- **Output:** Array of 5 hooks.

### 4. Script Writer (OpenAI)
- **Prompt:** "Write a 45s script for Hook #1 using [Direct Response Template]. Ensure NO guarantees. Output JSON with timecodes."
- **Output:** Script object (Audio + Visual description per scene).

### 5. Visual Planner (OpenAI)
- **Prompt:** "Convert script visuals into Midjourney prompts. Use [Visual Consistency Guide]. Output JSON array of prompts."
- **Output:** Array of image prompts.

### 6. Production (Parallel Execution)
- **Branch A (Images):** Http Request -> Midjourney API (Imagine) -> Save to Drive.
- **Branch B (Voice):** Http Request -> ElevenLabs API (Text-to-Speech) -> Save to Drive.

### 7. Delivery (Drive + Slack)
- **Action:** Zip folder -> Get Share Link -> Send to Slack/Email.

## Output Format (The "Assets Manifest")
A single ZIP file containing:
- `research_report.md`
- `hooks.txt`
- `script.json`
- `audio/vo_take_1.mp3`
- `images/scene_1.png`, `images/scene_2.png`...
- `midjourney_prompts.txt` (for manual iteration)
