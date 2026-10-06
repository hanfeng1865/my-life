import test from "node:test";
import assert from "node:assert/strict";
import { isPlayableAudio, toAudioTrack } from "../electron/audio-library.cjs";

test("recognizes the audio formats supported by the focus player", () => {
  assert.equal(isPlayableAudio("雨天白噪音.mp3"), true);
  assert.equal(isPlayableAudio("forest.M4A"), true);
  assert.equal(isPlayableAudio("cover.png"), false);
  assert.equal(isPlayableAudio("README.md"), false);
});

test("exposes each local audio file by its original filename", () => {
  const track = toAudioTrack("/library/雨天白噪音.mp3", "雨天白噪音.mp3");

  assert.deepEqual(track, { name: "雨天白噪音.mp3", url: "file:///library/%E9%9B%A8%E5%A4%A9%E7%99%BD%E5%99%AA%E9%9F%B3.mp3" });
});
