const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopData", {
  read: () => ipcRenderer.invoke("data:read"),
  write: (data) => ipcRenderer.invoke("data:write", data),
  path: () => ipcRenderer.invoke("data:path"),
  openFolder: () => ipcRenderer.invoke("app:open-data-folder"),
  listFocusAudio: () => ipcRenderer.invoke("focus-audio:list"),
  focusAudioPath: () => ipcRenderer.invoke("focus-audio:path"),
  openFocusAudioFolder: () => ipcRenderer.invoke("focus-audio:open-folder"),
  knowledgeConfig: () => ipcRenderer.invoke("knowledge:config"),
  saveKnowledgeConfig: (config) => ipcRenderer.invoke("knowledge:save-config", config),
  chooseKnowledgeVault: () => ipcRenderer.invoke("knowledge:choose-vault"),
  scanKnowledgeVault: () => ipcRenderer.invoke("knowledge:scan"),
  generateKnowledge: (notes) => ipcRenderer.invoke("knowledge:generate", notes),
});

contextBridge.exposeInMainWorld("desktopWidget", {
  show: () => ipcRenderer.invoke("widget:show"),
  hide: () => ipcRenderer.invoke("widget:hide"),
  openMain: () => ipcRenderer.invoke("widget:open-main"),
  pin: (value) => ipcRenderer.invoke("widget:pin", value),
  read: () => ipcRenderer.invoke("widget:read"),
  action: (action) => ipcRenderer.invoke("widget:action", action),
  onData: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on("widget:data", listener);
    return () => ipcRenderer.removeListener("widget:data", listener);
  },
  onAction: (callback) => {
    const listener = (_event, request) => callback(request);
    ipcRenderer.on("widget:action-request", listener);
    return () => ipcRenderer.removeListener("widget:action-request", listener);
  },
  actionResult: (requestId, error) => ipcRenderer.send("widget:action-result", { requestId, error }),
});
