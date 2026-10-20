"""Build data/market.json from the raw CSVs in data/raw/.

Sources (see data/README.md):
  sp.csv   S&P 500 monthly (Shiller via github.com/datasets/s-and-p-500, PDDL)
  tb3.csv  FRED TB3MS  3-month T-bill rate (%)
  aud.csv  FRED EXUSAL USD per 1 AUD
  cny.csv  FRED EXCHUS CNY per 1 USD
  twd.csv  FRED EXTAUS TWD per 1 USD
Re-download: see scripts/fetch_data.sh
"""
import csv, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
START = "1990-01"


def read(name, col):
    out = {}
    with open(RAW / name) as f:
        for row in csv.DictReader(f):
            v = row[col]
            if v in ("", "."):
                continue
            out[row[next(iter(row))][:7]] = float(v)
    return out


sp = read("sp.csv", "SP500")
div = read("sp.csv", "Dividend")
tb3 = read("tb3.csv", "TB3MS")
aud = read("aud.csv", "EXUSAL")
cny = read("cny.csv", "EXCHUS")
twd = read("twd.csv", "EXTAUS")

months = sorted(m for m in sp if m >= START)
series = {
    "month": months,
    "sp500": [round(sp[m], 2) for m in months],
    "sp500tr": [],
    "rate3m": [tb3.get(m) for m in months],
    "audusd": [aud.get(m) for m in months],
    "usdcny": [cny.get(m) for m in months],
    "usdtwd": [twd.get(m) for m in months],
}
tr, last_yield = 100.0, None
for i, m in enumerate(months):
    if div.get(m, 0) > 0:
        last_yield = div[m] / sp[m]
    if i > 0:
        p = months[i - 1]
        tr *= (sp[m] + sp[p] * last_yield / 12) / sp[p]
    series["sp500tr"].append(round(tr, 4))

meta = {
    "frequency": "monthly (月平均或月資料)",
    "notes": "sp500tr 為含息總報酬指數（1990-01=100），2023-07 後股息以最後已知殖利率估算。",
    "sources": {
        "sp500": "Robert Shiller / datasets/s-and-p-500 (PDDL)",
        "rate3m": "FRED TB3MS",
        "audusd": "FRED EXUSAL",
        "usdcny": "FRED EXCHUS",
        "usdtwd": "FRED EXTAUS",
    },
}
(ROOT / "data" / "market.json").write_text(json.dumps({"meta": meta, **series}, ensure_ascii=False))
(ROOT / "assets" / "engine" / "market-data.js").write_text(
    "// 由 scripts/build_data.py 產生，請勿手改\nexport default " + json.dumps({"meta": meta, **series}, ensure_ascii=False) + ";\n"
)
print(len(months), months[0], months[-1])
