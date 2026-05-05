const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("agentMemory", {
  listMemories: (input) => ipcRenderer.invoke("memories:list", input),
  getMemory: (input) => ipcRenderer.invoke("memories:get", input),
  createMemory: (input) => ipcRenderer.invoke("memories:create", input),
  updateMemory: (input) => ipcRenderer.invoke("memories:update", input),
  deleteMemory: (input) => ipcRenderer.invoke("memories:delete", input),
  dbPath: () => ipcRenderer.invoke("app:dbPath"),
  openDbFolder: () => ipcRenderer.invoke("app:openDbFolder")
});
