import { applyWidgetAction } from "./widget-data.js";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Airplane,
  Archive,
  ArrowLeft,
  ArrowRight,
  Barbell,
  BookOpen,
  Brain,
  CalendarBlank,
  CalendarCheck,
  Camera,
  CaretDown,
  Check,
  Code,
  FileImage,
  Flag,
  FolderOpen,
  Heart,
  Leaf,
  Laptop,
  Lightbulb,
  ListChecks,
  MusicNote,
  Palette,
  Paperclip,
  Pause,
  PencilSimple,
  PiggyBank,
  Play,
  Plus,
  PushPin,
  RocketLaunch,
  Target,
  Trash,
  Trophy,
  X,
  YoutubeLogo,
} from "@phosphor-icons/react";
import { CompletionCelebration } from "./CompletionCelebration.jsx";
import {
  BUG_STATUSES,
  addIterationBug,
  addIterationDecision,
  addProjectIteration,
  addProjectTaskToDay,
  addReviewPriorityToDay,
  deleteIterationBug,
  deleteIterationDecision,
  getLocalToday,
  getSavedTaskMap,
  isSameCalendarDay,
  markProjectTaskAddedToDay,
  moveTaskBetweenDays,
  normalizeData,
  orderedDateRange,
  projectIterationTasks,
  projectNotesForDisplay,
  projectProgress,
  projectTaskScheduleLabel,
  reviewDraftForDate,
  reviewTextSections,
  reviewTomorrowItems,
  reviewsForMonth,
  scheduleProjectTaskOnDate,
  syncDailyProjectTasks,
  syncProjectTaskDone,
  toggleProjectNotePinned,
  updateIterationBug,
  updateIterationDecision,
  updateProjectNote,
  updateProjectStatus,
  upsertDailyReview,
} from "./local-data.js";
import { focusProgress, formatFocusTime } from "./focus-session.js";
import { StatusSelect } from "./StatusSelect.jsx";
import { KnowledgeWorkspace } from "./KnowledgeWorkspace.jsx";

const week = ["日", "一", "二", "三", "四", "五", "六"];
const TASK_LONG_PRESS_MS = 480;
const dateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const shiftDate = (date, days) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const parseLocalDate = (value) => new Date(`${value}T00:00:00`);
const daySpan = (start, end) =>
  Math.max(
    0,
    Math.round((parseLocalDate(end) - parseLocalDate(start)) / 86400000),
  );
const goalGroupForDates = (start, end) => {
  const span = daySpan(start, end);
  return span <= 120 ? "short" : span <= 400 ? "mid" : "long";
};
const goalDatesText = (start, end) =>
  `${start.slice(0, 7).replace("-", "/")} - ${end.slice(0, 7).replace("-", "/")}`;
const starterTasks = [
  {
    id: 1,
    title: "写今日内容选题",
    note: "专注 30 分钟",
    done: false,
    color: "blue",
  },
  {
    id: 2,
    title: "回复 AI 社群消息",
    note: "重复 · 每个工作日",
    done: false,
    color: "green",
  },
  {
    id: 3,
    title: "散步 20 分钟",
    note: "给自己充个电",
    done: true,
    color: "yellow",
  },
];
const starterProjects = [
  {
    id: 201,
    title: "OpenWe MVP",
    description: "完成核心功能原型，准备进入用户验证。",
    icon: "laptop",
    status: "active",
    endDate: "2026-09-30",
    nextStep: "完成联系人模块",
    createdAt: 1767600000000,
    iterations: [
      {
        id: "openwe-v10",
        version: "V1.0",
        title: "跑通基础聊天",
        startDate: "2026-09-01",
        endDate: "2026-09-10",
        status: "done",
        goals: ["完成核心聊天流程", "验证客户信息管理体验"],
      },
      {
        id: "openwe-v11",
        version: "V1.1",
        title: "增加 AI 能力",
        startDate: "2026-09-11",
        endDate: "2026-09-18",
        status: "done",
        goals: ["接入 AI 辅助能力", "完成案例库原型"],
      },
      {
        id: "openwe-v12",
        version: "V1.2",
        title: "优化销售跟进",
        startDate: "2026-09-19",
        endDate: "2026-09-28",
        status: "active",
        goals: ["提升销售跟进效率，减少人工操作", "完成 AI 自动回复和客户标签能力", "跑通销售待办闭环"],
      },
    ],
    tasks: [
      { id: 1, title: "完成客户管理 UI", done: true, iterationId: "openwe-v10" },
      { id: 2, title: "完成案例库 UI", done: true, iterationId: "openwe-v11" },
      {
        id: 3,
        title: "完成联系人模块",
        done: false,
        startDate: "2026-09-08",
        endDate: "2026-09-15",
        iterationId: "openwe-v12",
      },
      { id: 4, title: "梳理 AI Agent 页面", done: false, iterationId: "openwe-v12" },
    ],
  },
  {
    id: 202,
    title: "个人品牌官网",
    description: "做一个简洁、有信任感的个人展示官网。",
    icon: "creative",
    status: "active",
    endDate: "2026-09-18",
    nextStep: "确定首页文案",
    createdAt: 1767513600000,
    tasks: [
      { id: 1, title: "确定页面结构", done: true },
      { id: 2, title: "选择视觉风格", done: true },
      { id: 3, title: "确定首页文案", done: false },
      { id: 4, title: "补充案例模块", done: false },
    ],
  },
  {
    id: 203,
    title: "日程管理客户端",
    description: "先完成基础界面，后续再补交互和本地存储。",
    icon: "code",
    status: "paused",
    endDate: "2026-10-10",
    nextStep: "整理功能范围",
    createdAt: 1767427200000,
    tasks: [
      { id: 1, title: "完成我的一天页面", done: true },
      { id: 2, title: "完成我的目标页面", done: true },
      { id: 3, title: "完成我的灵感页面", done: true },
      { id: 4, title: "设计项目管理模块", done: false },
    ],
  },
];
const goalIconOptions = [
  ["video", "视频", YoutubeLogo],
  ["health", "运动", Barbell],
  ["book", "学习", BookOpen],
  ["laptop", "产品", Laptop],
  ["growth", "成长", RocketLaunch],
  ["career", "职业", Trophy],
  ["money", "财务", PiggyBank],
  ["heart", "关系", Heart],
  ["mind", "思考", Brain],
  ["creative", "创作", Palette],
  ["photo", "影像", Camera],
  ["music", "音乐", MusicNote],
  ["travel", "旅行", Airplane],
  ["habit", "习惯", Leaf],
  ["idea", "灵感", Lightbulb],
  ["code", "编程", Code],
];

function ConfirmDelete({ title, itemType, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <div
        className="confirm-modal delete-confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="confirm-icon">
          <Trash size={24} weight="fill" />
        </span>
        <h2 id="delete-title">确认删除{itemType}？</h2>
        <p>“{title}”删除后无法恢复。</p>
        <div className="modal-actions">
          <button type="button" className="cancel" onClick={onCancel}>
            取消
          </button>
          <button type="button" className="danger" onClick={onConfirm}>
            <Trash size={17} weight="bold" /> 确认删除
          </button>
        </div>
      </div>
    </div>
  );
}

function EditableDayCopy({ value, onSave, kind }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);
  const save = () => {
    const next = draft.trim();
    if (next) onSave(next);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };
  const keyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      save();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    }
  };
  const label = kind === "title" ? "编辑今日标题" : "编辑今日提示";
  if (editing)
    return kind === "title" ? (
      <input
        ref={inputRef}
        className="day-copy-input title"
        aria-label={label}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={save}
        onKeyDown={keyDown}
      />
    ) : (
      <input
        ref={inputRef}
        className="day-copy-input subtitle"
        aria-label={label}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={save}
        onKeyDown={keyDown}
      />
    );
  const Tag = kind === "title" ? "h1" : "p";
  return (
    <Tag
      className="editable-day-copy"
      tabIndex={0}
      role="button"
      aria-label={label}
      title="点击编辑"
      onClick={() => setEditing(true)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setEditing(true);
        }
      }}
    >
      {value}
      <PencilSimple
        className="editable-day-copy__icon"
        size={kind === "title" ? 21 : 16}
        weight="bold"
      />
    </Tag>
  );
}

function EditableBannerText({
  value,
  onSave,
  tag: Tag = "h1",
  className = "",
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);
  const save = () => {
    const next = draft.trim();
    if (next) onSave(next);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };
  const keyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };
  if (editing)
    return (
      <input
        ref={inputRef}
        className={`banner-edit-input ${className}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={keyDown}
      />
    );
  return (
    <Tag
      className={`banner-editable ${className}`}
      onClick={() => setEditing(true)}
      title="点击编辑"
    >
      {value}
      <PencilSimple className="banner-edit-icon" size={15} weight="bold" />
    </Tag>
  );
}

function FocusDurationPicker({ task, onClose, onStart }) {
  const [minutes, setMinutes] = useState(30);
  return (
    <div
      className="modal-backdrop focus-picker-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="focus-duration-picker"
        aria-modal="true"
        role="dialog"
        aria-labelledby="focus-picker-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="focus-close"
          type="button"
          aria-label="关闭"
          onClick={onClose}
        >
          <X size={22} />
        </button>
        <span className="focus-picker-icon">
          <Target size={27} weight="fill" />
        </span>
        <p>给这一件事留出一段不被打扰的时间</p>
        <h2 id="focus-picker-title">{task.title}</h2>
        <div
          className="focus-duration-options"
          role="group"
          aria-label="选择专注时长"
        >
          {[15, 30, 45, 60].map((value) => (
            <button
              type="button"
              className={minutes === value ? "selected" : ""}
              key={value}
              onClick={() => setMinutes(value)}
            >
              {value}
              <small>分钟</small>
            </button>
          ))}
        </div>
        <button
          className="focus-start-button"
          type="button"
          onClick={() => onStart(minutes)}
        >
          <Play size={19} weight="fill" /> 开始专注
        </button>
      </section>
    </div>
  );
}

function FocusSession({ task, minutes, onExit }) {
  const totalSeconds = minutes * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioMenuOpen, setAudioMenuOpen] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const audioRef = useRef(null);
  const isDesktop = Boolean(window.desktopData?.listFocusAudio);
  useEffect(() => {
    if (!isDesktop) return;
    window.desktopData
      .listFocusAudio()
      .then((items) => {
        setTracks(items);
        setSelectedTrack((current) => current || items[0] || null);
      })
      .catch(() => setTracks([]));
  }, [isDesktop]);
  useEffect(() => {
    const timer = window.setInterval(
      () => setRemainingSeconds((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (remainingSeconds === 0) audioRef.current?.pause();
  }, [remainingSeconds]);
  useEffect(() => () => audioRef.current?.pause(), []);
  const toggleAudio = async () => {
    const audio = audioRef.current;
    if (!audio || !selectedTrack) return;
    if (audio.paused) {
      try {
        await audio.play();
        setAudioPlaying(true);
      } catch {
        setAudioPlaying(false);
      }
    } else {
      audio.pause();
      setAudioPlaying(false);
    }
  };
  const chooseTrack = (track) => {
    audioRef.current?.pause();
    setAudioPlaying(false);
    setSelectedTrack(track);
    setAudioMenuOpen(false);
  };
  const addBrowserTracks = (event) => {
    const nextTracks = [...event.target.files].map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    if (!nextTracks.length) return;
    setTracks((current) => [...current, ...nextTracks]);
    chooseTrack(nextTracks[0]);
  };
  const progress = focusProgress(remainingSeconds, totalSeconds);
  return (
    <section className="focus-session" aria-label="专注模式">
      <audio
        ref={audioRef}
        loop
        src={selectedTrack?.url}
        onPlay={() => setAudioPlaying(true)}
        onPause={() => setAudioPlaying(false)}
      />
      <div className="focus-session__glow focus-session__glow--one" />
      <div className="focus-session__glow focus-session__glow--two" />
      <div className="focus-window-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <button className="focus-exit" type="button" onClick={onExit}>
        <ArrowLeft size={22} weight="bold" /> 退出专注
      </button>
      <div className="focus-session__content">
        <h1>{task.title}</h1>
        <div className="focus-clock">
          <svg viewBox="0 0 340 340" aria-hidden="true">
            <circle className="focus-ring-track" cx="170" cy="170" r="157" />
            <circle
              className="focus-ring-progress"
              cx="170"
              cy="170"
              r="157"
              pathLength="100"
              strokeDasharray={`${progress} 100`}
            />
          </svg>
          <div>
            <strong>{formatFocusTime(remainingSeconds)}</strong>
            <span>/ {formatFocusTime(totalSeconds)}</span>
          </div>
        </div>
        {remainingSeconds === 0 ? (
          <p className="focus-finished">本次专注完成，做得很好。</p>
        ) : null}
      </div>
      <div className="focus-audio">
        <button
          className="focus-audio-play"
          type="button"
          onClick={toggleAudio}
          disabled={!selectedTrack}
          aria-label={audioPlaying ? "暂停专注音频" : "播放专注音频"}
        >
          {audioPlaying ? (
            <Pause size={25} weight="fill" />
          ) : (
            <Play size={25} weight="fill" />
          )}
        </button>
        <button
          className="focus-audio-trigger"
          type="button"
          onClick={() => setAudioMenuOpen((open) => !open)}
          aria-expanded={audioMenuOpen}
        >
          <span>
            <small>专注音频</small>
            <strong>{selectedTrack?.name || "选择本地音频"}</strong>
          </span>
          <CaretDown size={18} weight="bold" />
        </button>
        {audioMenuOpen && (
          <div className="focus-audio-menu">
            {tracks.length ? (
              tracks.map((track) => (
                <button
                  type="button"
                  key={track.url}
                  className={selectedTrack?.url === track.url ? "selected" : ""}
                  onClick={() => chooseTrack(track)}
                >
                  <MusicNote size={17} weight="fill" /> {track.name}
                </button>
              ))
            ) : (
              <p>还没有可播放的音频</p>
            )}
            {isDesktop ? (
              <button
                className="focus-audio-folder"
                type="button"
                onClick={() => window.desktopData.openFocusAudioFolder()}
              >
                <FolderOpen size={17} /> 打开音频文件夹
              </button>
            ) : (
              <label className="focus-audio-folder">
                <FileImage size={17} /> 选择音频文件
                <input
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={addBrowserTracks}
                />
              </label>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function DayCard({
  date,
  active,
  isToday,
  tasks,
  dragTask,
  dragOverDateKey,
  onSelect,
  onAdd,
  onToggle,
  onEditTask,
  onDeleteTask,
  onFocus = (task) =>
    window.dispatchEvent(new CustomEvent("start-focus", { detail: task })),
  onTaskPressStart,
  onTaskPressEnd,
  onTaskPressMove,
}) {
  const label = `${date.getMonth() + 1}/${String(date.getDate()).padStart(2, "0")}`;
  const key = dateKey(date);
  return (
    <article
      data-day-key={key}
      className={`day-card ${active ? "is-active" : ""} ${dragOverDateKey === key && dragTask?.sourceDateKey !== key ? "is-drop-target" : ""}`}
      onClick={onSelect}
    >
      <header className="day-card__header">
        <div>
          {isToday && <span className="today-chip">今</span>}
          <span>
            {label} 周{week[date.getDay()]}
          </span>
        </div>
        <button
          className="icon-button quiet"
          aria-label="新增待办"
          onClick={(event) => {
            event.stopPropagation();
            onAdd();
          }}
        >
          <Plus size={22} />
        </button>
      </header>
      <div className="task-list">
        {tasks.length ? (
          [...tasks]
            .sort((left, right) => Number(left.done) - Number(right.done))
            .map((task) => (
              <div
                className={`task-row ${task.done ? "is-done" : ""} ${dragTask?.id === task.id && dragTask.sourceDateKey === key ? "is-dragging" : ""}`}
                key={task.id}
                onPointerDown={(event) => onTaskPressStart(event, key, task)}
                onPointerMove={onTaskPressMove}
                onPointerUp={onTaskPressEnd}
                onPointerCancel={onTaskPressEnd}
              >
                <button
                  className="task-toggle"
                  aria-label={`完成待办：${task.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggle(task.id);
                  }}
                >
                  <span className={`check-box ${task.color}`}>
                    {task.done && <Check size={14} weight="bold" />}
                  </span>
                </button>
                <button
                  className="task-edit"
                  aria-label={`编辑待办：${task.title}`}
                  title="点击编辑，长按拖到其他日期"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEditTask(task);
                  }}
                >
                  <span className="task-copy">
                    <strong>{task.title}</strong>
                    {task.note && <small>{task.note}</small>}
                  </span>
                </button>
                {!task.done && (
                  <button
                    className="task-focus"
                    aria-label={`开始专注：${task.title}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onFocus(task);
                    }}
                  >
                    <Play size={14} weight="fill" /> 开始专注
                  </button>
                )}
                <button
                  className="task-delete"
                  aria-label="删除待办"
                  title={`删除${task.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteTask(task);
                  }}
                >
                  <Trash size={17} />
                </button>
              </div>
            ))
        ) : (
          <div className="empty-day">
            <img
              src="assets/mascot-planner-blue-v2.png"
              alt="正在写计划的 IP 小助手"
            />
            <span>这一天还是空白页，写点什么吧！</span>
          </div>
        )}
      </div>
    </article>
  );
}

