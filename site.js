(() => {
  'use strict';
  const config = window.WEDDING_CONFIG || {};
  document.title = `${config.title || 'Our Wedding'} | Share Your Photos`;
  document.getElementById('weddingDate').textContent = config.weddingDate || 'Our special day';
  document.getElementById('footerMark').textContent = `${(config.title || 'Our Wedding').toUpperCase()} · ${(config.weddingDate || '').slice(-4)}`;

  const url = config.appsScriptUrl || '';
  const valid = /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/.test(url);
  if (!valid) {
    document.getElementById('notConfigured').hidden = false;
    return;
  }

  const iframe = document.getElementById('uploadFrame');
  iframe.src = url;
  iframe.hidden = false;
  document.getElementById('directUpload').href = url;
  document.getElementById('iframeHint').hidden = false;
})();
