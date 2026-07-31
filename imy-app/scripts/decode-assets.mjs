// Build-time asset decoder.
// Large binary assets travel in git as base64 text (assets-b64/*.b64) because our
// commit pipeline is text-safe only. This script materializes the real files into
// public/ before `next build`. Pure Node, no dependencies. Safe to run repeatedly.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "assets-b64");

// name.b64 encodes its destination with "__" as the path separator,
// e.g. "public__bg__campfire-poster.jpg.b64" -> public/bg/campfire-poster.jpg
if (!existsSync(srcDir)) {
  console.log("[decode-assets] no assets-b64 directory; nothing to do");
  process.exit(0);
}
let n = 0;
for (const f of readdirSync(srcDir)) {
  if (!f.endsWith(".b64")) continue;
  const rel = f.slice(0, -4).split("__").join("/");
  const dest = join(root, rel);
  mkdirSync(dirname(dest), { recursive: true });
  const b64 = readFileSync(join(srcDir, f), "utf8").replace(/\s+/g, "");
  writeFileSync(dest, Buffer.from(b64, "base64"));
  n++;
}
console.log(`[decode-assets] wrote ${n} asset${n === 1 ? "" : "s"}`);
