import test from "node:test";
import assert from "node:assert/strict";
import { addIterationDecision, addProjectIteration, addProjectTaskToDay, addReviewPriorityToDay, createDefaultData, deleteIterationDecision, getLocalToday, getSavedTaskMap, isSameCalendarDay, markProjectTaskAddedToDay, moveTaskBetweenDays, normalizeData, orderedDateRange, projectIterationProgress, projectIterationTasks, projectNotesForDisplay, projectProgress, projectTaskScheduleLabel, reviewDraftForDate, reviewTextSections, reviewTomorrowItems, reviewsForMonth, scheduleProjectTaskOnDate, syncDailyProjectTasks, syncProjectTaskDone, toggleProjectNotePinned, updateIterationDecision, updateProjectNote, updateProjectStatus, upsertDailyReview } from "../src/local-data.js";

test("uses the device's local calendar date as today", () => {
  const now = new Date(2026, 8, 8, 0, 30);

  assert.equal(getLocalToday(now).getTime(), new Date(2026, 8, 8).getTime());
});

test("identifies today by calendar date rather than the selected date", () => {
  const today = new Date(2026, 8, 8, 8, 30);

  assert.equal(isSameCalendarDay(today, new Date(2026, 8, 8, 23, 59)), true);
  assert.equal(isSameCalendarDay(today, new Date(2026, 8, 9)), false);
});

test("moves a task to another day's list without changing the task", () => {
  const task = { id: 7, title: "整理优先级", done: false };
  const taskMap = {
    "2026-09-08": [task, { id: 8, title: "保留的事项", done: false }],
    "2026-09-09": [{ id: 9, title: "原有事项", done: true }],
  };

  const result = moveTaskBetweenDays(taskMap, "2026-09-08", "2026-09-09", 7);

  assert.deepEqual(result["2026-09-08"], [{ id: 8, title: "保留的事项", done: false }]);
  assert.deepEqual(result["2026-09-09"], [{ id: 9, title: "原有事项", done: true }, task]);
});

test("derives a project's progress from its completed tasks", () => {
  assert.equal(projectProgress({ tasks: [] }), 0);
  assert.equal(projectProgress({ tasks: [{ done: true }, { done: false }, { done: true }] }), 67);
});

test("filters project tasks by iteration and derives that iteration's progress", () => {
  const project = {
    tasks: [
      { id: 1, iterationId: "v1", done: true },
      { id: 2, iterationId: "v1", done: false },
      { id: 3, iterationId: "v2", done: true },
    ],
  };

  assert.deepEqual(projectIterationTasks(project, "v1").map((task) => task.id), [1, 2]);
  assert.equal(projectIterationProgress(project, "v1"), 50);
});

test("adds a project iteration without changing existing project data", () => {
  const projects = [{ id: 3, title: "OpenWe", iterations: [] }];
  const iteration = { id: "v1", version: "V1.0", title: "跑通基础流程", status: "active" };

  const result = addProjectIteration(projects, 3, iteration);

  assert.equal(result[0].title, "OpenWe");
  assert.deepEqual(result[0].iterations, [iteration]);
  assert.deepEqual(projects[0].iterations, []);
});

test("adds a pending decision to the selected iteration", () => {
  const projects = [{ id: 3, iterations: [{ id: "v1", decisions: [] }] }];
  const decision = { id: 8, content: "AI 回复是否读取历史聊天？", status: "discussing" };

  const result = addIterationDecision(projects, 3, "v1", decision);

  assert.deepEqual(result[0].iterations[0].decisions, [decision]);
});

test("updates only the selected pending decision", () => {
  const projects = [{ id: 3, iterations: [{ id: "v1", decisions: [
    { id: 8, content: "原待确定项", status: "discussing" },
    { id: 9, content: "保留的待确定项", status: "discussing" },
  ] }] }];

  const result = updateIterationDecision(projects, 3, "v1", 8, { content: "更新后的待确定项" });

  assert.equal(result[0].iterations[0].decisions[0].content, "更新后的待确定项");
  assert.equal(result[0].iterations[0].decisions[0].status, "discussing");
  assert.equal(result[0].iterations[0].decisions[1], projects[0].iterations[0].decisions[1]);
});

