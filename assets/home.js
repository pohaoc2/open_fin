// 首頁：利息拆解器（用最新的美元 3 個月國庫券利率）與各區塊進場動畫
import market from "./engine/market-data.js";

const FEE = 1.5; // 銀行與通路費用，常見 1–3%，取中間估算

function latestRate() {
  for (let i = market.month.length - 1; i >= 0; i--) {
    if (market.rate3m[i] != null) return { rate: market.rate3m[i], month: market.month[i] };
  }
  return { rate: 4, month: "" };
}

const { rate, month } = latestRate();
const input = document.getElementById("yield");
const out = document.querySelector(".decoder-out");
const asof = document.querySelector("[data-asof]");
const parts = {
  rate: document.querySelector(".p-rate"),
  risk: document.querySelector(".p-risk"),
  fee: document.querySelector(".p-fee"),
};
if (asof && month) asof.textContent = month;

const fmt = (x) => x.toFixed(1) + "%";

function render() {
  const y = Math.max(0, Math.min(30, parseFloat(input.value) || 0));
  const base = Math.min(rate, y);
  const gross = y + FEE;
  const risk = Math.max(0, y - rate);
  parts.rate.style.flexBasis = (base / gross) * 100 + "%";
  parts.risk.style.flexBasis = (risk / gross) * 100 + "%";
  parts.fee.style.flexBasis = (FEE / gross) * 100 + "%";
  if (y <= rate) {
    out.innerHTML = `${fmt(y)} 沒有超過現在美元短期公債的 <b>${fmt(rate)}</b>。利息不高，代表多承擔的風險也比較少，但還是要看費用和綁約多久。`;
    return;
  }
  out.innerHTML =
    `其中約 <b>${fmt(rate)}</b> 是現在放美元短期公債就拿得到的利息；` +
    `約 <b>${fmt(risk)}</b> 是你幫別人承擔跌價或匯率風險收的錢；` +
    `另外常見有 1–3% 被銀行和通路收走，這裡以 ${FEE}% 估算。` +
    (risk >= 6 ? ` 風險報酬這麼高，代表出事的機會或代價也不小。` : "");
}
if (input) {
  input.addEventListener("input", render);
  render();
}

// 進場：每個區塊的元素依序淡入上移，只播一次
const items = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.add("js-reveal");
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("in");
      io.unobserve(e.target);
    }
  }, { rootMargin: "0px 0px -8% 0px" });
  items.forEach((el, i) => {
    if (!el.style.getPropertyValue("--d")) el.style.setProperty("--d", (i % 4) * 70 + "ms");
    io.observe(el);
  });
} else {
  items.forEach((el) => el.classList.add("in"));
}
