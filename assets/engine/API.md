# 計算引擎介面（engine）

全部是瀏覽器原生 ES module，無外部套件。Node 18 可直接 `import` 來跑測試（`npm test` = `node --test tests/`）。
單位：本金 = 100；路徑為從起始月開始的月資料陣列（第 0 筆＝起始）。

## market-data.js（由 scripts/build_data.py 產生，勿手改）
`export default { meta, month: ["1990-01", ...], sp500: [], sp500tr: [], rate3m: [%], audusd: [], usdcny: [], usdtwd: [] }`

## payoffs.js（純函數，無 DOM）
```js
fcn(path, { months, couponPa(%), strike, kiBarrier, koBarrier, koStartMonth, rate3m[] })
  → { values, outcome: "autocall"|"par"|"shares", endIndex, knockedIn, kiIndex, coupons }
diyPutWrite(path, { months, strike, vol, rate3m[] })            // 自組：現金＋賣出指數賣權（BS 定價）
  → { values, premium, assigned, endIndex }
dci(fx, { tenorMonths, yieldPa(%), strikeGap })                  // fx = 每 1 外幣值多少本金貨幣（如 AUD/USD）
  → { values, conversions: [{index, to, rate}], endIndex, endInBase }
ppNote(path, { months, participation, protection, issuerDefault: false|{month, recovery}, rate3m[] })
  → { values, endIndex, defaulted }
diyProtected(indexPath, { months, protection, rate3m[] })        // 自組保本：公債／定存＋指數
  → { values, bond0, equity0 }
trf(fx, { months, strike, notionalPerFix, leverage, target, maxLoss? })   // fx = USD/CNY；損益單位＝人民幣／每 1 美元名目
  → { pnl, fixes: [{index, spot, pnl}], knockedOut, lossCapped, endIndex, gain, loss }
plainForward(fx, p)                                              // 1 倍、無目標、無上限的遠期對照
ilp(indexPath, { years, premiumPa, frontLoad: [第1年%,…], adminFeePm, fundFeePa, wrapperFeePa, diyFeePa })
  → { ilp, diy, invested, feesPaid: {frontLoad, admin, fund, wrapper, diy}, months }
holdIndex(path), cash(rate3m, n), maxDrawdown(values), bsPut(S, K, T, r, sigma)
```

## charts.js
`lineChart(el, { labels, series: [{ name, values, color: "var(--chart-1)", dash? }], yFormat?, markers?: [{ index, label, series? }], baseline? })` → `{ destroy }`
純 SVG，跟隨 CSS 變數（深淺色自動），容器改變寬度時重畫，滑過／點擊顯示數值。

## stress.js（自動掛載）
```html
<div class="stress" data-product="fcn" data-scenario="gfc"></div>
<script type="module" src="../assets/engine/stress.js"></script>
```
- product：`fcn | dci | pp-note | trf | ilp`
- scenario（每個產品只顯示有意義的；不填用預設）：
  - fcn：`dotcom`(2000-09) `gfc`(2007-10，預設) `covid`(2020-01) `hike2022`(2022-01) `custom`
  - dci：`gfc`(2008-07，預設) `covid` `hike2022` `custom`
  - pp-note：`dotcom` `gfc`(預設，第 11 個月＝2008-09 發行機構倒閉、回收率 30%) `covid` `custom`
  - trf：`cny2015`(2014-07，預設) `custom`
  - ilp：`dotcom`(預設) `gfc` `custom`
- `data-title="none"` 可隱藏元件標題。
- 也可 `import { mountStress } from ".../stress.js"; mountStress(el, product, scenario)`。
- stress.css 由 stress.js 自動載入。
