// 壓力測試元件：自動掛載所有 <div class="stress" data-product="..." data-scenario="...">
import data from "./market-data.js";
import * as P from "./payoffs.js";
import { lineChart } from "./charts.js";

if (!document.querySelector("link[data-stress-css]")) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL("./stress.css", import.meta.url).href;
  link.dataset.stressCss = "";
  document.head.append(link);
}

const C = { product: "var(--chart-1)", diy: "var(--chart-3)", index: "var(--chart-2)", cash: "var(--chart-4)" };
const LAST = data.month[data.month.length - 1];

/** 情境：每個產品用自己有意義的起始月 */
const S = {
  dotcom: { label: "2000 網路泡沫", start: "2000-09", note: "2000 年 9 月，美股在高點附近，之後兩年多一路往下。" },
  gfc: { label: "2008 金融海嘯", start: "2007-10", note: "2007 年 10 月美股創新高，一年多後跌掉一半，雷曼兄弟在 2008 年 9 月倒閉。" },
  gfcFx: { key: "gfc", label: "2008 金融海嘯", start: "2008-07", note: "2008 年 7 月澳幣接近高點，之後半年跌了約三成。" },
  cny2015: { label: "2015 人民幣急貶", start: "2014-07", note: "2014 年中很多人仍相信人民幣長期只會升值；2015 年 8 月人民幣突然大貶，之後一路走弱。" },
  covid: { label: "2020 疫情崩盤", start: "2020-01", note: "2020 年 2–3 月美股一個月內大跌，之後很快反彈。" },
  hike2022: { label: "2022 升息", start: "2022-01", note: "2022 年美國快速升息，股票和債券一起跌。" },
  custom: { label: "自己選月份", start: null },
};

const pct = (x, d = 0) => (x * 100).toFixed(d) + "%";
const wan = (v) => "NT$" + v.toFixed(1) + " 萬";
const signedWan = (v) => (v < 0 ? "−" : "+") + "NT$" + Math.abs(v).toFixed(1) + " 萬";
const monthOf = (idx, offset) => data.month[idx + offset];

function slice(key, i0, n) {
  return data[key].slice(i0, i0 + n + 1);
}