test("deletes only the selected pending decision", () => {
  const projects = [{ id: 3, iterations: [{ id: "v1", decisions: [
    { id: 8, content: "要删除的待确定项" },
    { id: 9, content: "保留的待确定项" },
  ] }] }];

  const result = deleteIterationDecision(projects, 3, "v1", 8);

  assert.deepEqual(result[0].iterations[0].decisions, [{ id: 9, content: "保留的待确定项" }]);
});

test("sorts pinned project notes first and toggles their pinned state", () => {
  const notes = [
    { id: 1, content: "较早的随记", createdAt: 100, pinned: false },
    { id: 2, content: "已置顶的随记", createdAt: 50, pinned: true },
    { id: 3, content: "最新的随记", createdAt: 200, pinned: false },
  ];

  assert.deepEqual(projectNotesForDisplay(notes).map((note) => note.id), [2, 3, 1]);
  assert.equal(toggleProjectNotePinned(notes, 3).find((note) => note.id === 3).pinned, true);
});

test("updates only the chosen project note while preserving its identity and pin state", () => {
  const notes = [
    { id: 1, content: "原来的想法", images: ["old-image"], pinned: true, createdAt: 100 },
    { id: 2, content: "不应变化", images: [], pinned: false, createdAt: 200 },
  ];

  const result = updateProjectNote(notes, 1, { content: "补充后的想法", images: ["new-image"] });

  assert.deepEqual(result[0], { id: 1, content: "补充后的想法", images: ["new-image"], pinned: true, createdAt: 100 });
  assert.equal(result[1], notes[1]);
});

test("updates only the selected project's workflow status", () => {
  const projects = [
    { id: 1, title: "保留项目", status: "active", tasks: [] },
    { id: 2, title: "要暂停的项目", status: "active", tasks: [] },
  ];

  const result = updateProjectStatus(projects, 2, "paused");

  assert.equal(result[0], projects[0]);
  assert.equal(result[1].status, "paused");
});

test("ignores unsupported project statuses", () => {
  const projects = [{ id: 1, status: "active", tasks: [] }];

  assert.equal(updateProjectStatus(projects, 1, "deleted"), projects);
});


test("orders a project date range so the start is never after the end", () => {
  assert.deepEqual(orderedDateRange("2026-09-16", "2026-09-15"), { startDate: "2026-09-15", endDate: "2026-09-16" });
  assert.deepEqual(orderedDateRange("2026-09-08", "2026-09-08"), { startDate: "2026-09-08", endDate: "" });
  assert.deepEqual(orderedDateRange("", "2026-09-15"), { startDate: "", endDate: "" });
});

test("formats a project task as either a single date or a date range", () => {
  const today = new Date(2026, 8, 8);

  assert.equal(projectTaskScheduleLabel({ startDate: "2026-09-12" }, today), "9月12日");
  assert.equal(projectTaskScheduleLabel({ startDate: "2026-09-10", endDate: "2026-09-12" }, today), "9月10日 - 9月12日");
});

test("adds a project task to a day only once", () => {
  const project = { id: 3, title: "项目", tasks: [{ id: 8, title: "项目待办", done: false }] };
  const once = addProjectTaskToDay({}, "2026-09-08", project, project.tasks[0]);
  const twice = addProjectTaskToDay(once, "2026-09-08", project, project.tasks[0]);

  assert.equal(once["2026-09-08"][0].projectId, 3);
  assert.equal(twice["2026-09-08"].length, 1);
});

test("scheduling an unplanned project task for today stores its date", () => {
  const projects = [{ id: 3, tasks: [{ id: 8, title: "项目待办", done: false }]}];
  const result = scheduleProjectTaskOnDate(projects, 3, 8, "2026-09-08");

  assert.equal(result[0].tasks[0].startDate, "2026-09-08");
  assert.equal(result[0].tasks[0].endDate, "");
});

test("remembers that a project task was added to a specific day", () => {
  const projects = [{ id: 3, tasks: [{ id: 8, title: "项目待办", done: false }]}];
  const result = markProjectTaskAddedToDay(projects, 3, 8, "2026-09-08");

  assert.deepEqual(result[0].tasks[0].addedToDateKeys, ["2026-09-08"]);
});

test("syncs completion from a daily project task back to its project", () => {
  const projects = [{ id: 3, status: "active", tasks: [{ id: 8, title: "项目待办", done: false }] }];

  const result = syncProjectTaskDone(projects, 3, 8, true)[0];
  assert.equal(result.tasks[0].done, true);
  assert.equal(result.status, "done");
});

