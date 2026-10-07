import { useEffect, useId, useRef, useState } from "react";
import { CaretDown, Check } from "@phosphor-icons/react";

export function StatusSelect({ value, onChange, options: statuses, label }) {
  const [open, setOpen] = useState(false);
  const controlRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const currentIndex = Math.max(0, statuses.findIndex(([optionValue]) => optionValue === value));
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    optionRefs.current[currentIndex]?.focus();
    const closeOutside = (event) => {
      if (!controlRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open, currentIndex]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <span
      ref={controlRef}
      className={`project-status-control ${value}${open ? " is-open" : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
    >
      <button
        type="button"
        ref={triggerRef}
        className="project-status-trigger"
        aria-label={`${label}（${statuses[currentIndex][1]}）`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {statuses[currentIndex][1]}
        <CaretDown size={13} weight="bold" />
      </button>
      {open && (
        <span className="project-status-menu" role="menu" id={menuId} aria-label={label}>
          {statuses.map(([optionValue, optionLabel], index) => (
            <button
              type="button"
              role="menuitemradio"
              aria-checked={value === optionValue}
              className={`project-status-option ${optionValue}${value === optionValue ? " selected" : ""}`}
              key={optionValue}
              ref={(element) => { optionRefs.current[index] = element; }}
              tabIndex={-1}
              onClick={() => {
                if (value !== optionValue) onChange(optionValue);
                close();
              }}
              onKeyDown={(event) => {
                const nextIndex = event.key === "ArrowDown" ? (index + 1) % statuses.length
                  : event.key === "ArrowUp" ? (index + statuses.length - 1) % statuses.length
                  : event.key === "Home" ? 0 : event.key === "End" ? statuses.length - 1 : null;
                if (nextIndex !== null) {
                  event.preventDefault();
                  optionRefs.current[nextIndex]?.focus();
                }
              }}
            >
              <span className="project-status-dot" aria-hidden="true" />
              {optionLabel}
              {value === optionValue && <Check size={15} weight="bold" />}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}
