import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, Trophy } from "@phosphor-icons/react";
import "./celebration.css";

export function CompletionCelebration({ event, onEnd }) {
  const grand = event.kind === "goal" || event.kind === "day";
  useEffect(() => {
    const timer = setTimeout(onEnd, grand ? 4200 : 2900);
    return () => clearTimeout(timer);
  }, [event, grand, onEnd]);
  return createPortal(<div className={`achievement-stage ${grand ? "is-grand" : ""}`} role="status" aria-live="polite">
    <div className="achievement-aura" />
    <div className="achievement-rings" aria-hidden="true"><i /><i /><i /></div>
    <div className="achievement-particles" aria-hidden="true">{Array.from({ length: grand ? 100 : 64 }, (_, i) => {
      const angle = i * 2.39996;
      const distance = 200 + (i * 79 % 430);
      return <i key={i} style={{ "--x": `${Math.cos(angle) * distance}px`, "--y": `${Math.sin(angle) * distance * .7 - 100}px`, "--spin": `${i * 137}deg`, "--delay": `${i % 5 * .045}s`, "--color": ["#ffcb53", "#53c2ff", "#fc85ab", "#b49aff", "#65dfb4"][i % 5] }} />;
    })}</div>
    <div className="achievement-content">
      <div className="achievement-medal">{grand ? <Trophy size={76} weight="fill" /> : <Check size={76} weight="bold" />}</div>
      <span className="achievement-kicker">{event.kind === "goal" ? "属于你的里程碑" : event.kind === "day" ? "今日成就 · 全部达成" : "每一步，都算数"}</span>
      <h2>{event.kind === "goal" ? "你真的做到了！" : event.kind === "day" ? "今天，漂亮收官！" : "漂亮！又完成一件！"}</h2>
      <p className="achievement-title">{event.title}</p>
      <p className="achievement-message">{grand ? "那些认真付出的日子，在这一刻闪闪发光。" : "把想做的事，变成了做成的事。"}</p>
      <span className="achievement-seal">{grand ? "✦  为自己骄傲  ✦" : "✦  行动力 +1  ✦"}</span>
    </div>
  </div>, document.body);
}
