# 我的⼈生：AI 协作速览

## 1. 项目是什么

这是一个中文个人管理应用原型，产品名为 **「我的人生」**。它把每日待办、目标、项目、灵感、每日复盘、专注计时和 Obsidian 知识库整合在一套低压力、柔和蓝色的桌面体验中。

主源码在 [`my-day-prototype/`](./my-day-prototype/)。它既能作为浏览器中的 React 单页应用运行，也能打包为 macOS Electron 应用；同时保留了 Sites 静态托管的交付链路。

仓库根目录中的内容：

- `my-day-prototype/`：唯一应持续开发的源码目录。
- `我的人生.app/`：当前 macOS 应用包（构建产物）。
- `我的人生.app.backup-*`：历史应用包备份，体积大、二进制文件多；不要把它们当成源码或日常修改对象。
- `flow-review/`：界面流程截图参考。

## 2. 技术栈与启动方式

- React 19 + React DOM，所有主界面目前集中在 `src/App.jsx`。
- Vite 6 负责开发和 Web 构建；构建输出为 `dist/client/`，使用相对资源路径，兼容 Electron 的 `file://` 加载。
- Electron 44 + electron-builder 负责 macOS 桌面版；CommonJS 主进程位于 `electron/`。
- `@phosphor-icons/react` 为唯一图标库；没有后端、数据库或状态管理库。
- JavaScript（ESM 为主；Electron 主进程使用 `.cjs`）。

在 `my-day-prototype/` 下运行：

```bash
npm install
npm run dev                 # Vite 开发服务器
npm run build               # Web 构建，并准备 Sites 交付文件
npm run desktop             # 构建后启动 Electron
npm run desktop:dist        # 生成 macOS 应用目录到 release/
node --test tests/*.test.mjs
npm run test:sites
```

首次接手时，优先运行 `npm run build` 和 `node --test tests/*.test.mjs` 来建立基线。视觉改动请自行启动预览进行验证，不要只依赖静态阅读。

## 3. 目录地图

```text
my-day-prototype/
├── src/
│   ├── App.jsx                    # 主应用、所有核心页面与交互编排
│   ├── local-data.js              # 纯数据转换/规范化/跨模块同步规则
│   ├── KnowledgeWorkspace.jsx     # Obsidian + 千问知识库页面
│   ├── knowledge-data.js          # 笔记筛选与 AI 返回解析
│   ├── CompletionCelebration.jsx  # 勋章、彩纸、奖杯完成反馈
│   ├── focus-session.js           # 专注计时纯函数
│   └── *.css                      # 按页面拆分的样式
├── electron/
│   ├── main.cjs                   # 窗口、IPC、本地文件与知识库 API 调用
│   ├── preload.cjs                # 唯一暴露给渲染进程的 window.desktopData 接口
│   └── audio-library.cjs          # 本地专注音频格式/路径转换
├── public/assets/                 # 吉祥物、模块横幅、专注场景等静态资源
├── tests/                         # Node 内置 test runner 的回归测试
├── worker/index.js                # Sites SPA 路由 fallback Worker
├── scripts/prepare-sites-build.mjs# 将 Worker/hosting 配置复制进 dist/
├── .openai/hosting.json           # Sites 托管配置
├── design-qa.md                   # 知识库页面视觉 QA 记录与待办
└── AGENTS.md                      # 源码目录内的产品约束；修改 UI 前必须阅读
```

## 4. 产品模块和关键行为

| 模块 | 主要功能 | 关键规则 |
| --- | --- | --- |
| 我的⼀天 | 日期卡、任务增删改、完成、拖拽改期、专注入口 | 「今」始终代表设备真实日期；正常点击编辑，长按约 480ms 后才进入拖拽。 |
| 我的目标 | 分期目标、进度、状态、下一步加入今天 | 进度为 100% 时必须为已完成；分类数量从真实数据计算。 |
| 我的项目 | 项目、任务、日程、笔记、状态 | 项目进度永远由已完成任务数推导；项目任务与每日任务双向同步。 |
| 我的灵感 | 快速记录、图片、置顶、归档、转目标/今天 | 删除必须明确触发并二次确认。 |
| 每日复盘 | 完成、阻碍、洞察、心情、明日重点、历史 | 每个日期至多一条；复盘重点加入明天时防止重复。 |
| 专注模式 | 15/30/45/60 分钟计时、循环音频 | 桌面版使用本机音频目录；浏览器版临时选择音频文件。 |
| 知识库 | 选择 Obsidian Vault，生成三条知识干货 | 仅 Electron 可访问本地 Vault；要求千问兼容 OpenAI Chat Completions API。 |

## 5. 数据与同步边界（改功能前必读）

应用状态由 `App.jsx` 持有，`local-data.js` 负责数据不变量与纯函数。浏览器预览时保存到 `localStorage` 的 `my-day-data`；Electron 中保存为用户数据目录的 `my-day-data.json`。不要把真实用户数据写入项目目录或提交到 Git。

