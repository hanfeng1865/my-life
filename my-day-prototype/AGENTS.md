# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Current product decisions

- Focus mode must follow the supplied blue glass-window reference closely: chin resting on folded arms at lower right, soft diagonal light and glossy tabletop, centered Song/Ming serif task title and elegant timer digits. Do not use handwritten / Ma Shan Zheng fonts in focus mode or checkerboard-backed mascot images. Audio controls must show actual local filenames and support multiple tracks.

- Keep the soft blue, low-pressure visual direction.
- Use a crisp, high-resolution redraw of the supplied boy IP as the primary illustration asset.
- “我的一天” must browse beyond nearby dates in both directions; do not limit it to a five-card demo strip.
- “我的目标” needs usable creation, progress editing, and a way to put a next action into “我的一天”.
- The mascot direction is a soft 3D chibi streetwear boy: oversized glossy eyes, fluffy dark hair, rosy cheeks, and a powder-blue hoodie. The overall UI should feel playful and personal rather than restrained or corporate.
- Day-card task lists must stay visually contained within each card; when a day has many tasks, scroll inside the card instead of overflowing below it.
- Narrow (collapsed) day cards keep each task on one compact row: the “开始专注” action exists only in the expanded card, and titles clamp to two lines with an ellipsis, so a long task never collapses into a one-character column. The “已完成” label sits on its own line there instead of reserving a 52px gutter.
- A task can be long-pressed and dragged onto a visible date card to reschedule it; the destination date should highlight while it is a valid drop target.
- The “今” chip is reserved for the device's actual calendar date, never merely the currently selected date.
- Completed and unfinished tasks must be unmistakably different: unfinished tasks keep strong text and actionable contrast, while completed tasks use a neutral subdued surface, a clear check, strike-through text, and an explicit completion label.
- Goal category tab counts must always be derived from the actual goals in data; never use placeholder counts. The classification hint is omitted from the goal form.
- A goal with 100% completion progress is treated as completed when it is created, edited, or loaded from saved data.
- Each goal has a left-side completion checkbox that sets progress to 100% and status to completed. Completion feedback should feel exhilarating: a dimensional medal, expanding rings and a confetti burst; finishing all daily tasks and achieving a goal deserve a larger gold-trophy celebration. Respect reduced-motion preferences.
- “我的项目” uses project tasks as the source of truth: project progress is automatically derived from completed-task count, never entered as a manual percentage. A project task added to today keeps a `projectId` and `projectTaskId`, and completion must synchronize in both directions.
- Project details are a dedicated full-page workspace: keep only the back/breadcrumb entry and 项目迭代, without the project hero or footer message; 项目随记 has its own page opened from the project card. Do not show an 全部项目待办 board or its task-entry and pending/completed lists; manage requirements within each iteration. Project task data and completion synchronization remain intact.
- A project task that has been added to today must visibly read “已加入今天” and be disabled for that day, preventing duplicate additions.
- “已加入今天” must stay on one line and never wrap mid-word.
- Project task dates are chosen with a two-click calendar: first tap is the start, second tap is the end, and the range is auto-ordered. Native date inputs are not used for ranges.
- Project list filters sit below the hero as their own bar, with clear space from the banner and from the cards.
- A day task opens its editor on a normal click. Dragging is reserved for a deliberate long press, then movement onto another visible date card.
- The project overview always exposes a prominent “新建项目” entry and lets each project switch directly among 进行中、已暂停、已完成.
- Inspiration cards use an explicit trash icon and confirmed permanent deletion; the three-dot overflow affordance is not used.
- The four module banners (目标、项目、灵感、每日复盘) use one crisp 16:5 canvas at 2880×900; keep important illustration content on the right and reserve the left side for live UI text so page switches do not jump or blur.
- Daily review history and detail views preserve user-entered line breaks, omit every unfilled section instead of showing placeholder copy, and allow any saved review to be edited.
- The daily review writing panel lets the user choose a date, loads that day's saved review or a blank draft, and saves edits under the chosen date. Its “tomorrow” task action follows the chosen date.
- Iteration pending decisions support inline editing and direct deletion from the decision list.
- 每日复盘日期选择器整块浅蓝区域都可点击打开应用内日历，避免原生日期输入框的分段编辑和小图标造成误点；浮窗内点击不关闭，选择日期后关闭，保留未保存复盘的切换提醒。

- 桌面待办采用 Electron 独立无边框小窗口，显示设备实际今天的任务，保留柔和蓝色；支持拖动、可选置顶、添加、勾选和折叠已完成事项，与主应用共用数据和项目完成状态。

- 项目列表卡片不显示下一步、进度条/百分比/自动计算和待办预览；操作为“查看迭代”“项目随记”和小垃圾桶删除图标（不显示“删除项目”文字，保留删除确认）。“项目随记”打开该项目的独立随记页，随记从迭代列表页移出。

- 项目状态选择器使用应用内圆角浮层：浅蓝选中背景、状态色圆点和勾选标记；不用原生 select 下拉菜单，支持点击外部、Esc 关闭及键盘选择。

- 每个项目迭代有独立“BUG列表”标签，记录 BUG 描述和状态（待处理、已完成、无需处理）；支持新增、编辑、确认删除、直接切换状态和本地保存，数量来自该迭代实际 BUG 数据。
