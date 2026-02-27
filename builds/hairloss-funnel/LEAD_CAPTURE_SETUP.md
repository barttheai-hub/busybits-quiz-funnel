# Lead Capture Backend Setup (Hair Loss Funnel)

To make the Exit Intent Popup actually save emails, follow this 2-minute setup.

## Option A: Google Sheets (Free, 5 mins)
Use this if you don't want to pay for Zapier yet.

1.  Create a new Google Sheet: `Hair Loss Leads`
2.  Go to `Extensions > Apps Script`.
3.  Delete any code and paste this:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  var email = data.email;
  var timestamp = new Date();
  
  sheet.appendRow([timestamp, email, "advertorial_exit_popup"]);
  
  return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4.  Click `Deploy > New Deployment`.
5.  Select type: `Web app`.
6.  Set **Who has access** to: `Anyone`. (Crucial!)
7.  Click `Deploy`. Copy the `Web App URL`.

## Option B: Zapier / Make (Easier, potential cost)
Use this if you want to send emails directly to Beehiiv/Klaviyo.

1.  Create a "Webhooks by Zapier" trigger (Catch Hook).
2.  Copy the Webhook URL.

## Final Step: Update Code
1.  Open `builds/hairloss-funnel/advertorial.html`.
2.  Find line `const WEBHOOK_URL = ...`.
3.  Paste your URL there.
4.  Uncomment the `fetch` block at the bottom of the `handleLeadSubmit` function.
