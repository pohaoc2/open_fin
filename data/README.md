# 資料

| 欄位 | 內容 | 來源 | 授權 |
|---|---|---|---|
| `sp500` | S&P 500 月平均價 | Robert Shiller 資料，經 [datasets/s-and-p-500](https://github.com/datasets/s-and-p-500) 整理 | ODC-PDDL |
| `sp500tr` | 含息總報酬指數（1990-01 = 100） | 由上列價格與股息計算；2023-07 後股息以最後已知殖利率估算 | 同上 |
| `rate3m` | 美國 3 個月國庫券利率（%） | FRED [TB3MS](https://fred.stlouisfed.org/series/TB3MS) | 公共領域（美國聯準會 H.15） |
| `audusd` | 1 澳幣兌美元 | FRED [EXUSAL](https://fred.stlouisfed.org/series/EXUSAL) | 公共領域（聯準會 H.10） |
| `usdcny` | 1 美元兌人民幣 | FRED [EXCHUS](https://fred.stlouisfed.org/series/EXCHUS) | 公共領域（聯準會 H.10） |
| `usdtwd` | 1 美元兌新台幣 | FRED [EXTAUS](https://fred.stlouisfed.org/series/EXTAUS) | 公共領域（聯準會 H.10） |

全部為**月資料**（多為月平均），會低估月內的極端波動。範圍 1990-01 起。

## 更新

```bash
scripts/fetch_data.sh        # 下載原始 CSV 到 data/raw/
python3 scripts/build_data.py  # 產生 data/market.json 與 assets/engine/market-data.js
```
