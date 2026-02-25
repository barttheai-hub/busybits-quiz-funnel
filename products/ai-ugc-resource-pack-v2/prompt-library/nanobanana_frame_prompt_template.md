# Midjourney "Seed Character" System

## Step 1: Generate the Base Character
Run this 4-5 times until you get the perfect "Face".

**Prompt:**
`portrait of a [Age] year old [Gender], [Ethnicity], [Hair Color/Style], wearing [Clothing], [Location] background, soft studio lighting, shot on 35mm, realistic texture, 8k --ar 16:9 --style raw`

**Action:**
1.  Upscale your favorite.
2.  Copy its Image URL.
3.  This is your `[SEED_URL]`.

---

## Step 2: Consistent Scene Generation
Use the `--cref` (Character Reference) tag to lock the face.

**Prompt Template:**
`[Action Description], [Camera Angle], [Lighting] --cref [SEED_URL] --cw 100 --ar 9:16 --style raw`

### Parameters Explained:
- `--cref`: The face to copy.
- `--cw 100`: Locks face AND outfit (High consistency).
- `--cw 0`: Locks face ONLY (Allows outfit change).
- `--ar 9:16`: Vertical video format.
- `--style raw`: Reduces "AI art" look, increases realism.

---

## Step 3: Scene Library (Copy Paste)

### Selfie (Holding Phone)
`holding iphone, taking a selfie video in mirror, [Location] background, phone screen visible, realistic hand --ar 9:16`

### Product Application
`close up macro shot of hand applying [Product Texture] to [Body Part], depth of field, high detail --ar 9:16`

### The "Reaction"
`looking into bathroom mirror, shocked happy expression, mouth open, touching face, bathroom lighting --ar 9:16`

### The "Walking" Shot
`walking down city street, holding coffee, looking at camera, sunny day, motion blur background --ar 9:16`

### The "Laptop" Shot
`sitting at desk, typing on laptop, focus on face, office background, evening lighting --ar 9:16`