/* ---------------- 產品設定 ---------------- */
const PRODUCTS = {
  fcn: {
    title: "FCN 壓力測試：把真實歷史走勢套進去",
    intro: "假設你在某個月投入 NT$100 萬買一檔連結美股 S&P 500 指數的 FCN，看看接下來 3 年會發生什麼事。",
    scenarios: ["dotcom", "gfc", "covid", "hike2022", "custom"],
    defaultScenario: "gfc",
    horizon: 36,
    params: [
      { key: "couponPa", label: "年息（%）", value: 8, step: 0.5, min: 0, max: 30 },
      { key: "ki", label: "跌到幾 % 會出事（敲入線）", value: 70, step: 5, min: 30, max: 95 },
      { key: "months", label: "天期（月）", value: 12, step: 1, min: 3, max: 24 },
      { key: "vol", label: "自組：假設波動度（%）", value: 20, step: 1, min: 5, max: 80, hint: "用來估算賣出賣權能收多少權利金" },
    ],
    minMonths: (p) => p.months,
    run(i0, n, p) {
      const px = slice("sp500", i0, n), tr = slice("sp500tr", i0, n), r = slice("rate3m", i0, n);
      const f = P.fcn(px, { months: p.months, couponPa: p.couponPa, kiBarrier: p.ki / 100, koBarrier: 1, koStartMonth: 3, rate3m: r });
      const d = P.diyPutWrite(px, { months: p.months, strike: 1, vol: p.vol / 100, rate3m: r });
      const idx = P.holdIndex(tr), cash = P.cash(r);
      const markers = [];
      if (f.kiIndex) markers.push({ index: f.kiIndex, label: "跌破敲入線" });
      if (f.endIndex) markers.push({ index: f.endIndex, label: { autocall: "提前出場", par: "到期拿回本金", shares: "拿到股票" }[f.outcome] });
      const endV = f.values[f.endIndex];
      const level = px[f.endIndex] / px[0];
      let verdict, tone;
      if (f.outcome === "shares") {
        verdict = `第 ${f.kiIndex} 個月指數跌破起始價的 ${p.ki}%，到期時只剩 ${pct(level)}，你拿到的是股票不是現金。連同配息，到期時約值 ${wan(endV)}。`;
        tone = "bad";
      } else if (f.outcome === "autocall") {
        verdict = `第 ${f.endIndex} 個月指數回到起始價以上，提前拿回本金，總共領到 ${wan(f.coupons)} 配息。之後這筆錢要自己再找地方放。`;
        tone = "ok";
      } else {
        verdict = f.knockedIn
          ? `中途曾跌破敲入線，但到期前漲回來，所以拿回本金加配息，共約 ${wan(endV)}。運氣成分很大。`
          : `到期前都沒有跌破敲入線，拿回本金加配息，共約 ${wan(endV)}。`;
        tone = "ok";
      }
      return {
        series: [
          { name: "FCN（若今天到期的價值）", values: f.values, color: C.product },
          { name: "自組：現金＋賣出指數賣權", values: d.values, color: C.diy },
          { name: "直接買指數（含股息）", values: idx, color: C.index },
          { name: "放定存／短期公債", values: cash, color: C.cash, dash: true },
        ],
        markers, verdict, tone, checkpoint: Math.min(p.months, n), checkpointLabel: "到期時",
        extra: `自組賣出一個 ${p.months} 個月期的指數賣權，以波動度 ${p.vol}% 估算，大約能先收 ${wan(d.premium)} 權利金。`,
      };
    },
    notes: [
      "只用每月平均股價判斷有沒有跌破敲入線；真實 FCN 多半每天檢查，所以真實情況通常更容易出事。",
      "這裡只連結一個指數。市面上的 FCN 常常同時綁 2–4 檔個股，看「表現最差的那一檔」，股價波動比指數大很多，出事機率也高很多。",
      "敲出（提前出場）設定為：第 3 個月起，指數回到起始價以上就提前還本。",
      "到期前的線是「如果今天到期能拿回多少」，不是真的可以賣出的價格；提前贖回通常還要再打折。",
      "沒有計入通路費、信託管理費、匯率變動和發行機構倒閉的風險。",
      "自組方案假設權利金用固定波動度的 Black–Scholes 公式估算；實際上大跌時波動度會上升，權利金也會變貴或變便宜。",
    ],
  },

  dci: {
    title: "DCI（雙元貨幣）壓力測試",
    intro: "假設你用等值 NT$100 萬的美元，每個月做一次連結澳幣的雙元貨幣，到期一直續做；被換成澳幣後，就改做反向的，等澳幣漲回來再換回美元。",
    scenarios: ["gfcFx", "covid", "hike2022", "custom"],
    defaultScenario: "gfcFx",
    horizon: 24,
    params: [
      { key: "yieldPa", label: "年化收益（%）", value: 8, step: 0.5, min: 0, max: 30 },
      { key: "gap", label: "轉換價比現價低幾 %", value: 1, step: 0.5, min: 0, max: 10 },
    ],
    minMonths: () => 2,
    run(i0, n, p) {
      const fx = slice("audusd", i0, n), r = slice("rate3m", i0, n);
      const res = P.dci(fx, { tenorMonths: 1, yieldPa: p.yieldPa, strikeGap: p.gap / 100 });
      const cash = P.cash(r), aud = P.holdIndex(fx);
      const markers = res.conversions.slice(0, 1).map((c) => ({ index: c.index, label: "被換成澳幣" }));
      const endV = res.values[n];
      const tone = endV < cash[n] ? "bad" : "ok";
      const verdict = res.conversions.length
        ? `${n} 個月內被換了 ${res.conversions.length} 次幣別。期末以美元計約值 ${wan(endV)}，同期間單純放美元定存約 ${wan(cash[n])}。${res.endInBase ? "" : "最後手上還是澳幣。"}`
        : `${n} 個月內都沒有被換成澳幣，期末約 ${wan(endV)}，比美元定存的 ${wan(cash[n])} 多賺一些。`;
      return {
        series: [
          { name: "DCI（以美元計）", values: res.values, color: C.product },
          { name: "直接換成澳幣抱著", values: aud, color: C.index },
          { name: "美元定存", values: cash, color: C.cash, dash: true },
        ],
        markers, verdict, tone, checkpoint: Math.min(12, n), checkpointLabel: "第 12 個月",
      };
    },
    notes: [
      "用每月平均匯率，不是到期那一天的匯率；真實結果會更上下跳動。",
      "假設美元和澳幣兩邊做的收益率一樣；實際上兩種幣別的報價會不同。",
      "只算美元價值，沒有計入美元兌台幣的變動，也沒有計入換匯手續費與銀行報價價差。",
      "DCI 的高收益來自你「賣出一個匯率選擇權」：匯率往不利方向走時，你被迫用比較差的價格換幣。",
    ],
  },

  "pp-note": {
    title: "保本型連動債壓力測試",
    intro: "假設你投入 NT$100 萬買一檔 5 年期、連結美股指數的保本型連動債：到期保本，指數上漲時分到一部分漲幅。最後一項可以模擬發行機構倒閉。",
    scenarios: ["dotcom", "gfc", "covid", "custom"],
    defaultScenario: "gfc",
    horizon: 72,
    params: [
      { key: "participation", label: "分到漲幅的比例（參與率 %）", value: 60, step: 5, min: 0, max: 150 },
      { key: "protection", label: "到期保本比例（%）", value: 100, step: 5, min: 50, max: 110 },
      { key: "defaultMonth", label: "發行機構第幾個月倒閉（0＝不倒）", value: 0, step: 1, min: 0, max: 60, scenarioDefault: { gfc: 11 } },
      { key: "recovery", label: "倒閉後拿回幾 %（回收率）", value: 30, step: 5, min: 0, max: 100, hint: "回收率是假設值，真實情況要等清算多年才知道" },
    ],
    minMonths: () => 60,
    run(i0, n, p) {
      const px = slice("sp500", i0, n), tr = slice("sp500tr", i0, n), r = slice("rate3m", i0, n);
      const months = 60;
      const def = p.defaultMonth > 0 ? { month: p.defaultMonth, recovery: p.recovery / 100 } : false;
      const res = P.ppNote(px, { months, participation: p.participation / 100, protection: p.protection / 100, issuerDefault: def, rate3m: r });
      const diy = P.diyProtected(tr, { months, protection: p.protection / 100, rate3m: r });
      const idx = P.holdIndex(tr), cash = P.cash(r);
      const markers = [];
      if (res.defaulted) markers.push({ index: res.endIndex, label: "發行機構倒閉" });
      else markers.push({ index: months, label: "到期" });
      const endV = res.values[Math.min(months, n)];
      let verdict, tone;
      if (res.defaulted) {
        verdict = `第 ${res.endIndex} 個月（${monthOf(i0, res.endIndex)}）發行機構倒閉，「保本」跟著失效，只拿回 ${wan(endV)}。自組的公債／定存部分不受這家公司影響，5 年後約 ${wan(diy.values[months])}。`;
        tone = "bad";
      } else {
        verdict = `5 年到期拿回 ${wan(endV)}。同期間自組（先買公債保本、剩下 ${wan(diy.equity0)} 買指數）約 ${wan(diy.values[months])}。`;
        tone = endV >= diy.values[months] ? "ok" : "";
      }
      return {
        series: [
          { name: "保本型連動債（若今天到期）", values: res.values, color: C.product },
          { name: "自組：公債／定存＋指數", values: diy.values, color: C.diy },
          { name: "直接買指數（含股息）", values: idx, color: C.index },
          { name: "放定存／短期公債", values: cash, color: C.cash, dash: true },
        ],
        markers, verdict, tone, checkpoint: months, checkpointLabel: "5 年到期",
        extra: `起始時利率約 ${r[0].toFixed(2)}%（以短期公債利率近似），所以要先放 ${wan(diy.bond0)} 在公債／定存才能 5 年後保本，剩下 ${wan(diy.equity0)} 可以投資。利率越低，能拿去投資的錢越少。`,
      };
    },
    notes: [
      "漲幅只算指數價格，不含股息；連動債通常拿不到股息，這是隱藏成本之一。",
      "自組方案用起始時的短期利率當作 5 年保本利率，只是近似。",
      "到期前的線是「如果今天到期能拿回多少」，提前贖回通常拿不到這麼多。",
      "回收率是假設值。2008 年雷曼兄弟倒閉後，連動債投資人要等很多年、經過清算與和解才拿回部分金額，各檔差異很大。",
      "沒有計入通路費、信託管理費與匯率變動。",
    ],
  },

  trf: {
    title: "TRF 壓力測試：2014–2016 人民幣",
    intro: "假設你在 2014 年 7 月（當時約 1 美元換 6.20 元人民幣）簽了一份賭人民幣升值的 TRF：每月結算一次，連續 24 個月。人民幣升值時你賺一點，累積到目標就提前結束；人民幣貶值時你要賠兩倍，而且沒有上限。",
    scenarios: ["cny2015", "custom"],
    defaultScenario: "cny2015",
    horizon: 24,
    params: [
      { key: "strike", label: "約定匯率（1 美元換幾元人民幣）", value: 6.2, step: 0.01, min: 4, max: 9 },
      { key: "target", label: "累計賺到多少就提前結束（每 1 美元幾角）", value: 3, step: 0.5, min: 0.5, max: 20, hint: "3 角＝0.3 元人民幣" },
      { key: "leverage", label: "賠的時候放大幾倍", value: 2, step: 1, min: 1, max: 4 },
      { key: "notional", label: "每月結算金額（萬美元）", value: 10, step: 1, min: 1, max: 500 },
      { key: "cap", label: "最大損失上限（NT$ 萬，0＝無上限）", value: 0, step: 10, min: 0, max: 100000, hint: "2016 年後的新規定要求設上限；0 代表舊式無上限商品" },
    ],
    minMonths: () => 2,
    run(i0, n, p) {
      const cny = slice("usdcny", i0, n), twd = slice("usdtwd", i0, n);
      const args = { months: n, strike: p.strike, notionalPerFix: 1, leverage: p.leverage, target: p.target / 10 };
      // 上限以起始匯率把台幣換算成「每 1 美元名目的人民幣」
      const maxLoss = p.cap > 0 ? p.cap / p.notional / (twd[0] / cny[0]) : Infinity;
      const t = P.trf(cny, { ...args, maxLoss }), fw = P.plainForward(cny, args);
      // 人民幣損益（每 1 美元）× 名目（萬美元）→ 換成台幣（萬）
      const toTwd = (fixes) => {
        const out = [0];
        let acc = 0;
        for (let m = 1; m <= n; m++) {
          const f = fixes.find((x) => x.index === m);
          if (f) acc += f.pnl * p.notional * (twd[m] / cny[m]);
          out.push(acc);
        }
        return out;
      };
      const tv = toTwd(t.fixes), fv = toTwd(fw.fixes);
      const worst = Math.min(...tv);
      const markers = [];
      if (t.knockedOut) markers.push({ index: t.endIndex, label: "賺到目標，提前結束" });
      else if (t.lossCapped) markers.push({ index: t.endIndex, label: "碰到損失上限，合約終止" });
      else {
        const firstLoss = t.fixes.find((f) => f.pnl < 0);
        if (firstLoss) markers.push({ index: firstLoss.index, label: "開始賠錢" });
      }
      const endV = tv[n];
      const verdict = t.knockedOut
        ? `第 ${t.endIndex} 個月累計賺到目標，合約提前結束，總共賺 ${signedWan(endV)}。`
        : t.lossCapped
        ? `第 ${t.endIndex} 個月虧損碰到上限，合約終止，累計 ${signedWan(endV)}。有上限能擋住無底洞，但上限本身通常就是一大筆錢。`
        : `${n} 個月結算完，累計 ${signedWan(endV)}。最多只能賺 ${(p.target / 10).toFixed(2)} 元×名目，${p.cap > 0 ? "這段期間還沒碰到損失上限" : "但虧損沒有上限"}。`;
      return {
        series: [
          { name: "TRF 累計損益", values: tv, color: C.product },
          { name: "一般遠期合約（賺賠都 1 倍）", values: fv, color: C.diy },
          { name: "不做（0）", values: tv.map(() => 0), color: C.cash, dash: true },
        ],
        markers, verdict, tone: endV < 0 ? "bad" : "ok", money: true, worst,
        extra: `起始匯率 ${cny[0].toFixed(3)}，期末 ${cny[n].toFixed(3)}。每月名目 ${p.notional} 萬美元，賠錢的月份實際要賠 ${p.leverage} 倍，也就是 ${p.notional * p.leverage} 萬美元的部位。`,
      };
    },
    notes: [
      "用每月平均匯率結算；真實合約是在約定的結算日、用離岸人民幣（CNH）報價，波動通常更大。",
      "簡化為「賺到目標時只給到剛好目標」。不同合約對最後一次怎麼算規定不同。",
      "沒有計入銀行要求追加的保證金。真實情況中，虧損擴大時銀行會要求補錢，補不出來可能被強制平倉。",
      "「一般遠期合約」只是用來對照：同樣的約定匯率，但賺賠都是 1 倍、也不會提前結束。",
      "損失上限：2016 年起主管機關要求這類商品設定最大損失上限，模擬中可以自行設定；預設 0（無上限）代表 2015 年以前賣出的舊式商品。上限以起始匯率換算成台幣，實際契約的上限計算方式各有不同。",
    ],
  },

  ilp: {
    title: "投資型保單 vs 自組（定期險＋低成本指數基金）",
    intro: "假設每年繳一樣的錢，投資同一個美股指數，差別只在費用。兩邊的保障成本視為相同，所以都不扣，只比較「多付的費用」吃掉多少。",
    scenarios: ["dotcom", "gfc", "custom"],
    defaultScenario: "dotcom",
    horizon: 240,
    params: [
      { key: "premium", label: "每年繳（萬元）", value: 10, step: 1, min: 1, max: 1000 },
      { key: "years", label: "繳幾年", value: 20, step: 1, min: 1, max: 30 },
      { key: "load", label: "第 1 年前置費用（% 保費，之後逐年遞減）", value: 60, step: 5, min: 0, max: 100, hint: "示意：60% → 40% → 20% → 10% → 0%，以保單條款為準" },
      { key: "fundFee", label: "基金內扣＋帳戶管理費（每年 %）", value: 2, step: 0.1, min: 0, max: 5, hint: "自組 ETF 假設每年 0.1%" },
    ],
    minMonths: () => 12,
    horizonFrom: (p) => p.years * 12,
    run(i0, n, p) {
      const tr = slice("sp500tr", i0, n);
      const res = P.ilp(tr, { years: p.years, premiumPa: p.premium, frontLoad: [1, 2 / 3, 1 / 3, 1 / 6].map((k) => p.load * k), adminFeePm: 0.01, fundFeePa: p.fundFee, wrapperFeePa: 0, diyFeePa: 0.1 });
      const m = res.months;
      const gap = res.diy[m] - res.ilp[m];
      const f = res.feesPaid;
      return {
        series: [
          { name: "投資型保單帳戶", values: res.ilp, color: C.product },
          { name: "自組：定期險＋指數 ETF", values: res.diy, color: C.diy },
          { name: "累計繳的錢", values: res.invested, color: C.cash, dash: true },
        ],
        markers: [], money: true, absolute: true,
        verdict: `${Math.round(m / 12)} 年後，投資型保單帳戶約 ${wan(res.ilp[m])}，自組約 ${wan(res.diy[m])}，差 ${wan(gap)}。保單這邊共付了約 ${wan(f.frontLoad + f.admin + f.fund)} 費用。`,
        tone: "",
        extra: `費用拆解：前置費用 ${wan(f.frontLoad)}、保單管理費 ${wan(f.admin)}、基金與帳戶管理費 ${wan(f.fund)}；自組 ETF 費用約 ${wan(f.diy)}。`,
      };
    },
    notes: [
      "保障成本（危險保費）兩邊視為一樣，所以都沒扣。實際上投資型保單的危險保費會隨年齡上升，從帳戶扣；定期險則是另外繳。",
      "前置費用以「基本保費」逐年遞減的示意表計算（例：第 1 年 60%、第 2 年 40%、第 3 年 20%、第 4 年 10%、第 5 年起 0）。實際費率各家不同，超額保費通常只收較低比例（例如 3–5%），請以保單條款為準。",
      "保單管理費以每月 NT$100 計算。",
      "沒有計入解約費用。很多保單前幾年解約要另外扣一筆，如果在大跌時解約，損失更大。",
      "保單可以選的基金有限，不一定有低成本指數基金；這裡假設兩邊投資報酬完全一樣，只差在費用。",
      "沒有計入稅務與遺產規劃上的差異，對部分人來說這是投資型保單的真實好處。",
    ],
  },
};

