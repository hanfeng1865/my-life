export const STORAGE_VERSION = 1;

const defaultDayHeading = {
  title: "嗨，今天想先完成哪件小事？",
  subtitle: "不用一下子做完，勾掉一件就很棒。",
};

const shippedDemoReviewCompletions = new Set([
  "优化了每日复盘页面的交互细节",
  "完成了项目首页的视觉改版",
  "梳理了 AI Agent 模块的需求文档",
  "完成了目标管理模块的基础开发",
]);

function isShippedDemoReview(review) {
  return ["2026-09-07", "2026-09-06", "2026-09-05", "2026-09-04"].includes(review?.date)
    && shippedDemoReviewCompletions.has(review?.completed);
}

export function getLocalToday(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isSameCalendarDay(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

export function moveTaskBetweenDays(taskMap, sourceDateKey, targetDateKey, taskId) {
  if (sourceDateKey === targetDateKey) return taskMap;
  const sourceTasks = taskMap[sourceDateKey] || [];
  const task = sourceTasks.find((item) => item.id === taskId);
  if (!task) return taskMap;
  return {
    ...taskMap,
    [sourceDateKey]: sourceTasks.filter((item) => item.id !== taskId),
    [targetDateKey]: [...(taskMap[targetDateKey] || []), task],
  };
}

export function projectProgress(project) {
  const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
  return tasks.length ? Math.round(tasks.filter((task) => task.done).length / tasks.length * 100) : 0;
}

export function projectIterationTasks(project, iterationId) {
  const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
  return tasks.filter((task) => task.iterationId === iterationId);
}

export function projectIterationProgress(project, iterationId) {
  const tasks = projectIterationTasks(project, iterationId);
  return tasks.length ? Math.round(tasks.filter((task) => task.done).length / tasks.length * 100) : 0;
}

export function addProjectIteration(projects, projectId, iteration) {
  return projects.map((project) => project.id === projectId ? {
    ...project,
    iterations: [...(Array.isArray(project.iterations) ? project.iterations : []), iteration],
  } : project);
}

export function addIterationDecision(projects, projectId, iterationId, decision) {
  return projects.map((project) => project.id !== projectId ? project : {
    ...project,
    iterations: (project.iterations || []).map((iteration) => iteration.id !== iterationId ? iteration : {
      ...iteration,
      decisions: [...(Array.isArray(iteration.decisions) ? iteration.decisions : []), decision],
    }),
  });
}

export function updateIterationDecision(projects, projectId, iterationId, decisionId, update) {
  return projects.map((project) => project.id !== projectId ? project : {
    ...project,
    iterations: (project.iterations || []).map((iteration) => iteration.id !== iterationId ? iteration : {
      ...iteration,
      decisions: (iteration.decisions || []).map((decision) => (
        decision.id === decisionId ? { ...decision, ...update } : decision
      )),
    }),
  });
}

export function deleteIterationDecision(projects, projectId, iterationId, decisionId) {
  return projects.map((project) => project.id !== projectId ? project : {
    ...project,
    iterations: (project.iterations || []).map((iteration) => iteration.id !== iterationId ? iteration : {
      ...iteration,
      decisions: (iteration.decisions || []).filter((decision) => decision.id !== decisionId),
    }),
  });
}

export function projectNotesForDisplay(notes) {
  return (Array.isArray(notes) ? notes : []).slice().sort((left, right) => (
    Number(Boolean(right.pinned)) - Number(Boolean(left.pinned))
    || Number(right.createdAt || 0) - Number(left.createdAt || 0)
  ));
}

export function toggleProjectNotePinned(notes, noteId) {
  return (Array.isArray(notes) ? notes : []).map((note) => (
    note.id === noteId ? { ...note, pinned: !note.pinned } : note
  ));
}

export function updateProjectNote(notes, noteId, update) {
  return (Array.isArray(notes) ? notes : []).map((note) => (
    note.id === noteId ? { ...note, ...update } : note
  ));
}

export function updateProjectStatus(projects, projectId, status) {
  if (!["active", "paused", "done"].includes(status)) return projects;
  return projects.map((project) => project.id === projectId ? { ...project, status } : project);
}

export function orderedDateRange(startDate, endDate) {
  if (!startDate) return { startDate: "", endDate: "" };
  if (!endDate || endDate === startDate) return { startDate, endDate: "" };
  return startDate < endDate ? { startDate, endDate } : { startDate: endDate, endDate: startDate };
}

export function projectTaskScheduleLabel(task) {
  if (!task?.startDate) return "未安排";
  const format = (date) => `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`;
  const range = orderedDateRange(task.startDate, task.endDate);
  return range.endDate ? `${format(range.startDate)} - ${format(range.endDate)}` : format(range.startDate);
}

export function scheduleProjectTaskOnDate(projects, projectId, projectTaskId, startDate) {
  return projects.map((project) => project.id !== projectId ? project : {
    ...project,
    tasks: project.tasks.map((task) => task.id !== projectTaskId ? task : { ...task, startDate, endDate: task.endDate || "" }),
  });
}

export function markProjectTaskAddedToDay(projects, projectId, projectTaskId, dateKey) {
  return projects.map((project) => project.id !== projectId ? project : {
    ...project,
    tasks: project.tasks.map((task) => task.id !== projectTaskId ? task : {
      ...task,
      addedToDateKeys: [...new Set([...(task.addedToDateKeys || []), dateKey])],
    }),
  });
}

export function addProjectTaskToDay(taskMap, targetDateKey, project, projectTask) {
  const dayTasks = taskMap[targetDateKey] || [];
  const exists = dayTasks.some((task) => task.projectId === project.id && task.projectTaskId === projectTask.id);
  if (exists) return taskMap;
  return {
    ...taskMap,
    [targetDateKey]: [...dayTasks, {
      id: Date.now(),
      title: projectTask.title,
      note: `来自项目 · ${project.title}`,
      done: projectTask.done,
      color: "blue",
      projectId: project.id,
      projectTaskId: projectTask.id,
    }],
  };
}

export function addReviewPriorityToDay(taskMap, targetDateKey, reviewDateKey, title, id = Date.now()) {
  const normalizedTitle = title?.trim();
  if (!normalizedTitle) return taskMap;
  const dayTasks = taskMap[targetDateKey] || [];
  const alreadyAdded = dayTasks.some((task) => task.reviewDate === reviewDateKey && task.title === normalizedTitle);
  if (alreadyAdded) return taskMap;
  return {
    ...taskMap,
    [targetDateKey]: [...dayTasks, {
      id,
      title: normalizedTitle,
      note: "来自每日复盘",
      done: false,
      color: "blue",
      reviewDate: reviewDateKey,
    }],
  };
}

export function syncProjectTaskDone(projects, projectId, projectTaskId, done) {
  return projects.map((project) => {
    if (project.id !== projectId) return project;
    const tasks = (project.tasks || []).map((task) => task.id === projectTaskId ? { ...task, done } : task);
    return { ...project, tasks, status: project.status === "paused" ? "paused" : tasks.length && tasks.every((task) => task.done) ? "done" : "active" };
  });
}

export function syncDailyProjectTasks(taskMap, projectId, projectTaskId, done) {
  return Object.fromEntries(Object.entries(taskMap).map(([key, tasks]) => [key, tasks.map((task) => (
    task.projectId === projectId && task.projectTaskId === projectTaskId ? { ...task, done } : task
  ))]));
}

export function getSavedTaskMap(taskMap) {
  return taskMap && typeof taskMap === "object" ? taskMap : {};
}

export function upsertDailyReview(reviews, review) {
  const next = Array.isArray(reviews) ? reviews.filter((item) => item?.date !== review.date) : [];
  return [{ ...review, tomorrow: Array.isArray(review.tomorrow) ? review.tomorrow.filter(Boolean) : [] }, ...next]
    .sort((left, right) => right.date.localeCompare(left.date));
}

export function reviewDraftForDate(reviews, date) {
  const review = Array.isArray(reviews) ? reviews.find((item) => item?.date === date) : null;
  return {
    completed: review?.completed || "",
    blockers: review?.blockers || "",
    insight: review?.insight || "",
    mood: review?.mood || "calm",
    tomorrow: Array.isArray(review?.tomorrow) && review.tomorrow.length ? [...review.tomorrow] : [""],
  };
}

const dailyReviewTextFields = [
  { key: "completed", label: "完成", detailLabel: "完成" },
  { key: "blockers", label: "卡点", detailLabel: "问题 / 卡点" },
  { key: "insight", label: "收获", detailLabel: "收获" },
];

export function reviewTextSections(review) {
  return dailyReviewTextFields
    .filter(({ key }) => typeof review?.[key] === "string" && review[key].trim())
    .map((field) => ({ ...field, content: review[field.key] }));
}

export function reviewTomorrowItems(tomorrow) {
  return Array.isArray(tomorrow)
    ? tomorrow.filter((item) => typeof item === "string" && item.trim())
    : [];
}

export function reviewsForMonth(reviews, yearMonth) {
  const allReviews = Array.isArray(reviews) ? reviews : [];
  return yearMonth ? allReviews.filter((review) => review?.date?.startsWith(yearMonth)) : allReviews;
}

function normalizeTaskMap(taskMap) {
  return Object.fromEntries(Object.entries(getSavedTaskMap(taskMap)).map(([key, tasks]) => [
    key,
    Array.isArray(tasks) ? tasks.map((task) => task?.note === "这一天" ? { ...task, note: "" } : task) : [],
  ]));
}

export function createDefaultData() {
  return { version: STORAGE_VERSION, taskMap: {}, goals: [], inspirations: [], projects: [], dailyReviews: [], dayHeading: { ...defaultDayHeading } };
}

export function normalizeData(value) {
  if (!value || typeof value !== "object") return createDefaultData();
  return {
    version: STORAGE_VERSION,
    taskMap: normalizeTaskMap(value.taskMap),
    goals: Array.isArray(value.goals) ? value.goals.map((goal) => ({
      ...goal,
      status: Number(goal.progress) >= 100 ? "done" : goal.status || "active",
    })) : [],
    inspirations: Array.isArray(value.inspirations) ? value.inspirations : [],
    projects: Array.isArray(value.projects) ? value.projects.map((project) => ({
      ...project,
      iterations: Array.isArray(project?.iterations) ? project.iterations.filter(Boolean).map((iteration) => ({
        ...iteration,
        goals: Array.isArray(iteration.goals) ? iteration.goals.filter((goal) => typeof goal === "string" && goal.trim()) : [],
        decisions: Array.isArray(iteration.decisions) ? iteration.decisions.filter((decision) => decision && typeof decision.content === "string") : [],
        status: ["planned", "active", "done"].includes(iteration.status) ? iteration.status : "planned",
      })) : [],
      notes: Array.isArray(project?.notes) ? project.notes.filter((note) => note && typeof note.content === "string").map((note) => ({
        ...note,
        images: Array.isArray(note.images) ? note.images.filter((image) => typeof image === "string") : [],
        pinned: Boolean(note.pinned),
      })) : [],
    })) : [],
    dailyReviews: Array.isArray(value.dailyReviews) ? value.dailyReviews.map((review) => ({
      ...review,
      tomorrow: Array.isArray(review?.tomorrow) ? review.tomorrow.filter(Boolean) : [],
    })).filter((review) => typeof review?.date === "string" && !isShippedDemoReview(review)) : [],
    dayHeading: {
      title: typeof value.dayHeading?.title === "string" && value.dayHeading.title.trim() ? value.dayHeading.title.trim() : defaultDayHeading.title,
      subtitle: typeof value.dayHeading?.subtitle === "string" && value.dayHeading.subtitle.trim() ? value.dayHeading.subtitle.trim() : defaultDayHeading.subtitle,
    },
  };
}