test("syncs completion from a project task to all daily copies", () => {
  const taskMap = {
    "2026-09-08": [{ id: 1, projectId: 3, projectTaskId: 8, done: false }],
    "2026-09-09": [{ id: 2, projectId: 3, projectTaskId: 8, done: false }],
  };

  const result = syncDailyProjectTasks(taskMap, 3, 8, true);
  assert.equal(result["2026-09-08"][0].done, true);
  assert.equal(result["2026-09-09"][0].done, true);
});

test("keeps an intentionally empty saved task list empty", () => {
  assert.deepEqual(getSavedTaskMap({}), {});
});

test("normalizes incomplete saved data without losing valid values", () => {
  const data = normalizeData({
    taskMap: { "2026-09-07": [{ id: 7, title: "本地事项", done: true }] },
    goals: [{ id: 8, title: "本地目标" }],
  });

  assert.equal(data.taskMap["2026-09-07"][0].title, "本地事项");
  assert.equal(data.goals[0].title, "本地目标");
});

test("normalizes saved project iteration details", () => {
  const data = normalizeData({
    projects: [{
      id: 3,
      iterations: [{ id: "v1", version: "V1.0", title: "首个迭代", goals: ["完成基础功能", ""], decisions: [{ id: 2, content: "需要确认", status: "discussing" }] }],
    }],
  });

  assert.deepEqual(data.projects[0].iterations[0].goals, ["完成基础功能"]);
  assert.equal(data.projects[0].iterations[0].status, "planned");
  assert.equal(data.projects[0].iterations[0].decisions[0].content, "需要确认");
});

test("returns starter data for invalid saved data", () => {
  const data = normalizeData(null);

  assert.deepEqual(data, createDefaultData());
});

test("preserves an edited daily heading and supplies its default copy for older saved data", () => {
  const edited = normalizeData({ dayHeading: { title: "今天先完成最重要的一件事", subtitle: "慢慢来，也是在前进。" } });
  const olderData = normalizeData({ taskMap: {} });

  assert.deepEqual(edited.dayHeading, { title: "今天先完成最重要的一件事", subtitle: "慢慢来，也是在前进。" });
  assert.deepEqual(olderData.dayHeading, { title: "嗨，今天想先完成哪件小事？", subtitle: "不用一下子做完，勾掉一件就很棒。" });
});

test("marks saved goals at 100 percent as completed", () => {
  const data = normalizeData({
    goals: [
      { id: 1, title: "已完成目标", progress: 100, status: "active" },
      { id: 2, title: "进行中目标", progress: 99, status: "active" },
    ],
  });

  assert.equal(data.goals[0].status, "done");
  assert.equal(data.goals[1].status, "active");
});

test("removes the legacy default note while preserving real task notes", () => {
  const data = normalizeData({
    taskMap: {
      "2026-09-08": [
        { id: 1, title: "无备注任务", note: "这一天", done: false },
        { id: 2, title: "有备注任务", note: "专注 30 分钟", done: false },
      ],
    },
  });

  assert.equal(data.taskMap["2026-09-08"][0].note, "");
  assert.equal(data.taskMap["2026-09-08"][1].note, "专注 30 分钟");
});

test("preserves inspirations and provides an empty list for older saved data", () => {
  const withIdeas = normalizeData({
    inspirations: [{ id: 1, title: "做一个 AI 帮用户分析 Reddit 需求的工具", status: "pending" }],
  });
  const olderData = normalizeData({ taskMap: {} });

  assert.equal(withIdeas.inspirations[0].title, "做一个 AI 帮用户分析 Reddit 需求的工具");
  assert.deepEqual(olderData.inspirations, []);
});

test("stores only one daily review per date and keeps the newest date first", () => {
  const previous = [{ date: "2026-09-06", mood: "great", completed: "完成旧事项" }];
  const once = upsertDailyReview(previous, { date: "2026-09-08", mood: "calm", completed: "完成复盘模块" });
  const updated = upsertDailyReview(once, { date: "2026-09-08", mood: "great", completed: "优化复盘模块" });

  assert.equal(updated.length, 2);
  assert.deepEqual(updated.map((review) => review.date), ["2026-09-08", "2026-09-06"]);
  assert.equal(updated[0].completed, "优化复盘模块");
});

