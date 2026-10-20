// 共用前端：主題切換、目前頁面標示、詞彙提示（<dfn data-term="...">）
import glossary from "./glossary.js";

const root = document.documentElement;
try {
  const saved = localStorage.getItem("theme");
  if (saved) root.dataset.theme = saved;
} catch {}

const toggle = document.querySelector(".theme-toggle");
if (toggle) {
  toggle.addEventListener("click", () => {
    const dark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch {}
  });
}

const here = location.pathname.replace(/index\.html$/, "");
for (const a of document.querySelectorAll(".site-nav a")) {
  const target = new URL(a.href).pathname.replace(/index\.html$/, "");
  if (target === here || (target.endsWith("/") && target.length > 1 && here.startsWith(target))) {
    a.setAttribute("aria-current", "page");
  }
}

// 詞彙提示：滑過或點擊 <dfn data-term> 顯示白話解釋
const glossaryHref = new URL("../glossary.html", import.meta.url).href;
let tip = null;
function hideTip() { tip?.remove(); tip = null; }
function showTip(el) {
  hideTip();
  const entry = glossary[el.dataset.term];
  if (!entry) return;
  tip = document.createElement("div");
  tip.className = "term-tip";
  tip.setAttribute("role", "tooltip");
  const b = document.createElement("b");
  b.textContent = el.dataset.term;
  const p = document.createElement("span");
  p.textContent = entry.short + " ";
  const more = document.createElement("a");
  more.href = glossaryHref + "#" + encodeURIComponent(el.dataset.term);
  more.textContent = "更多 →";
  tip.append(b, p, more);
  document.body.append(tip);
  const r = el.getBoundingClientRect();
  const w = tip.offsetWidth;
  const left = Math.min(Math.max(8, r.left + scrollX), scrollX + document.documentElement.clientWidth - w - 8);
  tip.style.left = left + "px";
  tip.style.top = r.bottom + scrollY + 6 + "px";
}
for (const el of document.querySelectorAll("dfn[data-term]")) {
  el.tabIndex = 0;
  el.addEventListener("mouseenter", () => showTip(el));
  el.addEventListener("focus", () => showTip(el));
  el.addEventListener("click", (e) => { e.stopPropagation(); showTip(el); });
  el.addEventListener("mouseleave", () => setTimeout(() => { if (!tip?.matches(":hover")) hideTip(); }, 250));
  el.addEventListener("blur", () => setTimeout(hideTip, 200));
}
document.addEventListener("click", (e) => { if (tip && !tip.contains(e.target)) hideTip(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideTip(); });