function RepeatFields({ repeat, setRepeat }) {
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);
  return (
    <div className="repeat-area">
      <label>重复方式</label>
      <div className="repeat-options">
        {[
          { value: "none", label: "不重复" },
          { value: "range", label: "日期范围" },
          { value: "weekly", label: "每周重复" },
        ].map((option) => (
          <button
            type="button"
            key={option.value}
            className={repeat === option.value ? "selected" : ""}
            onClick={() => setRepeat(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {repeat === "range" && (
        <div className="date-line">
          <input aria-label="开始日期" type="date" defaultValue="2026-09-07" />
          <span>至</span>
          <input aria-label="结束日期" type="date" defaultValue="2026-09-30" />
        </div>
      )}
      {repeat === "weekly" && (
        <div className="weekly-picker">
          <span className="week-label">重复日</span>
          <div>
            {week.map((day, index) => (
              <button
                type="button"
                key={day}
                className={selectedDays.includes(index) ? "picked" : ""}
                onClick={() =>
                  setSelectedDays((current) =>
                    current.includes(index)
                      ? current.filter((item) => item !== index)
                      : [...current, index],
                  )
                }
              >
                周{day}
              </button>
            ))}
          </div>
          <div className="date-line compact">
            <input
              aria-label="重复截止日期"
              type="date"
              defaultValue="2026-10-31"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AddTask({ onClose, onSave, selectedDate, initialTitle = "" }) {
  const [repeat, setRepeat] = useState("none");
  const [title, setTitle] = useState(initialTitle);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <form
        className="task-modal"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (title.trim()) onSave(title, repeat);
        }}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">安排给自己</span>
            <h2>新建一件小事</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={22} />
          </button>
        </div>
        <label className="field-label">
          事项名称
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：整理明天的优先事项"
          />
        </label>
        <RepeatFields repeat={repeat} setRepeat={setRepeat} />
        <div className="modal-actions">
          <button type="button" className="cancel" onClick={onClose}>
            先不加了
          </button>
          <button className="save" type="submit">
            <Plus size={18} weight="bold" /> 加入我的一天
          </button>
        </div>
      </form>
    </div>
  );
}

function EditTask({ task, onClose, onSave }) {
  const [title, setTitle] = useState(task.title);
  const [note, setNote] = useState(task.note || "");
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <form
        className="task-modal"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (title.trim())
            onSave({ ...task, title: title.trim(), note: note.trim() });
        }}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">调整一下安排</span>
            <h2>编辑这件小事</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={22} />
          </button>
        </div>
        <label className="field-label">
          事项名称
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="field-label">
          备注
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="例如：专注 30 分钟"
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="cancel" onClick={onClose}>
            取消
          </button>
          <button className="save" type="submit">
            <Check size={18} weight="bold" /> 保存修改
          </button>
        </div>
      </form>
    </div>
  );
}

function IconPicker({ value, onChange }) {
  return (
    <div className="icon-picker" role="group" aria-label="目标图标">
      {goalIconOptions.map(([type, label, Icon]) => (
        <button
          key={type}
          type="button"
          className={value === type ? "selected" : ""}
          onClick={() => onChange(type)}
          title={label}
          aria-label={label}
        >
          <Icon size={20} weight="fill" />
        </button>
      ))}
    </div>
  );
}

function NewGoal({ onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [next, setNext] = useState("");
  const [icon, setIcon] = useState("book");
  const [start, setStart] = useState("2026-09-07");
  const [end, setEnd] = useState("2026-10-07");
  const [progress, setProgress] = useState(0);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <form
        className="task-modal goal-modal"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (title.trim() && end >= start)
            onSave({
              title: title.trim(),
              description: description.trim(),
              next,
              icon,
              start,
              end,
              progress,
            });
        }}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">给未来一点方向</span>
            <h2>新建一个目标</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={22} />
          </button>
        </div>
        <label className="field-label">
          目标名称
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：完成一份个人作品集"
          />
        </label>
        <label className="field-label">
          目标说明
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="写下一句说明，它会显示在目标名称下面"
            rows="2"
          />
        </label>
        <label className="field-label">
          选一个图标
          <IconPicker value={icon} onChange={setIcon} />
        </label>
        <label className="field-label">
          下一步可以做什么？
          <input
            value={next}
            onChange={(event) => setNext(event.target.value)}
            placeholder="例如：挑选 3 个作品"
          />
        </label>
        <div className="date-pair">
          <label className="field-label">
            开始日期
            <input
              type="date"
              value={start}
              onChange={(event) => setStart(event.target.value)}
            />
          </label>
          <label className="field-label">
            结束日期
            <input
              type="date"
              value={end}
              min={start}
              onChange={(event) => setEnd(event.target.value)}
            />
          </label>
        </div>
        <label className="field-label">
          完成进度
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(event) => setProgress(Number(event.target.value))}
          />
          <span className="range-value">{progress}%</span>
        </label>
        <div className="modal-actions">
          <button type="button" className="cancel" onClick={onClose}>
            先不加了
          </button>
          <button className="save" type="submit">
            <Target size={18} weight="bold" /> 保存目标
          </button>
        </div>
      </form>
    </div>
  );
}

function EditGoal({ goal, onClose, onSave }) {
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description);
  const [next, setNext] = useState(goal.next);
  const [icon, setIcon] = useState(goal.type);
  const [start, setStart] = useState(goal.startDate || "2026-09-07");
  const [end, setEnd] = useState(goal.endDate || "2026-10-07");
  const [progress, setProgress] = useState(goal.progress);
  const [status, setStatus] = useState(goal.status);
  const changeStatus = (nextStatus) => {
    setStatus(nextStatus);
    if (nextStatus === "done") setProgress(100);
    else if (status === "done" && Number(progress) === 100) setProgress(90);
  };
  return (
    <div
      className="modal-backdrop goal-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <form
        className="task-modal goal-modal goal-modal-shell"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (title.trim() && end >= start)
            onSave({
              ...goal,
              type: icon,
              title: title.trim(),
              description: description.trim(),
              next: next.trim() || "写下第一步",
              startDate: start,
              endDate: end,
              group: goalGroupForDates(start, end),
              dates: goalDatesText(start, end),
              daysLeft: daySpan("2026-09-07", end),
              progress: Number(progress),
              status: Number(progress) >= 100 ? "done" : status,
            });
        }}
      >
        <div className="goal-modal-hero">
          <div className="goal-modal-mark">
            <GoalIcon type={icon} />
          </div>
          <div>
            <span>GOAL WORKSHOP</span>
            <h2>编辑目标</h2>
            <p>把方向调清楚，下一步就会更轻松。</p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={22} />
          </button>
        </div>
        <div className="goal-form-body">
          <section className="goal-form-section">
            <div className="goal-form-section__title">
              <span>1</span>
              <div>
                <strong>目标内容</strong>
                <small>一句话说清楚你想完成什么</small>
              </div>
            </div>
            <label className="field-label">
              目标名称
              <input
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label className="field-label">
              目标说明
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows="2"
              />
            </label>
            <label className="field-label">
              下一步行动
              <input
                value={next}
                onChange={(event) => setNext(event.target.value)}
                placeholder="写下一个可以马上开始的小动作"
              />
            </label>
          </section>
          <section className="goal-form-section">
            <div className="goal-form-section__title">
              <span>2</span>
              <div>
                <strong>时间与图标</strong>
                <small>给目标一个清晰的时间边界</small>
              </div>
            </div>
            <label className="field-label icon-field">
              目标图标
              <IconPicker value={icon} onChange={setIcon} />
            </label>
            <div className="date-pair">
              <label className="field-label">
                开始日期
                <input
                  type="date"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                />
              </label>
              <label className="field-label">
                结束日期
                <input
                  type="date"
                  value={end}
                  min={start}
                  onChange={(event) => setEnd(event.target.value)}
                />
              </label>
            </div>
          </section>
          <section className="goal-form-section goal-progress-control">
            <div className="goal-form-section__title">
              <span>3</span>
              <div>
                <strong>进度与状态</strong>
                <small>随时更新，保持节奏感</small>
              </div>
            </div>
            <label className="field-label goal-range-label">
              <span>
                完成进度 <b>{progress}%</b>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setProgress(value);
                  if (value >= 100) setStatus("done");
                  else if (status === "done") setStatus("active");
                }}
              />
            </label>
            <div
              className="goal-status-options"
              role="group"
              aria-label="目标状态"
            >
              {[
                ["active", Play, "进行中"],
                ["paused", Pause, "暂时搁置"],
                ["done", Check, "已完成"],
              ].map(([value, Icon, label]) => (
                <button
                  type="button"
                  key={value}
                  className={`${status === value ? "selected" : ""} ${value}`}
                  onClick={() => changeStatus(value)}
                >
                  <Icon size={17} weight="bold" />
                  {label}
                </button>
              ))}
            </div>
          </section>
        </div>
        <div className="modal-actions goal-modal-actions">
          <button type="button" className="cancel" onClick={onClose}>
            取消
          </button>
          <button className="save" type="submit">
            <Check size={18} weight="bold" /> 保存修改
          </button>
        </div>
      </form>
    </div>
  );
}

const goalGroups = [
  {
    key: "short",
    label: "短期目标",
    range: "1 - 3个月",
    icon: <Flag size={22} weight="fill" />,
    tone: "mint",
  },
  {
    key: "mid",
    label: "中期目标",
    range: "3 - 12个月",
    icon: <Target size={22} weight="fill" />,
    tone: "blue",
  },
  {
    key: "long",
    label: "长期目标",
    range: "1年以上",
    icon: <Flag size={22} weight="fill" />,
    tone: "pink",
  },
];

function GoalIcon({ type }) {
  const option = goalIconOptions.find(([value]) => value === type);
  const Icon = option?.[2] || Target;
  return <Icon size={28} weight="fill" />;
}

