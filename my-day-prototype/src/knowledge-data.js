const sensitivePath = /(账号|密码|password|secret|credential|token|key)/i;

export function selectKnowledgeNotes(notes, limit = 24, excludedPaths = []) {
  const excluded = new Set(excludedPaths);
  const candidates = notes.filter((note) => note?.path?.endsWith(".md") && !note.path.split("/").some((part) => part.startsWith(".")) && !sensitivePath.test(note.path));
  const available = candidates.filter((note) => !excluded.has(note.path));
  const source = available.length >= Math.min(limit, candidates.length) ? available : candidates;
  const groups = new Map();
  for (const note of source) {
    const folder = note.path.split("/")[0] || "未分类";
    groups.set(folder, [...(groups.get(folder) || []), note]);
  }
  const queues = [...groups.values()].map((items) => items.sort((left, right) => Number(right.modifiedAt || 0) - Number(left.modifiedAt || 0))).sort((left, right) => Number(right[0]?.modifiedAt || 0) - Number(left[0]?.modifiedAt || 0));
  const selected = [];
  while (selected.length < limit && queues.some((items) => items.length)) {
    for (const queue of queues) if (queue.length && selected.length < limit) selected.push(queue.shift());
  }
  return selected;
}

export function normaliseInsightPayload(value) {
  let parsed;
  try { parsed = typeof value === "string" ? JSON.parse(value) : value; } catch { return []; }
  const items = Array.isArray(parsed?.insights) ? parsed.insights : [];
  return items.slice(0, 3).map((item) => ({
    title: String(item?.title || "未命名洞见").trim(),
    summary: String(item?.summary || "").trim(),
    source: String(item?.source || "").trim(),
    tags: Array.isArray(item?.tags) ? item.tags.slice(0, 3).map((tag) => String(tag).trim()).filter(Boolean) : [],
  })).filter((item) => item.summary && item.source);
}
