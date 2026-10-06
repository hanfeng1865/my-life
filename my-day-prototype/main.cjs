const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");

const dataPath = () => path.join(app.getPath("userData"), "my-day-data.json");

async function readData() {
  try { return JSON.parse(await fs.readFile(dataPath(), "utf8")); } catch { return null; }
}

async function writeData(data) {
  const target = dataPath();
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(data, null, 2), "utf8");
  return { ok: true, path: target };
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 980,
    minWidth: 1024,
    minHeight: 720,
    title: "我的人生",
    backgroundColor: "#eef6ff",
    webPreferences: { preload: path.join(__dirname, "preload.cjs"), contextIsolation: true, nodeIntegration: false },
  });
  window.webContents.on("did-fail-load", (_event, code, description) => console.error("页面加载失败", code, description));
  window.loadFile(path.join(__dirname, "../dist/client/index.html"));
  if (!app.isPackaged) window.webContents.openDevTools({ mode: "detach" });
}

app.whenReady().then(() => {
  ipcMain.handle("data:read", readData);
  ipcMain.handle("data:write", (_event, data) => writeData(data));
  ipcMain.handle("data:path", () => dataPath());
  ipcMain.handle("app:open-data-folder", () => shell.openPath(path.dirname(dataPath())));
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