function Goals({
  goals,
  onCreate,
  onEdit,
  onAddNext,
  onDeleteGoal,
  onComplete,
  bannerCopy,
  onBannerSave,
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [joining, setJoining] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [notice, setNotice] = useState("");
  const [group, setGroup] = useState("all");
  const [status, setStatus] = useState("active");
  const [collapsed, setCollapsed] = useState({});
  const visibleGroups = goalGroups.filter(
    (item) => group === "all" || item.key === group,
  );
  const matches = (goal) => status === "all" || goal.status === status;
  return (
    <section className="goals-workspace">
      <div className="goal-hero">
        <img
          className="module-banner-art"
          src="assets/banner-goals-v3.png"
          alt=""
        />
        <div className="module-banner-copy">
          <span>我的目标</span>
          <h1>每一个小目标，都在让你成为更好的自己</h1>
          <p>专注重要的事，少一点焦虑，多一点行动。</p>
        </div>
      </div>
      <div className="goal-toolbar">
        <div className="goal-tabs">
          {goalGroups.map((item) => (
            <button
              key={item.key}
              className={group === item.key ? "active" : ""}
              onClick={() => setGroup(group === item.key ? "all" : item.key)}
            >
              {item.label}（
              {
                goals.filter((goal) => goal.group === item.key && matches(goal))
                  .length
              }
              ）
            </button>
          ))}
        </div>
        <div className="goal-tools">
          <label className="status-select">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="active">进行中</option>
              <option value="done">已完成</option>
              <option value="paused">已放弃</option>
              <option value="all">全部状态</option>
            </select>
            <CaretDown size={16} />
          </label>
          <button className="new-goal-button" onClick={() => setAdding(true)}>
            <Plus size={20} /> 新建目标
          </button>
        </div>
      </div>
      <div className="goal-sections">
        {visibleGroups.map((groupInfo) => {
          const groupGoals = goals.filter(
            (goal) => goal.group === groupInfo.key && matches(goal),
          );
          const isCollapsed = collapsed[groupInfo.key];
          return (
            <section
              className={`goal-section ${groupInfo.tone}`}
              key={groupInfo.key}
            >
              <button
                className="section-title"
                onClick={() =>
                  setCollapsed((current) => ({
                    ...current,
                    [groupInfo.key]: !current[groupInfo.key],
                  }))
                }
              >
                <span className="section-title__icon">{groupInfo.icon}</span>
                <strong>{groupInfo.label}</strong>
                <span>（{groupInfo.range}）</span>
                <CaretDown className={isCollapsed ? "rotated" : ""} size={19} />
              </button>
              {!isCollapsed && (
                <div className="goal-rows">
                  {groupGoals.length ? (
                    groupGoals.map((goal) => (
                      <article className="goal-row" key={goal.id}>
                        <div className="goal-leading">
                          <label
                            className="goal-complete"
                            title={
                              goal.status === "done" ? "已完成" : "完成目标"
                            }
                          >
                            <input
                              type="checkbox"
                              aria-label={`完成目标：${goal.title}`}
                              checked={goal.status === "done"}
                              disabled={goal.status === "done"}
                              onChange={() => onComplete(goal)}
                            />
                            <span>
                              <Check size={18} weight="bold" />
                            </span>
                          </label>
                          <div className="goal-row__icon">
                            <GoalIcon type={goal.type} />
                          </div>
                        </div>
                        <div className="goal-main">
                          <h3>{goal.title}</h3>
                          {goal.status === "done" && (
                            <span className="goal-done-label">✓ 已完成</span>
                          )}
                          <p>{goal.description}</p>
                          <div className="goal-tags">
                            {goal.tags.map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                          </div>
                        </div>
                        <div className="goal-meta">
                          <div className="goal-progress-label">
                            <b>{goal.progressLabel || `${goal.progress}%`}</b>
                            <div>
                              <i style={{ width: `${goal.progress}%` }} />
                            </div>
                          </div>
                          <p>
                            <CalendarBlank size={15} /> {goal.dates}
                          </p>
                          <p>
                            <CalendarCheck size={15} /> 剩余 {goal.daysLeft} 天
                          </p>
                        </div>
                        <div className="next-action">
                          <span>下一步行动</span>
                          <label>
                            <input type="checkbox" /> {goal.next}
                          </label>
                        </div>
                        <div className="goal-row-actions">
                          <div className="goal-icon-actions">
                            <button
                              className="dots"
                              aria-label={`编辑${goal.title}`}
                              title="编辑目标"
                              onClick={() => setEditing(goal)}
                            >
                              <PencilSimple size={18} weight="bold" />
                            </button>
                            <button
                              className="goal-delete"
                              aria-label={`删除目标${goal.title}`}
                              title="删除目标"
                              onClick={() => setDeleting(goal)}
                            >
                              <Trash size={18} />
                            </button>
                          </div>
                          <button
                            className="join-day"
                            onClick={() => setJoining(goal)}
                          >
                            <CalendarCheck size={17} /> 加入今天
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="no-goals">
                      没有符合条件的目标，换个筛选试试。
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
      {adding && (
        <NewGoal
          onClose={() => setAdding(false)}
          onSave={(data) => {
            onCreate(data);
            setAdding(false);
          }}
        />
      )}
      {editing && (
        <EditGoal
          goal={editing}
          onClose={() => setEditing(null)}
          onSave={(updated) => {
            onEdit(updated);
            setEditing(null);
          }}
        />
      )}
      {deleting && (
        <ConfirmDelete
          title={deleting.title}
          itemType="目标"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            onDeleteGoal(deleting.id);
            setDeleting(null);
            setNotice("目标已删除");
            setTimeout(() => setNotice(""), 2200);
          }}
        />
      )}
      {joining && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setJoining(null)}
        >
          <div
            className="confirm-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="confirm-icon">
              <CalendarCheck size={24} />
            </span>
            <h2>加入今天？</h2>
            <p>把“{joining.next}”放进今天的待办清单。</p>
            <div className="modal-actions">
              <button
                type="button"
                className="cancel"
                onClick={() => setJoining(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="save"
                onClick={() => {
                  onAddNext(joining.next);
                  setJoining(null);
                  setNotice("已加入今天");
                  setTimeout(() => setNotice(""), 2200);
                }}
              >
                确定加入
              </button>
            </div>
          </div>
        </div>
      )}
      {notice && (
        <div className="goal-toast" role="status">
          <Check size={18} weight="bold" /> {notice}
        </div>
      )}
    </section>
  );
}

function EditInspiration({ item, onClose, onSave }) {
  const [title, setTitle] = useState(item.title);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <form
        className="task-modal"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) onSave({ ...item, title: title.trim() });
        }}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">编辑灵感</span>
            <h2>修改这条想法</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={22} />
          </button>
        </div>
        <label className="field-label">
          灵感内容
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="记录你的想法…"
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="cancel" onClick={onClose}>
            取消
          </button>
          <button className="save" type="submit">
            <Check size={18} weight="bold" /> 保存修改
          </button>
        </div>
      </form>
    </div>
  );
}

function Inspirations({
  inspirations,
  onCreate,
  onArchive,
  onDelete,
  onTogglePin,
  onAddToToday,
  onTurnIntoGoal,
  onEdit,
  bannerCopy,
  onBannerSave,
}) {
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [image, setImage] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // "已转化" covers goal + today statuses; "已归档" = archived
  const converted = inspirations.filter(
    (item) => item.status === "goal" || item.status === "today",
  );
  const pending = inspirations.filter((item) => item.status === "pending");
  const allActive = inspirations.filter((item) => item.status !== "archived");

  let activeItems =
    filter === "all"
      ? allActive
      : filter === "pending"
        ? pending
        : filter === "converted"
          ? converted
          : inspirations.filter((item) => item.status === "archived");

  // Sort: pinned first, then by id desc (recent)
  activeItems = [...activeItems].sort((a, b) => {
    if (sort === "pinned")
      return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.id - a.id;
    return b.id - a.id;
  });

  const add = () => {
    if (!draft.trim()) return;
    onCreate({ title: draft.trim(), image, type: image ? "图片" : "文字" });
    setDraft("");
    setImage("");
  };

  return (
    <section className="inspirations-workspace">
      <div className="inspiration-hero">
        <img
          className="module-banner-art"
          src="assets/banner-inspirations-v3.png"
          alt=""
        />
        <div className="module-banner-copy">
          <span>我的灵感</span>
          <h1>每一个小瞬间，都可能成为奇妙的灵感</h1>
          <p>先把它记下来，再慢慢让它发光。</p>
        </div>
      </div>

      <div className="inspiration-composer">
        <div className="inspiration-lightbulb">
          <Lightbulb size={31} weight="fill" />
        </div>
        <div className="inspiration-input">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder="现在想到什么了？"
            aria-label="记录灵感"
          />
          <label className="image-upload">
            <FileImage size={22} /> 添加图片
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setImage(URL.createObjectURL(f));
              }}
            />
          </label>
        </div>
        <button className="inspiration-save" onClick={add}>
          <PencilSimple size={24} weight="bold" /> 快速记录
        </button>
      </div>

      <div className="inspiration-toolbar">
        <div className="inspiration-toolbar__left">
          <div className="inspiration-filter">
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              全部灵感（{allActive.length}）
            </button>
            <button
              className={filter === "pending" ? "active" : ""}
              onClick={() => setFilter("pending")}
            >
              待整理（{pending.length}）
            </button>
            <button
              className={filter === "converted" ? "active" : ""}
              onClick={() => setFilter("converted")}
            >
              已转化（{converted.length}）
            </button>
          </div>
          <label className="inspiration-sort">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="排序方式"
            >
              <option value="recent">最近创建</option>
              <option value="pinned">置顶优先</option>
            </select>
            <CaretDown size={15} />
          </label>
        </div>
        <div className="inspiration-stats">
          <span>
            <Lightbulb size={17} weight="fill" /> 本周新增 {inspirations.length}{" "}
            条灵感
          </span>
          <span>
            <Target size={18} weight="bold" />{" "}
            {inspirations.filter((i) => i.status === "goal").length}{" "}
            条已转为目标
          </span>
          <span>
            <CalendarCheck size={18} weight="bold" />{" "}
            {inspirations.filter((i) => i.status === "today").length} 条加入今天
          </span>
        </div>
      </div>

      <div className="inspiration-grid">
        {activeItems.length ? (
          activeItems.map((item) => (
            <article
              className={`inspiration-card ${item.image ? "has-image" : ""} ${item.pinned ? "is-pinned-card" : ""}`}
              key={item.id}
            >
              <header>
                <span
                  className={`inspiration-kind ${item.image ? "image" : "text"}`}
                >
                  {item.image ? (
                    <FileImage size={16} weight="fill" />
                  ) : (
                    <PencilSimple size={16} weight="bold" />
                  )}{" "}
                  {item.type || (item.image ? "图片" : "文字")}
                </span>
                <small>{item.time || "刚刚"}</small>
                <div className="inspiration-card__actions">
                  <button
                    aria-label="置顶灵感"
                    title="置顶"
                    className={item.pinned ? "is-pinned" : ""}
                    onClick={() => onTogglePin(item.id)}
                  >
                    <PushPin size={20} weight={item.pinned ? "fill" : "bold"} />
                  </button>
                  <button
                    aria-label="编辑灵感"
                    title="编辑"
                    onClick={() => setEditing(item)}
                  >
                    <PencilSimple size={18} weight="bold" />
                  </button>
                  <button
                    className="inspiration-delete"
                    aria-label={`删除灵感：${item.title}`}
                    title="删除"
                    onClick={() => setDeleting(item)}
                  >
                    <Trash size={19} weight="bold" />
                  </button>
                </div>
              </header>
              {item.image && (
                <div className="inspiration-img-wrap">
                  <img src={item.image} alt="灵感参考图片" />
                </div>
              )}
              <h2>{item.title}</h2>
              {item.pinned && (
                <span className="pinned-badge">
                  <PushPin size={13} weight="fill" /> 已置顶
                </span>
              )}
              <footer>
                <button onClick={() => onTurnIntoGoal(item)}>
                  <Target size={19} weight="bold" /> 转为目标
                </button>
                <button onClick={() => onAddToToday(item)}>
                  <CalendarCheck size={19} weight="bold" /> 加入今天
                </button>
                <button onClick={() => onArchive(item.id)}>
                  <Archive size={19} weight="bold" /> 归档
                </button>
              </footer>
            </article>
          ))
        ) : (
          <div className="inspiration-empty">
            <Lightbulb size={35} weight="fill" />
            <strong>这里还没有灵感</strong>
            <span>先接住一个闪过的念头吧。</span>
          </div>
        )}
      </div>

      {editing && (
        <EditInspiration
          item={editing}
          onClose={() => setEditing(null)}
          onSave={(updated) => {
            onEdit(updated);
            setEditing(null);
          }}
        />
      )}
      {deleting && (
        <ConfirmDelete
          title={deleting.title}
          itemType="灵感"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            onDelete(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </section>
  );
}

function ProjectStatus({ status }) {
  const labels = { active: "进行中", done: "已完成", paused: "已搁置" };
  return (
    <span className={`project-status ${status}`}>
      {status === "active" ? (
        <Play size={13} weight="fill" />
      ) : status === "paused" ? (
        <Pause size={13} weight="fill" />
      ) : (
        <Check size={14} weight="bold" />
      )}
      {labels[status]}
    </span>
  );
}

function ProjectStatusControl({ project, onChange }) {
  return (
    <StatusSelect
      value={project.status}
      onChange={(status) => onChange(project.id, status)}
      options={[["active", "进行中"], ["paused", "已搁置"], ["done", "已完成"]]}
      label={`更改项目状态：${project.title}`}
    />
  );
}

function ProjectForm({ onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("laptop");
  const [endDate, setEndDate] = useState("2026-09-30");
  const [nextStep, setNextStep] = useState("");
  const [tasks, setTasks] = useState([""]);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <form
        className="task-modal project-modal"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (title.trim())
            onSave({
              title: title.trim(),
              description: description.trim(),
              icon,
              endDate,
              nextStep: nextStep.trim(),
              tasks: tasks
                .filter((item) => item.trim())
                .map((item, index) => ({
                  id: Date.now() + index,
                  title: item.trim(),
                  done: false,
                })),
            });
        }}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">把想法落成行动</span>
            <h2>新建项目</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={22} />
          </button>
        </div>
        <label className="field-label">
          项目名称
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：个人品牌官网"
          />
        </label>
        <label className="field-label">
          项目说明
          <textarea
            rows="2"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="写下这件事想带你去哪里"
          />
        </label>
        <label className="field-label">
          选择图标
          <IconPicker value={icon} onChange={setIcon} />
        </label>
        <div className="date-pair">
          <label className="field-label">
            截止日期
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
          <label className="field-label">
            下一步行动
            <input
              value={nextStep}
              onChange={(event) => setNextStep(event.target.value)}
              placeholder="例如：确定首页文案"
            />
          </label>
        </div>
        <div className="project-form-tasks">
          <span>初始待办</span>
          {tasks.map((item, index) => (
            <div key={index}>
              <input
                value={item}
                onChange={(event) =>
                  setTasks((current) =>
                    current.map((task, taskIndex) =>
                      taskIndex === index ? event.target.value : task,
                    ),
                  )
                }
                placeholder="写下一件可完成的小事"
              />
              {tasks.length > 1 && (
                <button
                  type="button"
                  aria-label="删除待办"
                  onClick={() =>
                    setTasks((current) =>
                      current.filter((_, taskIndex) => taskIndex !== index),
                    )
                  }
                >
                  <Trash size={16} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="text-action"
            onClick={() => setTasks((current) => [...current, ""])}
          >
            <Plus size={16} /> 添加一条待办
          </button>
        </div>
        <div className="modal-actions">
          <button type="button" className="cancel" onClick={onClose}>
            取消
          </button>
          <button className="save" type="submit">
            <FolderOpen size={18} weight="bold" /> 创建项目
          </button>
        </div>
      </form>
    </div>
  );
}

function LegacyProjectDetail({
  project,
  onClose,
  onToggleTask,
  onAddToToday,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) {
  const [draft, setDraft] = useState("");
  const progress = projectProgress(project);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="task-modal project-detail"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">项目详情</span>
            <h2>{project.title}</h2>
            <p>{project.description}</p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={22} />
          </button>
        </div>
        <div className="project-detail-meta">
          <ProjectStatus status={project.status} />
          <span>
            <CalendarBlank size={16} /> 截止 {project.endDate}
          </span>
          <b>{progress}% 自动进度</b>
        </div>
        <div className="project-progress">
          <i style={{ width: `${progress}%` }} />
        </div>
        <div className="project-detail-tasks">
          <div className="project-detail-tasks__head">
            <strong>项目待办</strong>
            <span>
              {project.tasks.filter((task) => task.done).length}/
              {project.tasks.length} 已完成
            </span>
          </div>
          {project.tasks.map((task) => (
            <article
              className={`project-task ${task.done ? "done" : ""}`}
              key={task.id}
            >
              <label>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => onToggleTask(project, task)}
                />
                <span>
                  <Check size={14} weight="bold" />
                </span>
              </label>
              <div className="project-task__copy">
                <strong>{task.title}</strong>
                <div className="project-task__dates">
                  <input
                    aria-label={`${task.title}开始日期`}
                    type="date"
                    value={task.startDate || ""}
                    onChange={(event) =>
                      onUpdateTask(project.id, task.id, {
                        startDate: event.target.value,
                      })
                    }
                  />
                  <span>至</span>
                  <input
                    aria-label={`${task.title}结束日期`}
                    type="date"
                    value={task.endDate || ""}
                    min={task.startDate || ""}
                    onChange={(event) =>
                      onUpdateTask(project.id, task.id, {
                        endDate: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <button
                className="project-add-today"
                onClick={() => onAddToToday(project, task)}
              >
                <CalendarCheck size={17} /> 加入今天
              </button>
              <button
                className="project-task-delete"
                aria-label={`删除${task.title}`}
                onClick={() => onDeleteTask(project.id, task.id)}
              >
                <Trash size={17} />
              </button>
            </article>
          ))}
          <form
            className="project-new-task"
            onSubmit={(event) => {
              event.preventDefault();
              if (draft.trim()) {
                onAddTask(project.id, draft.trim());
                setDraft("");
              }
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="添加一件项目待办"
            />
            <button className="save" type="submit">
              <Plus size={17} /> 添加
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function LegacyProjectDetailPage({
  project,
  onClose,
  onToggleTask,
  onAddToToday,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [schedule, setSchedule] = useState("none");
  const [specificDate, setSpecificDate] = useState(dateKey(getLocalToday()));
  const [rangeEnd, setRangeEnd] = useState(dateKey(getLocalToday()));
  const [editingSchedule, setEditingSchedule] = useState(null);
  const progress = projectProgress(project);
  const add = (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    const today = getLocalToday();
    const startDate =
      schedule === "today"
        ? dateKey(today)
        : schedule === "tomorrow"
          ? dateKey(shiftDate(today, 1))
          : schedule === "date" || schedule === "range"
            ? specificDate
            : "";
    const range = orderedDateRange(
      startDate,
      schedule === "range" ? rangeEnd : "",
    );
    onAddTask(project.id, {
      title: title.trim(),
      note: note.trim(),
      startDate: range.startDate,
      endDate: range.endDate,
    });
    setTitle("");
    setNote("");
    setSchedule("none");
  };
  const pending = project.tasks.filter((task) => !task.done);
  const completed = project.tasks.filter((task) => task.done);
  const row = (task) => (
    <article
      className={`project-detail-row ${task.done ? "done" : ""}`}
      key={task.id}
    >
      <label className="project-detail-check">
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => onToggleTask(project, task)}
        />
        <span>
          <Check size={15} weight="bold" />
        </span>
      </label>
      <div className="project-detail-copy">
        <strong>{task.title}</strong>
        {task.note && <small>{task.note}</small>}
      </div>
      <div className="project-schedule">
        <button
          type="button"
          onClick={() =>
            setEditingSchedule(editingSchedule === task.id ? null : task.id)
          }
        >
          <CalendarBlank size={16} /> {projectTaskScheduleLabel(task)}
        </button>
        {editingSchedule === task.id && (
          <div className="project-schedule-popover">
            <label>
              单日
              <input
                type="date"
                value={task.startDate || ""}
                onChange={(event) =>
                  onUpdateTask(project.id, task.id, {
                    startDate: event.target.value,
                    endDate: task.endDate || "",
                  })
                }
              />
            </label>
            <label>
              日期范围结束
              <input
                type="date"
                value={task.endDate || ""}
                min={task.startDate || ""}
                onChange={(event) =>
                  onUpdateTask(project.id, task.id, {
                    endDate: event.target.value,
                  })
                }
              />
            </label>
            <button
              type="button"
              onClick={() =>
                onUpdateTask(project.id, task.id, {
                  startDate: "",
                  endDate: "",
                })
              }
            >
              清除日期
            </button>
          </div>
        )}
      </div>
      {!task.done && (
        <button
          className="project-add-today"
          disabled={task.addedToDateKeys?.includes(dateKey(getLocalToday()))}
          onClick={() => onAddToToday(project, task)}
        >
          {task.addedToDateKeys?.includes(dateKey(getLocalToday())) ? (
            <>
              <Check size={17} weight="bold" /> 已加入今天
            </>
          ) : (
            <>
              <CalendarCheck size={17} /> 加入今天
            </>
          )}
        </button>
      )}
      <button
        className="project-row-edit"
        type="button"
        onClick={() => setEditingSchedule(task.id)}
      >
        <PencilSimple size={17} /> 编辑
      </button>
      <button
        className="project-task-delete"
        aria-label={`删除${task.title}`}
        onClick={() => onDeleteTask(project.id, task.id)}
      >
        <Trash size={17} /> 删除
      </button>
    </article>
  );
  return (
    <section className="project-detail-page">
      <button className="project-back" onClick={onClose}>
        <ArrowLeft size={18} /> 我的项目 <span>/</span> {project.title}
      </button>
      <header className="project-detail-hero">
        <img src="assets/inspiration-hero-v1.png" alt="小助手正在专注项目" />
        <div>
          <span className="project-icon">
            <GoalIcon type={project.icon} />
          </span>
          <h1>{project.title}</h1>
          <ProjectStatus status={project.status} />
          <p>{project.description}</p>
          <div>
            <span>
              <CalendarBlank size={18} /> 截止时间：{project.endDate}
            </span>
            <span>
              <ListChecks size={18} /> 当前进度：{progress}%
            </span>
            <i>
              <b style={{ width: `${progress}%` }} />
            </i>
          </div>
        </div>
        <aside>
          “一步一步做完，
          <br />
          比想很多更重要。”<small>— Muge</small>
        </aside>
      </header>
      <section className="project-detail-board">
        <h2>
          <span>
            <Check size={20} weight="bold" />
          </span>{" "}
          待办事项 <b>{project.tasks.length}</b>
        </h2>
        <form className="project-quick-add" onSubmit={add}>
          <label>
            待办标题
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：完成联系人模块"
            />
          </label>
          <label>
            备注（选填）
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="简单写下说明…"
            />
          </label>
          <div className="project-schedule-picker">
            <span>安排到哪一天（非必填）</span>
            <button
              type="button"
              className={schedule === "today" ? "selected" : ""}
              onClick={() => setSchedule("today")}
            >
              ☀️ 今天
            </button>
            <button
              type="button"
              className={schedule === "tomorrow" ? "selected" : ""}
              onClick={() => setSchedule("tomorrow")}
            >
              🌙 明天
            </button>
            <button
              type="button"
              className={schedule === "date" ? "selected" : ""}
              onClick={() => setSchedule("date")}
            >
              单日
            </button>
            <button
              type="button"
              className={schedule === "range" ? "selected" : ""}
              onClick={() => setSchedule("range")}
            >
              日期范围
            </button>
            {(schedule === "date" || schedule === "range") && (
              <DateRangeCalendar
                allowRange={schedule === "range"}
                startDate={specificDate}
                endDate={schedule === "range" ? rangeEnd : ""}
                onChange={(range) => {
                  setSpecificDate(range.startDate || dateKey(getLocalToday()));
                  setRangeEnd(
                    range.endDate ||
                      range.startDate ||
                      dateKey(getLocalToday()),
                  );
                }}
              />
            )}
          </div>
          <button className="project-add-submit" type="submit">
            <Plus size={22} /> 添加待办
          </button>
        </form>
        <h3 className="project-list-heading pending">
          <span /> 进行中待办 <b>{pending.length}</b>
        </h3>
        <div className="project-detail-list">
          {pending.length ? (
            pending.map(row)
          ) : (
            <p className="project-list-empty">所有待办都完成啦！</p>
          )}
        </div>
        <h3 className="project-list-heading complete">
          <span>
            <Check size={13} weight="bold" />
          </span>{" "}
          已完成 <b>{completed.length}</b>
        </h3>
        <div className="project-detail-list">{completed.map(row)}</div>
      </section>
      <footer className="project-footer">
        🌱 把想法变成行动，把行动变成更好的自己。
      </footer>
    </section>
  );
}

function monthDateKeys(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [
    ...Array(firstWeekday).fill(""),
    ...Array.from({ length: daysInMonth }, (_, index) =>
      dateKey(new Date(year, month, index + 1)),
    ),
  ];
}

function DateRangeCalendar({
  startDate,
  endDate,
  allowRange = true,
  onChange,
}) {
  const seed = parseLocalDate(startDate || dateKey(getLocalToday()));
  const [cursor, setCursor] = useState(
    () => new Date(seed.getFullYear(), seed.getMonth(), 1),
  );
  const todayKey = dateKey(getLocalToday());
  const cells = monthDateKeys(cursor.getFullYear(), cursor.getMonth());
  const inRange = (key) =>
    startDate && endDate && key >= startDate && key <= endDate;
  const pick = (key) => {
    if (!key) return;
    if (!allowRange || !startDate || endDate) {
      onChange({ startDate: key, endDate: "" });
      return;
    }
    onChange(
      startDate <= key
        ? { startDate, endDate: key === startDate ? "" : key }
        : { startDate: key, endDate: startDate },
    );
  };
  return (
    <div className="project-calendar">
      <div className="project-calendar__nav">
        <strong>
          {cursor.getFullYear()}年
          {String(cursor.getMonth() + 1).padStart(2, "0")}月
        </strong>
        <div>
          <button
            type="button"
            aria-label="上个月"
            onClick={() =>
              setCursor(
                (date) => new Date(date.getFullYear(), date.getMonth() - 1, 1),
              )
            }
          >
            <ArrowLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="下个月"
            onClick={() =>
              setCursor(
                (date) => new Date(date.getFullYear(), date.getMonth() + 1, 1),
              )
            }
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
      <div className="project-calendar__week">
        {week.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="project-calendar__grid">
        {cells.map((key, index) => (
          <button
            type="button"
            key={key || `empty-${index}`}
            disabled={!key}
            className={`${key === todayKey ? "is-today" : ""} ${key && key === startDate ? "is-start" : ""} ${key && key === endDate ? "is-end" : ""} ${key && inRange(key) ? "is-range" : ""}`}
            onClick={() => pick(key)}
          >
            {key ? Number(key.slice(8, 10)) : ""}
          </button>
        ))}
      </div>
      <p>
        {allowRange ? "点一下开始日期，再点一下结束日期" : "点选要安排的那一天"}
      </p>
    </div>
  );
}

function DirectProjectDate({ task, onUpdate }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!boxRef.current?.contains(event.target)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);
  return (
    <div className="project-schedule" ref={boxRef}>
      <button type="button" onClick={() => setOpen((value) => !value)}>
        <CalendarBlank size={16} /> {projectTaskScheduleLabel(task)}
      </button>
      {open && (
        <div className="project-date-popover">
          <DateRangeCalendar
            startDate={task.startDate || ""}
            endDate={task.endDate || ""}
            onChange={onUpdate}
          />
          <div className="project-date-actions">
            <button
              type="button"
              onClick={() => {
                onUpdate({ startDate: "", endDate: "" });
                setOpen(false);
              }}
            >
              清除
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdate({ startDate: dateKey(getLocalToday()), endDate: "" });
                setOpen(false);
              }}
            >
              今天
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => setOpen(false)}
            >
              完成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const clampImageZoom = (value) => Math.min(4, Math.max(1, value));

function ImageLightbox({ image, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const pinchRef = useRef(null);
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const changeZoom = (amount) =>
    setZoom((current) => clampImageZoom(current + amount));
  const touchDistance = (touches) =>
    Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY,
    );
  const startPan = (event) => {
    if (zoom <= 1 || event.pointerType === "touch") return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, pan };
  };
  const movePan = (event) => {
    if (!dragRef.current) return;
    setPan({
      x: dragRef.current.pan.x + event.clientX - dragRef.current.x,
      y: dragRef.current.pan.y + event.clientY - dragRef.current.y,
    });
  };
  return (
    <div
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="图片放大预览"
      onMouseDown={onClose}
    >
      <div
        className="image-lightbox__toolbar"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="缩小图片"
          disabled={zoom <= 1}
          onClick={() => changeZoom(-0.25)}
        >
          −
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          aria-label="放大图片"
          disabled={zoom >= 4}
          onClick={() => changeZoom(0.25)}
        >
          ＋
        </button>
        <button
          type="button"
          aria-label="还原图片大小"
          disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
          onClick={reset}
        >
          还原
        </button>
      </div>
      <button
        type="button"
        className="image-lightbox__close"
        aria-label="关闭图片预览"
        onClick={onClose}
      >
        <X size={24} />
      </button>
      <div
        className="image-lightbox__canvas"
        onMouseDown={(event) => event.stopPropagation()}
        onWheel={(event) => {
          if (!event.ctrlKey && !event.metaKey) return;
          event.preventDefault();
          setZoom((current) =>
            clampImageZoom(current + (event.deltaY < 0 ? 0.15 : -0.15)),
          );
        }}
        onPointerDown={startPan}
        onPointerMove={movePan}
        onPointerUp={() => {
          dragRef.current = null;
        }}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
        onTouchStart={(event) => {
          if (event.touches.length === 2)
            pinchRef.current = { distance: touchDistance(event.touches), zoom };
        }}
        onTouchMove={(event) => {
          if (!pinchRef.current || event.touches.length !== 2) return;
          event.preventDefault();
          setZoom(
            clampImageZoom(
              (pinchRef.current.zoom * touchDistance(event.touches)) /
                pinchRef.current.distance,
            ),
          );
        }}
        onTouchEnd={() => {
          pinchRef.current = null;
        }}
      >
        <img
          src={image}
          alt="随记图片放大预览"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
          draggable="false"
        />
      </div>
      <p className="image-lightbox__hint">
        双指捏合缩放 · ⌘ + 滚动缩放 · 放大后可拖动图片
      </p>
    </div>
  );
}

function ProjectNotes({
  notes,
  onAdd,
  onUpdate,
  onTogglePin,
  onDelete,
  open,
  onToggleOpen,
  title = "项目随记",
}) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [lightboxImage, setLightboxImage] = useState("");
  const inputRef = useRef(null);
  const readImages = async (files, existingImages, setTargetImages) => {
    const selected = Array.from(files || [])
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 4 - existingImages.length);
    const dataUrls = await Promise.all(
      selected.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve(typeof reader.result === "string" ? reader.result : "");
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
          }),
      ),
    );
    setTargetImages((current) => [...current, ...dataUrls.filter(Boolean)]);
  };
  const pasteImages = (event, existingImages, setTargetImages) => {
    const files = Array.from(event.clipboardData?.files || []).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (!files.length) return;
    event.preventDefault();
    readImages(files, existingImages, setTargetImages);
  };
  const submit = (event) => {
    event.preventDefault();
    if (!content.trim() && !images.length) return;
    onAdd({ content: content.trim(), images });
    setContent("");
    setImages([]);
    if (inputRef.current) inputRef.current.value = "";
  };
  const displayed = projectNotesForDisplay(notes);
  return (
    <section className="project-notes" aria-labelledby="project-notes-heading">
      <div className="project-notes__heading">
        <div>
          <h2 id="project-notes-heading">
            <span>
              <PencilSimple size={20} weight="bold" />
            </span>{" "}
            {title} <b>{displayed.length}</b>
          </h2>
          <p>记下灵感、需求和关键决定，重要内容可以置顶。</p>
        </div>
        <button
          type="button"
          className="project-section-toggle"
          onClick={onToggleOpen}
          aria-expanded={open}
        >
          {open ? "折叠" : "展开"}
        </button>
      </div>
      {open && (
        <>
          <form className="project-note-composer" onSubmit={submit}>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              onPaste={(event) => pasteImages(event, images, setImages)}
              placeholder="记录灵感、临时需求、问题…"
              aria-label="项目随记内容"
              rows={3}
            />
            <input
              ref={inputRef}
              className="project-note-file"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) =>
                readImages(event.target.files, images, setImages)
              }
              aria-label="添加随记图片"
            />
            {images.length > 0 && (
              <div className="project-note-image-previews">
                {images.map((image, index) => (
                  <div key={image}>
                    <img src={image} alt={`待添加图片 ${index + 1}`} />
                    <button
                      type="button"
                      aria-label={`移除图片 ${index + 1}`}
                      onClick={() =>
                        setImages((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="project-note-composer__actions">
              <button
                className="project-note-attach"
                type="button"
                onClick={() => inputRef.current?.click()}
              >
                <FileImage size={18} /> 添加图片
              </button>
              <span>可直接粘贴图片，最多 4 张</span>
              <button className="project-note-submit" type="submit">
                <Plus size={19} weight="bold" /> 添加随记
              </button>
            </div>
          </form>
          <div className="project-note-list">
            {displayed.length ? (
              displayed.map((note) => (
                <article
                  className={`project-note ${note.pinned ? "pinned" : ""}`}
                  key={note.id}
                >
                  {editing?.id === note.id ? (
                    <form
                      className="project-note-editor"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!editing.content.trim() && !editing.images.length)
                          return;
                        onUpdate(note.id, {
                          content: editing.content.trim(),
                          images: editing.images,
                        });
                        setEditing(null);
                      }}
                    >
                      <textarea
                        autoFocus
                        value={editing.content}
                        onChange={(event) =>
                          setEditing((current) => ({
                            ...current,
                            content: event.target.value,
                          }))
                        }
                        onPaste={(event) =>
                          pasteImages(event, editing.images, (updater) =>
                            setEditing((current) => ({
                              ...current,
                              images: updater(current.images),
                            })),
                          )
                        }
                        aria-label="编辑随记内容"
                        rows={3}
                      />
                      {editing.images.length > 0 && (
                        <div className="project-note-image-previews">
                          {editing.images.map((image, index) => (
                            <div key={image}>
                              <img
                                src={image}
                                alt={`编辑中的图片 ${index + 1}`}
                              />
                              <button
                                type="button"
                                aria-label={`移除图片 ${index + 1}`}
                                onClick={() =>
                                  setEditing((current) => ({
                                    ...current,
                                    images: current.images.filter(
                                      (_, itemIndex) => itemIndex !== index,
                                    ),
                                  }))
                                }
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="project-note-editor__actions">
                        <label className="project-note-attach">
                          <FileImage size={18} /> 添加图片
                          <input
                            className="project-note-file"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(event) =>
                              readImages(
                                event.target.files,
                                editing.images,
                                (updater) =>
                                  setEditing((current) => ({
                                    ...current,
                                    images: updater(current.images),
                                  })),
                              )
                            }
                          />
                        </label>
                        <span>可直接粘贴图片</span>
                        <button type="button" onClick={() => setEditing(null)}>
                          取消
                        </button>
                        <button type="submit">保存修改</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="project-note__body">
                        <div className="project-note__meta">
                          {note.pinned && (
                            <span>
                              <PushPin size={14} weight="fill" /> 置顶
                            </span>
                          )}
                          <time>
                            {new Date(
                              note.createdAt || Date.now(),
                            ).toLocaleString("zh-CN", {
                              month: "numeric",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </time>
                        </div>
                        {note.content && <p>{note.content}</p>}
                        {note.images?.length > 0 && (
                          <div className="project-note__images">
                            {note.images.map((image, index) => (
                              <button
                                type="button"
                                key={image}
                                onClick={() => setLightboxImage(image)}
                                aria-label={`放大查看随记图片 ${index + 1}`}
                              >
                                <img
                                  src={image}
                                  alt={`随记图片 ${index + 1}`}
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="project-note__actions">
                        <button
                          type="button"
                          onClick={() =>
                            setEditing({
                              id: note.id,
                              content: note.content || "",
                              images: [...(note.images || [])],
                            })
                          }
                          aria-label="编辑随记"
                        >
                          <PencilSimple size={17} /> 编辑
                        </button>
                        <button
                          type="button"
                          className={note.pinned ? "is-pinned" : ""}
                          onClick={() => onTogglePin(note.id)}
                          aria-label={note.pinned ? "取消置顶随记" : "置顶随记"}
                        >
                          <PushPin
                            size={18}
                            weight={note.pinned ? "fill" : "regular"}
                          />{" "}
                          {note.pinned ? "已置顶" : "置顶"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(note.id)}
                          aria-label="删除随记"
                        >
                          <Trash size={17} /> 删除
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))
            ) : (
              <div className="project-notes-empty">
                <PencilSimple size={24} />{" "}
                这里还没有随记，先记下项目里的第一个想法吧。
              </div>
            )}
          </div>
        </>
      )}
      {lightboxImage && (
        <ImageLightbox
          image={lightboxImage}
          onClose={() => setLightboxImage("")}
        />
      )}
    </section>
  );
}

function IterationBugs({ bugs, onAdd, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ description: "", status: "pending" });
  const [editingBug, setEditingBug] = useState(null);
  const [editingDescription, setEditingDescription] = useState("");
  const [deletingBug, setDeletingBug] = useState(null);

  return (
    <section className="iteration-tab-panel iteration-bugs">
      <div className="iteration-panel-heading">
        <div><h2>BUG列表 <b>{bugs.length}</b></h2></div>
        <button type="button" aria-expanded={showForm} onClick={() => setShowForm((value) => !value)}>
          <Plus size={18} /> 新建BUG
        </button>
      </div>
      {showForm && (
        <form className="iteration-bug-form" onSubmit={(event) => {
          event.preventDefault();
          if (!draft.description.trim()) return;
          onAdd({ id: `bug-${Date.now()}`, description: draft.description.trim(), status: draft.status, createdAt: Date.now() });
          setDraft({ description: "", status: "pending" });
          setShowForm(false);
        }}>
          <label>BUG描述<textarea autoFocus rows="3" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="描述遇到的问题，例如：点击保存后没有响应" /></label>
          <div className="iteration-bug-form__footer">
            <div><span>BUG状态</span><StatusSelect value={draft.status} options={BUG_STATUSES} label="新建BUG状态" onChange={(status) => setDraft((current) => ({ ...current, status }))} /></div>
            <div className="iteration-bug-form__actions">
              <button type="button" onClick={() => setShowForm(false)}>取消</button>
              <button type="submit" disabled={!draft.description.trim()}>添加BUG</button>
            </div>
          </div>
        </form>
      )}
      <div className="iteration-bugs-table" role="table" aria-label="BUG列表">
        <div className="iteration-bugs-row header" role="row">
          <span role="columnheader">BUG描述</span><span role="columnheader">BUG状态</span><span role="columnheader">操作</span>
        </div>
        {bugs.map((bug) => (
          <div className={`iteration-bugs-row ${bug.status}`} role="row" key={bug.id}>
            <div className="iteration-bug-description" role="cell">
              {editingBug === bug.id ? (
                <form className="iteration-bug-editor" onSubmit={(event) => {
                  event.preventDefault();
                  if (!editingDescription.trim()) return;
                  onUpdate(bug.id, { description: editingDescription.trim() });
                  setEditingBug(null);
                }}>
                  <textarea autoFocus rows="3" aria-label="编辑BUG描述" value={editingDescription} onChange={(event) => setEditingDescription(event.target.value)} />
                  <div className="iteration-bug-form__actions">
                    <button type="button" onClick={() => setEditingBug(null)}>取消</button>
                    <button type="submit" disabled={!editingDescription.trim()}>保存修改</button>
                  </div>
                </form>
              ) : <span>{bug.description}</span>}
            </div>
            <div role="cell">
              <StatusSelect value={bug.status} options={BUG_STATUSES} label={`更改BUG状态：${bug.description}`} onChange={(status) => onUpdate(bug.id, { status })} />
            </div>
            <div className="iteration-bug-actions" role="cell">
              <button type="button" onClick={() => { setEditingBug(bug.id); setEditingDescription(bug.description); }}><PencilSimple size={16} /> 编辑</button>
              <button type="button" className="iteration-bug-delete" aria-label={`删除BUG：${bug.description}`} title="删除BUG" onClick={() => setDeletingBug(bug)}><Trash size={17} /></button>
            </div>
          </div>
        ))}
        {!bugs.length && <p className="project-list-empty">还没有BUG，发现问题时可以在这里记录。</p>}
      </div>
      {deletingBug && <ConfirmDelete title={deletingBug.description} itemType="BUG" onCancel={() => setDeletingBug(null)} onConfirm={() => { onDelete(deletingBug.id); setDeletingBug(null); }} />}
    </section>
  );
}

function ProjectDetail({
  project,
  onClose,
  onToggleTask,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddNote,
  onUpdateNote,
  onToggleNotePin,
  onDeleteNote,
  onAddIteration,
  onAddDecision,
  onUpdateDecision,
  onDeleteDecision,
  onAddBug,
  onUpdateBug,
  onDeleteBug,
}) {
  const [editingTask, setEditingTask] = useState(null);
  const [editingCopy, setEditingCopy] = useState({ title: "", note: "" });
  const [notesOpen, setNotesOpen] = useState(true);
  const iterations = Array.isArray(project.iterations) ? project.iterations : [];
  const [iterationDetailId, setIterationDetailId] = useState(null);
  const [iterationTab, setIterationTab] = useState("requirements");
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [requirementDraft, setRequirementDraft] = useState({ title: "", description: "", priority: "P1", workflowStatus: "pending" });
  const [decisionDraft, setDecisionDraft] = useState("");
  const [editingDecision, setEditingDecision] = useState(null);
  const [editingDecisionCopy, setEditingDecisionCopy] = useState("");
  const [showIterationForm, setShowIterationForm] = useState(false);
  const [iterationDraft, setIterationDraft] = useState({
    version: `V${iterations.length + 1}.0`,
    title: "",
    startDate: dateKey(getLocalToday()),
    endDate: dateKey(shiftDate(getLocalToday(), 7)),
    goals: "",
  });
  const selectedIteration = iterations.find((iteration) => iteration.id === iterationDetailId);
  const visibleTasks = selectedIteration ? projectIterationTasks(project, selectedIteration.id) : project.tasks;
  useEffect(() => {
    if (iterationDetailId && !iterations.some((iteration) => iteration.id === iterationDetailId)) {
      setIterationDetailId(null);
    }
  }, [iterations, iterationDetailId]);
  if (selectedIteration) {
    return (
      <section className="project-detail-page project-iteration-detail-page">
        <button className="project-back" onClick={() => setIterationDetailId(null)}>
          <ArrowLeft size={18} /> 返回项目迭代 <span>/</span> {project.title}
        </button>
        <nav className="iteration-detail-tabs" aria-label="迭代详情分类">
          {[["requirements", "需求列表", visibleTasks.length], ["decisions", "待确定项", selectedIteration.decisions?.length || 0], ["notes", "随记", (project.notes || []).filter((entry) => entry.iterationId === selectedIteration.id).length], ["bugs", "BUG列表", selectedIteration.bugs?.length || 0]].map(([value, label, count]) => (
            <button type="button" key={value} className={iterationTab === value ? "active" : ""} onClick={() => setIterationTab(value)}>{label}<b>{count}</b></button>
          ))}
        </nav>
        {iterationTab === "requirements" && (
          <section className="iteration-tab-panel iteration-requirements">
            <div className="iteration-panel-heading"><div><h2>需求列表 <b>{visibleTasks.length}</b></h2><p>管理本迭代的功能需求、优先级与交付进度。</p></div><button type="button" onClick={() => setShowRequirementForm((value) => !value)}><Plus size={18} /> 新建需求</button></div>
            {showRequirementForm && (
              <form className="iteration-requirement-form" onSubmit={(event) => { event.preventDefault(); if (!requirementDraft.title.trim()) return; onAddTask(project.id, { ...requirementDraft, title: requirementDraft.title.trim(), description: requirementDraft.description.trim(), note: requirementDraft.description.trim(), iterationId: selectedIteration.id }); setRequirementDraft({ title: "", description: "", priority: "P1", workflowStatus: "pending" }); setShowRequirementForm(false); }}>
                <label>需求名称<input autoFocus value={requirementDraft.title} onChange={(event) => setRequirementDraft((current) => ({ ...current, title: event.target.value }))} placeholder="例如：AI 自动打标签" /></label>
                <label>需求说明<input value={requirementDraft.description} onChange={(event) => setRequirementDraft((current) => ({ ...current, description: event.target.value }))} placeholder="简要说明需求背景与验收目标" /></label>
                <label>优先级<select value={requirementDraft.priority} onChange={(event) => setRequirementDraft((current) => ({ ...current, priority: event.target.value }))}><option>P1</option><option>P2</option><option>P3</option></select></label>
                <button type="submit">创建需求</button>
              </form>
            )}
            <div className="iteration-requirements-table">
              <div className="iteration-requirements-row header"><span>需求名称</span><span>需求说明</span><span>优先级</span><span>状态</span><span>操作</span></div>
              {visibleTasks.map((task) => {
                return <div className="iteration-requirements-row" key={task.id}><span className="requirement-name"><label><input type="checkbox" checked={task.done} onChange={() => onToggleTask(project, task)} /><i><Check size={12} /></i></label><strong>{task.title}</strong></span><span className="requirement-description">{task.description || task.note || "—"}</span><span><em className={`requirement-priority ${task.priority || "P2"}`}>{task.priority || "P2"}</em></span><span><em className={`requirement-workflow ${task.done ? "done" : task.workflowStatus || "pending"}`}>{task.done ? "已完成" : task.workflowStatus === "testing" ? "测试中" : task.workflowStatus === "developing" ? "开发中" : "待开发"}</em></span><span><button type="button" onClick={() => { setEditingTask(task.id); setEditingCopy({ title: task.title, note: task.description || task.note || "" }); }}>编辑</button><button type="button" onClick={() => onDeleteTask(project.id, task.id)}>删除</button></span>{editingTask === task.id && <form className="project-task-copy-editor" onSubmit={(event) => { event.preventDefault(); onUpdateTask(project.id, task.id, { title: editingCopy.title.trim(), description: editingCopy.note.trim(), note: editingCopy.note.trim() }); setEditingTask(null); }}><label>需求名称<input value={editingCopy.title} onChange={(event) => setEditingCopy((current) => ({ ...current, title: event.target.value }))} /></label><label>需求说明<textarea value={editingCopy.note} onChange={(event) => setEditingCopy((current) => ({ ...current, note: event.target.value }))} /></label><div><button type="button" onClick={() => setEditingTask(null)}>取消</button><button type="submit">保存</button></div></form>}</div>;
              })}
              {!visibleTasks.length && <p className="project-list-empty">这个迭代还没有需求。</p>}
            </div>
          </section>
        )}
        {iterationTab === "decisions" && (
          <section className="iteration-tab-panel iteration-decisions">
            <div className="iteration-panel-heading"><div><h2>待确定项 <b>{selectedIteration.decisions?.length || 0}</b></h2><p>收集需要讨论、选择或等待结论的问题。</p></div></div>
            <form onSubmit={(event) => { event.preventDefault(); if (!decisionDraft.trim()) return; onAddDecision(selectedIteration.id, { id: Date.now(), content: decisionDraft.trim(), status: "discussing", createdAt: Date.now() }); setDecisionDraft(""); }}><input value={decisionDraft} onChange={(event) => setDecisionDraft(event.target.value)} placeholder="例如：AI 回复是否读取历史聊天？" /><button type="submit"><Plus size={18} /> 添加待确定项</button></form>
            <div className="iteration-decision-list">
              {(selectedIteration.decisions || []).map((decision) => (
                <article key={decision.id}>
                  <span>?</span>
                  {editingDecision === decision.id ? (
                    <form className="iteration-decision-editor" onSubmit={(event) => { event.preventDefault(); const content = editingDecisionCopy.trim(); if (!content) return; onUpdateDecision(selectedIteration.id, decision.id, { content }); setEditingDecision(null); setEditingDecisionCopy(""); }}>
                      <input autoFocus value={editingDecisionCopy} onChange={(event) => setEditingDecisionCopy(event.target.value)} aria-label="编辑待确定项内容" />
                      <button type="button" onClick={() => { setEditingDecision(null); setEditingDecisionCopy(""); }}>取消</button>
                      <button type="submit">保存修改</button>
                    </form>
                  ) : (
                    <strong>{decision.content}</strong>
                  )}
                  <em>讨论中</em>
                  <div className="iteration-decision-actions">
                    <button type="button" aria-label={`编辑${decision.content}`} onClick={() => { setEditingDecision(decision.id); setEditingDecisionCopy(decision.content); }}><PencilSimple size={16} /> 编辑</button>
                    <button type="button" className="danger" aria-label={`删除${decision.content}`} onClick={() => onDeleteDecision(selectedIteration.id, decision.id)}><Trash size={16} /> 删除</button>
                  </div>
                </article>
              ))}
              {!selectedIteration.decisions?.length && <p className="project-list-empty">暂无待确定项。</p>}
            </div>
          </section>
        )}
        {iterationTab === "bugs" && (
          <IterationBugs
            key={selectedIteration.id}
            bugs={selectedIteration.bugs || []}
            onAdd={(bug) => onAddBug(selectedIteration.id, bug)}
            onUpdate={(bugId, update) => onUpdateBug(selectedIteration.id, bugId, update)}
            onDelete={(bugId) => onDeleteBug(selectedIteration.id, bugId)}
          />
        )}
        {iterationTab === "notes" && (
          <ProjectNotes notes={(project.notes || []).filter((entry) => entry.iterationId === selectedIteration.id)} onAdd={(entry) => onAddNote({ ...entry, iterationId: selectedIteration.id })} onUpdate={onUpdateNote} onTogglePin={onToggleNotePin} onDelete={onDeleteNote} open={notesOpen} onToggleOpen={() => setNotesOpen((value) => !value)} title={`${selectedIteration.version} 迭代随记`} />
        )}
      </section>
    );
  }
  return (
    <section className="project-detail-page">
      <button className="project-back" onClick={onClose}>
        <ArrowLeft size={18} /> 我的项目 <span>/</span> {project.title}
      </button>
      <section className="project-iterations" aria-label="项目迭代">
        <div className="project-iterations__head">
          <div>
            <span className="eyebrow">PROJECT ITERATIONS</span>
            <h2>项目迭代</h2>
          </div>
          <button type="button" onClick={() => setShowIterationForm((value) => !value)}>
            <Plus size={18} weight="bold" /> 新建迭代
          </button>
        </div>
        {showIterationForm && (
          <form
            className="project-iteration-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!iterationDraft.version.trim() || !iterationDraft.title.trim()) return;
              const id = `iteration-${Date.now()}`;
              onAddIteration({
                id,
                version: iterationDraft.version.trim(),
                title: iterationDraft.title.trim(),
                startDate: iterationDraft.startDate,
                endDate: iterationDraft.endDate,
                goals: iterationDraft.goals.split("\n").map((goal) => goal.trim()).filter(Boolean),
                status: "planned",
              });
              setIterationDetailId(id);
              setShowIterationForm(false);
              setIterationDraft({
                version: `V${iterations.length + 2}.0`,
                title: "",
                startDate: dateKey(getLocalToday()),
                endDate: dateKey(shiftDate(getLocalToday(), 7)),
                goals: "",
              });
            }}
          >
            <label>版本号<input value={iterationDraft.version} onChange={(event) => setIterationDraft((current) => ({ ...current, version: event.target.value }))} placeholder="V1.3" /></label>
            <label>迭代名称<input value={iterationDraft.title} onChange={(event) => setIterationDraft((current) => ({ ...current, title: event.target.value }))} placeholder="例如：客户跟进增强" /></label>
            <label>开始日期<input type="date" value={iterationDraft.startDate} onChange={(event) => setIterationDraft((current) => ({ ...current, startDate: event.target.value }))} /></label>
            <label>结束日期<input type="date" min={iterationDraft.startDate} value={iterationDraft.endDate} onChange={(event) => setIterationDraft((current) => ({ ...current, endDate: event.target.value }))} /></label>
            <label className="project-iteration-form__goals">迭代目标（每行一条）<textarea rows="3" value={iterationDraft.goals} onChange={(event) => setIterationDraft((current) => ({ ...current, goals: event.target.value }))} placeholder="完成核心功能\n验证关键流程" /></label>
            <div className="project-iteration-form__actions"><button type="button" onClick={() => setShowIterationForm(false)}>取消</button><button type="submit">创建迭代</button></div>
          </form>
        )}
        <div className="project-iteration-tabs project-iteration-list">
          {iterations.map((iteration) => {
            const iterationTaskCount = projectIterationTasks(project, iteration.id).length;
            return (
              <button
                type="button"
                className=""
                key={iteration.id}
                onClick={() => setIterationDetailId(iteration.id)}
              >
                <span><strong>{iteration.version}</strong><em className={`iteration-status ${iteration.status}`}>{iteration.status === "done" ? "已上线" : iteration.status === "active" ? "进行中" : "未开始"}</em></span>
                <b>{iteration.title}</b>
                <small>{iteration.startDate?.slice(5).replace("-", ".")} - {iteration.endDate?.slice(5).replace("-", ".")} · {iterationTaskCount} 项</small>
                <ArrowRight size={18} />
              </button>
            );
          })}
          {!iterations.length && <p className="project-list-empty">还没有迭代，先创建第一个吧。</p>}
        </div>
      </section>
    </section>
  );
}

function ProjectNotesPage({
  project,
  onClose,
  onAddNote,
  onUpdateNote,
  onToggleNotePin,
  onDeleteNote,
}) {
  const [notesOpen, setNotesOpen] = useState(true);
  return (
    <section className="project-detail-page project-notes-page">
      <button className="project-back" onClick={onClose}>
        <ArrowLeft size={18} /> 我的项目 <span>/</span> {project.title}
      </button>
      <ProjectNotes
        notes={project.notes}
        onAdd={onAddNote}
        onUpdate={onUpdateNote}
        onTogglePin={onToggleNotePin}
        onDelete={onDeleteNote}
        open={notesOpen}
        onToggleOpen={() => setNotesOpen((value) => !value)}
        title="项目随记"
      />
    </section>
  );
}

function Projects({
  projects,
  onCreate,
  onToggleTask,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateStatus,
  onDeleteProject,
  onAddNote,
  onUpdateNote,
  onToggleNotePin,
  onDeleteNote,
  onAddIteration,
  onAddDecision,
  onUpdateDecision,
  onDeleteDecision,
  onAddBug,
  onUpdateBug,
  onDeleteBug,
  bannerCopy,
  onBannerSave,
}) {
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState(null);
  const [adding, setAdding] = useState(false);
  const [deletingProject, setDeletingProject] = useState(null);
  const visible = projects.filter(
    (project) => filter === "all" || project.status === filter,
  );
  if (detail?.view === "notes")
    return (
      <ProjectNotesPage
        key={detail.id}
        project={projects.find((project) => project.id === detail.id) || detail}
        onClose={() => setDetail(null)}
        onAddNote={(note) => onAddNote(detail.id, note)}
        onUpdateNote={(noteId, update) => onUpdateNote(detail.id, noteId, update)}
        onToggleNotePin={(noteId) => onToggleNotePin(detail.id, noteId)}
        onDeleteNote={(noteId) => onDeleteNote(detail.id, noteId)}
      />
    );
  if (detail)
    return (
      <ProjectDetail
        project={projects.find((project) => project.id === detail.id) || detail}
        onClose={() => setDetail(null)}
        onToggleTask={onToggleTask}
        onAddTask={onAddTask}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        onUpdateStatus={onUpdateStatus}
        onAddNote={(note) => onAddNote(detail.id, note)}
        onUpdateNote={(noteId, update) =>
          onUpdateNote(detail.id, noteId, update)
        }
        onToggleNotePin={(noteId) => onToggleNotePin(detail.id, noteId)}
        onDeleteNote={(noteId) => onDeleteNote(detail.id, noteId)}
        onAddIteration={(iteration) => onAddIteration(detail.id, iteration)}
        onAddDecision={(iterationId, decision) => onAddDecision(detail.id, iterationId, decision)}
        onUpdateDecision={(iterationId, decisionId, update) => onUpdateDecision(detail.id, iterationId, decisionId, update)}
        onDeleteDecision={(iterationId, decisionId) => onDeleteDecision(detail.id, iterationId, decisionId)}
        onAddBug={(iterationId, bug) => onAddBug(detail.id, iterationId, bug)}
        onUpdateBug={(iterationId, bugId, update) => onUpdateBug(detail.id, iterationId, bugId, update)}
        onDeleteBug={(iterationId, bugId) => onDeleteBug(detail.id, iterationId, bugId)}
      />
    );
  return (
    <section className="projects-workspace">
      {deletingProject && (
        <ConfirmDelete
          title={deletingProject.title}
          itemType="项目"
          onCancel={() => setDeletingProject(null)}
          onConfirm={() => {
            onDeleteProject(deletingProject.id);
            setDeletingProject(null);
          }}
        />
      )}
      <div className="project-hero">
        <img
          className="module-banner-art"
          src="assets/banner-projects-v3.png"
          alt=""
        />
        <div className="module-banner-copy">
          <span>我的项目</span>
          <h1>把想法变成行动，一步步搭建成果</h1>
          <p>从今天的一小步开始，让计划慢慢长成现实。</p>
        </div>
      </div>
      <div className="project-toolbar">
        <div>
          {[
            ["all", "全部项目"],
            ["active", "进行中"],
            ["done", "已完成"],
            ["paused", "已搁置"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={filter === value ? "active" : ""}
              onClick={() => setFilter(value)}
            >
              {label}（
              {value === "all"
                ? projects.length
                : projects.filter((project) => project.status === value).length}
              ）
            </button>
          ))}
        </div>
        <button
          className="new-project"
          aria-label="新建项目"
          onClick={() => setAdding(true)}
        >
          <Plus size={23} /> 新建项目
        </button>
      </div>
      <div className="project-list">
        {visible.length ? (
          visible.map((project) => {
            return (
              <article className="project-card" key={project.id}>
                <div className="project-card__identity">
                  <span className="project-icon">
                    <GoalIcon type={project.icon} />
                  </span>
                  <div>
                    <h2>
                      {project.title}{" "}
                      <ProjectStatusControl
                        project={project}
                        onChange={onUpdateStatus}
                      />
                    </h2>
                    <p>{project.description}</p>
                    <small>
                      <CalendarBlank size={15} /> 截止 {project.endDate}
                    </small>
                  </div>
                </div>
                <div className="project-card__actions">
                  <button onClick={() => setDetail({ ...project, view: "iterations" })}>
                    <FolderOpen size={18} /> 查看迭代
                  </button>
                  <button
                    className="primary"
                    onClick={() => setDetail({ ...project, view: "notes" })}
                  >
                    <PencilSimple size={18} /> 项目随记
                  </button>
                  <button
                    className="project-delete-btn"
                    aria-label={`删除项目${project.title}`}
                    title="删除项目"
                    onClick={() => setDeletingProject(project)}
                  >
                    <Trash size={17} />
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="project-empty">
            <FolderOpen size={36} />
            <strong>还没有符合条件的项目</strong>
            <span>新建一个项目，把一个想法慢慢做完。</span>
          </div>
        )}
      </div>
      <footer className="project-footer">
        🌱 专注做好眼前的项目，一点一点，都会变成更好的自己。
      </footer>
      {adding && (
        <ProjectForm
          onClose={() => setAdding(false)}
          onSave={(data) => {
            onCreate(data);
            setAdding(false);
          }}
        />
      )}
    </section>
  );
}

const reviewMoods = [
  { value: "great", label: "很好", icon: "😊" },
  { value: "calm", label: "平稳", icon: "😌" },
  { value: "anxious", label: "焦虑", icon: "😟" },
  { value: "tired", label: "疲惫", icon: "😮‍💨" },
  { value: "low", label: "低落", icon: "😔" },
];
const reviewMood = (value) =>
  reviewMoods.find((mood) => mood.value === value) || reviewMoods[1];
const reviewDateLabel = (key) => {
  const date = parseLocalDate(key);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

function ReviewEditor({ review, onClose, onSave }) {
  const [completed, setCompleted] = useState(review.completed || "");
  const [blockers, setBlockers] = useState(review.blockers || "");
  const [insight, setInsight] = useState(review.insight || "");
  const [mood, setMood] = useState(review.mood || "calm");
  const [tomorrow, setTomorrow] = useState(() =>
    reviewTomorrowItems(review.tomorrow).length
      ? reviewTomorrowItems(review.tomorrow)
      : [""],
  );
  const fields = [
    ["今天完成了什么", completed, setCompleted],
    ["今天遇到的问题 / 卡点", blockers, setBlockers],
    ["今天最有价值的收获", insight, setInsight],
  ];
  return (
    <div
      className="review-detail-modal"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="review-detail-panel review-editor-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`编辑${reviewDateLabel(review.date)}复盘`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="review-detail-head">
          <div>
            <h2>编辑{reviewDateLabel(review.date)}的复盘</h2>
            <div className="review-detail-meta">
              周{week[parseLocalDate(review.date).getDay()]}
            </div>
          </div>
          <button
            className="review-detail-close"
            type="button"
            onClick={onClose}
            aria-label="关闭编辑"
          >
            <X size={19} />
          </button>
        </header>
        <div className="review-editor-fields">
          {fields.map(([label, value, setValue]) => (
            <label key={label}>
              {label}
              <textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
            </label>
          ))}
        </div>
        <div className="review-editor-label">当天情绪</div>
        <div className="review-moods">
          {reviewMoods.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`review-mood-btn ${mood === item.value ? "selected" : ""}`}
              onClick={() => setMood(item.value)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
        <div className="review-editor-label">明天最重要的事</div>
        <div className="review-editor-tomorrow">
          {tomorrow.map((item, index) => (
            <div key={index}>
              <input
                value={item}
                onChange={(event) =>
                  setTomorrow((items) =>
                    items.map((value, itemIndex) =>
                      itemIndex === index ? event.target.value : value,
                    ),
                  )
                }
                placeholder="写下一件重要的事"
              />
              {tomorrow.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setTomorrow((items) =>
                      items.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  aria-label={`移除第 ${index + 1} 件事`}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="review-editor-add"
          onClick={() => setTomorrow((items) => [...items, ""])}
        >
          <Plus size={15} /> 添加一件重要的事
        </button>
        <div className="review-editor-actions">
          <button type="button" className="review-clear-btn" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="review-save-btn"
            onClick={() =>
              onSave({
                ...review,
                completed,
                blockers,
                insight,
                mood,
                tomorrow,
              })
            }
          >
            <Check size={17} weight="bold" /> 保存修改
          </button>
        </div>
      </section>
    </div>
  );
}

function ReviewDatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const triggerRef = useRef(null);
  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => {
      if (!boxRef.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("pointerdown", outside);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("pointerdown", outside);
      window.removeEventListener("keydown", escape);
    };
  }, [open]);
  const pick = (nextDate) => {
    if (onChange(nextDate) !== false) close();
  };
  return (
    <div className="review-date-picker" ref={boxRef} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button type="button" className="review-date-badge" ref={triggerRef}
        aria-label="选择复盘日期" aria-expanded={open} aria-controls="review-date-calendar"
        onClick={() => setOpen((current) => !current)}>
        <CalendarBlank size={17} />
        <span>{value.replaceAll("-", "/")}</span>
        <span>周{week[parseLocalDate(value).getDay()]}</span>
        <CaretDown size={14} />
      </button>
      {open && <div id="review-date-calendar" className="review-date-popover" role="group" aria-label="复盘日期日历">
        <DateRangeCalendar startDate={value} endDate="" allowRange={false}
          onChange={({ startDate }) => pick(startDate)} />
        <div className="project-date-actions">
          <button type="button" onClick={() => pick(dateKey(getLocalToday()))}>今天</button>
          <button type="button" onClick={close}>关闭</button>
        </div>
      </div>}
    </div>
  );
}

function ReviewWorkspace({
  reviews,
  onSave,
  taskMap,
  onAddToTomorrow,
  bannerCopy,
  onBannerSave,
}) {
  const todayKey = dateKey(getLocalToday());
  const [selectedReviewDate, setSelectedReviewDate] = useState(todayKey);
  const [savedDraft, setSavedDraft] = useState(() => reviewDraftForDate(reviews, todayKey));
  const [completed, setCompleted] = useState(savedDraft.completed);
  const [blockers, setBlockers] = useState(savedDraft.blockers);
  const [insight, setInsight] = useState(savedDraft.insight);
  const [mood, setMood] = useState(savedDraft.mood);
  const [tomorrow, setTomorrow] = useState(savedDraft.tomorrow);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const [monthOpen, setMonthOpen] = useState(false);
  const [historyMonth, setHistoryMonth] = useState("");
  const date = parseLocalDate(selectedReviewDate);
  const tomorrowKey = dateKey(shiftDate(date, 1));
  const tomorrowTasks = taskMap[tomorrowKey] || [];
  const visibleReviews = reviewsForMonth(reviews, historyMonth);
  const loadDraft = (draft) => {
    setCompleted(draft.completed);
    setBlockers(draft.blockers);
    setInsight(draft.insight);
    setMood(draft.mood);
    setTomorrow(draft.tomorrow);
    setSavedDraft(draft);
  };
  const chooseDate = (nextDate) => {
    if (!nextDate || nextDate === selectedReviewDate) return;
    const currentDraft = { completed, blockers, insight, mood, tomorrow };
    if (JSON.stringify(currentDraft) !== JSON.stringify(savedDraft)
      && !window.confirm("当前复盘有未保存的修改，确定切换日期吗？")) return false;
    setSelectedReviewDate(nextDate);
    loadDraft(reviewDraftForDate(reviews, nextDate));
  };
  const save = () => {
    onSave({ date: selectedReviewDate, completed, blockers, insight, mood, tomorrow });
    setSavedDraft({ completed, blockers, insight, mood, tomorrow: [...tomorrow] });
    setNotice("复盘已保存");
    window.setTimeout(() => setNotice(""), 2200);
  };
  const saveEdit = (review) => {
    onSave(review);
    if (review.date === selectedReviewDate) loadDraft(reviewDraftForDate([review], review.date));
    if (detail?.date === review.date) setDetail(review);
    setEditing(null);
    setNotice("历史复盘已更新");
    window.setTimeout(() => setNotice(""), 2200);
  };
  const clear = () => {
    setCompleted("");
    setBlockers("");
    setInsight("");
    setMood("calm");
    setTomorrow([""]);
  };
  const question = (number, title, value, onChange, placeholder, accent) => (
    <div className="review-question">
      <label className="review-question-label">
        <span className={`review-question-num ${accent}`}>{number}</span>
        {title}
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
  return (
    <section className="review-workspace">
      <header className="review-hero">
        <img
          className="module-banner-art"
          src="assets/banner-review-v3.png"
          alt=""
        />
        <div className="review-hero-bg" aria-hidden="true">
          <span className="rh-moon" />
          <span className="rh-star s1">✦</span>
          <span className="rh-star s2">✦</span>
          <span className="rh-star s3">✦</span>
        </div>
        <div className="review-hero-inner">
          <EditableBannerText
            value={bannerCopy.title}
            onSave={(v) => onBannerSave({ title: v })}
            tag="h1"
          />
          <EditableBannerText
            value={bannerCopy.sub}
            onSave={(v) => onBannerSave({ sub: v })}
            tag="p"
            className="banner-sub"
          />
        </div>
        <aside>
          "复盘不是自责，
          <br />
          而是看见自己。"<small>— Muge</small>
        </aside>
      </header>
      <div className="review-body">
        <section className="review-today">
          <header className="review-today-head">
            <h2>
              <PencilSimple size={22} weight="bold" /> {selectedReviewDate === todayKey ? "今天的复盘" : "当天的复盘"}
            </h2>
            <div className="review-date-controls">
              <ReviewDatePicker value={selectedReviewDate} onChange={chooseDate} />
              {selectedReviewDate !== todayKey && <button type="button" className="review-back-today" onClick={() => chooseDate(todayKey)}>回到今天</button>}
            </div>
          </header>
          {question(
            "1",
            "这一天完成了什么",
            completed,
            setCompleted,
            "记录一下这一天完成的事情吧～\n比如：完成了哪些任务？有什么进展？",
            "blue",
          )}
          {question(
            "2",
            "这一天遇到的问题 / 卡点",
            blockers,
            setBlockers,
            "这一天遇到了什么问题？\n有什么困难或卡住的地方？",
            "green",
          )}
          {question(
            "3",
            "这一天最有价值的收获",
            insight,
            setInsight,
            "这一天有什么新的思考、收获或启发？\n哪怕是一点点进步，也值得被记录！",
            "yellow",
          )}
          <div className="review-mood-label">
            <Heart size={19} weight="fill" /> 当天的情绪
          </div>
          <div className="review-moods">
            {reviewMoods.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`review-mood-btn ${mood === item.value ? "selected" : ""}`}
                onClick={() => setMood(item.value)}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
          <div className="review-tomorrow-label">
            <Flag size={19} weight="fill" /> 明天最重要的事
          </div>
          <div className="review-tomorrow-items">
            {tomorrow.map((item, index) => {
              const added = tomorrowTasks.some(
                (task) =>
                  task.reviewDate === selectedReviewDate && task.title === item.trim(),
              );
              return (
                <div className="review-tomorrow-item" key={index}>
                  <input
                    type="checkbox"
                    checked={added}
                    disabled={!item.trim() || added}
                    onChange={() => onAddToTomorrow(item, selectedReviewDate)}
                    aria-label={`${item || `第 ${index + 1} 件重要的事`}加入我的一天（${tomorrowKey}）`}
                  />
                  <input
                    type="text"
                    value={item}
                    onChange={(event) =>
                      setTomorrow((items) =>
                        items.map((value, itemIndex) =>
                          itemIndex === index ? event.target.value : value,
                        ),
                      )
                    }
                    placeholder="例如：完成某个核心功能"
                  />
                  <span
                    className={`review-add-day-label ${added ? "is-added" : ""}`}
                  >
                    {added ? "已加入明天" : "加入我的一天"}
                  </span>
                  {tomorrow.length > 1 && (
                    <button
                      type="button"
                      className="review-priority-remove"
                      aria-label={`移除第 ${index + 1} 件重要的事`}
                      onClick={() =>
                        setTomorrow((items) =>
                          items.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            className="review-priority-add"
            onClick={() => setTomorrow((items) => [...items, ""])}
          >
            <Plus size={16} weight="bold" /> 添加一件重要的事
          </button>
          <div className="review-actions">
            <button className="review-save-btn" type="button" onClick={save}>
              <Check size={18} weight="bold" /> 保存复盘
            </button>
            <button className="review-clear-btn" type="button" onClick={clear}>
              <Trash size={17} /> 清空内容
            </button>
          </div>
        </section>
        <aside className="review-history">
          <header className="review-history-head">
            <h2>
              <CalendarCheck size={22} weight="bold" /> 历史复盘
            </h2>
            <div className="review-month-filter">
              <button
                type="button"
                className="review-sort"
                onClick={() => setMonthOpen((open) => !open)}
              >
                {historyMonth
                  ? historyMonth.replace("-", "年") + "月"
                  : "最近更新"}{" "}
                <CaretDown size={14} />
              </button>
              {monthOpen && (
                <div className="review-month-picker">
                  <label>
                    筛选月份
                    <input
                      type="month"
                      value={historyMonth}
                      onChange={(event) => {
                        setHistoryMonth(event.target.value);
                        setMonthOpen(false);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryMonth("");
                      setMonthOpen(false);
                    }}
                  >
                    查看全部
                  </button>
                </div>
              )}
            </div>
          </header>
          <div className="review-history-list">
            {visibleReviews.length ? (
              visibleReviews.map((review) => {
                const currentMood = reviewMood(review.mood);
                return (
                  <article className="review-history-entry" key={review.date}>
                    <div className="review-entry-head">
                      <div>
                        <span className="review-entry-date">
                          {reviewDateLabel(review.date)}
                        </span>
                        <span className="review-entry-week">
                          周{week[parseLocalDate(review.date).getDay()]}
                        </span>
                      </div>
                      <span
                        className={`review-entry-mood mood-${currentMood.value}`}
                      >
                        {currentMood.icon} {currentMood.label}
                      </span>
                    </div>
                    <div className="review-entry-snippet">
                      {reviewTextSections(review).map((section) => (
                        <p key={section.key}>
                          <span>{section.label}：</span>
                          {section.content}
                        </p>
                      ))}
                      {reviewTomorrowItems(review.tomorrow).length ? (
                        <p>
                          <span>明日：</span>
                          {reviewTomorrowItems(review.tomorrow).join("、")}
                        </p>
                      ) : null}
                    </div>
                    <div className="review-entry-actions">
                      <button
                        type="button"
                        className="review-edit-btn"
                        onClick={() => setEditing(review)}
                      >
                        <PencilSimple size={15} /> 编辑
                      </button>
                      <button
                        type="button"
                        className="review-detail-btn"
                        onClick={() => setDetail(review)}
                      >
                        查看详情
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="review-history-empty">这个月还没有复盘记录。</div>
            )}
          </div>
        </aside>
      </div>
      <footer className="review-footer">
        <span>🌱 写下每一天，才看得见自己的成长。</span>
        <i>Better Me　A Brighter Tomorrow ♡</i>
      </footer>
      {detail && (
        <div
          className="review-detail-modal"
          role="presentation"
          onMouseDown={() => setDetail(null)}
        >
          <section
            className="review-detail-panel"
            role="dialog"
            aria-modal="true"
            aria-label={`${reviewDateLabel(detail.date)}复盘详情`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="review-detail-head">
              <div>
                <h2>{reviewDateLabel(detail.date)}的复盘</h2>
                <div className="review-detail-meta">
                  周{week[parseLocalDate(detail.date).getDay()]} ·{" "}
                  {reviewMood(detail.mood).icon} {reviewMood(detail.mood).label}
                </div>
              </div>
              <button
                className="review-detail-close"
                type="button"
                onClick={() => setDetail(null)}
              >
                <X size={19} />
              </button>
            </header>
            {reviewTextSections(detail).map((section) => (
              <section className="review-detail-section" key={section.key}>
                <h3>{section.detailLabel}</h3>
                <p>{section.content}</p>
              </section>
            ))}
            {reviewTomorrowItems(detail.tomorrow).length ? (
              <section className="review-detail-section">
                <h3>明天最重要的事</h3>
                <ul>
                  {reviewTomorrowItems(detail.tomorrow).map((item, index) => (
                    <li key={`${index}-${item}`}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            <div className="review-detail-actions">
              <button type="button" className="review-edit-btn" onClick={() => setEditing(detail)}>
                <PencilSimple size={16} /> 编辑这条复盘
              </button>
            </div>
          </section>
        </div>
      )}
      {editing && (
        <ReviewEditor
          review={editing}
          onClose={() => setEditing(null)}
          onSave={saveEdit}
        />
      )}
      {notice && <div className="review-saved-toast">{notice}</div>}
    </section>
  );
}

export function App() {
  const [selectedDate, setSelectedDate] = useState(() => getLocalToday());
  const [taskMap, setTaskMap] = useState(() => ({
    [dateKey(getLocalToday())]: starterTasks,
  }));
  const [goals, setGoals] = useState([
    {
      id: 1,
      group: "short",
      type: "video",
      period: "9 月目标",
      title: "坚持更新短视频内容",
      description: "每周至少更新 3 条，积累粉丝。",
      next: "准备下一条视频选题",
      progress: 25,
      dates: "2026/09 - 2026/09",
      startDate: "2026-09-07",
      endDate: "2026-09-30",
      daysLeft: 23,
      tags: ["内容", "个人品牌"],
      status: "active",
    },
    {
      id: 2,
      group: "short",
      type: "health",
      period: "习惯养成",
      title: "保持每周三次运动",
      description: "控制体重 70kg 以内，提升精神状态。",
      next: "本周安排一次运动",
      progress: 42,
      progressLabel: "1/3 次",
      dates: "2026/09 - 2026/12",
      startDate: "2026-09-07",
      endDate: "2026-12-31",
      daysLeft: 116,
      tags: ["健康", "生活"],
      status: "active",
    },
    {
      id: 3,
      group: "short",
      type: "book",
      period: "9 月目标",
      title: "完成一份个人作品集",
      description: "整理过往项目，打造可展示的作品集。",
      next: "挑选 3 个作品",
      progress: 60,
      dates: "2026/09 - 2026/09",
      startDate: "2026-09-07",
      endDate: "2026-09-19",
      daysLeft: 12,
      tags: ["学习", "职业发展"],
      status: "active",
    },
    {
      id: 4,
      group: "mid",
      type: "laptop",
      period: "产品计划",
      title: "完成 OpenWe MVP 并上线",
      description: "核心功能可用，开始小范围测试。",
      next: "完成客户聊天页原型设计",
      progress: 40,
      dates: "2026/09 - 2026/12",
      startDate: "2026-09-07",
      endDate: "2026-12-31",
      daysLeft: 116,
      tags: ["产品", "技术"],
      status: "active",
    },
    {
      id: 5,
      group: "long",
      type: "growth",
      period: "长期愿景",
      title: "打造属于自己的产品，实现稳定收入",
      description: "通过 OpenWe 等产品，建立可持续的收入来源。",
      next: "完善产品核心功能列表",
      progress: 30,
      dates: "2026/09 - 2027/12",
      startDate: "2026-09-07",
      endDate: "2027-12-31",
      daysLeft: 451,
      tags: ["事业", "财务"],
      status: "active",
    },
  ]);
  const [showAdd, setShowAdd] = useState(false),
    [initialTask, setInitialTask] = useState(""),
    [taskToEdit, setTaskToEdit] = useState(null),
    [taskToDelete, setTaskToDelete] = useState(null),
    [focusTask, setFocusTask] = useState(null),
    [focusSession, setFocusSession] = useState(null),
    [celebration, setCelebration] = useState(0),
    [tab, setTab] = useState("day"),
    [dragTask, setDragTask] = useState(null),
    [dragOverDateKey, setDragOverDateKey] = useState(null),
    [dragGhost, setDragGhost] = useState(null);
  const [inspirations, setInspirations] = useState([
    {
      id: 101,
      title: "做一个 AI 帮用户分析 Reddit 需求的工具",
      type: "文字",
      time: "今天 10:24",
      status: "pending",
      pinned: false,
    },
    {
      id: 102,
      title: "适合我的个人品牌主页风格",
      type: "图片",
      time: "昨天 16:20",
      status: "pending",
      pinned: true,
      image: "assets/inspiration-hero-v1.png",
    },
    {
      id: 103,
      title: "做一个帮助销售跟进客户的 AI 副驾驶",
      type: "文字",
      time: "昨天 09:12",
      status: "pending",
      pinned: false,
    },
    {
      id: 104,
      title: "首页插画氛围参考",
      type: "图片",
      time: "9月16日 20:08",
      status: "pending",
      pinned: false,
      image: "assets/your-ip-hd.png",
    },
  ]);
  const [projects, setProjects] = useState(starterProjects);
  const [dailyReviews, setDailyReviews] = useState([]);
  const [knowledgeInsights, setKnowledgeInsights] = useState([]);
  const [dayHeading, setDayHeading] = useState({
    title: "嗨，今天想先完成哪件小事？",
    subtitle: "不用一下子做完，勾掉一件就很棒。",
  });
  const [goalsBanner, setGoalsBanner] = useState({
    title: "每一个小目标，都在让你成为更好的自己 ✨",
    sub: "专注重要的事，少一点焦虑，多一点行动。",
  });
  const [projectsBanner, setProjectsBanner] = useState({
    title: "把想法变成项目，再把项目慢慢做完。",
    sub: "项目不必很多，但要一步一步向前推进。",
  });
  const [inspirationsBanner, setInspirationsBanner] = useState({
    title: "先把想法接住，暂时不用急着决定。",
    sub: "记录每一个一闪而过的念头，让灵感慢慢长成行动。",
  });
  const [reviewBanner, setReviewBanner] = useState({
    title: "停下来回看一天，才能更清楚地走向明天。",
    sub: "记录完成、反思和明日重点，让成长慢慢被看见。",
  });
  // Hydration must be state, not a ref: the browser read is synchronous, so a ref
  // flips before the first save effect runs and that effect would overwrite the
  // saved day with the starter data before it is ever rendered.
  const [hydrated, setHydrated] = useState(false);
  const widgetRequests = useRef([]);
  const longPressTimer = useRef(null);
  const pressPoint = useRef(null);
  const didDrag = useRef(false);
  const dragTaskRef = useRef(null);
  useEffect(() => {
    const load = async () => {
      let saved = null;
      try {
        saved = window.desktopData
          ? await window.desktopData.read()
          : JSON.parse(localStorage.getItem("my-day-data"));
      } catch {
        saved = null;
      }
      if (saved) {
        const data = normalizeData(saved);
        setTaskMap(getSavedTaskMap(data.taskMap));
        setGoals(data.goals);
        if (data.inspirations.length) setInspirations(data.inspirations);
        if (data.projects.length) setProjects(data.projects);
        if (data.dailyReviews.length) setDailyReviews(data.dailyReviews);
        if (Array.isArray(saved.knowledgeInsights))
          setKnowledgeInsights(saved.knowledgeInsights);
        setDayHeading(data.dayHeading);
        if (data.goalsBanner) setGoalsBanner(data.goalsBanner);
        if (data.projectsBanner) setProjectsBanner(data.projectsBanner);
        if (data.inspirationsBanner)
          setInspirationsBanner(data.inspirationsBanner);
        if (data.reviewBanner) setReviewBanner(data.reviewBanner);
      }
      setHydrated(true);
    };
    load();
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    const data = {
      version: 1,
      taskMap,
      goals,
      inspirations,
      projects,
      dailyReviews,
      knowledgeInsights,
      dayHeading,
      goalsBanner,
      projectsBanner,
      inspirationsBanner,
      reviewBanner,
    };
    try {
      if (window.desktopData) {
        const requests = widgetRequests.current.splice(0);
        window.desktopData.write(data).then(() => {
          requests.forEach((id) => window.desktopWidget?.actionResult(id));
        }).catch(() => {
          requests.forEach((id) => window.desktopWidget?.actionResult(id, "保存失败，请检查磁盘空间后重试"));
        });
      }
      else localStorage.setItem("my-day-data", JSON.stringify(data));
    } catch {}
  }, [
    hydrated,
    taskMap,
    goals,
    inspirations,
    projects,
    dailyReviews,
    knowledgeInsights,
    dayHeading,
    goalsBanner,
    projectsBanner,
    inspirationsBanner,
    reviewBanner,
  ]);
  useEffect(() => {
    if (!window.desktopWidget) return;
    return window.desktopWidget.onAction(({ requestId, action }) => {
      if (!hydrated) {
        window.desktopWidget.actionResult(requestId, "任务正在加载，请稍后重试");
        return;
      }
      const current = { taskMap, projects };
      const next = applyWidgetAction(current, action);
      if (next === current) {
        window.desktopWidget.actionResult(requestId, "这条任务已变更，请刷新后重试");
        return;
      }
      widgetRequests.current.push(requestId);
      setTaskMap(next.taskMap);
      setProjects(next.projects || projects);
    });
  }, [hydrated, taskMap, projects]);
  useEffect(() => {
    const openFocusPicker = (event) => setFocusTask(event.detail);
    window.addEventListener("start-focus", openFocusPicker);
    return () => window.removeEventListener("start-focus", openFocusPicker);
  }, []);
  const clearLongPress = () => {
    window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
    pressPoint.current = null;
  };
  const getDropDateKey = (clientX, clientY) =>
    document.elementFromPoint(clientX, clientY)?.closest("[data-day-key]")
      ?.dataset.dayKey || null;
  const beginTaskDrag = (task, sourceDateKey, x, y) => {
    didDrag.current = true;
    const next = { ...task, sourceDateKey };
    dragTaskRef.current = next;
    setDragTask(next);
    setDragOverDateKey(sourceDateKey);
    setDragGhost({ x, y });
  };
  const finishTaskDrag = (clientX, clientY) => {
    const dragging = dragTaskRef.current;
    const pressing = pressPoint.current;
    if (!dragging && !pressing) return;
    clearLongPress();
    if (!dragging) {
      window.setTimeout(() => {
        didDrag.current = false;
      }, 0);
      return;
    }
    const targetDateKey = getDropDateKey(clientX, clientY);
    if (targetDateKey && targetDateKey !== dragging.sourceDateKey) {
      setTaskMap((current) =>
        moveTaskBetweenDays(
          current,
          dragging.sourceDateKey,
          targetDateKey,
          dragging.id,
        ),
      );
      setSelectedDate(parseLocalDate(targetDateKey));
    }
    dragTaskRef.current = null;
    setDragTask(null);
    setDragOverDateKey(null);
    setDragGhost(null);
    window.setTimeout(() => {
      didDrag.current = false;
    }, 0);
  };
  const startTaskPress = (event, sourceDateKey, task) => {
    if (event.button !== 0) return;
    if (
      event.target.closest(
        "button.task-toggle, button.task-delete, button.task-focus",
      )
    )
      return;
    clearLongPress();
    didDrag.current = false;
    pressPoint.current = {
      x: event.clientX,
      y: event.clientY,
      sourceDateKey,
      task,
      element: event.currentTarget,
      pointerId: event.pointerId,
    };
    longPressTimer.current = window.setTimeout(() => {
      const point = pressPoint.current;
      if (!point) return;
      point.element.setPointerCapture?.(point.pointerId);
      beginTaskDrag(task, sourceDateKey, point.x, point.y);
    }, TASK_LONG_PRESS_MS);
  };
  const moveTaskPress = (event) => {
    if (!pressPoint.current && !dragTaskRef.current) return;
    if (
      !didDrag.current &&
      pressPoint.current &&
      Math.hypot(
        event.clientX - pressPoint.current.x,
        event.clientY - pressPoint.current.y,
      ) > 8
    ) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      pressPoint.current = null;
    }
    if (!didDrag.current) return;
    setDragGhost({ x: event.clientX, y: event.clientY });
    setDragOverDateKey(getDropDateKey(event.clientX, event.clientY));
  };
  const endTaskPress = (event) => finishTaskDrag(event.clientX, event.clientY);
  const dates = useMemo(
    () => [-2, -1, 0, 1, 2].map((offset) => shiftDate(selectedDate, offset)),
    [selectedDate],
  );
  const selectedKey = dateKey(selectedDate);
  const activeTasks = taskMap[selectedKey] || [];
  const toggleTask = (id) =>
    setTaskMap((current) => ({
      ...current,
      [selectedKey]: current[selectedKey].map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    }));
  const addTask = (title, repeat) => {
    setTaskMap((current) => ({
      ...current,
      [selectedKey]: [
        ...(current[selectedKey] || []),
        {
          id: Date.now(),
          title,
          note:
            repeat === "none"
              ? ""
              : repeat === "range"
                ? "重复 · 日期范围"
                : "重复 · 已选周几",
          done: false,
          color: "blue",
        },
      ],
    }));
    setShowAdd(false);
    setInitialTask("");
  };
  const addGoalToToday = (title) =>
    setTaskMap((current) => ({
      ...current,
      [selectedKey]: [
        ...(current[selectedKey] || []),
        { id: Date.now(), title, note: "来自目标", done: false, color: "blue" },
      ],
    }));
  const addReviewPriorityToTomorrow = (title, reviewDateKey) => {
    const tomorrowDateKey = dateKey(shiftDate(parseLocalDate(reviewDateKey), 1));
    setTaskMap((current) =>
      addReviewPriorityToDay(current, tomorrowDateKey, reviewDateKey, title),
    );
  };
  const editTask = (updated) => {
    if (!taskToEdit) return;
    setTaskMap((current) => ({
      ...current,
      [taskToEdit.dateKey]: (current[taskToEdit.dateKey] || []).map((task) =>
        task.id === updated.id ? updated : task,
      ),
    }));
    setTaskToEdit(null);
  };
  const deleteTask = () => {
    if (!taskToDelete) return;
    setTaskMap((current) => ({
      ...current,
      [taskToDelete.dateKey]: (current[taskToDelete.dateKey] || []).filter(
        (task) => task.id !== taskToDelete.task.id,
      ),
    }));
    setTaskToDelete(null);
  };
  const celebrate = (kind, title) =>
    setCelebration({ id: Date.now(), kind, title });
  const completeGoal = (goal) => {
    if (goal.status === "done") return;
    setGoals((current) =>
      current.map((item) =>
        item.id === goal.id
          ? { ...item, progress: 100, progressLabel: undefined, status: "done" }
          : item,
      ),
    );
    celebrate("goal", goal.title);
  };
  const toggleTaskWithCelebration = (date, task) => {
    const done = !task.done;
    setSelectedDate(date);
    setTaskMap((current) => ({
      ...current,
      [dateKey(date)]: current[dateKey(date)].map((item) =>
        item.id === task.id ? { ...item, done } : item,
      ),
    }));
    if (task.projectId && task.projectTaskId)
      setProjects((current) =>
        syncProjectTaskDone(current, task.projectId, task.projectTaskId, done),
      );
    if (!task.done) {
      setCelebration({
        id: Date.now(),
        kind: (taskMap[dateKey(date)] || []).every(
          (item) => item.id === task.id || item.done,
        )
          ? "day"
          : "task",
        title: task.title,
      });
    }
  };
  const createProject = (data) =>
    setProjects((current) => [
      ...current,
      { ...data, id: Date.now(), status: "active", createdAt: Date.now() },
    ]);
  const changeProjectStatus = (projectId, status) =>
    setProjects((current) => updateProjectStatus(current, projectId, status));
  const createProjectIteration = (projectId, iteration) =>
    setProjects((current) => addProjectIteration(current, projectId, iteration));
  const createIterationDecision = (projectId, iterationId, decision) =>
    setProjects((current) => addIterationDecision(current, projectId, iterationId, decision));
  const editIterationDecision = (projectId, iterationId, decisionId, update) =>
    setProjects((current) => updateIterationDecision(current, projectId, iterationId, decisionId, update));
  const removeIterationDecision = (projectId, iterationId, decisionId) =>
    setProjects((current) => deleteIterationDecision(current, projectId, iterationId, decisionId));
  const createIterationBug = (projectId, iterationId, bug) =>
    setProjects((current) => addIterationBug(current, projectId, iterationId, bug));
  const editIterationBug = (projectId, iterationId, bugId, update) =>
    setProjects((current) => updateIterationBug(current, projectId, iterationId, bugId, update));
  const removeIterationBug = (projectId, iterationId, bugId) =>
    setProjects((current) => deleteIterationBug(current, projectId, iterationId, bugId));
  const toggleProjectTask = (project, task) => {
    const done = !task.done;
    setProjects((current) =>
      syncProjectTaskDone(current, project.id, task.id, done),
    );
    setTaskMap((current) =>
      syncDailyProjectTasks(current, project.id, task.id, done),
    );
  };
  const addProjectTaskToToday = (project, task) => {
    const todayKey = dateKey(getLocalToday());
    setProjects((current) => {
      const scheduled = task.startDate
        ? current
        : scheduleProjectTaskOnDate(current, project.id, task.id, todayKey);
      return markProjectTaskAddedToDay(
        scheduled,
        project.id,
        task.id,
        todayKey,
      );
    });
    setTaskMap((current) =>
      addProjectTaskToDay(current, todayKey, project, task),
    );
  };
  const addProjectTask = (projectId, task) =>
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? {
              ...project,
              tasks: [
                ...project.tasks,
                { id: Date.now(), ...task, done: false },
              ],
            }
          : project,
      ),
    );
  const updateProjectTask = (projectId, taskId, update) =>
    setProjects((current) =>
      current.map((project) =>
        project.id !== projectId
          ? project
          : {
              ...project,
              tasks: project.tasks.map((task) =>
                task.id === taskId ? { ...task, ...update } : task,
              ),
            },
      ),
    );
  const deleteProjectTask = (projectId, taskId) =>
    setProjects((current) =>
      current.map((project) =>
        project.id !== projectId
          ? project
          : {
              ...project,
              tasks: project.tasks.filter((task) => task.id !== taskId),
            },
      ),
    );
  const addProjectNote = (projectId, note) =>
    setProjects((current) =>
      current.map((project) =>
        project.id !== projectId
          ? project
          : {
              ...project,
              notes: [
                {
                  id: Date.now(),
                  content: note.content || "",
                  images: note.images || [],
                  iterationId: note.iterationId,
                  pinned: false,
                  createdAt: Date.now(),
                },
                ...(project.notes || []),
              ],
            },
      ),
    );
  const updateProjectNoteEntry = (projectId, noteId, update) =>
    setProjects((current) =>
      current.map((project) =>
        project.id !== projectId
          ? project
          : {
              ...project,
              notes: updateProjectNote(project.notes, noteId, update),
            },
      ),
    );
  const toggleProjectNotePin = (projectId, noteId) =>
    setProjects((current) =>
      current.map((project) =>
        project.id !== projectId
          ? project
          : {
              ...project,
              notes: toggleProjectNotePinned(project.notes, noteId),
            },
      ),
    );
  const deleteProjectNote = (projectId, noteId) =>
    setProjects((current) =>
      current.map((project) =>
        project.id !== projectId
          ? project
          : {
              ...project,
              notes: (project.notes || []).filter((note) => note.id !== noteId),
            },
      ),
    );
  const addInspiration = ({ title, image, type }) =>
    setInspirations((current) => [
      {
        id: Date.now(),
        title,
        image,
        type,
        time: "刚刚",
        status: "pending",
        pinned: false,
      },
      ...current,
    ]);
  const updateInspiration = (id, update) =>
    setInspirations((current) =>
      current.map((item) => (item.id === id ? { ...item, ...update } : item)),
    );
  const inspirationToGoal = (idea) => {
    updateInspiration(idea.id, { status: "goal" });
    setGoals((current) => [
      ...current,
      {
        id: Date.now(),
        group: "short",
        type: "idea",
        period: "来自灵感",
        title: idea.title,
        description: "从一个念头开始，把它慢慢变成行动。",
        next: "写下第一个最小行动",
        progress: 0,
        dates: "2026/09 - 2026/12",
        startDate: "2026-09-08",
        endDate: "2026-12-31",
        daysLeft: 114,
        tags: ["灵感"],
        status: "active",
      },
    ]);
  };
  const inspirationToToday = (idea) => {
    updateInspiration(idea.id, { status: "today" });
    addGoalToToday(idea.title);
  };
  if (focusSession)
    return (
      <FocusSession
        task={focusSession.task}
        minutes={focusSession.minutes}
        onExit={() => setFocusSession(null)}
      />
    );
  if (focusTask)
    return (
      <FocusDurationPicker
        task={focusTask}
        onClose={() => setFocusTask(null)}
        onStart={(minutes) => {
          setFocusSession({ task: focusTask, minutes });
          setFocusTask(null);
        }}
      />
    );
  if (tab === "knowledge")
    return (
      <main className="app-shell">
        <nav className="topbar">
          <div className="brand">
            <span className="brand-mark">
              <img src="assets/mascot-avatar-wink-v2.png" alt="" />
            </span>
            <span>我的人生</span>
          </div>
          <div className="tabs">
            <button onClick={() => setTab("day")}>我的一天</button>
            <button onClick={() => setTab("goals")}>我的目标</button>
            <button onClick={() => setTab("projects")}>我的项目</button>
            <button onClick={() => setTab("inspirations")}>我的灵感</button>
            <button className="active">知识库</button>
            <button onClick={() => setTab("review")}>每日复盘</button>
          </div>
        </nav>
        <KnowledgeWorkspace
          insights={knowledgeInsights}
          onInsightsChange={setKnowledgeInsights}
        />
      </main>
    );
  return (
    <main className="app-shell">
      {celebration ? (
        <CompletionCelebration
          key={celebration.id}
          event={celebration}
          onEnd={() => setCelebration(0)}
        />
      ) : null}
      <nav className="topbar">
        {window.desktopWidget && <button className="desktop-widget-entry" onClick={() => window.desktopWidget.show()} title="显示今天的桌面待办">桌面待办 ↗</button>}
        <div className="brand">
          <span className="brand-mark">
            <img src="assets/mascot-avatar-wink-v2.png" alt="" />
          </span>
          <span>我的人生</span>
          <small className="brand-bubble">今天也要元气满满</small>
        </div>
        <div className="tabs">
          <button
            className={tab === "day" ? "active" : ""}
            onClick={() => setTab("day")}
          >
            我的一天
          </button>
          <button
            className={tab === "goals" ? "active" : ""}
            onClick={() => setTab("goals")}
          >
            我的目标
          </button>
          <button
            className={tab === "projects" ? "active" : ""}
            onClick={() => setTab("projects")}
          >
            我的项目
          </button>
          <button
            className={tab === "inspirations" ? "active" : ""}
            onClick={() => setTab("inspirations")}
          >
            我的灵感
          </button>
          <button
            className={tab === "knowledge" ? "active" : ""}
            onClick={() => setTab("knowledge")}
          >
            知识库
          </button>
          <button
            className={tab === "review" ? "active" : ""}
            onClick={() => setTab("review")}
          >
            每日复盘
          </button>
        </div>
      </nav>
      {tab === "review" ? (
        <ReviewWorkspace
          reviews={dailyReviews}
          taskMap={taskMap}
          onAddToTomorrow={addReviewPriorityToTomorrow}
          onSave={(review) =>
            setDailyReviews((current) => upsertDailyReview(current, review))
          }
          bannerCopy={reviewBanner}
          onBannerSave={(patch) =>
            setReviewBanner((cur) => ({ ...cur, ...patch }))
          }
        />
      ) : tab === "projects" ? (
        <Projects
          projects={projects}
          onCreate={createProject}
          onToggleTask={toggleProjectTask}
          onAddToToday={addProjectTaskToToday}
          onAddTask={addProjectTask}
          onUpdateTask={updateProjectTask}
          onDeleteTask={deleteProjectTask}
          onUpdateStatus={changeProjectStatus}
          onDeleteProject={(id) =>
            setProjects((cur) => cur.filter((p) => p.id !== id))
          }
          onAddNote={addProjectNote}
          onUpdateNote={updateProjectNoteEntry}
          onToggleNotePin={toggleProjectNotePin}
          onDeleteNote={deleteProjectNote}
          onAddIteration={createProjectIteration}
          onAddDecision={createIterationDecision}
          onUpdateDecision={editIterationDecision}
          onDeleteDecision={removeIterationDecision}
          onAddBug={createIterationBug}
          onUpdateBug={editIterationBug}
          onDeleteBug={removeIterationBug}
          bannerCopy={projectsBanner}
          onBannerSave={(patch) =>
            setProjectsBanner((cur) => ({ ...cur, ...patch }))
          }
        />
      ) : tab === "inspirations" ? (
        <Inspirations
          inspirations={inspirations}
          onCreate={addInspiration}
          onArchive={(id) => updateInspiration(id, { status: "archived" })}
          onDelete={(id) =>
            setInspirations((current) =>
              current.filter((item) => item.id !== id),
            )
          }
          onTogglePin={(id) =>
            setInspirations((current) =>
              current.map((item) =>
                item.id === id ? { ...item, pinned: !item.pinned } : item,
              ),
            )
          }
          onAddToToday={inspirationToToday}
          onTurnIntoGoal={inspirationToGoal}
          onEdit={(updated) =>
            setInspirations((current) =>
              current.map((item) => (item.id === updated.id ? updated : item)),
            )
          }
          bannerCopy={inspirationsBanner}
          onBannerSave={(patch) =>
            setInspirationsBanner((cur) => ({ ...cur, ...patch }))
          }
        />
      ) : tab === "goals" ? (
        <Goals
          goals={goals}
          onComplete={completeGoal}
          onAddNext={addGoalToToday}
          onDeleteGoal={(id) =>
            setGoals((current) => current.filter((goal) => goal.id !== id))
          }
          onEdit={(updated) => {
            setGoals((current) =>
              current.map((goal) => (goal.id === updated.id ? updated : goal)),
            );
            if (
              updated.status === "done" &&
              goals.find((goal) => goal.id === updated.id)?.status !== "done"
            )
              celebrate("goal", updated.title);
          }}
          onCreate={({
            title,
            description,
            next,
            icon,
            start,
            end,
            progress,
          }) =>
            setGoals((current) => [
              ...current,
              {
                id: Date.now(),
                group: goalGroupForDates(start, end),
                type: icon,
                period: "新目标",
                title,
                description: description || "一步一步把它完成。",
                next: next || "写下第一步",
                progress,
                dates: goalDatesText(start, end),
                startDate: start,
                endDate: end,
                daysLeft: daySpan("2026-09-07", end),
                tags: ["新目标"],
                status: Number(progress) >= 100 ? "done" : "active",
              },
            ])
          }
          bannerCopy={goalsBanner}
          onBannerSave={(patch) =>
            setGoalsBanner((cur) => ({ ...cur, ...patch }))
          }
        />
      ) : (
        <>
          <section className="day-heading">
            <div>
              <span className="eyebrow">
                TODAY · 周{week[selectedDate.getDay()]} ·{" "}
                {String(selectedDate.getMonth() + 1).padStart(2, "00")}.
                {String(selectedDate.getDate()).padStart(2, "00")}
              </span>
              <EditableDayCopy
                kind="title"
                value={dayHeading.title}
                onSave={(title) =>
                  setDayHeading((current) => ({ ...current, title }))
                }
              />
              <EditableDayCopy
                kind="subtitle"
                value={dayHeading.subtitle}
                onSave={(subtitle) =>
                  setDayHeading((current) => ({ ...current, subtitle }))
                }
              />
            </div>
            <div className="month-switch">
              <button
                aria-label="往前一天"
                onClick={() => setSelectedDate((date) => shiftDate(date, -1))}
              >
                <ArrowLeft size={19} />
              </button>
              <strong>
                {selectedDate.getFullYear()} 年 {selectedDate.getMonth() + 1} 月
              </strong>
              <button
                aria-label="往后一天"
                onClick={() => setSelectedDate((date) => shiftDate(date, 1))}
              >
                <ArrowRight size={19} />
              </button>
            </div>
          </section>
          <section
            className="calendar-stage"
            style={{ position: "relative" }}
            aria-label="日期与待办"
          >
            <button
              className="rail-nav rail-nav-left"
              style={{
                position: "absolute",
                left: 22,
                top: "50%",
                zIndex: 2,
                width: 42,
                height: 42,
                borderRadius: 14,
                color: "#5d8fc7",
                background: "#ffffffdf",
                boxShadow: "0 6px 18px #7289a42b",
              }}
              aria-label="查看更早日期"
              onClick={() => setSelectedDate((date) => shiftDate(date, -1))}
            >
              <ArrowLeft size={23} />
            </button>
            <div className="card-rail" key={selectedKey}>
              {dates.map((date, index) => (
                <DayCard
                  key={dateKey(date)}
                  date={date}
                  active={index === 2}
                  isToday={isSameCalendarDay(date, getLocalToday())}
                  tasks={taskMap[dateKey(date)] || []}
                  dragTask={dragTask}
                  dragOverDateKey={dragOverDateKey}
                  onSelect={() => setSelectedDate(date)}
                  onAdd={() => setShowAdd(true)}
                  onToggle={(id) => {
                    if (!didDrag.current)
                      toggleTaskWithCelebration(
                        date,
                        (taskMap[dateKey(date)] || []).find(
                          (task) => task.id === id,
                        ),
                      );
                  }}
                  onEditTask={(task) => {
                    if (!didDrag.current)
                      setTaskToEdit({ task, dateKey: dateKey(date) });
                  }}
                  onDeleteTask={(task) => {
                    if (!didDrag.current)
                      setTaskToDelete({ task, dateKey: dateKey(date) });
                  }}
                  onTaskPressStart={startTaskPress}
                  onTaskPressEnd={endTaskPress}
                  onTaskPressMove={moveTaskPress}
                />
              ))}
            </div>
            <button
              className="rail-nav rail-nav-right"
              style={{
                position: "absolute",
                right: 22,
                top: "50%",
                zIndex: 2,
                width: 42,
                height: 42,
                borderRadius: 14,
                color: "#5d8fc7",
                background: "#ffffffdf",
                boxShadow: "0 6px 18px #7289a42b",
              }}
              aria-label="查看更晚日期"
              onClick={() => setSelectedDate((date) => shiftDate(date, 1))}
            >
              <ArrowRight size={23} />
            </button>
          </section>
          <div className="progress-line">
            <span>
              {activeTasks.length && activeTasks.every((item) => item.done)
                ? "今天全部完成啦！"
                : "今天的小进度"}
            </span>
            <div>
              <i
                style={{
                  width: `${activeTasks.length ? Math.round((activeTasks.filter((item) => item.done).length / activeTasks.length) * 100) : 0}%`,
                }}
              />
            </div>
            <b>
              {activeTasks.filter((item) => item.done).length}/
              {activeTasks.length}
            </b>
          </div>
          <button className="floating-add" onClick={() => setShowAdd(true)}>
            <Plus size={25} />
            <span>添加待办</span>
          </button>
        </>
      )}
      {showAdd && (
        <AddTask
          key={`${selectedKey}-${initialTask}`}
          selectedDate={selectedDate}
          initialTitle={initialTask}
          onClose={() => {
            setShowAdd(false);
            setInitialTask("");
          }}
          onSave={addTask}
        />
      )}
      {taskToEdit && (
        <EditTask
          task={taskToEdit.task}
          onClose={() => setTaskToEdit(null)}
          onSave={editTask}
        />
      )}
      {taskToDelete && (
        <ConfirmDelete
          title={taskToDelete.task.title}
          itemType="待办"
          onCancel={() => setTaskToDelete(null)}
          onConfirm={deleteTask}
        />
      )}
      {dragTask && dragGhost && (
        <div
          className="task-drag-ghost"
          style={{ left: dragGhost.x, top: dragGhost.y }}
        >
          {dragTask.title}
        </div>
      )}
    </main>
  );
}
