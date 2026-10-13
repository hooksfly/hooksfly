# Hooksfly Google Sheets connection

Sheet: https://docs.google.com/spreadsheets/d/1Zih1OfELAUeuskZOm0gdAL9jF_w75j4yclPmfdoSuAA/edit

Keep the spreadsheet sharing set to **Restricted**. You do not need to make it publicly editable.

1. Open this Google Sheet as its owner, then choose **Extensions → Apps Script**.
2. Paste the complete contents of `Hooksfly-Google-Sheets.gs` into `Code.gs` and save.
3. Select `setupSheet` in the function dropdown, click **Run**, and authorize access with the Google account that owns the Sheet. This creates and formats a dedicated **Hooksfly Leads** tab without changing other tabs.
4. Choose **Deploy → New deployment → Web app**.
5. Set **Execute as: Me**, and **Who has access: Anyone**. Deploy and copy the web-app URL ending in `/exec` (not `/dev`). If your Workspace policy does not offer Anyone, an administrator must permit anonymous web apps, or use another form backend.
6. Send that `/exec` URL to connect it to the website. No Google password or OAuth token is needed.

The website's `dist/config.js` has one configuration field, `googleScriptUrl`, for this deployment URL. It is configured with the deployed Apps Script endpoint supplied by the owner.

Rows contain submission time, full name, phone, email, monthly creative volume, source, unique submission ID and consent. The frontend displays success only after a read-only receipt check confirms the row exists. Retrying the same enquiry ID does not create duplicates.

After changing the Apps Script code, edit the deployment and publish a new version. The original `/exec` URL stays the same when the existing deployment is updated.

## Verify before launch

After the connection is active, send one clearly labelled test enquiry. Verify that exactly one new row appears in **Hooksfly Leads**, and that the form shows its success message. Do not make the Sheet public. There are no Apps Script secrets embedded in the frontend.

Official references:
- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/guides/content
