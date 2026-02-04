const { app, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

const SETTINGS_FILENAME = 'settings.json';

function getSettingsPath() {
  return path.join(app.getPath('userData'), SETTINGS_FILENAME);
}

function defaultSettings() {
  return {
    vaultPath: path.join(app.getPath('documents'), 'SnippetCollectorVault'),
    captureEnabled: true,
    ai: {
      provider: 'local',
      apiKey: ''
    },
    models: {
      llmPath: '',
      embedPath: ''
    }
  };
}

function loadSettings() {
  const settingsPath = getSettingsPath();
  if (!fs.existsSync(settingsPath)) {
    return defaultSettings();
  }
  try {
    const raw = fs.readFileSync(settingsPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...defaultSettings(), ...parsed };
  } catch {
    return defaultSettings();
  }
}

function saveSettings(settings) {
  const settingsPath = getSettingsPath();
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

function ensureVault(settings) {
  const vaultPath = settings.vaultPath;
  fs.mkdirSync(vaultPath, { recursive: true });
  fs.mkdirSync(path.join(vaultPath, 'assets'), { recursive: true });
  fs.mkdirSync(path.join(vaultPath, 'models'), { recursive: true });
  return vaultPath;
}

async function selectVault() {
  const result = await dialog.showOpenDialog({
    title: '选择知识库文件夹',
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
}

module.exports = {
  loadSettings,
  saveSettings,
  ensureVault,
  selectVault,
  getSettingsPath
};
