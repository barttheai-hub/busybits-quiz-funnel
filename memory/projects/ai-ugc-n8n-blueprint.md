# AI UGC Resource Pack - Blueprint for n8n Automation

**Goal:** Provide the exact logic for the JSON file included in the pack.
**Platform:** n8n (Self-hosted or Cloud).

---

## Workflow Overview
**Trigger:** Webhook (Receive `product_url`).
**Output:** A structured Google Doc with Hooks, Scripts, and Visual Prompts.

---

## Nodes Configuration

### 1. Webhook (Start)
-   **Method:** POST
-   **Path:** `/generate-ad`
-   **Input:** `{ "url": "https://..." }`

### 2. HTTP Request (Scraper)
-   **Method:** GET
-   **URL:** `{{json.body.url}}`
-   **Output:** HTML (Text).

### 3. HTML to Text (Parser)
-   **Operation:** Strip HTML tags.
-   **Limit:** 2000 words (Context window optimization).

### 4. OpenAI (Research Agent)
-   **Model:** GPT-4o
-   **System Prompt:** "You are a direct response copywriter. Analyze this product page. Extract: USP, Pain Points, Target Audience. Output JSON."
-   **User Prompt:** `{{json.text}}`

### 5. OpenAI (Script Writer)
-   **Model:** GPT-4o
-   **System Prompt:** "Create 3 video ad scripts using the 'PAS' framework based on this analysis."
-   **Input:** Output from Node 4.

### 6. OpenAI (Visual Prompt Generator)
-   **Model:** GPT-4o
-   **System Prompt:** "Convert these scripts into Midjourney Prompts. Use the following format: `[Scene Description] --ar 9:16 --style raw`."

### 7. Google Docs (Deliverable)
-   **Operation:** Create Document.
-   **Content:**
    -   **Research:** Pain Points / USP.
    -   **Hooks:** 5 Video Hooks.
    -   **Scripts:** 3 Full Scripts.
    -   **Prompts:** Image Generation Prompts.

### 8. Email (Notification)
-   **To:** User Email.
-   **Subject:** Your AI Ad Brief is ready.
-   **Body:** "Click here to view your brief: {{google_doc_link}}"

---

## JSON Export (Placeholder)
*(This structure is used to build the actual .json file)*
`{ "nodes": [ ... ], "connections": { ... } }`
