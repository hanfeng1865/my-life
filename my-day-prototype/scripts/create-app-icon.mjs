import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "public", "assets", "mascot-avatar-wink-v2.png");
const iconset = path.join(root, "build", "my-life.iconset");
const target = path.join(root, "build", "my-life.icns");
const sizes = [16, 32, 128, 256, 512];

await rm(iconset, { recursive: true, force: true });
await mkdir(iconset, { recursive: true });
for (const size of sizes) {
  await execFileAsync("sips", ["-z", String(size), String(size), source, "--out", path.join(iconset, `icon_${size}x${size}.png`)]);
  await execFileAsync("sips", ["-z", String(size * 2), String(size * 2), source, "--out", path.join(iconset, `icon_${size}x${size}@2x.png`)]);
}
const chunks = await Promise.all([["ic07", "icon_128x128.png"], ["ic08", "icon_128x128@2x.png"], ["ic09", "icon_256x256@2x.png"], ["ic10", "icon_512x512@2x.png"]].map(async ([type, filename]) => {
  const payload = await readFile(path.join(iconset, filename));
  const header = Buffer.alloc(8);
  header.write(type, 0, 4, "ascii");
  header.writeUInt32BE(payload.length + 8, 4);
  return Buffer.concat([header, payload]);
}));
const body = Buffer.concat(chunks);
const header = Buffer.alloc(8);
header.write("icns", 0, 4, "ascii");
header.writeUInt32BE(body.length + 8, 4);
await writeFile(target, Buffer.concat([header, body]));
