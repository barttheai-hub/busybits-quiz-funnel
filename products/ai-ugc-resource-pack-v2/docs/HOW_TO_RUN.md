# How to Run the AI UGC Pipeline

## Prerequisites
1.  **n8n Account:** Self-hosted or Cloud.
2.  **API Keys Required:**
    *   OpenAI (GPT-4)
    *   Midjourney (via API wrapper like userapi.ai or similar)
    *   Kling AI
    *   ElevenLabs
    *   Google Drive (Service Account)
    *   Slack (Bot Token)

## Step-by-Step Setup

### 1. Import Workflows
1.  Open n8n Dashboard.
2.  Click "Import from File".
3.  Select all 8 `.json` files from the `workflows/` folder.
4.  Activate them.

### 2. Configure Credentials
1.  Go to `Credentials` tab in n8n.
2.  Create credentials for each service listed above.
3.  Open each workflow node and select your new credential.

### 3. Set Up Google Drive
1.  Create a root folder named `AI_UGC_Projects`.
2.  Copy its `Folder ID` (from the URL).
3.  Paste this ID into the "Save to Drive" nodes in Workflows 04, 05, 06, and 07.

### 4. Running Your First Ad
1.  **Trigger:** Send a POST request to the Webhook URL of `01_Generate_Angle_and_Hook`.
    *   Body: `{"product_url": "https://your-product.com", "avatar": "Men 30-45"}`
2.  **Monitor:** Watch the execution in n8n.
3.  **Review:** Check your Google Sheet for generated Hooks.
4.  **Proceed:** Select a hook and trigger Workflow `02` manually (or automate the handoff).

## Troubleshooting
*   **Midjourney Timeout:** Increase the timeout setting on the HTTP Request node to 300s.
*   **Drive Permission Error:** Ensure the Service Account email has "Editor" access to your folder.