状态形状为：`{ version, taskMap, goals, inspirations, projects, dailyReviews, dayHeading }`。当前 `STORAGE_VERSION` 为 `1`，载入时一律通过 `normalizeData()` 兼容旧数据。新增持久化字段时必须同步更新默认值、规范化逻辑、保存载荷和测试。

涉及项目任务时，必须使用/保持以下约束：

- 每日任务引用项目任务时保留 `projectId` 与 `projectTaskId`。
- 用 `addProjectTaskToDay()` 防止同一天的重复副本。
- 从每日任务完成时，用 `syncProjectTaskDone()` 回写项目任务；从项目任务完成时，用 `syncDailyProjectTasks()` 更新所有每日副本。
- `projectProgress()` 是唯一可信进度来源，不能改为手填百分比。

## 6. Electron 与知识库安全模型

渲染进程没有 Node 权限（`contextIsolation: true`、`nodeIntegration: false`）。新增桌面能力时遵循这条链：

1. 在 `electron/main.cjs` 新增受限的 `ipcMain.handle`；
2. 在 `electron/preload.cjs` 明确、最小化地暴露方法；
3. 从前端通过 `window.desktopData` 调用，并保留浏览器模式降级；
4. 为关键纯逻辑或协议补测试。

知识库设置单独保存为用户数据目录的 `knowledge-config.json`。API Key 仅在 Electron 主进程中使用 `safeStorage` 加密保存；不得写入源码、日志、测试快照或浏览器本地存储。Vault 扫描会跳过点文件夹，只读取 `.md` 文件，并将单篇内容截断到 12,000 字符。生成时要求 AI 严格返回三条、来自不同一级文件夹、可追溯原始相对路径的 JSON 洞察。

## 7. 视觉与交互的硬约束

详细且持续维护的视觉决策在 [`my-day-prototype/AGENTS.md`](./my-day-prototype/AGENTS.md)，开始 UI 工作前必须阅读。高优先级摘要：

- 整体是柔和粉蓝、低压力、活泼个人化的体验，不要演变为企业管理面板。
- 吉祥物是清晰的 3D Q 版街头男孩；优先复用 `public/assets/` 高分辨率资源。
- 四张模块横幅使用统一 16:5、2880×900 画布；关键插图在右侧，左侧留给实时文案。
- 已完成和未完成任务必须可一眼区分；窄日卡中的任务不允许溢出。
- 专注模式是蓝色玻璃窗氛围，宋/明朝感标题和优雅数字；不要使用手写体、马善政字体或棋盘底透明吉祥物。
- 尊重 `prefers-reduced-motion`，尤其是彩纸、勋章和奖杯反馈。

持久性的产品决策或用户视觉反馈，需要补充到 `my-day-prototype/AGENTS.md`，不要只留在对话中。

## 8. 构建、发布与不可破坏文件

`npm run build` 依次运行 Vite 和 `scripts/prepare-sites-build.mjs`，最终必须存在：

- `dist/client/index.html`
- `dist/server/index.js`
- `dist/.openai/hosting.json`

因此，除非同时更新对应构建和测试，不要随意删除或迁移 `.openai/hosting.json`、`worker/index.js`、`scripts/prepare-sites-build.mjs`、`tests/sites-worker.test.mjs`。修改 Sites 交付逻辑后运行 `npm run test:sites`。

`electron-builder` 只打包 `package.json`、`electron/**/*` 和 `dist/client/**/*`；桌面版静态资源必须经由 Vite 构建进入 `dist/client`。所有资源路径保持相对路径，避免破坏打包应用的 `file://` 加载。

## 9. 改动清单

1. 先读本文件和 `my-day-prototype/AGENTS.md`，再定位对应的纯函数、页面和测试。
2. 优先修改 `src/`；不要直接编辑 `dist/`、`release/` 或 `.app` 包来实现功能。
3. 数据逻辑变更：更新 `local-data.js` / `knowledge-data.js` 及对应测试。
4. 桌面 API 变更：同时检查 `main.cjs`、`preload.cjs` 和浏览器降级逻辑。
5. UI 变更：运行预览进行实际交互和视觉检查。
6. 至少运行受影响的 `node --test` 文件；交付前运行 `npm run build`，并在 Sites 相关改动后运行 `npm run test:sites`。

## 10. 当前已知待办

知识库已经完成配置：Vault 指向本机 Obsidian 笔记库，千问 API Key 以 `safeStorage` 加密存于用户数据目录的 `knowledge-config.json`，且已经成功生成过三条来自不同一级文件夹的可追溯洞察。因此待办只剩**视觉验收**——在 1440×1024 下检查洞察卡排版、超长来源路径的折行和标签密度。完成条件是：重新生成一次三条洞察，捕获该分辨率截图，与 `design-qa.md` 记录的目标图比对后更新该文件结论（当前结论仍停留在 `blocked`，已过期）。

开源发布：根目录是 Git 仓库，源码位于 `my-day-prototype/`。根目录 `.gitignore` 排除依赖、构建产物、应用包、个人表格、工作截图及本地用户数据。每次提交前请用 `git status` 确认没有真实用户数据被纳入。
