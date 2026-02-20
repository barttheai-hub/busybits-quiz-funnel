# Social AI Character ("Mark") - Production Asset Pack (v1.0)

## Overview
**Character:** Mark (32, Software Engineer, Hair Loss Journey).
**Platform:** TikTok / IG Reels.
**Goal:** Consistent visual/audio identity across 100+ videos.

---

## 1. Visual Prompts (Midjourney v6.1)

### The "Master" Character (Seed Image)
**Prompt:** `Portrait of a 32 year old man named Mark, friendly but skeptical expression, short beard, messy dark hair with slight recession at temples, wearing a grey hoodie, sitting in a modern minimalist apartment with natural window light, shot on 35mm film, Kodak Portra 400, high texture --ar 9:16 --stylize 250`
**Usage:** Generate 1 perfect image. Use its URL as `--cref` for everything else.

### Scene: The Car (Confessionals)
**Prompt:** `A 32 year old man wearing a baseball cap sitting in the driver's seat of a parked car, looking at the camera nervously, daytime, natural lighting coming through windshield, shot on iPhone style --cref [URL] --cw 100 --ar 9:16`

### Scene: The Bathroom (Routine)
**Prompt:** `A 32 year old man standing in a modern bathroom looking in the mirror, holding a small glass dropper bottle, applying serum to his hairline, cinematic lighting, shot on 35mm --cref [URL] --cw 100 --ar 9:16`

### Scene: The Gym (Lifestyle)
**Prompt:** `A 32 year old man at the gym, wearing workout clothes, sweating slightly, drinking water, gym background blurred, neon lights --cref [URL] --cw 0 --ar 9:16`
*(Note: `--cw 0` changes his outfit but keeps his face).*

---

## 2. Voice Specifications (ElevenLabs)

**Voice ID:** `Adam` (Premade) or `Antony` (Premade).
**Settings:**
-   **Stability:** 45% (Allows for more emotional range/inflection).
-   **Similarity:** 80% (Keeps the tone consistent).
-   **Style Exaggeration:** 15% (Slightly punchy for social media).
-   **Speaker Boost:** ON.

**Audio Engineering SOP:**
1.  Generate VO.
2.  Import to CapCut.
3.  Add **"Room Tone"** (Sound effect: "Quiet Apartment" or "Car Interior" at 10% volume).
4.  This makes the AI voice sound recorded in a real space, not a vacuum.

---

## 3. Animation Settings (Hedra / HeyGen)

**Tool:** Hedra (Better for expressive talking heads).
**Input:** Midjourney Image + ElevenLabs Audio.
**Aspect Ratio:** 9:16 (Vertical).
**Emotion Setting:** "Conversational" (Not "News Anchor").
**Zoom:** 1.1x (Add a slow zoom in CapCut, not in generation, for higher quality).

---

## 4. Editing Style Guide (CapCut)

**Captions:**
-   **Font:** "The Bold Font" or "Komika Axis".
-   **Color:** Yellow text with black stroke (Hex: #FFD700).
-   **Animation:** Pop-in word by word.
-   **Position:** Center screen (Safe Zone).

**Music:**
-   **Educational:** "Lofi Study" (Volume: 10%).
-   **Skit/Stress:** "Phonk" or "Vine Boom" (Volume: 15%).

**Pacing:**
-   Cut dead air.
-   Change visual every 3-5 seconds (Zoom, B-roll, or Text Overlay).
-   Loop the end back to the start if possible.
