# Hair Loss Ad Visuals - Midjourney & Motion Prompts

**Objective:** Generate high-fidelity visual assets for the 3 scripted Hair Loss ads.
**Workflow:**
1.  **Generate Base Image (Midjourney):** Use prompts below.
2.  **Animate (Runway Gen-3 / Luma):** Use the Motion prompt.
3.  **Lip Sync (Hedra/HeyGen):** For talking heads.

---

## Ad 1: "The Kink in the Hose" (Metaphor)

### Scene 1: The Green Hose
-   **Midjourney Prompt:** `Close up macro shot of a green garden hose lying on lush grass, the hose has a severe kink blocking the water, high contrast, cinematic lighting, 8k, photorealistic --ar 16:9`
-   **Motion Prompt (Runway):** "Camera zooms in on the kink in the hose. The hose shakes slightly from pressure buildup."

### Scene 2: The Scalp Anatomy (Tension)
-   **Midjourney Prompt:** `3D medical illustration of a human scalp cross-section, transparent skin showing red tense muscles squeezing blue blood vessels, hair follicles above look withered and grey, scientific diagram style, clean white background --ar 16:9`
-   **Motion Prompt:** "The red muscles pulsate and squeeze tighter. The blue vessels shrink."

### Scene 3: Unkinking (Resolution)
-   **Midjourney Prompt:** `Close up of the green garden hose unkinking, powerful burst of water spraying out, the brown grass around it turns instant lush green, magical realism, bright lighting --ar 16:9`
-   **Motion Prompt:** "The hose snaps straight. Water explodes out. The grass turns green rapidly."

---

## Ad 2: "The Pinch Test" (Interactive)

### Scene 1: The Tight Pinch
-   **Midjourney Prompt:** `Extreme close up of a male hand trying to pinch the skin on the top of a bald head, the skin is tight and does not lift, skin texture detail, pores, realistic lighting --ar 9:16`
-   **Motion Prompt:** "The fingers try to pinch the skin but fail. The skin is tight like a drum."

### Scene 2: The Loose Pinch (Comparison)
-   **Midjourney Prompt:** `Extreme close up of fingers pinching the loose skin above the ear, the skin stretches easily, elastic, soft lighting --ar 9:16`
-   **Motion Prompt:** "The fingers easily pinch and pull the skin away from the skull."

### Scene 3: Internal constriction
-   **Midjourney Prompt:** `Conceptual 3D render of a skull with red arrows pushing outwards against the skin from the inside, symbolizing pressure, x-ray style, dark background --ar 9:16`
-   **Motion Prompt:** "The red arrows pulse outwards, pushing against the skin boundary."

---

## Ad 3: "The Barber's Confusion" (Story - Featuring "Mark")

### Character Reference (Mark)
-   **Seed Prompt:** `Portrait of a 32 year old man, short beard, messy dark hair (thick but receding slightly at temples), wearing a grey hoodie, sitting in a car, daylight, shot on iPhone --ar 9:16`
-   **Use `--cref [URL]`** for all shots below.

### Scene 1: The Barber Mirror POV
-   **Midjourney Prompt:** `POV shot looking into a barbershop mirror, a barber stands behind the chair holding scissors looking confused, blurry background, sharp focus on the reflection of the customer (Mark), cinematic lighting --cref [URL] --ar 9:16`
-   **Motion Prompt:** "The barber freezes with scissors in hand, looking at the hair in disbelief."

### Scene 2: Talking Head (Car)
-   **Midjourney Prompt:** `Selfie video angle of Mark sitting in his car, laughing, holding a phone, daylight, authentic UGC style --cref [URL] --ar 9:16`
-   **Motion Prompt:** "He laughs and talks to the camera. Natural head movement."
-   **Lip Sync:** Use Hedra with the ElevenLabs audio.

### Scene 3: Result (Hairline Check)
-   **Midjourney Prompt:** `Close up of Mark tilting his head down to show the top of his head, thick dense hair, studio lighting revealing texture, no bald spot --cref [URL] --ar 9:16`
-   **Motion Prompt:** "He runs his hand through his thick hair, ruffling it to show density."

---

## Technical Notes
-   **Consistency:** Always use `--cref` for Mark.
-   **Aspect Ratio:** Ads 1 & 2 are better as 9:16 (Vertical) for Reels/TikTok, but prompts above include 16:9 for YouTube. Adjust `--ar` as needed.
-   **Voice:** Use ElevenLabs "Adam" for the voiceover.
