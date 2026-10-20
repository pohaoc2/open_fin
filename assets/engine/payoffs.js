// 產品報酬計算（純函數，無 DOM）。單位：本金 = 100。
// 所有路徑都是「從起始月開始」的月資料陣列，第 0 筆 = 起始。
// 只看月資料，實務上很多條款是每日觀察，所以這裡的結果通常偏樂觀。

const monthlyRate = (rate3m, i) => (rate3m?.[i] ?? 0) / 100 / 12;

// 標準常態累積分配（Abramowitz–Stegun 7.1.26）
function normCdf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x / 2);
  return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

/** Black–Scholes 歐式賣權價格。T 單位為年，r 與 sigma 為年化小數。 */
export function bsPut(S, K, T, r, sigma) {
  if (T <= 0 || sigma <= 0) return Math.max(K - S, 0);
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return K * Math.exp(-r * T) * normCdf(-d2) - S * normCdf(-d1);
}

/** 直接持有：起始 = 100 */
export function holdIndex(path) {
  return path.map((v) => (100 * v) / path[0]);
}

/** 現金／定存：以三個月國庫券利率逐月滾存 */
export function cash(rate3m, n = rate3m.length) {
  const out = [100];
  for (let i = 1; i < n; i++) out.push(out[i - 1] * (1 + monthlyRate(rate3m, i - 1)));
  return out;
}

/** 最大跌幅（由高點往下跌最多幾 %，回傳 0–1） */
export function maxDrawdown(values) {
  let peak = -Infinity, dd = 0;
  for (const v of values) {
    peak = Math.max(peak, v);
    dd = Math.max(dd, 1 - v / peak);
  }
  return dd;
}

/**
 * FCN 固定配息連結股票債（單一標的、月觀察）。
 * p: { months, couponPa(%), strike, kiBarrier, koBarrier, koStartMonth, rate3m[] }
 * 期間內的價值 = 已領配息 + 「如果今天到期」能拿回的本金（敲入後以股價打折）。
 * 提前出場或到期拿回現金後，現金以 rate3m 滾存；拿到股票則一路持有到路徑結束。
 */
export function fcn(path, p) {
  const { months = 12, couponPa = 10, strike = 1, kiBarrier = 0.65, koBarrier = 1, koStartMonth = 3, rate3m = [] } = p;
  const S0 = path[0];
  let cashAcc = 0, shares = 0, knockedIn = false, outcome = null, endIndex = null, kiIndex = null, coupons = 0;
  const values = [100];
  for (let m = 1; m < path.length; m++) {
    cashAcc *= 1 + monthlyRate(rate3m, m - 1);
    const ratio = path[m] / S0;
    if (outcome === null) {
      cashAcc += couponPa / 12;
      coupons += couponPa / 12;
      if (!knockedIn && ratio < kiBarrier) { knockedIn = true; kiIndex = m; }
      if (m >= koStartMonth && m < months && ratio >= koBarrier) {
        outcome = "autocall"; endIndex = m; cashAcc += 100;
      } else if (m === months) {
        endIndex = m;
        if (knockedIn && ratio < strike) { outcome = "shares"; shares = 100 / (strike * S0); }
        else { outcome = "par"; cashAcc += 100; }
      }
    }
    const principal = outcome !== null ? 0 : knockedIn ? 100 * Math.min(1, ratio / strike) : 100;
    values.push(cashAcc + shares * path[m] + principal);
  }
  return { values, outcome, endIndex, knockedIn, kiIndex, coupons };
}

/**
 * 自組 FCN 替代：現金 + 賣出一個指數賣權（有足額現金擔保，沒有敲入線）。
 * p: { months, strike, vol(年化小數), rate3m[] }。權利金用 Black–Scholes 估算，假設波動度固定。
 */
