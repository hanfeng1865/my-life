import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const source = process.argv[2];
const target = process.argv[3];
if (!source || !target) throw new Error("Usage: node make-app-icon.mjs iconset-directory target.icns");

const sizes = [
  ["ic07", 128],
  ["ic08", 256],
  ["ic09", 512],
  ["ic10", 1024],
];
const chunks = await Promise.all(sizes.map(async ([type, size]) => {
  const payload = await readFile(path.join(source, `icon_${size}x${size}.png`));
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
