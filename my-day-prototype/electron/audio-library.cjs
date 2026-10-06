const path = require("node:path");
const { pathToFileURL } = require("node:url");

const AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".wav", ".ogg", ".aac", ".flac"]);

function isPlayableAudio(filename) {
  return AUDIO_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

function toAudioTrack(filePath, name = path.basename(filePath)) {
  return { name, url: pathToFileURL(filePath).href };
}

module.exports = { isPlayableAudio, toAudioTrack };
