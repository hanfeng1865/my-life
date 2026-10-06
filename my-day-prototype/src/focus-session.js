export function formatFocusTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function focusProgress(remainingSeconds, totalSeconds) {
  if (!totalSeconds || totalSeconds < 0) return 0;
  const percent = (1 - Math.max(0, remainingSeconds) / totalSeconds) * 100;
  return Math.max(0, Math.min(100, Math.round(percent)));
}
