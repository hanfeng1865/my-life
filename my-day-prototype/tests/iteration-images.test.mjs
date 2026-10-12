import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeData, addIterationBug, updateIterationBug, addIterationDecision, updateIterationDecision } from '../src/local-data.js';
const image = 'data:image/png;base64,aGVsbG8=';
test('restores valid images on requirements, bugs and decisions and removes invalid attachments', () => {
  const data = normalizeData({ projects: [{ id: 1, tasks: [{ id: 2, title: '需求', images: [image, null, 'javascript:bad'] }], iterations: [{ id: 3, bugs: [{ id: 4, description: 'BUG', images: [image, 7] }], decisions: [{ id: 5, content: '待确定', images: [image, {}] }] }] }] });
  assert.deepEqual(data.projects[0].tasks[0].images, [image]);
  assert.deepEqual(data.projects[0].iterations[0].bugs[0].images, [image]);
  assert.deepEqual(data.projects[0].iterations[0].decisions[0].images, [image]);
});
test('image edits survive save/reload and status updates; deleting attachments persists', () => {
  let projects = [{ id: 1, tasks: [], iterations: [{ id: 3 }] }];
  projects = addIterationBug(projects, 1, 3, { id: 4, description: 'BUG', images: [image] });
  projects = addIterationDecision(projects, 1, 3, { id: 5, content: '待确定', images: [image] });
  projects = updateIterationBug(projects, 1, 3, 4, { status: 'done' });
  projects = updateIterationDecision(projects, 1, 3, 5, { content: '已编辑' });
  projects = normalizeData(JSON.parse(JSON.stringify({ projects }))).projects;
  assert.deepEqual(projects[0].iterations[0].bugs[0].images, [image]);
  assert.deepEqual(projects[0].iterations[0].decisions[0].images, [image]);
  projects = updateIterationBug(projects, 1, 3, 4, { images: [] });
  projects = updateIterationDecision(projects, 1, 3, 5, { images: [] });
  assert.deepEqual(normalizeData({ projects }).projects[0].iterations[0].bugs[0].images, []);
  assert.deepEqual(normalizeData({ projects }).projects[0].iterations[0].decisions[0].images, []);
});
