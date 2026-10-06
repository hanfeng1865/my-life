# 我的人生 · My Life

柔和蓝色的个人管理应用，将每日待办、目标、项目、灵感、复盘、专注计时和知识库放在一起。使用 React + Vite 构建，支持浏览器预览和 Electron macOS 桌面版。

## 功能

- 每日任务：按日期浏览、长按拖动改期、完成反馈。
- 目标与项目：目标进度、项目任务、迭代与决策，任务完成状态双向同步。
- 灵感与复盘：记录灵感、按日期复盘、把下一步加入每日任务。
- 专注模式：计时与本地音频播放。
- 知识库：桌面版连接本地 Obsidian Vault，通过兼容 OpenAI 的接口生成知识洞察。
- 桌面待办小窗口：显示今天任务，支持拖动、置顶和与主窗口同步。

## 本地运行

建议使用 Node.js 22 LTS 和 npm。桌面打包面向 macOS。

```bash
git clone https://github.com/hanfeng1865/my-life.git
cd my-life/my-day-prototype
npm ci
npm run dev
```

启动桌面版：`npm run desktop`。构建 macOS 应用目录：`npm run desktop:dist`，输出到 `my-day-prototype/release/`。

## 构建与测试

在 `my-day-prototype/` 下运行：

```bash
npm run build
node --test tests/*.test.mjs
npm run test:sites
```

Web 构建产物位于 `dist/client/`；构建同时准备 Sites 所需的 Worker 和配置。

## 数据与配置

浏览器版将应用数据保存在本机 localStorage；桌面版保存在 Electron 用户数据目录。仓库不包含真实用户数据、API Key、本地音频、应用安装包或个人工作资料。

知识库需要在桌面版设置中自行选择 Vault 并配置模型接口和 API Key。生成洞察时，相关笔记内容会发送至所配置的模型服务。API Key 由桌面主进程使用系统安全存储加密保存。

## 目录

- `my-day-prototype/src/`：React 页面与数据逻辑。
- `my-day-prototype/electron/`：桌面窗口、存储和知识库接口。
- `my-day-prototype/public/assets/`：界面插图和静态资源。
- `my-day-prototype/tests/`：Node 回归测试。

## 许可证

本项目采用 [MIT License](LICENSE)。第三方组件保留其各自许可证；Electron 相关许可见 `my-day-prototype/LICENSE` 和 `my-day-prototype/LICENSES.chromium.html`。