export function diyPutWrite(path, p) {
  const { months = 12, strike = 1, vol = 0.2, rate3m = [] } = p;
  const S0 = path[0], K = strike * S0, T = months / 12, r = (rate3m[0] ?? 0) / 100;
  const units = 100 / K;
  const premium = units * bsPut(S0, K, T, r, vol);
  let cashAcc = 100 + premium, shares = 0, assigned = false;
  const values = [100];
  for (let m = 1; m < path.length; m++) {
    cashAcc *= 1 + monthlyRate(rate3m, m - 1);
    if (m === months && path[m] < K) { assigned = true; shares = units; cashAcc -= units * K; }
    const liability = m < months ? units * Math.max(K - path[m], 0) : 0;
    values.push(cashAcc + shares * path[m] - liability);
  }
  return { values, premium, assigned, endIndex: Math.min(months, path.length - 1) };
}

/**
 * DCI 雙元貨幣（逐期滾動）。fx = 每 1 單位「連結貨幣」值多少「本金貨幣」（如 AUD/USD）。
 * 拿本金貨幣做時：到期匯率跌破 (1-strikeGap) 就被換成連結貨幣；
 * 被換之後改做反向 DCI，匯率漲過 (1+strikeGap) 才換回。價值一律以本金貨幣計。
 * p: { tenorMonths, yieldPa(%), strikeGap, rate3m[] }
 */
export function dci(fx, p) {
  const { tenorMonths = 1, yieldPa = 8, strikeGap = 0.01 } = p;
  let inBase = true, amount = 100;
  const conversions = [], values = [100];
  for (let start = 0; start + tenorMonths < fx.length; start += tenorMonths) {
    const end = start + tenorMonths;
    const K = inBase ? fx[start] * (1 - strikeGap) : fx[start] * (1 + strikeGap);
    const grown = amount * (1 + (yieldPa / 100) * (tenorMonths / 12));
    for (let m = start + 1; m < end; m++) values.push(inBase ? amount : amount * fx[m]);
    if (inBase && fx[end] < K) { amount = grown / K; inBase = false; conversions.push({ index: end, to: "linked", rate: K }); }
    else if (!inBase && fx[end] > K) { amount = grown * K; inBase = true; conversions.push({ index: end, to: "base", rate: K }); }
    else amount = grown;
    values.push(inBase ? amount : amount * fx[end]);
  }
  while (values.length < fx.length) values.push(inBase ? amount : amount * fx[values.length]);
  return { values, conversions, endIndex: fx.length - 1, endInBase: inBase };
}

/** 本金貨幣定存（對照用），與 cash 相同 */
export const fxDeposit = cash;

/**
 * 保本型連動債：到期給 保本率 + 參與率 × max(0, 漲幅)。發行機構倒閉則只拿回 recovery。
 * p: { months, participation, protection, issuerDefault: false | { month, recovery }, rate3m[] }
 * 期間價值以「如果今天到期」顯示（真實賣回價通常更低）。
 */
export function ppNote(path, p) {
  const { months = 60, participation = 0.6, protection = 1, issuerDefault = false, rate3m = [] } = p;
  const S0 = path[0];
  const values = [100];
  let defaulted = false, endIndex = null, cashAcc = 0;
  for (let m = 1; m < path.length; m++) {
    if (defaulted || endIndex !== null) {
      cashAcc *= 1 + monthlyRate(rate3m, m - 1);
      values.push(cashAcc);
      continue;
    }
    if (issuerDefault && m >= issuerDefault.month) {
      defaulted = true; endIndex = m; cashAcc = 100 * issuerDefault.recovery;
      values.push(cashAcc);
      continue;
    }
    const v = 100 * (protection + participation * Math.max(0, path[m] / S0 - 1));
    if (m === months) { endIndex = m; cashAcc = v; }
    values.push(v);
  }
  return { values, endIndex, defaulted };
}

/**
 * 自組保本：先買足到期可還本的公債／定存（以起始利率折現），剩下的錢買指數。
 * p: { months, protection, rate3m[] }；indexPath 建議用含息指數。
 */
export function diyProtected(indexPath, p) {
  const { months = 60, protection = 1, rate3m = [] } = p;
  const r = (rate3m[0] ?? 0) / 100 / 12;
  const bond0 = (100 * protection) / Math.pow(1 + r, months);
  const equity0 = 100 - bond0;
  const values = [100];
  let bond = bond0;
  for (let m = 1; m < indexPath.length; m++) {
    bond *= 1 + (m <= months ? r : monthlyRate(rate3m, m - 1));
    values.push(bond + equity0 * indexPath[m] / indexPath[0]);
  }
  return { values, bond0, equity0 };
}

