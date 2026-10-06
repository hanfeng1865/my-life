import { useEffect, useRef, useState } from 'react';
import { widgetDateKey } from './widget-data.js';
import './desktop-widget.css';

export function DesktopWidget() {
  const api = window.desktopWidget;
  const [data, setData] = useState(null);
  const [today, setToday] = useState(widgetDateKey);
  const [pinned, setPinned] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef(null);
  useEffect(() => {
    if (!api) return;
    let active = true;
    let received = false;
    const off = api.onData((value) => { received = true; if (active) { setData(value); setError(''); } });
    api.read().then((value) => { if (active) { if (!received) setData(value.data); setPinned(value.pinned); } }).catch(() => { if (active) setError('任务加载失败，请重新打开小窗口'); });
    const refreshDate = () => setToday(widgetDateKey());
    const timer = setInterval(refreshDate, 1000);
    window.addEventListener('focus', refreshDate);
    return () => { active = false; off(); clearInterval(timer); window.removeEventListener('focus', refreshDate); };
  }, [api]);
  useEffect(() => { if (adding) input.current?.focus(); }, [adding]);
  const tasks = data?.taskMap?.[today] || [];
  const pending = tasks.filter((task) => !task.done);
  const completed = tasks.filter((task) => task.done);
  async function act(action) {
    if (busy) return false;
    setBusy(true); setError('');
    try { await api.action({ ...action, dateKey: widgetDateKey() }); return true; }
    catch (e) { setError(e.message?.replace(/^Error invoking remote method '[^']+': Error: /, '') || '同步失败，请重试'); return false; }
    finally { setBusy(false); }
  }
  const renderTask = (task) => <label className={`widget-task ${task.done ? 'is-done' : ''}`} key={task.id}>
    <input type="checkbox" checked={Boolean(task.done)} disabled={busy} onChange={(event) => act({ type: 'complete', id: task.id, done: event.target.checked })} />
    <span title={task.title}>{task.title}</span>
  </label>;
  return <main className="desktop-widget">
    <header className="widget-header">
      <button className="widget-dismiss" aria-label="收起桌面待办" title="收起桌面待办" onClick={() => api?.hide()}>×</button>
      <div className="widget-heading"><strong>我的一天</strong><span>{Number(today.slice(5, 7))}月{Number(today.slice(8))}日 · 今天</span></div>
      <div className="widget-actions">
        <button aria-label={pinned ? '取消置顶' : '置顶窗口'} aria-pressed={pinned} title={pinned ? '取消置顶' : '置顶窗口'} className={pinned ? 'is-pinned' : ''} onClick={async () => { try { setPinned(await api.pin(!pinned)); } catch { setError('置顶失败，请重试'); } }}>↟</button>
        <button className="widget-plus" aria-label="添加待办" title="添加待办" disabled={!data} onClick={() => setAdding((value) => !value)}>+</button>
      </div>
    </header>
    {adding && <form className="widget-add" onSubmit={async (event) => { event.preventDefault(); if (!title.trim()) return; if (await act({ type: 'add', title, id: crypto.randomUUID() })) { setTitle(''); input.current?.focus(); } }}>
      <input ref={input} aria-label="新的待办事项" placeholder="写下一件小事…" value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') setAdding(false); }} maxLength={500} />
      <button type="submit" disabled={busy || !title.trim()}>添加</button>
    </form>}
    <div className="widget-scroll" aria-busy={busy}>
      {!data ? <p className="widget-empty">{api ? '正在读取今天的任务…' : '请在桌面应用中打开待办小窗口'}</p> : <>
        <section aria-label="未完成任务">{pending.map(renderTask)}</section>
        {!pending.length && <div className="widget-empty"><span>{completed.length ? '✓' : '☀'}</span><p>{completed.length ? '今天的小事，都完成了' : '今天想先完成哪件小事？'}</p><small>{completed.length ? '给自己一点掌声。' : '点右上角 +，轻轻开始。'}</small></div>}
        {completed.length > 0 && <section className="widget-completed">
          <button className="widget-completed-toggle" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}><span>{expanded ? '⌄' : '›'}</span> 已完成 <b>{completed.length}</b></button>
          {expanded && completed.map(renderTask)}
        </section>}
      </>}
    </div>
    {error && <p className="widget-error" role="alert">{error}</p>}
    <footer className="widget-footer"><span>{busy ? '正在保存…' : `${pending.length} 件待办 · ${completed.length} 件完成`}</span><button onClick={() => api?.openMain()}>打开我的一天 ↗</button></footer>
  </main>;
}
