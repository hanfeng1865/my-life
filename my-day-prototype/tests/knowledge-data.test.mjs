import test from "node:test";
import assert from "node:assert/strict";
import { selectKnowledgeNotes, normaliseInsightPayload } from "../src/knowledge-data.js";

test("selects a balanced set of notes across folders and excludes sensitive paths", () => {
  const notes = [
    { path: "19发疯姥子/内容系统.md", content: "A", modifiedAt: 50 },
    { path: "19发疯姥子/另一篇.md", content: "B", modifiedAt: 49 },
    { path: "03自媒体/选题.md", content: "C", modifiedAt: 40 },
    { path: "09LLM Wiki/模型.md", content: "D", modifiedAt: 30 },
    { path: "01导航（含账号密码）/账号.md", content: "SECRET", modifiedAt: 100 },
    { path: ".obsidian/workspace.md", content: "B", modifiedAt: 99 },
  ];

  assert.deepEqual(selectKnowledgeNotes(notes, 3).map((note) => note.path), ["19发疯姥子/内容系统.md", "03自媒体/选题.md", "09LLM Wiki/模型.md"]);
});

test("avoids sources used by the previous generation when alternatives exist", () => {
  const notes = [
    { path: "19发疯姥子/a.md", content: "A", modifiedAt: 3 },
    { path: "03自媒体/b.md", content: "B", modifiedAt: 2 },
    { path: "09LLM Wiki/c.md", content: "C", modifiedAt: 1 },
  ];

  assert.deepEqual(selectKnowledgeNotes(notes, 2, ["19发疯姥子/a.md"]).map((note) => note.path), ["03自媒体/b.md", "09LLM Wiki/c.md"]);
});

test("normalises a Qwen JSON response into exactly three traceable insights", () => {
  const parsed = normaliseInsightPayload(JSON.stringify({ insights: [
    { title: "先行动再调整", summary: "从小步开始。", source: "创作/内容系统.md", tags: ["行动"] },
    { title: "保护注意力", summary: "给深度工作留空白。", source: "工作/深度工作.md", tags: ["效率"] },
    { title: "复利来自复盘", summary: "规律回看有价值。", source: "生活/每周复盘.md", tags: ["成长"] },
    { title: "不应该出现", summary: "第四条", source: "x.md" },
  ] }));

  assert.equal(parsed.length, 3);
  assert.deepEqual(parsed[0], { title: "先行动再调整", summary: "从小步开始。", source: "创作/内容系统.md", tags: ["行动"] });
});