/**
 * TRF 目標可贖回遠期（客戶賭外幣升值，例：賭人民幣升值 = 美元兌人民幣下跌）。
 * fx = 每 1 美元換多少人民幣。每月結算：
 *   匯率 < 履約價：客戶賺 (strike - spot) × 名目，累計賺到 target 就提前終止（最後一次只給到 target）
 *   匯率 > 履約價：客戶賠 leverage × 名目 × (spot - strike)，沒有上限
 * p: { months, strike, notionalPerFix, leverage, target, maxLoss? }；損益單位 = 人民幣（每 1 美元名目）
 * maxLoss：累計虧損上限（同單位，正數）；預設無上限＝2016 年前的商品。碰到上限合約終止。
 */
export function trf(fx, p) {
  const { months = 24, strike = 6.2, notionalPerFix = 1, leverage = 2, target = 0.3, maxLoss = Infinity } = p;
  let gain = 0, loss = 0, total = 0, knockedOut = false, lossCapped = false, endIndex = null;
  const pnl = [0], fixes = [];
  for (let m = 1; m < fx.length; m++) {
    if (endIndex === null) {
      const spot = fx[m];
      let x = spot < strike ? (strike - spot) * notionalPerFix : -leverage * notionalPerFix * (spot - strike);
      if (x > 0 && gain + x >= target) { x = target - gain; knockedOut = true; }
      if (x < 0 && loss - x >= maxLoss) { x = -(maxLoss - loss); lossCapped = true; }
      if (x > 0) gain += x; else loss -= x;
      total += x;
      fixes.push({ index: m, spot, pnl: x });
      if (knockedOut || lossCapped || m === months) endIndex = m;
    }
    pnl.push(total);
  }
  return { pnl, fixes, knockedOut, lossCapped, endIndex, gain, loss };
}

/** 一般遠期合約（無槓桿、無目標）對照：每月以 strike 換匯，賺賠都是 1 倍 */
export function plainForward(fx, p) {
  return trf(fx, { ...p, leverage: 1, target: Infinity, maxLoss: Infinity });
}

/**
 * 投資型保單 vs 自組（定期險 + 低成本 ETF）。保障成本兩邊視為相同，所以都不扣。
 * indexPath 為月資料（建議含息指數），長度決定能模擬多久。
 * p: { years, premiumPa, frontLoad: [第1年%, 第2年%…]（逐年費率表，超過長度的年份為 0）, adminFeePm, fundFeePa(%), wrapperFeePa(%), diyFeePa(%) }
 * 回傳金額單位同 premiumPa。
 */
export function ilp(indexPath, p) {
  const { years = 20, premiumPa = 100000, frontLoad = [], adminFeePm = 100, fundFeePa = 1.5, wrapperFeePa = 0, diyFeePa = 0.1 } = p;
  const n = Math.min(years * 12, indexPath.length - 1);
  const fees = { frontLoad: 0, admin: 0, fund: 0, wrapper: 0, diy: 0 };
  let a = 0, d = 0, paid = 0;
  const ilpV = [0], diyV = [0], invested = [0];
  for (let m = 1; m <= n; m++) {
    if ((m - 1) % 12 === 0) {
      const y = (m - 1) / 12;
      const load = premiumPa * ((frontLoad[y] ?? 0) / 100);
      fees.frontLoad += load;
      a += premiumPa - load;
      d += premiumPa;
      paid += premiumPa;
    }
    const g = indexPath[m] / indexPath[m - 1];
    a *= g; d *= g;
    const fundFee = a * fundFeePa / 100 / 12, wrapFee = a * wrapperFeePa / 100 / 12, diyFee = d * diyFeePa / 100 / 12;
    const admin = Math.min(adminFeePm, a - fundFee - wrapFee);
    a -= fundFee + wrapFee + Math.max(admin, 0);
    d -= diyFee;
    fees.fund += fundFee; fees.wrapper += wrapFee; fees.admin += Math.max(admin, 0); fees.diy += diyFee;
    ilpV.push(a); diyV.push(d); invested.push(paid);
  }
  return { ilp: ilpV, diy: diyV, invested, feesPaid: fees, months: n };
}
