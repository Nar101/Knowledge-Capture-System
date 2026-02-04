const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  capture: {
    enable: () => ipcRenderer.invoke('capture/enable'),
    disable: () => ipcRenderer.invoke('capture/disable'),
    toggle: () => ipcRenderer.invoke('capture/toggle'),
    status: () => ipcRenderer.invoke('capture/status'),
    now: () => ipcRenderer.invoke('capture/now'),
    onStatus: (callback) => ipcRenderer.on('capture/status', (_event, value) => callback(value))
  },
  notes: {
    search: (query) => ipcRenderer.invoke('notes/search', query),
    get: (id) => ipcRenderer.invoke('notes/get', id),
    export: (id) => ipcRenderer.invoke('notes/export', id),
    onUpdated: (callback) => ipcRenderer.on('notes/updated', (_event, value) => callback(value))
  },
  bookmarks: {
    list: () => ipcRenderer.invoke('bookmarks/list'),
    addCurrent: () => ipcRenderer.invoke('bookmarks/addCurrent'),
    open: (url) => ipcRenderer.invoke('bookmarks/open', url),
    onUpdated: (callback) => ipcRenderer.on('bookmarks/updated', (_event, value) => callback(value))
  },
  settings: {
    get: () => ipcRenderer.invoke('settings/get'),
    set: (payload) => ipcRenderer.invoke('settings/set', payload),
    selectVault: () => ipcRenderer.invoke('settings/selectVault')
  }
});
