# Wedding QR Photo Uploader (GitHub Pages + Google Drive)

A mobile-friendly, one-day wedding photo upload site. Visitors can take a photo or choose multiple pictures on iPhone/Android and send them to a **private Google Drive folder**. No guest account required.

## How it works

- GitHub Pages hosts the photo-sharing page and its local design assets (`index.html`, `styles.css`, `config.js`, `site.js`, `favicon.ico`, `monogram.png`, and `fonts/`).
- A Google Apps Script Web App hosts the uploader widget in an iframe and writes each uploaded photo to your Drive folder.
- The Apps Script runs under your Google account. **Do not embed your OAuth tokens, client secrets, or Google account credentials in GitHub files.**
- Date-window validation happens **on the server**. Uploads stop at the configured time even if the GitHub page remains available.

## Step 1: Set up the Google Drive folder

1. Open Google Drive and create a private folder, for example `Wedding Photos – Guest Uploads`.
2. Keep it **Restricted**. Do **not** enable "Anyone with link can edit".
3. Copy the folder ID from `https://drive.google.com/drive/folders/FOLDER_ID`.
4. Verify the Google account has enough free storage for the expected uploads.

## Step 2: Deploy Google Apps Script

1. Go to https://script.google.com/ and select **New project**.
2. Replace the default `Code.gs` contents with `apps-script/Code.gs` from this project.
3. Create a new HTML file with the name **Upload** (not `Upload.html` when entering the name in the Apps Script editor), and paste the contents of `apps-script/Upload.html`.
4. In `Code.gs`, replace `PASTE_YOUR_PRIVATE_GOOGLE_DRIVE_FOLDER_ID` with the folder ID from Step 1.
5. Confirm `OPENS_AT` and `CLOSES_AT`. Default: **12 December 2026 at 8:00 AM Bahrain time** through **13 December 2026 at 8:00 AM Bahrain time**. Both ends are editable.
6. In the Apps Script editor, use **Deploy > New deployment > Web app**.
7. Set **Execute as: Me**, **Who has access: Anyone** (anonymous access) and deploy. Authorize Google's requested Drive access as the folder owner.
8. Copy the deployed URL ending `/exec`.
9. For edits to Apps Script after publishing: **Deploy > Manage deployments > Edit > New version > Deploy**. Simply saving code doesn't automatically update the public deployment.

**Important:** If Google Workspace policy does not allow anonymous access, use a personal Google account with Apps Script available, or a different upload backend. Test in an incognito browser before the event.

## Step 3: Connect the GitHub Pages frontend

Edit `config.js`:

```js
window.WEDDING_CONFIG = Object.freeze({
  title: 'Our Wedding',
  weddingDate: '12 December 2026',
  appsScriptUrl: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'
});
```

The `/exec` URL is intentionally public: guests must be able to access the uploader, but the URL **does not** give anyone general access to your Drive. The server code only accepts validated photo uploads to the designated folder during the event window.

## Step 4: Publish GitHub Pages

1. Create a new GitHub repository named e.g. `wedding-photos`.
2. Upload `index.html`, `styles.css`, `site.js`, `config.js`, `favicon.ico`, `monogram.png`, the `fonts/` folder, and `.nojekyll` to the repository root. You may also include this README and the `apps-script` sources (but never any credentials or tokens).
3. Under the repository **Settings > Pages**, choose **Deploy from a branch**, branch **main**, folder **/(root)**, then save.
4. Your public URL should look like `https://YOUR_USERNAME.github.io/wedding-photos/`.
5. Create a QR code containing the **GitHub Pages URL** (not the Apps Script URL); print it on table signs.

## Step 5: Test BEFORE the wedding

- Use an iPhone (Safari) and Android (Chrome) on mobile data, not just your home Wi-Fi.
- Test the **Take photo** control on iPhone (Safari) and Android (Chrome). There is no separate photo-library option; browser and device behavior may still show a chooser when opening the camera control.
- Verify an uploaded file appears in your private Drive folder and the filename contains the guest name.
- Test multiple camera captures, HEIC iPhone photos, file-size errors, and weak mobile connections.
- Open the QR target in an **incognito/private** window to ensure no Google sign-in is required.
- If a mobile browser blocks the embedded uploader, use the **open it directly** fallback link shown below the widget.
- To test before the configured event date, temporarily set `OPENS_AT` to a time in the past and `CLOSES_AT` to a time in the future, then redeploy a new Apps Script version. Restore the wedding window before printing the QR cards.
- This template is **not field-tested** against your specific Google account, deployment, or devices. Perform an end-to-end test before relying on it for the wedding.

## After the event

- The backend automatically stops accepting uploads at `CLOSES_AT`.
- Download or back up the Google Drive folder.
- Go to **Google Apps Script > Deploy > Manage deployments** and archive/remove the web app deployment if you no longer need it.
- Optionally disable **Settings > Pages** in GitHub, or delete the repository. Turning off Pages is a separate manual action; the GitHub website will not automatically disappear.

## Limits and safety

- **12 MiB max per photo**, 30 photos per batch (take another batch afterward). These are intentionally conservative default limits for Google Apps Script. They are not universal Apps Script hard limits.
- Image originals are preserved, including HEIC files; nothing is downscaled.
- Videos and very large ProRAW images are **not supported** by this starter; use a streaming backend for those cases.
- Apps Script has quotas and can be throttled, especially when many guests upload simultaneously. For large weddings or critical uploads, use a production backend (e.g. Cloud Run/Cloudflare Worker) and load-test it.
- The public upload endpoint can be abused during the event window if its URL spreads. It includes basic file and date checks, but **no anti-bot mechanism**. Consider a CAPTCHA/rate-limited backend for a high-profile or large event.
- Guests can upload to your folder but **cannot browse the folder** using this app. Anyone with a direct link to a file cannot access it unless you separately change Drive sharing permissions.
- The browser's `capture` support varies by device: on some phones, the Take photo button may display a chooser rather than opening the camera immediately.
- The upload UI is served by Google Apps Script inside the GitHub Pages website for reliable same-origin use of `google.script.run`. Some browsers may restrict third-party embedded content. Use the provided direct-link fallback.
