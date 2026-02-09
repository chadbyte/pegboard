const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  ai: {
    generate: (params) => ipcRenderer.invoke('ai:generate', params),
    onStreamChunk: (callback) => {
      ipcRenderer.on('ai:stream-chunk', (event, data) => callback(data));
    },
    onStreamThinking: (callback) => {
      ipcRenderer.on('ai:stream-thinking', (event, data) => callback(data));
    },
    onStreamComplete: (callback) => {
      ipcRenderer.on('ai:stream-complete', (event, data) => callback(data));
    },
    onStreamError: (callback) => {
      ipcRenderer.on('ai:stream-error', (event, data) => callback(data));
    },
    removeStreamListeners: () => {
      ipcRenderer.removeAllListeners('ai:stream-chunk');
      ipcRenderer.removeAllListeners('ai:stream-thinking');
      ipcRenderer.removeAllListeners('ai:stream-complete');
      ipcRenderer.removeAllListeners('ai:stream-error');
    }
  },
  embedding: {
    generate: (texts) => ipcRenderer.invoke('embedding:generate', { texts })
  },
  storage: {
    load: () => ipcRenderer.invoke('storage:load'),
    save: (data) => ipcRenderer.invoke('storage:save', data)
  },
  floating: {
    create: (chatboxId, windowData) => ipcRenderer.invoke('floating:create', { chatboxId, windowData }),
    close: (chatboxId) => ipcRenderer.invoke('floating:close', { chatboxId }),
    showMain: () => ipcRenderer.invoke('floating:showMain'),
    getData: (chatboxId) => ipcRenderer.invoke('floating:getData', { chatboxId }),
    update: (chatboxId, windowData) => ipcRenderer.send('floating:update', { chatboxId, windowData }),
    sync: (chatboxId, state, fromWidget) => ipcRenderer.send('floating:sync', { chatboxId, state, fromWidget }),
    onSync: (callback) => {
      ipcRenderer.on('floating:sync', (event, data) => callback(data));
    },
    sendDataResponse: (chatboxId, windowData) => ipcRenderer.send('floating:dataResponse', { chatboxId, windowData }),
    onInit: (callback) => {
      ipcRenderer.on('floating:init', (event, data) => callback(data));
    },
    onClosed: (callback) => {
      ipcRenderer.on('floating:closed', (event, data) => callback(data));
    },
    onUpdate: (callback) => {
      ipcRenderer.on('floating:update', (event, data) => callback(data));
    },
    onRequestData: (callback) => {
      ipcRenderer.on('floating:requestData', (event, data) => callback(data));
    },
    removeListeners: () => {
      ipcRenderer.removeAllListeners('floating:init');
      ipcRenderer.removeAllListeners('floating:closed');
      ipcRenderer.removeAllListeners('floating:update');
      ipcRenderer.removeAllListeners('floating:requestData');
    }
  }
});
