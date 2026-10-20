// 純 SVG 折線圖：跟隨 CSS 變數（深淺色自動）、響應式、滑過顯示數值、事件標記。
const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs = {}, style = "") => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (style) n.setAttribute("style", style);
  return n;
};

function niceTicks(min, max, count = 5) {
  if (min === max) { min -= 1; max += 1; }
  const step0 = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= step0);
  const ticks = [];
  for (let v = Math.floor(min / step) * step; v <= max + step * 1e-9; v += step) ticks.push(+v.toFixed(10));
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

/**
 * lineChart(container, { labels, series: [{ name, values, color, dash? }], yFormat?, markers?: [{ index, label, series? }], baseline? })
 * 回傳 { destroy }。容器尺寸改變時自動重畫。
 */
export function lineChart(container, opts) {
  const { labels, series, yFormat = (v) => v.toFixed(0), markers = [], baseline = null } = opts;
  container.classList.add("lc");
  container.replaceChildren();

  const legend = document.createElement("div");
  legend.className = "lc-legend";
  for (const s of series) {
    const item = document.createElement("span");
    const sw = document.createElement("i");
    sw.style.background = s.color;
    if (s.dash) sw.className = "dash";
    item.append(sw, document.createTextNode(s.name));
    legend.append(item);
  }
  const plot = document.createElement("div");
  plot.className = "lc-plot";
  const tip = document.createElement("div");
  tip.className = "lc-tip";
  tip.hidden = true;
  plot.append(tip);
  container.append(legend, plot);

  let svg = null;
  function draw() {
    const W = Math.max(280, plot.clientWidth || 600);
    const H = W < 480 ? 240 : 320;
    const pad = { l: W < 480 ? 44 : 56, r: 12, t: 12, b: 28 };
    const n = labels.length;
    const all = series.flatMap((s) => s.values.filter((v) => v != null && isFinite(v)));
    if (baseline != null) all.push(baseline);
    const ticks = niceTicks(Math.min(...all), Math.max(...all));
    const y0 = ticks[0], y1 = ticks[ticks.length - 1];
    const x = (i) => pad.l + ((W - pad.l - pad.r) * i) / Math.max(1, n - 1);
    const y = (v) => pad.t + ((H - pad.t - pad.b) * (y1 - v)) / (y1 - y0);

    svg?.remove();
    svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img", "aria-label": series.map((s) => s.name).join("、") + " 走勢圖" });
    for (const t of ticks) {
      svg.append(el("line", { x1: pad.l, x2: W - pad.r, y1: y(t), y2: y(t) }, "stroke: var(--border); stroke-width: 1"));
      const tx = el("text", { x: pad.l - 6, y: y(t) + 4, "text-anchor": "end" }, "fill: var(--muted); font-size: 11px");
      tx.textContent = yFormat(t);
      svg.append(tx);
    }
    if (baseline != null) svg.append(el("line", { x1: pad.l, x2: W - pad.r, y1: y(baseline), y2: y(baseline) }, "stroke: var(--muted); stroke-width: 1; stroke-dasharray: 2 3"));
    const xticks = Math.min(n, W < 480 ? 4 : 7);
    for (let k = 0; k < xticks; k++) {
      const i = Math.round((k * (n - 1)) / Math.max(1, xticks - 1));
      const tx = el("text", { x: x(i), y: H - 8, "text-anchor": k === 0 ? "start" : k === xticks - 1 ? "end" : "middle" }, "fill: var(--muted); font-size: 11px");
      tx.textContent = labels[i];
      svg.append(tx);
    }
    for (const s of series) {
      let d = "", pen = false;
      s.values.forEach((v, i) => {
        if (v == null || !isFinite(v)) { pen = false; return; }
        d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
        pen = true;
      });
      svg.append(el("path", { d, fill: "none" }, `stroke: ${s.color}; stroke-width: ${s.width ?? 2.2}; stroke-linejoin: round;${s.dash ? " stroke-dasharray: 5 4;" : ""}`));
    }
    for (const mk of markers) {
      const s = series[mk.series ?? 0];
      const v = s?.values[mk.index];
      if (v == null) continue;
      svg.append(el("circle", { cx: x(mk.index), cy: y(v), r: 5 }, `fill: var(--surface); stroke: var(--danger); stroke-width: 2.5`));
      if (mk.label) {
        const right = x(mk.index) > W * 0.7;
        const tx = el("text", { x: x(mk.index) + (right ? -8 : 8), y: y(v) - 8, "text-anchor": right ? "end" : "start" }, "fill: var(--danger); font-size: 12px; font-weight: 700; paint-order: stroke; stroke: var(--surface); stroke-width: 3px");
        tx.textContent = mk.label;
        svg.append(tx);
      }
    }
    const cursor = el("line", { y1: pad.t, y2: H - pad.b, visibility: "hidden" }, "stroke: var(--muted); stroke-width: 1");
    svg.append(cursor);
    const hit = el("rect", { x: pad.l, y: pad.t, width: W - pad.l - pad.r, height: H - pad.t - pad.b, fill: "transparent" });
    svg.append(hit);

    const show = (clientX) => {
      const r = svg.getBoundingClientRect();
      const px = ((clientX - r.left) * W) / r.width;
      const i = Math.max(0, Math.min(n - 1, Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (n - 1))));
      cursor.setAttribute("x1", x(i)); cursor.setAttribute("x2", x(i)); cursor.setAttribute("visibility", "visible");
      tip.replaceChildren();
      const h = document.createElement("b");
      h.textContent = labels[i];
      tip.append(h);
      for (const s of series) {
        const row = document.createElement("div");
        const sw = document.createElement("i");
        sw.style.background = s.color;
        row.append(sw, document.createTextNode(`${s.name}：${s.values[i] == null ? "—" : yFormat(s.values[i])}`));
        tip.append(row);
      }
      tip.hidden = false;
      const left = (x(i) / W) * r.width;
      tip.style.left = (left > r.width / 2 ? left - tip.offsetWidth - 10 : left + 10) + "px";
    };
    const hide = () => { tip.hidden = true; cursor.setAttribute("visibility", "hidden"); };
    hit.addEventListener("pointermove", (e) => show(e.clientX));
    hit.addEventListener("pointerdown", (e) => show(e.clientX));
    hit.addEventListener("pointerleave", hide);
    plot.prepend(svg);
  }

  draw();
  let last = plot.clientWidth;
  const ro = new ResizeObserver(() => { if (Math.abs(plot.clientWidth - last) > 4) { last = plot.clientWidth; draw(); } });
  ro.observe(plot);
  return { destroy: () => { ro.disconnect(); container.replaceChildren(); } };
}
