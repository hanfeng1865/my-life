import test from "node:test";
import assert from "node:assert/strict";
import { formatFocusTime, focusProgress } from "../src/focus-session.js";

test("formats a remaining focus duration as mm:ss", () => {
  assert.equal(formatFocusTime(15 * 60), "15:00");
  assert.equal(formatFocusTime(59), "00:59");
  assert.equal(formatFocusTime(0), "00:00");
});

test("calculates focus progress from remaining seconds", () => {
  assert.equal(focusProgress(900, 900), 0);
  assert.equal(focusProgress(450, 900), 50);
  assert.equal(focusProgress(0, 900), 100);
  assert.equal(focusProgress(1200, 900), 0);
});
