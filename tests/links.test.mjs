// 全站檢查：內部連結與資源存在、詞彙鍵都有定義
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import glossary from "../assets/glossary.js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const skip = new Set(["node_modules", "templates", "data"]);
const pages = (function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith(".") || skip.has(e.name)) return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name.endsWith(".html") ? [p] : [];
  });
})(root);

test("內部連結與資源都存在", () => {
  const broken = [];
  for (const file of pages) {
    const html = fs.readFileSync(file, "utf8");
    for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|#|javascript:|data:)/.test(url)) continue;
      const target = path.resolve(path.dirname(file), decodeURIComponent(url.split("#")[0].split("?")[0]));
      if (!fs.existsSync(target)) broken.push(`${path.relative(root, file)} → ${url}`);
    }
  }
  assert.deepEqual(broken, []);
});

test("data-term 都在詞彙表", () => {
  const missing = [];
  for (const file of pages) {
    for (const [, term] of fs.readFileSync(file, "utf8").matchAll(/data-term="([^"]+)"/g)) {
      if (!glossary[term]) missing.push(`${path.relative(root, file)}: ${term}`);
    }
  }
  assert.deepEqual(missing, []);
});
