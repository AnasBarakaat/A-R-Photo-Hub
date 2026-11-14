/**
 * Wedding photo uploader backend (Google Apps Script).
 * Deploy this script as a Web app: Execute as 'Me', access 'Anyone'.
 * Only photos in a single private folder; no login needed for guests.
 */
const SETTINGS = Object.freeze({
  // From https://drive.google.com/drive/folders/FOLDER_ID
  FOLDER_ID: 'PASTE_YOUR_PRIVATE_GOOGLE_DRIVE_FOLDER_ID',

  // Bahrain local time, default: 24-hour upload period for 12 Dec 2026.
  OPENS_AT: '2026-12-12T08:00:00+03:00',
  CLOSES_AT: '2026-12-13T08:00:00+03:00',

  MAX_FILE_BYTES: 12 * 1024 * 1024, // 12 MiB, in original quality
  EVENT_NAME: 'Our Wedding'
});

function doGet() {
  const page = HtmlService.createTemplateFromFile('Upload');
  page.eventName = SETTINGS.EVENT_NAME;
  page.maxMB = SETTINGS.MAX_FILE_BYTES / (1024 * 1024);
  return page.evaluate()
    .setTitle('Share Your Wedding Photos')
    // Allow embedding the uploader in the GitHub Pages website.
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getStatus() {
  const now = Date.now();
  const opens = new Date(SETTINGS.OPENS_AT).getTime();
  const closes = new Date(SETTINGS.CLOSES_AT).getTime();
  if (!Number.isFinite(opens) || !Number.isFinite(closes) || opens >= closes) {
    return { open: false, message: 'The event is not configured yet.' };
  }
  if (now < opens) return { open: false, message: 'Our photo collection opens on the wedding day. See you soon!' };
  if (now >= closes) return { open: false, message: 'Our photo collection is now closed. Thank you for sharing our day!' };
  return { open: true, message: 'Uploads are open!' };
}

/** Called by google.script.run inside Upload.html. */
function uploadPhoto(payload) {
  const status = getStatus();
  if (!status.open) throw new Error(status.message);
  if (SETTINGS.FOLDER_ID.startsWith('PASTE_')) {
    throw new Error('The album has not been configured by the couple.');
  }
  if (!payload || typeof payload.base64 !== 'string' || typeof payload.name !== 'string') {
    throw new Error('Invalid photo data. Please select the photo again.');
  }

  // Check the original name, MIME type and base64 payload before decoding.
  const rawName = payload.name.slice(0, 140);
  const lowerName = rawName.toLowerCase();
  const allowedExtensions = /\.(jpe?g|png|webp|gif|heic|heif|avif)$/;
  const allowedTypes = /^(image\/(jpeg|png|webp|gif|heic|heif|avif)|application\/octet-stream)$/;
  let mime = String(payload.mimeType || '').toLowerCase();
  if (!allowedExtensions.test(lowerName) || (mime && !allowedTypes.test(mime))) {
    throw new Error('Only common image files (JPEG, PNG, HEIC, WebP, GIF or AVIF) can be uploaded.');
  }
  if (!mime || mime === 'application/octet-stream') {
    if (/\.heic$/.test(lowerName)) mime = 'image/heic';
    else if (/\.heif$/.test(lowerName)) mime = 'image/heif';
    else if (/\.png$/.test(lowerName)) mime = 'image/png';
    else if (/\.webp$/.test(lowerName)) mime = 'image/webp';
    else if (/\.gif$/.test(lowerName)) mime = 'image/gif';
    else if (/\.avif$/.test(lowerName)) mime = 'image/avif';
    else mime = 'image/jpeg';
  }

  // base64 expands binary data; bound it before allocating bytes.
  const base64 = payload.base64;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length > Math.ceil(SETTINGS.MAX_FILE_BYTES / 3) * 4 + 4) {
    throw new Error('This photo is invalid or too large (12 MB maximum).');
  }
  const bytes = Utilities.base64Decode(base64);
  if (bytes.length === 0 || bytes.length > SETTINGS.MAX_FILE_BYTES) {
    throw new Error('This photo exceeds the 12 MB limit.');
  }

  const safeGuest = String(payload.guestName || 'Guest')
    .trim().replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 35) || 'Guest';
  const safeName = rawName.replace(/[^\p{L}\p{N}._ -]/gu, '_').replace(/\.{2,}/g, '.').slice(-90);
  const datePrefix = Utilities.formatDate(new Date(), 'Asia/Bahrain', 'yyyyMMdd_HHmmss');
  const unique = Utilities.getUuid().slice(0, 8);
  const storedName = `${datePrefix}_${unique}_${safeGuest}_${safeName}`;

  // Folder stays private. Guests never receive a Drive sharing link.
  const folder = DriveApp.getFolderById(SETTINGS.FOLDER_ID);
  folder.createFile(Utilities.newBlob(bytes, mime, storedName));
  return { success: true, fileName: rawName };
}