/* ---------------- 元件 ---------------- */
function h(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  n.append(...kids.filter((k) => k != null));
  return n;
}

export function mountStress(root, productKey, scenarioKey) {
  const cfg = PRODUCTS[productKey];
  if (!cfg) { root.textContent = `找不到產品：${productKey}`; return; }
  root.replaceChildren();
  root.classList.add("stress");
  const firstKey = cfg.scenarios.find((k) => k === scenarioKey || S[k].key === scenarioKey) ?? cfg.defaultScenario;
  const state = { scenario: firstKey, custom: S[firstKey].start ?? "2008-01", params: {} };
  for (const prm of cfg.params) state.params[prm.key] = prm.scenarioDefault?.[S[firstKey].key ?? firstKey] ?? prm.value;

  const showTitle = root.dataset.title !== "none";
  const scenBox = h("div", { class: "stress-scenarios", role: "group", "aria-label": "選擇情境" });
  const monthInput = h("input", { type: "month", min: "1990-01", max: LAST, value: state.custom, "aria-label": "起始月份" });
  monthInput.hidden = state.scenario !== "custom";
  monthInput.addEventListener("change", () => { state.custom = monthInput.value; render(); });
  const buttons = cfg.scenarios.map((k) => {
    const b = h("button", { type: "button", "aria-pressed": String(k === state.scenario) }, S[k].label);
    b.addEventListener("click", () => {
      state.scenario = k;
      for (const x of buttons) x.setAttribute("aria-pressed", String(x === b));
      monthInput.hidden = k !== "custom";
      for (const prm of cfg.params) {
        if (prm.scenarioDefault) {
          state.params[prm.key] = prm.scenarioDefault[S[k].key ?? k] ?? prm.value;
          inputs[prm.key].value = state.params[prm.key];
        }
      }
      render();
    });
    return b;
  });
  scenBox.append(...buttons, monthInput);

  const inputs = {};
  const controls = h("div", { class: "controls" });
  for (const prm of cfg.params) {
    const inp = h("input", { type: "number", step: prm.step, min: prm.min, max: prm.max, value: state.params[prm.key], inputmode: "decimal" });
    inp.addEventListener("input", () => {
      const v = parseFloat(inp.value);
      if (isFinite(v)) { state.params[prm.key] = Math.min(prm.max, Math.max(prm.min, v)); render(); }
    });
    inputs[prm.key] = inp;
    controls.append(h("label", {}, prm.label, inp, prm.hint ? h("span", { class: "hint" }, prm.hint) : null));
  }

  const scenNote = h("p", { class: "small muted" });
  const verdict = h("div", { class: "stress-verdict", role: "status", "aria-live": "polite" });
  const chart = h("div", { class: "stress-chart" });
  const extra = h("p", { class: "small" });
  const tableWrap = h("div", { class: "table-wrap" });
  const notes = h("details", {}, h("summary", {}, "這個模擬簡化了什麼？"), h("ul", {}, ...cfg.notes.map((t) => h("li", {}, t)),
    h("li", {}, "歷史資料：美股為 S&P 500 每月資料（Shiller），利率為美國 3 個月國庫券（FRED TB3MS），匯率為 FRED 每月平均。過去不代表未來。")));

  if (showTitle) root.append(h("h3", { class: "stress-title" }, cfg.title));
  root.append(h("p", { class: "stress-intro" }, cfg.intro), scenBox, scenNote, controls, verdict, chart, extra, tableWrap, notes);

  let chartHandle = null;
  function render() {
    const sc = S[state.scenario];
    const start = sc.start ?? state.custom;
    const i0 = data.month.indexOf(start);
    const p = state.params;
    const want = cfg.horizonFrom ? cfg.horizonFrom(p) : cfg.horizon;
    const n = Math.min(want, data.month.length - 1 - i0);
    scenNote.textContent = sc.note ? `${sc.note}（從 ${start} 開始）` : `從 ${start} 開始，看 ${n} 個月。`;
    if (i0 < 0 || n < cfg.minMonths(p)) {
      verdict.className = "stress-verdict";
      verdict.textContent = `資料不夠：從 ${start} 開始到 ${LAST} 只有 ${Math.max(0, n)} 個月，請選早一點的月份。`;
      chartHandle?.destroy(); chartHandle = null; tableWrap.replaceChildren(); extra.textContent = "";
      return;
    }
    const out = cfg.run(i0, n, p);
    verdict.className = "stress-verdict" + (out.tone ? " " + out.tone : "");
    verdict.textContent = out.verdict;
    extra.textContent = out.extra ?? "";
    const labels = data.month.slice(i0, i0 + n + 1);
    const fmt = out.money ? (v) => (Math.abs(v) >= 1000 ? (v / 10000).toFixed(1) + " 億" : v.toFixed(0) + " 萬") : (v) => v.toFixed(0) + " 萬";
    chartHandle?.destroy();
    chartHandle = lineChart(chart, { labels, series: out.series, markers: out.markers, yFormat: fmt, baseline: out.money ? 0 : 100 });

    const cp = out.checkpoint;
    const head = out.absolute
      ? h("tr", {}, h("th", {}, "方案"), h("th", { class: "num" }, `期末（${labels[n]}）`))
      : out.money
      ? h("tr", {}, h("th", {}, "方案"), h("th", { class: "num" }, `期末（${labels[n]}）`), h("th", { class: "num" }, "最差的時候"))
      : h("tr", {}, h("th", {}, "方案（投入 NT$100 萬）"), h("th", { class: "num" }, `${out.checkpointLabel}（${labels[cp]}）`), h("th", { class: "num" }, `期末（${labels[n]}）`), h("th", { class: "num" }, "途中最大跌幅"));
    const rows = out.series.filter((s) => !(out.money && s.name.startsWith("不做"))).map((s) => {
      const v = s.values;
      const cell = (x) => h("td", { class: "num" + (out.money ? (x < 0 ? " neg" : "") : x < 100 ? " neg" : "") }, out.money ? (out.absolute ? wan(x) : signedWan(x)) : wan(x));
      if (out.absolute) return h("tr", {}, h("td", {}, s.name), h("td", { class: "num" }, wan(v[n])));
      return out.money
        ? h("tr", {}, h("td", {}, s.name), cell(v[n]), cell(Math.min(...v)))
        : h("tr", {}, h("td", {}, s.name), cell(v[cp]), cell(v[n]), h("td", { class: "num" }, pct(P.maxDrawdown(v))));
    });
    tableWrap.replaceChildren(h("table", {}, h("thead", {}, head), h("tbody", {}, ...rows)));
  }
  render();
}

export const productKeys = Object.keys(PRODUCTS);
export const productTitles = Object.fromEntries(Object.entries(PRODUCTS).map(([k, v]) => [k, v.title]));

for (const el of document.querySelectorAll(".stress[data-product]")) {
  try { mountStress(el, el.dataset.product, el.dataset.scenario); }
  catch (e) { el.append(h("p", { class: "stress-error" }, "壓力測試載入失敗：" + e.message)); console.error(e); }
}
