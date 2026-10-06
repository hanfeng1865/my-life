import { syncProjectTaskDone, syncDailyProjectTasks } from './local-data.js';

export function widgetDateKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function applyWidgetAction(data, action) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(action?.dateKey || '')) return data;
  const taskMap = data.taskMap || {};
  const tasks = taskMap[action.dateKey] || [];
  if (action.type === 'add') {
    const title = typeof action.title === 'string' ? action.title.trim() : '';
    if (!title) return data;
    return { ...data, taskMap: { ...taskMap, [action.dateKey]: [...tasks, { id: action.id || crypto.randomUUID(), title, note: '', color: 'blue', done: false }] } };
  }
  const task = tasks.find((item) => item.id === action.id);
  if (action.type !== 'complete' || !task || typeof action.done !== 'boolean') return data;
  let nextMap = { ...taskMap, [action.dateKey]: tasks.map((item) => item.id === action.id ? { ...item, done: action.done } : item) };
  let projects = data.projects || [];
  if (task.projectId && task.projectTaskId) {
    nextMap = syncDailyProjectTasks(nextMap, task.projectId, task.projectTaskId, action.done);
    projects = syncProjectTaskDone(projects, task.projectId, task.projectTaskId, action.done);
  }
  return { ...data, taskMap: nextMap, projects };
}
