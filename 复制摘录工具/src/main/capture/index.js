const { clipboard, nativeImage } = require('electron');
const crypto = require('crypto');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const { getFrontmostApp, getBrowserTabInfo } = require('../services/appleScript');

function hashBuffer(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

function createCaptureService({ db, pipeline, vaultPath }) {
  const emitter = new EventEmitter();
  let enabled = false;
  let interval = null;
  let lastTextHash = '';
  let lastImageHash = '';
  let lastSource = '';

  function emitStatus(extra = {}) {
    emitter.emit('status', {
      enabled,
      sourceApp: lastSource || '',
      queueSize: pipeline.size(),
      ...extra
    });
  }

  async function getSourceInfo() {
    const frontApp = await getFrontmostApp();
    lastSource = frontApp || '';
    let url = '';
    let title = '';
    if (frontApp) {
      const browserInfo = await getBrowserTabInfo(frontApp);
      if (browserInfo) {
        url = browserInfo.url;
        title = browserInfo.title;
      }
    }
    return { frontApp, url, title };
  }

  function shouldIgnoreFrontApp(frontApp) {
    if (!frontApp) return false;
    const lower = frontApp.toLowerCase();
    return lower.includes('snippet') || lower.includes('electron');
  }

  async function captureClipboard() {
    const { frontApp, url, title } = await getSourceInfo();
    if (shouldIgnoreFrontApp(frontApp)) return;

    const image = clipboard.readImage();
    if (!image.isEmpty()) {
      const png = image.toPNG();
      const imgHash = hashBuffer(png);
      if (imgHash !== lastImageHash) {
        lastImageHash = imgHash;
        const snippetId = db.insertSnippet({
          content_text: '',
          content_html: '',
          content_markdown: '',
          source_app: frontApp,
          source_url: url,
          source_title: title,
          source_type: 'image',
          ai_status: 'pending'
        });

        const fileName = `${Date.now()}-${imgHash}.png`;
        const filePath = path.join(vaultPath, 'assets', fileName);
        fs.writeFileSync(filePath, png);
        db.insertAsset({
          snippet_id: snippetId,
          file_path: filePath,
          hash: imgHash,
          width: image.getSize().width,
          height: image.getSize().height
        });

        pipeline.enqueue(snippetId);
        emitStatus({ lastCapturedId: snippetId });
      }
      return;
    }

    const html = clipboard.readHTML();
    const text = clipboard.readText();
    const combined = html || text;
    if (!combined) return;

    const hash = hashBuffer(Buffer.from(combined));
    if (hash === lastTextHash) return;
    lastTextHash = hash;

    const sourceType = html || url ? 'web' : 'text';
    const snippetId = db.insertSnippet({
      content_text: text || '',
      content_html: html || '',
      content_markdown: '',
      source_app: frontApp,
      source_url: url,
      source_title: title || frontApp,
      source_type: sourceType,
      ai_status: 'pending'
    });
    pipeline.enqueue(snippetId);
    emitStatus({ lastCapturedId: snippetId });
  }

  function startWatcher() {
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      if (!enabled) return;
      captureClipboard().catch(() => {});
    }, 500);
  }

  function enable() {
    enabled = true;
    startWatcher();
    emitStatus();
    return status();
  }

  function disable() {
    enabled = false;
    emitStatus();
    return status();
  }

  function status() {
    return {
      enabled,
      sourceApp: lastSource || '',
      queueSize: pipeline.size()
    };
  }

  async function captureNow() {
    await captureClipboard();
    return status();
  }

  return {
    enable,
    disable,
    status,
    captureNow,
    onStatus: (cb) => emitter.on('status', cb)
  };
}

module.exports = { createCaptureService };