test("loads the selected day's review or starts a blank draft without carrying over another day", () => {
  const reviews = [
    { date: "2026-09-08", completed: "旧日完成", blockers: "旧日卡点", insight: "旧日收获", mood: "great", tomorrow: ["旧日计划"] },
    { date: "2026-09-09", completed: "今日完成", mood: "tired" },
  ];

  assert.deepEqual(reviewDraftForDate(reviews, "2026-09-08"), {
    completed: "旧日完成", blockers: "旧日卡点", insight: "旧日收获", mood: "great", tomorrow: ["旧日计划"],
  });
  assert.deepEqual(reviewDraftForDate(reviews, "2026-09-10"), {
    completed: "", blockers: "", insight: "", mood: "calm", tomorrow: [""],
  });
});

test("normalizes daily reviews and gives older saved data an empty review list", () => {
  const withReviews = normalizeData({ dailyReviews: [{ date: "2026-09-08", mood: "calm", tomorrow: ["安排用户测试"] }] });
  const olderData = normalizeData({ taskMap: {} });

  assert.equal(withReviews.dailyReviews[0].mood, "calm");
  assert.deepEqual(withReviews.dailyReviews[0].tomorrow, ["安排用户测试"]);
  assert.deepEqual(olderData.dailyReviews, []);
});

test("keeps any number of tomorrow priorities in a saved review", () => {
  const priorities = ["写方案", "用户访谈", "整理反馈", "运动", "读书"];
  const result = upsertDailyReview([], { date: "2026-09-08", tomorrow: priorities });

  assert.deepEqual(result[0].tomorrow, priorities);
});

test("shows only filled review sections and preserves the user's line breaks", () => {
  const sections = reviewTextSections({
    completed: "",
    blockers: "1. 系统熟悉得太慢\n2. 新需求直接接入",
    insight: "  ",
  });

  assert.deepEqual(sections, [{
    key: "blockers",
    label: "卡点",
    detailLabel: "问题 / 卡点",
    content: "1. 系统熟悉得太慢\n2. 新需求直接接入",
  }]);
});

test("hides empty tomorrow priorities without changing filled text", () => {
  assert.deepEqual(reviewTomorrowItems(["", "  ", "写方案\n拆解细节"]), ["写方案\n拆解细节"]);
  assert.deepEqual(reviewTomorrowItems(undefined), []);
});

test("filters review history by selected year and month", () => {
  const reviews = [{ date: "2026-09-08" }, { date: "2026-08-31" }, { date: "2025-09-01" }];

  assert.deepEqual(reviewsForMonth(reviews, "2026-09").map((review) => review.date), ["2026-09-08"]);
  assert.equal(reviewsForMonth(reviews, "").length, 3);
});

test("removes only the shipped demo daily reviews during saved-data normalization", () => {
  const data = normalizeData({
    dailyReviews: [
      { date: "2026-09-07", completed: "优化了每日复盘页面的交互细节", insight: "把问题问得更具体，反馈会更有价值" },
      { date: "2026-09-06", completed: "完成了项目首页的视觉改版", insight: "保持专注可以带来很大的正向反馈" },
      { date: "2026-09-08", completed: "我自己的真实复盘", insight: "今天的收获" },
    ],
  });

  assert.deepEqual(data.dailyReviews.map((review) => review.completed), ["我自己的真实复盘"]);
});

test("adds one selected review priority only to the supplied tomorrow date", () => {
  const result = addReviewPriorityToDay({}, "2026-09-10", "2026-09-09", "整理用户反馈", 99);

  assert.deepEqual(result["2026-09-10"], [{
    id: 99,
    title: "整理用户反馈",
    note: "来自每日复盘",
    done: false,
    color: "blue",
    reviewDate: "2026-09-09",
  }]);
  assert.equal(result["2026-09-09"], undefined);
});

test("does not add the same review priority to tomorrow twice", () => {
  const once = addReviewPriorityToDay({}, "2026-09-10", "2026-09-09", "整理用户反馈", 99);
  const twice = addReviewPriorityToDay(once, "2026-09-10", "2026-09-09", "整理用户反馈", 100);

  assert.equal(twice["2026-09-10"].length, 1);
});
