const { BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

function installDesktopWidget({ app, getMainWindow, showMainWindow, readData }) {
  let widget;
  const statePath = path.join(app.getPath('userData'), 'desktop-widget.json');
  let state = {};
  try { state = JSON.parse(fs.readFileSync(statePath, 'utf8')); } catch {}
  const rememberWindow = () => {
    if (!widget || widget.isDestroyed()) return;
    state = { bounds: widget.getBounds(), pinned: widget.isAlwaysOnTop() };
    try { fs.mkdirSync(path.dirname(statePath), { recursive: true }); fs.writeFileSync(statePath, JSON.stringify(state)); } catch {}
  };
  let serial = Promise.resolve();
  let counter = 0;
  const pending = new Map();
  const broadcast = (data) => {
    if (widget && !widget.isDestroyed()) widget.webContents.send('widget:data', data);
  };
  function showWidget() {
    showMainWindow(false);
    if (widget && !widget.isDestroyed()) { widget.show(); return; }
    const saved = state.bounds;
    const valid = saved && ['x', 'y', 'width', 'height'].every(key => Number.isFinite(saved[key]));
    const area = (valid ? screen.getDisplayMatching(saved) : screen.getPrimaryDisplay()).workArea;
    const width = Math.min(area.width, Math.max(300, valid ? saved.width : 340));
    const height = Math.min(area.height, Math.max(280, valid ? saved.height : 470));
    const x = Math.max(area.x, Math.min(area.x + area.width - width, valid ? saved.x : area.x + 28));
    const y = Math.max(area.y, Math.min(area.y + area.height - height, valid ? saved.y : area.y + 350));
    widget = new BrowserWindow({
      width, height, minWidth: 300, minHeight: 280, x, y,
      title: '我的一天 · 桌面待办', frame: false, transparent: true,
      backgroundColor: '#00000000', hasShadow: true, resizable: true,
      webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false },
    });
    widget.setAlwaysOnTop(Boolean(state.pinned));
    widget.on('moved', rememberWindow);
    widget.on('resized', rememberWindow);
    widget.on('close', rememberWindow);
    widget.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
    widget.loadFile(path.join(app.getAppPath(), 'dist/client/index.html'), { hash: 'desktop-widget' });
    widget.on('closed', () => { widget = null; });
  }
  ipcMain.handle('widget:show', showWidget);
  ipcMain.handle('widget:hide', () => widget?.hide());
  ipcMain.handle('widget:open-main', () => showMainWindow(true));
  ipcMain.handle('widget:pin', (_event, pinned) => { widget?.setAlwaysOnTop(Boolean(pinned)); rememberWindow(); return Boolean(pinned); });
  ipcMain.handle('widget:read', async () => {
    const data = await readData();
    return { data, pinned: widget?.isAlwaysOnTop() || false };
  });
  ipcMain.handle('widget:action', (event, action) => {
    if (event.sender !== widget?.webContents) throw new Error('无效的待办窗口');
    const run = () => new Promise((resolve, reject) => {
      const main = getMainWindow();
      if (!main || main.isDestroyed()) return reject(new Error('主应用尚未就绪，请稍后重试'));
      const requestId = ++counter;
      const timer = setTimeout(() => { pending.delete(requestId); reject(new Error('同步超时，请打开主应用检查任务状态后重试')); }, 10000);
      pending.set(requestId, { resolve, reject, timer });
      main.webContents.send('widget:action-request', { requestId, action });
    });
    const result = serial.then(run, run);
    serial = result.catch(() => {});
    return result;
  });
  ipcMain.on('widget:action-result', (event, { requestId, error }) => {
    if (event.sender !== getMainWindow()?.webContents) return;
    const request = pending.get(requestId);
    if (!request) return;
    clearTimeout(request.timer);
    pending.delete(requestId);
    if (error) request.reject(new Error(error)); else request.resolve({ ok: true });
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: '我的人生', submenu: [{ role: 'about' }, { type: 'separator' }, { label: '显示我的一天桌面待办', click: showWidget }, { label: '打开主窗口', click: () => showMainWindow(true) }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' }, { role: 'quit' }] },
    { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' },
  ]));
  return { showWidget, broadcast };
}
module.exports = { installDesktopWidget };
