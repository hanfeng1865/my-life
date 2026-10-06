import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { extractFile, listPackage } from "@electron/asar";

const pngDimensions = async (name) => {
  const file = await readFile(new URL(`../public/assets/${name}`, import.meta.url));
  return { width: file.readUInt32BE(16), height: file.readUInt32BE(20) };
};

test("uses one high-resolution aspect ratio for all module banners", async () => {
  const banners = await Promise.all([
    "banner-goals-v3.png",
    "banner-projects-v3.png",
    "banner-inspirations-v3.png",
    "banner-review-v3.png",
  ].map(pngDimensions));

  for (const { width, height } of banners) {
    assert.equal(width, 2880);
    assert.equal(height, 900);
  }

  const styles = await readFile(new URL("../src/review.css", import.meta.url), "utf8");
  assert.match(styles, /\.module-banner-art\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*5/s);
  assert.match(styles, /\.module-banner-art\s*\{[^}]*object-fit:\s*cover/s);
  assert.match(styles, /\.goal-hero>\.module-banner-art[^\{]*\{[^}]*width:\s*100%[^}]*height:\s*100%/s);
});

test("uses relative asset paths so the desktop file URL can load images", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /src="\/assets\//);
});

test("lets the image preview zoom with controls, trackpad pinch, and command-scroll", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../src/projects.css", import.meta.url), "utf8");

  assert.match(source, /aria-label="放大图片"/);
  assert.match(source, /onTouchStart/);
  assert.match(source, /onTouchMove/);
  assert.match(source, /event\.metaKey/);
  assert.match(styles, /\.image-lightbox__canvas/);
  assert.match(source, /transform: `translate\(\$\{pan\.x\}px/);
  assert.match(styles, /touch-action:\s*none/);
});

test("keeps unfinished tasks first and removes the goal search control", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /\.sort\(\(left, right\) => Number\(left\.done\) - Number\(right\.done\)\)/);
  assert.doesNotMatch(source, /placeholder="搜索目标/);
});

test("imports the arrow icons rendered by desktop navigation", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const phosphorImport = source.match(/import \{([^}]+)\} from "@phosphor-icons\/react";/)?.[1] || "";

  assert.match(phosphorImport, /\bArrowLeft\b/);
  assert.match(phosphorImport, /\bArrowRight\b/);
});

test("removes the redundant right-side navigation avatar globally", async () => {
  const appSource = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const styleSource = await readFile(new URL("../src/playful.css", import.meta.url), "utf8");

  assert.doesNotMatch(appSource, /className="avatar-button"/);
  assert.match(styleSource, /\.topbar\s*\{[^}]*grid-template-columns:\s*1fr\s+auto\s+1fr/s);
});

test("keeps task rows inside the day card and distinguishes completed rows", async () => {
  const source = await readFile(new URL("../src/playful.css", import.meta.url), "utf8");

  assert.match(source, /\.day-card\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(source, /\.task-list\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(source, /\.task-row\.is-done\s*\{[^}]*background:/s);
  assert.match(source, /\.task-row\.is-done \.task-copy::after/);
});

test("provides confirmed delete actions for tasks and goals", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /aria-label="删除待办"/);
  assert.match(source, /aria-label={`删除目标\$\{goal\.title\}`}/);
  assert.match(source, /确认删除/);
  assert.match(source, /onDeleteTask/);
  assert.match(source, /onDeleteGoal/);
});

test("celebrates only when an unfinished task becomes complete", async () => {
  const appSource = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const styleSource = await readFile(new URL("../src/celebration.css", import.meta.url), "utf8");

  assert.match(appSource, /!task\.done.*setCelebration/s);
  assert.match(appSource, /<CompletionCelebration\s+key={celebration.id}/);
  assert.match(styleSource, /@keyframes achievement-burst/);
  assert.match(styleSource, /prefers-reduced-motion:\s*reduce/);
});

test("opens task editing from the task text without changing completion state", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /function EditTask\(/);
  assert.match(source, /onEditTask/);
  assert.match(source, /aria-label={`编辑待办：\$\{task\.title\}`}/);
  assert.match(source, /taskToEdit/);
  assert.match(source, /onEditTask=\{\(task\) => \{[^}]*setTaskToEdit\(\{ task, dateKey: dateKey\(date\) \}\)/);
  assert.match(source, /\{taskToEdit &&\s*\(?\s*<EditTask\s+task=\{taskToEdit\.task\}/);
});

test("reserves dragging for a deliberate long press", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /TASK_LONG_PRESS_MS\s*=\s*[4-9]\d\d/);
  assert.doesNotMatch(source, /Math\.hypot[\s\S]{0,260}beginTaskDrag/);
  assert.doesNotMatch(source, /const startTaskPress[\s\S]{0,240}event\.currentTarget\.setPointerCapture/);
  assert.match(source, /point\.element\.setPointerCapture/);
  assert.match(source, /title="点击编辑，长按拖到其他日期"/);
});

test("shows project creation and direct status controls", async () => {
  const appSource = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const styleSource = await readFile(new URL("../src/projects.css", import.meta.url), "utf8");

  assert.match(appSource, /aria-label="新建项目"/);
  assert.match(appSource, /aria-label={`更改项目状态：\$\{project\.title\}`}/);
  assert.match(appSource, /onUpdateStatus/);
  assert.doesNotMatch(styleSource, /\.project-stats-row\s*\{\s*display\s*:\s*none/);
});

test("lets project task and note sections collapse independently", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /项目随记/);
  assert.match(source, /project-section-toggle/);
  assert.match(source, /展开/);
  assert.match(source, /折叠/);
});

test("shows project iterations and their selected iteration details", async () => {
  const appSource = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const styleSource = await readFile(new URL("../src/projects.css", import.meta.url), "utf8");

  assert.match(appSource, /新建迭代/);
  assert.match(appSource, /迭代目标/);
  assert.match(appSource, /project-iteration-tabs/);
  assert.match(appSource, /iterationId/);
  assert.match(styleSource, /\.project-iteration-tabs/);
  assert.match(styleSource, /\.project-iteration-summary/);
});

test("opens an iteration in a dedicated detail page", async () => {
  const appSource = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const styleSource = await readFile(new URL("../src/projects.css", import.meta.url), "utf8");

  assert.match(appSource, /setIterationDetailId\(iteration\.id\)/);
  assert.match(appSource, /project-iteration-detail-page/);
  assert.match(appSource, /返回项目详情/);
  assert.doesNotMatch(appSource, /className="project-iteration-detail-hero"/);
});

test("switches iteration details between requirements decisions and notes tabs", async () => {
  const appSource = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const styleSource = await readFile(new URL("../src/projects.css", import.meta.url), "utf8");

  assert.match(appSource, /iteration-detail-tabs/);
  assert.match(appSource, /需求列表/);
  assert.match(appSource, /待确定项/);
  assert.match(appSource, /iterationTab === "notes"/);
  assert.match(appSource, /iteration-requirements-table/);
  assert.match(styleSource, /\.iteration-detail-tabs/);
  assert.match(styleSource, /\.iteration-decisions/);
});

test("lets pending decisions be edited and deleted", async () => {
  const appSource = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(appSource, /editingDecision/);
  assert.match(appSource, /保存修改/);
  assert.match(appSource, /aria-label={`编辑\$\{decision\.content\}`}/);
  assert.match(appSource, /aria-label={`删除\$\{decision\.content\}`}/);
});

test("uses a simplified requirement list with descriptions", async () => {
  const appSource = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(appSource, /需求说明/);
  assert.doesNotMatch(appSource, /<span>故事点<\/span>/);
  assert.doesNotMatch(appSource, /<span>进度<\/span>/);
  assert.doesNotMatch(appSource, /<span>类型<\/span>/);
});

test("uses the project task edit action for task copy instead of dates", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /project-task-copy-editor/);
  assert.match(source, /保存文案/);
  assert.doesNotMatch(source, /editingTask === task\.id && <div className="project-schedule-popover"/);
});

test("stacks project task copy fields vertically for comfortable editing", async () => {
  const source = await readFile(new URL("../src/projects.css", import.meta.url), "utf8");

  assert.match(source, /\.project-task-copy-editor\{[^}]*flex-direction:column/s);
});

test("uses a real delete action for inspiration cards", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /aria-label={`删除灵感：\$\{item\.title\}`}/);
  assert.match(source, /<Trash size=\{19\}/);
  assert.match(source, /onDelete=\{\(id\) =>\s*setInspirations/);
  assert.doesNotMatch(source, /<DotsThree/);
});

test("styles the goal editor as a designed form instead of a native status dropdown", async () => {
  const appSource = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const styleSource = await readFile(new URL("../src/goals-reference.css", import.meta.url), "utf8");

  assert.match(appSource, /className="goal-status-options"/);
  assert.match(appSource, /className="[^"]*goal-progress-control[^"]*"/);
  assert.match(styleSource, /\.goal-modal-shell/);
  assert.match(styleSource, /\.goal-status-options/);
});

test("keeps mobile navigation labels on one line", async () => {
  const source = await readFile(new URL("../src/playful.css", import.meta.url), "utf8");

  assert.match(source, /@media \(max-width: 720px\)[\s\S]*\.topbar\s*\{[^}]*position:\s*relative/s);
  assert.match(source, /@media \(max-width: 720px\)[\s\S]*\.tabs\s*\{[^}]*position:\s*absolute/s);
  assert.match(source, /\.tabs button\s*\{[^}]*white-space:\s*nowrap/s);
});

test("keeps an omitted task note blank", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /note: note\.trim\(\)/);
  assert.match(source, /repeat === "none"\s*\? ""/);
  assert.match(source, /\{task\.note && <small>\{task\.note\}<\/small>\}/);
  assert.doesNotMatch(source, /note\.trim\(\) \|\| "这一天"/);
});

test("ships the rendered app and task editor in the bundled desktop app", async () => {
  const appArchive = new URL("../release/mac-arm64/我的人生.app/Contents/Resources/app.asar", import.meta.url);
  const packagedFiles = listPackage(fileURLToPath(appArchive));
  const appBundle = packagedFiles.find((name) => /^\/dist\/client\/assets\/index-.*\.js$/.test(name));
  const packageAssets = extractFile(fileURLToPath(appArchive), appBundle.slice(1)).toString("utf8");

  assert.ok(packagedFiles.includes("/dist/client/index.html"));
  assert.match(packageAssets, /编辑这件小事/);
});

test("limits desktop packaging to runtime files", async () => {
  const packageData = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

  assert.deepEqual(packageData.build.files, ["package.json", "electron/**/*", "dist/client/**/*"]);
});

test("uses live goal counts, hides the classification hint, and completes 100% goals", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /count: 5|count: 3|count: 2/);
  assert.match(source, /goals\.filter\(\(goal\) => goal\.group === item\.key && matches\(goal\)\)\s*\.length/);
  assert.doesNotMatch(source, /预计归类/);
  assert.match(source, /status: Number\(progress\) >= 100 \? "done" : "active"/);
  assert.match(source, /status: Number\(progress\) >= 100 \? "done" : status/);
});
