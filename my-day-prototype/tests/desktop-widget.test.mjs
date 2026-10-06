import test from 'node:test';
import assert from 'node:assert/strict';
import * as widget from '../src/widget-data.js';

test('widget uses the local calendar date, including midnight rollover', () => {
  assert.equal(widget.widgetDateKey?.(new Date(2026, 9, 6, 23, 59)), '2026-10-06');
  assert.equal(widget.widgetDateKey?.(new Date(2026, 9, 7)), '2026-10-07');
});
test('adding a widget task preserves other days and unrelated saved data', () => {
  const data = { taskMap: { '2026-10-05': [{ id: 1, title: 'yesterday' }] }, projects: [], goals: [{ id: 3 }] };
  const next = widget.applyWidgetAction?.(data, { type: 'add', dateKey: '2026-10-06', title: '  今天的小事  ', id: 'new' });
  assert.equal(next?.taskMap['2026-10-06'][0].title, '今天的小事');
  assert.deepEqual(next.taskMap['2026-10-05'], data.taskMap['2026-10-05']);
  assert.deepEqual(next.goals, data.goals);
  assert.equal(data.taskMap['2026-10-06'], undefined);
});
test('widget completion updates linked project and all daily copies; undo restores progress', () => {
  const data = { taskMap: { '2026-10-06': [{ id: 1, projectId: 2, projectTaskId: 3, done: false }], '2026-10-07': [{ id: 4, projectId: 2, projectTaskId: 3, done: false }] }, projects: [{ id: 2, tasks: [{ id: 3, done: false }], status: 'active' }] };
  const next = widget.applyWidgetAction?.(data, { type: 'complete', dateKey: '2026-10-06', id: 1, done: true });
  assert.equal(next?.taskMap['2026-10-06'][0].done, true);
  assert.equal(next.taskMap['2026-10-07'][0].done, true);
  assert.equal(next.projects[0].status, 'done');
  const undo = widget.applyWidgetAction(next, { type: 'complete', dateKey: '2026-10-06', id: 1, done: false });
  assert.equal(undo.projects[0].status, 'active');
  assert.equal(undo.projects[0].tasks[0].done, false);
});
test('blank input and stale task commands cannot change data', () => {
  const data = { taskMap: {}, projects: [] };
  assert.equal(widget.applyWidgetAction?.(data, { type: 'add', dateKey: '2026-10-06', title: '  ' }), data);
  assert.equal(widget.applyWidgetAction?.(data, { type: 'complete', dateKey: '2026-10-06', id: 99, done: true }), data);
});
