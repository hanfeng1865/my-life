import test from "node:test";
import assert from "node:assert/strict";
import { addIterationBug, updateIterationBug, deleteIterationBug, normalizeData } from "../src/local-data.js";

const fixture = () => [
  { id: 1, tasks: [{ id: 10, done: false }], notes: [{ id: 20, content: "保留随记" }], iterations: [
    { id: "v1", decisions: [{ id: 30, content: "保留待确定项" }] },
    { id: "v2", bugs: [{ id: 40, description: "另一迭代的 BUG", status: "pending" }] },
  ] },
  { id: 2, iterations: [{ id: "v1", bugs: [{ id: 50, description: "另一项目的 BUG", status: "done" }] }] },
];

test("stores bugs within one iteration and preserves unrelated records", () => {
  const original = fixture();
  let projects = addIterationBug(original, 1, "v1", { id: 60, description: "  保存时报错  ", status: "pending" });
  assert.equal(projects[0].iterations[0].bugs[0].description, "保存时报错");
  assert.equal(original[0].iterations[0].bugs, undefined);
  for (const status of ["done", "ignored", "pending"]) {
    projects = updateIterationBug(projects, 1, "v1", 60, { status });
    assert.equal(projects[0].iterations[0].bugs[0].status, status);
  }
  projects = updateIterationBug(projects, 1, "v1", 60, { description: "已更新的描述" });
  assert.equal(projects[0].iterations[0].bugs[0].description, "已更新的描述");
  assert.equal(projects[0].iterations[1], original[0].iterations[1]);
  assert.equal(projects[1], original[1]);
  assert.equal(projects[0].tasks, original[0].tasks);
  assert.equal(projects[0].notes, original[0].notes);
  assert.equal(projects[0].iterations[0].decisions, original[0].iterations[0].decisions);
  projects = deleteIterationBug(projects, 1, "v1", 60);
  assert.deepEqual(projects[0].iterations[0].bugs, []);
  assert.equal(projects[0].iterations[1], original[0].iterations[1]);
});

test("loads older data safely and preserves bugs through a saved-data round trip", () => {
  const older = normalizeData({ projects: fixture() });
  assert.deepEqual(older.projects[0].iterations[0].bugs, []);
  const projects = addIterationBug(older.projects, 1, "v1", { id: 60, description: "首行\n第二行", status: "ignored" });
  const loaded = normalizeData(JSON.parse(JSON.stringify({ ...older, projects })));
  assert.deepEqual(loaded.projects[0].iterations[0].bugs, projects[0].iterations[0].bugs);
  assert.deepEqual(loaded.projects[0].tasks, older.projects[0].tasks);
});

test("rejects blank descriptions and normalizes invalid saved bug entries", () => {
  const projects = fixture();
  assert.equal(addIterationBug(projects, 1, "v1", { description: "  " }), projects);
  const added = addIterationBug(projects, 1, "v1", { id: 60, description: "原描述", status: "pending" });
  const edited = updateIterationBug(added, 1, "v1", 60, { description: " " });
  assert.equal(edited[0].iterations[0].bugs[0], added[0].iterations[0].bugs[0]);
  const data = normalizeData({ projects: [{ id: 1, iterations: [{ id: "v1", bugs: [null, {}, { description: " " }, { id: 70, description: "恢复的记录", status: "unknown" }] }] }] });
  assert.deepEqual(data.projects[0].iterations[0].bugs, [{ id: 70, description: "恢复的记录", status: "pending" }]);
});
