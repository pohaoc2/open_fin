import { test } from "node:test";
import assert from "node:assert/strict";
import * as P from "../assets/engine/payoffs.js";
import data from "../assets/engine/market-data.js";

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);
const flat = (n, v = 100) => Array(n + 1).fill(v);

test("FCN：沒跌破敲入線、也沒敲出 → 到期拿回本金＋12 個月配息", () => {
  const path = [100, 95, 90, 92, 94, 96, 97, 98, 95, 93, 92, 91, 90];
  const r = P.fcn(path, { months: 12, couponPa: 12, kiBarrier: 0.7, koBarrier: 1, koStartMonth: 3 });
  assert.equal(r.outcome, "par");
  assert.equal(r.knockedIn, false);
  close(r.values[12], 112);
});

test("FCN：跌破敲入線、到期剩一半 → 拿到股票，價值 = 50 + 配息", () => {
  const path = [100, 90, 80, 60, 55, 50, 50, 50, 50, 50, 50, 50, 50];
  const r = P.fcn(path, { months: 12, couponPa: 12, kiBarrier: 0.7 });
  assert.equal(r.outcome, "shares");
  assert.equal(r.kiIndex, 3);
  close(r.values[12], 50 + 12);
});

test("FCN：第 3 個月漲回起始價以上 → 提前出場，只領 3 個月配息", () => {
  const path = [100, 98, 99, 101, 120, 130];
  const r = P.fcn(path, { months: 12, couponPa: 12, koStartMonth: 3 });
  assert.equal(r.outcome, "autocall");
  assert.equal(r.endIndex, 3);
  close(r.coupons, 3);
  close(r.values[5], 103); // 利率 0，之後是現金
});

test("FCN：2008 金融海嘯起跑，12 個月期、敲入 70% → 拿到股票", () => {
  const i = data.month.indexOf("2007-10");
  const r = P.fcn(data.sp500.slice(i, i + 37), { months: 12, couponPa: 8, kiBarrier: 0.7, rate3m: data.rate3m.slice(i, i + 37) });
  assert.equal(r.outcome, "shares");
  assert.ok(r.values[12] < 80);
});

test("Black–Scholes 賣權：價平、r=0 時約為 0.4·σ·√T·S", () => {
  close(P.bsPut(100, 100, 1, 0, 0.2), 7.966, 0.01);
  close(P.bsPut(100, 50, 0.0001, 0, 0.2), 0, 1e-9);
});

test("自組賣權：沒跌 → 本金＋權利金", () => {
  const r = P.diyPutWrite(flat(12), { months: 12, vol: 0.2 });
  close(r.values[12], 100 + r.premium);
  assert.equal(r.assigned, false);
});

test("DCI：匯率不動 → 每月領利息，不被轉換", () => {
  const r = P.dci(flat(12, 0.7), { yieldPa: 12, strikeGap: 0.01 });
  assert.equal(r.conversions.length, 0);
  close(r.values[12], 100 * Math.pow(1.01, 12));
});

test("DCI：第 1 期匯率跌 10% → 以轉換價換成外幣，之後跟著匯率走", () => {
  const r = P.dci([1, 0.9, 0.9], { yieldPa: 12, strikeGap: 0.01 });
  assert.equal(r.conversions.length, 1);
  const linked = 101 / 0.99; // 本金＋利息，以 0.99 換成外幣
  close(r.values[1], linked * 0.9);
  // 第 2 期做反向：匯率沒漲過 0.9×1.01，繼續拿外幣並領利息
  close(r.values[2], linked * 1.01 * 0.9);
});

test("保本連動債：到期指數漲 50%、參與率 60% → 130", () => {
  const path = [100, ...Array(59).fill(110), 150];
  const r = P.ppNote(path, { months: 60, participation: 0.6, protection: 1 });
  close(r.values[60], 130);
});

test("保本連動債：到期指數下跌 → 保本 100；發行機構倒閉 → 只剩回收率", () => {
  const path = [100, ...Array(60).fill(60)];
  close(P.ppNote(path, { months: 60 }).values[60], 100);
  const d = P.ppNote(path, { months: 60, issuerDefault: { month: 11, recovery: 0.3 } });
  assert.equal(d.defaulted, true);
  close(d.values[60], 30);
});

test("自組保本：利率 0 時全部錢都要放公債，只剩 0 投資", () => {
  const r = P.diyProtected(flat(60), { months: 60, protection: 1, rate3m: Array(61).fill(0) });
  close(r.equity0, 0);
  close(r.values[60], 100);
});

test("TRF：連續有利 → 累計到目標提前終止", () => {
  const fx = [6.2, 6.1, 6.1, 6.1, 6.1];
  const r = P.trf(fx, { months: 24, strike: 6.2, target: 0.25 });
  assert.equal(r.knockedOut, true);
  assert.equal(r.endIndex, 3); // 0.1 + 0.1 + 0.05
  close(r.pnl.at(-1), 0.25);
});

test("TRF：不利時賠 2 倍、沒有上限", () => {
  const r = P.trf([6.2, 6.4, 6.6], { months: 2, strike: 6.2, leverage: 2, target: 0.3 });
  close(r.pnl[2], -2 * 0.2 - 2 * 0.4);
  const f = P.plainForward([6.2, 6.4, 6.6], { months: 2, strike: 6.2 });
  close(f.pnl[2], -0.6);
});

test("投資型保單：0 費用時與自組 0 費用一樣；有費用一定比較少", () => {
  const path = Array.from({ length: 121 }, (_, i) => 100 * Math.pow(1.005, i));
  const same = P.ilp(path, { years: 10, premiumPa: 10, frontLoad: [], adminFeePm: 0, fundFeePa: 0, diyFeePa: 0 });
  close(same.ilp[120], same.diy[120]);
  const r = P.ilp(path, { years: 10, premiumPa: 10, frontLoad: [5, 5, 5, 5, 5], adminFeePm: 0.01, fundFeePa: 2, diyFeePa: 0.1 });
  assert.ok(r.ilp[120] < r.diy[120]);
  close(r.feesPaid.frontLoad, 2.5);
  close(r.invested[120], 100);
});

test("現金與最大跌幅", () => {
  close(P.cash(Array(13).fill(12))[12], 100 * Math.pow(1.01, 12));
  close(P.maxDrawdown([100, 120, 60, 130]), 0.5);
});

test("TRF：有最大損失上限 → 碰到上限就終止，虧損不再擴大", () => {
  const r = P.trf([6.2, 6.4, 6.6, 6.8], { months: 3, strike: 6.2, leverage: 2, target: 0.3, maxLoss: 1 });
  assert.equal(r.lossCapped, true);
  assert.equal(r.endIndex, 2); // 0.4 + 0.8 ≥ 1
  close(r.pnl.at(-1), -1);
});
