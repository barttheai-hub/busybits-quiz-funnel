# 03 — Visual Consistency Guide (AI Character Continuity)

## Goal
Keep the same actor identity, vibe, and framing across every generated scene.

## Seed Character Method
1. Generate a base portrait with stable attributes:
   - age range
   - hairstyle
   - wardrobe
   - lighting style
   - camera style
2. Save reference image URL.
3. Reuse this reference for every scene prompt.
4. Lock identity strongly (`--cw 100` in Midjourney-style workflows).

## Base Prompt Template
`photo of a [age] year old [gender], [hair], [facial details], wearing [outfit], [emotion], natural bathroom lighting, authentic UGC smartphone style --ar 9:16`

## Scene Prompt Templates
- **Problem Scene:**
  `[character] noticing [problem] in mirror, concerned expression, handheld smartphone framing, natural indoor lighting --cref [URL] --cw 100 --ar 9:16`

- **Application Scene:**
  `close up hands applying [product] to [area], clean texture detail, realistic skin/hair detail, vertical UGC framing --ar 9:16`

- **Result Scene:**
  `[character] reacting positively after [timeframe], confident expression, same bathroom environment --cref [URL] --cw 100 --ar 9:16`

## Quality control checklist
- Face matches base reference
- Outfit continuity makes sense
- Lighting is natural (avoid over-CGI look)
- First 2 seconds visually clear on mobile
