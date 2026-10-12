const { app, BrowserWindow, ipcMain, shell, dialog, safeStorage } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const { installDesktopWidget } = require("./desktop-widget.cjs");
const { isPlayableAudio, toAudioTrack } = require("./audio-library.cjs");

let mainWindow;
let desktopWidget;
let quitting = false;
let saveQueue = Promise.resolve();
if (process.env.MY_DAY_TEST_USER_DATA) app.setPath("userData", process.env.MY_DAY_TEST_USER_DATA);

const dataPath = () => path.join(app.getPath("userData"), "my-day-data.json");
const audioPath = () => path.join(app.getPath("userData"), "focus-audio");
const knowledgeConfigPath = () => path.join(app.getPath("userData"), "knowledge-config.json");

async function readKnowledgeConfig() {
  try {
    const data = JSON.parse(await fs.readFile(knowledgeConfigPath(), "utf8"));
    return { vaultPath: data.vaultPath || "", apiUrl: data.apiUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1", model: data.model || "qwen-plus", apiKey: data.apiKey && safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(Buffer.from(data.apiKey, "base64")) : "" };
  } catch { return { vaultPath: "", apiUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-plus", apiKey: "" }; }
}

async function writeKnowledgeConfig(config) {
  const current = await readKnowledgeConfig();
  const apiKey = config.apiKey || current.apiKey;
  const stored = { vaultPath: config.vaultPath || current.vaultPath, apiUrl: config.apiUrl || current.apiUrl, model: config.model || current.model, apiKey: apiKey && safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(apiKey).toString("base64") : "" };
  await fs.writeFile(knowledgeConfigPath(), JSON.stringify(stored), "utf8");
  return { ...stored, apiKey: undefined, hasApiKey: Boolean(apiKey) };
}

async function scanMarkdown(folder, base = folder, output = []) {
  const entries = await fs.readdir(folder, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const target = path.join(folder, entry.name);
    if (entry.isDirectory()) await scanMarkdown(target, base, output);
    else if (entry.isFile() && entry.name.endsWith(".md")) {
      const [content, stat] = await Promise.all([fs.readFile(target, "utf8"), fs.stat(target)]);
      output.push({ path: path.relative(base, target), content: content.slice(0, 12000), modifiedAt: stat.mtimeMs });
    }
  }
  return output;
}

async function chooseKnowledgeVault() {
  const result = await dialog.showOpenDialog({ title: "选择你的 Obsidian Vault", properties: ["openDirectory"] });
  if (result.canceled || !result.filePaths[0]) return null;
  const config = await writeKnowledgeConfig({ vaultPath: result.filePaths[0] });
  return { ...config, notes: (await scanMarkdown(result.filePaths[0])).length };
}

async function generateKnowledgeInsights(_event, notes) {
  const config = await readKnowledgeConfig();
  if (!config.apiUrl || !config.model) throw new Error("请在知识库设置中填写本地模型服务地址和模型名。");
  const prompt = `你是个人知识管理助手。根据下面的 Obsidian 笔记，提炼恰好三条中文知识干货。三条必须来自不同的一级文件夹；source 必须逐字使用提供的原笔记相对路径，不能编造。只返回 JSON：{"insights":[{"title":"不超过18字","summary":"80-130字","source":"原笔记相对路径","tags":["标签"]}]}。\n\n笔记：\n${notes.map((note) => `## ${note.path}\n${note.content}`).join("\n\n")}`;
  // Ollama、LM Studio 与 vLLM 均提供 OpenAI Chat Completions 兼容端点。
  // 本地服务通常无需鉴权；只有用户填写 Key 时才发送 Authorization 头。
  const headers = { "Content-Type": "application/json" };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
  let response;
  try {
    response = await fetch(`${config.apiUrl.replace(/\/$/, "")}/chat/completions`, { method: "POST", headers, body: JSON.stringify({ model: config.model, messages: [{ role: "user", content: prompt }], temperature: 0.5 }) });
  } catch {
    throw new Error("无法连接本地模型服务。请确认服务已启动，地址包含 /v1，且桌面应用可访问该地址。");
  }
  if (!response.ok) throw new Error(`模型请求失败（${response.status}）。请检查服务地址、模型名和模型是否已加载。`);
  const payload = await response.json();
  return payload.choices?.[0]?.message?.content || "";
}

async function readData() {
  try { return JSON.parse(await fs.readFile(dataPath(), "utf8")); } catch { return null; }
}

function writeData(data) {
  const save = async () => {
    const target = dataPath();
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(`${target}.tmp`, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(`${target}.tmp`, target);
    desktopWidget?.broadcast(data);
    return { ok: true, path: target };
  };
  const result = saveQueue.then(save, save);
  saveQueue = result.catch(() => {});
  return result;
}

async function listFocusAudio() {
  const folder = audioPath();
  await fs.mkdir(folder, { recursive: true });
  const entries = await fs.readdir(folder, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && isPlayableAudio(entry.name))
    .map((entry) => toAudioTrack(path.join(folder, entry.name), entry.name))
    .sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
}

function createWindow(show = true) {
  const window = new BrowserWindow({
    show,
    width: 1440,
    height: 980,
    minWidth: 1024,
    minHeight: 720,
    title: "我的人生",
    backgroundColor: "#eef6ff",
    webPreferences: { preload: path.join(__dirname, "preload.cjs"), contextIsolation: true, nodeIntegration: false },
  });
  mainWindow = window;
  window.on("close", (event) => { if (!quitting) { event.preventDefault(); window.hide(); } });
  window.on("closed", () => { mainWindow = null; });
  window.webContents.on("did-fail-load", (_event, code, description, validatedURL) => { console.error("页面加载失败", code, description, validatedURL); fs.writeFile(path.join(app.getPath("userData"), "load-error.txt"), `${code} ${description} ${validatedURL}`, "utf8").catch(() => {}); });
  const indexPath = path.join(app.getAppPath(), "dist/client/index.html");
  window.loadFile(indexPath);
  if (!app.isPackaged && process.env.MY_DAY_DEVTOOLS) window.webContents.openDevTools({ mode: "detach" });
  return window;
}

app.whenReady().then(() => {
  ipcMain.handle("data:read", readData);
  ipcMain.handle("data:write", (_event, data) => writeData(data));
  ipcMain.handle("data:path", () => dataPath());
  ipcMain.handle("app:open-data-folder", () => shell.openPath(path.dirname(dataPath())));
  ipcMain.handle("focus-audio:list", listFocusAudio);
  ipcMain.handle("focus-audio:path", () => audioPath());
  ipcMain.handle("focus-audio:open-folder", async () => { await fs.mkdir(audioPath(), { recursive: true }); return shell.openPath(audioPath()); });
  ipcMain.handle("knowledge:config", async () => { const config = await readKnowledgeConfig(); return { vaultPath: config.vaultPath, apiUrl: config.apiUrl, model: config.model, hasApiKey: Boolean(config.apiKey) }; });
  ipcMain.handle("knowledge:save-config", (_event, config) => writeKnowledgeConfig(config));
  ipcMain.handle("knowledge:choose-vault", chooseKnowledgeVault);
  ipcMain.handle("knowledge:scan", async () => { const config = await readKnowledgeConfig(); return config.vaultPath ? scanMarkdown(config.vaultPath) : []; });
  ipcMain.handle("knowledge:generate", generateKnowledgeInsights);
  desktopWidget = installDesktopWidget({
    app, readData, getMainWindow: () => mainWindow,
    showMainWindow: (show = true) => {
      if (!mainWindow || mainWindow.isDestroyed()) createWindow(show);
      if (show) { mainWindow.show(); mainWindow.focus(); }
    },
  });
  createWindow();
  desktopWidget.showWidget();
  app.on("activate", (_event, hasVisibleWindows) => {
    if (hasVisibleWindows || desktopWidget.isDismissing()) return;
    if (!mainWindow || mainWindow.isDestroyed()) createWindow(); else mainWindow.show();
  });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

app.on("before-quit", () => { quitting = true; });
