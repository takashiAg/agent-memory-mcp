const path = require("node:path");
const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, shell } = require("electron");

let tray = null;
let window = null;
let storage = null;

const rootDir = path.resolve(__dirname, "../..");
const isDev = !app.isPackaged;

async function loadStorage() {
  if (!storage) {
    const storageModulePath = app.isPackaged
      ? path.join(__dirname, "vendor/core/storage.js")
      : path.join(rootDir, "packages/core/dist/storage.js");
    const module = await import(storageModulePath);
    storage = new module.MemoryStorage();
  }
  return storage;
}

function createWindow() {
  window = new BrowserWindow({
    width: 1120,
    height: 720,
    minWidth: 860,
    minHeight: 560,
    show: false,
    title: "Agent Memory",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  window.loadFile(path.join(__dirname, "renderer/index.html"));
  window.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      window.hide();
    }
  });
}

function showWindow() {
  if (!window) {
    createWindow();
  }
  window.show();
  window.focus();
}

function createTray() {
  const image = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAR1JREFUSEvtldENwjAMRF83YARGYARGYARGYARGYARGSCYgI3ACMwEluKpJVctXSXwCG6pPUiJb+/jtQ7aNae22FLr3PqIoIpc0uN9GRLC1tnEcZ8p5XJZl5Os4jpRS5JAGAKUUXNd1l1IKpRRKKQQAz3PgOA5RFOG6LmVZIsuyW4ewG2Y4cRxjGIYQgrCqKuI4RlVVyLIMnueRJAlRFKFpGkiSRBRFfM55nOu6xnEcTdPgOA69Xg9ZlsE0TfI8h+M4rKfrupRSSqkPEhGcc45hGHCcxxU0z4nrnucRQRCgqirCMMQYAwD4vo9hGGRZhmEYSJKEuK5xHAeO42AcR7Ztm2VZ4DgOtm3jOA4sy8I0TbZt8xvLsqRpCkEQ8Pv9uDhVVTEMA9d1rS54zrk4joP3+72ZgTmTzU8fQenpIQAAAABJRU5ErkJggg=="
  );
  image.setTemplateImage(true);
  tray = new Tray(image);
  tray.setToolTip("Agent Memory");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Open Agent Memory", click: showWindow },
    { type: "separator" },
    { label: "Quit", click: () => {
      app.isQuitting = true;
      app.quit();
    } }
  ]));
  tray.on("click", showWindow);
}

function registerIpc() {
  ipcMain.handle("memories:list", async (_event, input = {}) => {
    const repo = await loadStorage();
    return repo.listDetailed({ include_expired: true, limit: 1000, ...input });
  });

  ipcMain.handle("memories:get", async (_event, input) => {
    const repo = await loadStorage();
    return repo.get(input);
  });

  ipcMain.handle("memories:create", async (_event, input) => {
    const repo = await loadStorage();
    return repo.remember(input);
  });

  ipcMain.handle("memories:update", async (_event, input) => {
    const repo = await loadStorage();
    return repo.update(input);
  });

  ipcMain.handle("memories:delete", async (_event, input) => {
    const repo = await loadStorage();
    return repo.forget(input);
  });

  ipcMain.handle("app:openDbFolder", async () => {
    const dbPath = process.env.AGENT_MEMORY_DB_PATH || path.join(app.getPath("home"), ".agent-memory-mcp", "memory.sqlite");
    await shell.showItemInFolder(dbPath);
    return { opened: true };
  });

  ipcMain.handle("app:dbPath", async () => {
    return process.env.AGENT_MEMORY_DB_PATH || path.join(app.getPath("home"), ".agent-memory-mcp", "memory.sqlite");
  });
}

app.whenReady().then(() => {
  if (!isDev && process.platform === "darwin" && app.dock) {
    app.dock.hide();
  }
  registerIpc();
  createWindow();
  createTray();
  if (isDev) {
    showWindow();
  }
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});
