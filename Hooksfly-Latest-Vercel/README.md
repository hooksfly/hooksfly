# HooksFly — latest website export

Includes the latest published website (version 35), all ten creative videos,
logo, styles, JavaScript and the configured Google Sheets endpoint.

## Deploy on Vercel
1. Extract this ZIP.
2. Upload its contents to a GitHub repository (index.html must be at repository root).
3. Import that repository in Vercel.
4. Framework Preset: Other. No build command. Output directory: .
5. Deploy, then add your GoDaddy domain under Project Settings > Domains.
6. Copy the DNS records shown by Vercel into GoDaddy DNS settings.

The enquiry popup opens after 10 seconds. Submit button: Register for Free Creatives.
The current Google Apps Script endpoint is already in config.js.
Do not create another Google Script deployment unless changing the backend.
A backend test save was confirmed; after deployment, submit one test enquiry
and check your Google Sheet to verify the complete flow on your own domain.

The integrations folder contains the Apps Script source and setup notes for reference.
No Node installation or build process is needed for these static website files.
