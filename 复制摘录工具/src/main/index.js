const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, shell, nativeImage } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const { loadSettings, saveSettings, ensureVault, selectVault } = require('./settings');
const db = require('./db');
const { createPipeline } = require('./pipeline');
const { createCaptureService } = require('./capture');
const { getFrontmostApp, getBrowserTabInfo } = require('./services/appleScript');

let mainWindow = null;
let tray = null;
let settings = null;
let pipeline = null;
let captureService = null;

function getRendererUrl(page) {
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    return `${devUrl}/${page}/index.html`;
  }
  const filePath = path.join(__dirname, '../../dist/renderer', page, 'index.html');
  return pathToFileURL(filePath).toString();
}

function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) return mainWindow;
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#f7f5f1',
    title: '剪贴板摘录',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  mainWindow.loadURL(getRendererUrl('library'));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  return mainWindow;
}

async function setupServices() {
  if (captureService) captureService.disable();
  settings = loadSettings();
  const vaultPath = ensureVault(settings);
  await db.initDb(vaultPath);
  pipeline = createPipeline({ db });
  captureService = createCaptureService({ db, pipeline, vaultPath });

  if (settings.captureEnabled) captureService.enable();

  captureService.onStatus((status) => {
    updateTrayMenu();
    if (mainWindow && !mainWindow.isDestroyed() && status.noteId) {
      mainWindow.webContents.send('notes/updated', { noteId: status.noteId });
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('capture/status', status);
    }
  });
}

function updateTrayMenu() {
  if (!tray) return;
  const enabled = captureService?.status().enabled;
  const menu = Menu.buildFromTemplate([
    { label: enabled ? '捕获已开启' : '捕获已暂停', enabled: false },
    {
      label: enabled ? '暂停捕获' : '开启捕获',
      click: () => toggleCapture()
    },
    {
      label: '立即捕获',
      click: () => captureService?.captureNow()
    },
    { type: 'separator' },
    {
      label: '收藏当前网页',
      click: () => addCurrentBookmark()
    },
    {
      label: '打开主界面',
      click: () => openMainWindow()
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => app.quit()
    }
  ]);
  tray.setContextMenu(menu);
}

function getTrayImage() {
  const candidates = [
    'NSTouchBarCaptureScreenTemplate',
    'NSTouchBarRecordStartTemplate',
    'NSTouchBarComposeTemplate',
    'NSImageNameQuickLookTemplate'
  ];

  for (const name of candidates) {
    const image = nativeImage.createFromNamedImage(name);
    if (image && !image.isEmpty()) return image;
  }

  const fallbackPath = path.join(__dirname, '../../icon.png');
  const fallback = nativeImage.createFromPath(fallbackPath);
  return fallback;
}

function createTray() {
  let image = getTrayImage();
  if (image && !image.isEmpty()) {
    image = image.resize({ width: 18, height: 18 });
    image.setTemplateImage(true);
  }
  tray = new Tray(image);
  tray.setToolTip('剪贴板摘录工具');
  tray.on('click', () => openMainWindow());
  updateTrayMenu();
}

function openMainWindow() {
  const win = createMainWindow();
  win.show();
  win.focus();
}

async function addCurrentBookmark() {
  const frontApp = await getFrontmostApp();
  const browserInfo = await getBrowserTabInfo(frontApp);
  if (!browserInfo?.url) return false;
  db.insertBookmark({ url: browserInfo.url, title: browserInfo.title || '' });
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('bookmarks/updated', { url: browserInfo.url });
  }
  return true;
}

function exportNoteMarkdown(noteId) {
  const note = db.getNote(noteId);
  if (!note) return '';
  const lines = [];
  lines.push(`# ${note.title || '未命名'}`);
  if (note.source_url) lines.push(`URL: ${note.source_url}`);
  lines.push(`作者: ${note.author || ''}`);
  lines.push(`时间: ${note.publish_time || ''}`);
  lines.push(`关键词: ${note.keywords || ''}`);
  lines.push(`摘要: ${note.summary || ''}`);
  lines.push('');

  for (const clip of note.clips || []) {
    lines.push('---');
    if (clip.type === 'text' && clip.content_text) {
      lines.push(clip.content_text);
    }
    if (clip.type === 'image' && clip.image_path) {
      lines.push(`![image](file://${clip.image_path})`);
      if (clip.ocr_text) lines.push(clip.ocr_text);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function toggleCapture() {
  const enabled = captureService?.status().enabled;
  if (enabled) {
    captureService.disable();
  } else {
    captureService.enable();
  }
  settings = { ...settings, captureEnabled: captureService.status().enabled };
  saveSettings(settings);
  updateTrayMenu();
  return captureService.status();
}

function setupIpc() {
  ipcMain.handle('capture/enable', () => {
    captureService.enable();
    settings = { ...settings, captureEnabled: true };
    saveSettings(settings);
    updateTrayMenu();
    return captureService.status();
  });
  ipcMain.handle('capture/disable', () => {
    captureService.disable();
    settings = { ...settings, captureEnabled: false };
    saveSettings(settings);
    updateTrayMenu();
    return captureService.status();
  });
  ipcMain.handle('capture/toggle', () => toggleCapture());
  ipcMain.handle('capture/status', () => captureService.status());
  ipcMain.handle('capture/now', () => captureService.captureNow());

  ipcMain.handle('notes/search', (_event, query) => db.searchNotes(query || ''));
  ipcMain.handle('notes/get', (_event, id) => db.getNote(id));
  ipcMain.handle('notes/export', (_event, id) => exportNoteMarkdown(id));

  ipcMain.handle('bookmarks/list', () => db.listBookmarks());
  ipcMain.handle('bookmarks/addCurrent', () => addCurrentBookmark());
  ipcMain.handle('bookmarks/open', (_event, url) => shell.openExternal(url));

  ipcMain.handle('settings/get', () => settings);
  ipcMain.handle('settings/set', (_event, next) => {
    settings = { ...settings, ...next };
    saveSettings(settings);
    return settings;
  });
  ipcMain.handle('settings/selectVault', async () => {
    const selected = await selectVault();
    if (!selected) return settings;
    settings = { ...settings, vaultPath: selected };
    saveSettings(settings);
    await setupServices();
    return settings;
  });
}

function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+X', () => {
    if (captureService) captureService.captureNow();
  });
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    toggleCapture();
  });
}

app.whenReady().then(async () => {
  await setupServices();
  createMainWindow();
  createTray();
  setupIpc();
  registerShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
