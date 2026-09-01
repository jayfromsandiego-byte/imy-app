// scripts/port/bundle-lib.mjs — shared fail-loud patch harness for the unified
// bundle (imy-app/public/preview/unified.html: six base64 <script id="pg-*">
// page documents + a plain-text shell tail).
//
// The rules, inherited from extract-tribute-unified.mjs:
//   · never hand-edit base64 — decode → patch → re-encode;
//   · every patch is FAIL-LOUD: a missing or ambiguous anchor names itself and
//     exits non-zero, never writing a silently mispatched bundle;
//   · only the intended page block may change — the harness asserts every
//     other block (and the shell) is byte-identical before writing.
//
// Usage (from a one-shot patch script):
//   import { patchBundle } from "./bundle-lib.mjs";
//   patchBundle({
//     pages: {
//       "pg-studio": (p) => { p.mustReplace(from, to, "label"); },
//     },
//   });

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.env.IMY_REPO_ROOT || process.cwd();
const BUNDLE = path.join(ROOT, "imy-app/public/preview/unified.html");

export const fatal = (msg) => {
  console.error(`\nbundle-patch: FAIL — ${msg}`);
  process.exit(1);
};

function makePatcher(id, doc) {
  const state = { doc, patches: 0 };
  return {
    state,
    /** Replace an exact string exactly once. Loud when absent or ambiguous. */
    mustReplace(from, to, label) {
      const i = state.doc.indexOf(from);
      if (i === -1) fatal(`[${id}] anchor not found (${label}): ${JSON.stringify(from.slice(0, 90))}`);
      if (state.doc.indexOf(from, i + 1) !== -1) fatal(`[${id}] anchor is ambiguous (${label}): ${JSON.stringify(from.slice(0, 90))}`);
      state.doc = state.doc.slice(0, i) + to + state.doc.slice(i + from.length);
      state.patches++;
    },
    /** Replace from an exact start anchor through an exact end anchor (inclusive). */
    mustSpan(start, end, to, label) {
      const i = state.doc.indexOf(start);
      if (i === -1) fatal(`[${id}] span start not found (${label}): ${JSON.stringify(start.slice(0, 90))}`);
      const j = state.doc.indexOf(end, i + start.length);
      if (j === -1) fatal(`[${id}] span end not found (${label}): ${JSON.stringify(end)}`);
      state.doc = state.doc.slice(0, i) + to + state.doc.slice(j + end.length);
      state.patches++;
    },
    /** Assert a string is present after patching (a required-output contract). */
    mustContain(needle, label) {
      if (!state.doc.includes(needle)) fatal(`[${id}] required string missing after patch (${label}): ${JSON.stringify(needle.slice(0, 90))}`);
    },
  };
}

export function patchBundle({ pages, shell: shellFn }) {
  const original = readFileSync(BUNDLE, "utf8");
  let out = original;
  const touched = [];

  for (const [id, fn] of Object.entries(pages || {})) {
    const re = new RegExp(`<script type="text/plain" id="${id}">([\\s\\S]*?)</script>`);
    const m = out.match(re);
    if (!m) fatal(`no <script type="text/plain" id="${id}"> block in the bundle`);
    const before = Buffer.from(m[1].trim(), "base64").toString("utf8");
    if (!before.startsWith("<!DOCTYPE html>")) fatal(`decoded ${id} does not start with <!DOCTYPE html> — encoding drift?`);
    const p = makePatcher(id, before);
    fn(p);
    const after = p.state.doc;
    if (after === before) fatal(`[${id}] patch function changed nothing`);
    const b64 = Buffer.from(after, "utf8").toString("base64");
    out = out.replace(m[0], `<script type="text/plain" id="${id}">${b64}</script>`);
    touched.push(`${id}: ${p.state.patches} patches, ${before.length} → ${after.length} bytes`);
  }

  if (shellFn) {
    // The shell is everything outside the six page blocks; patch it in place,
    // fail-loud, without ever touching a base64 payload.
    const p = makePatcher("shell", out);
    const guardBlocks = [...out.matchAll(/<script type="text\/plain" id="pg-[a-z]+">[\s\S]*?<\/script>/g)].map((x) => x[0]);
    shellFn(p);
    for (const g of guardBlocks) {
      if (!p.state.doc.includes(g)) fatal(`shell patch modified a base64 page block — refused`);
    }
    out = p.state.doc;
    touched.push(`shell: ${p.state.patches} patches`);
  }

  // Every untouched page block must be byte-identical.
  const beforeBlocks = Object.fromEntries([...original.matchAll(/<script type="text\/plain" id="(pg-[a-z]+)">([\s\S]*?)<\/script>/g)].map((m) => [m[1], m[2]]));
  const afterBlocks = Object.fromEntries([...out.matchAll(/<script type="text\/plain" id="(pg-[a-z]+)">([\s\S]*?)<\/script>/g)].map((m) => [m[1], m[2]]));
  for (const id of Object.keys(beforeBlocks)) {
    if (!(id in afterBlocks)) fatal(`page block ${id} disappeared`);
    if (!(pages && id in pages) && beforeBlocks[id] !== afterBlocks[id]) fatal(`page block ${id} changed but was not a patch target`);
  }

  writeFileSync(BUNDLE, out);
  console.log(`bundle-patch: ok — ${touched.join(" · ")} → ${path.relative(ROOT, BUNDLE)} (${out.length} bytes)`);
}
