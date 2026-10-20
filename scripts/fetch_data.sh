#!/usr/bin/env bash
# 重新下載原始資料到 data/raw/
set -euo pipefail
cd "$(dirname "$0")/../data/raw"
curl -sSL -o sp.csv  https://raw.githubusercontent.com/datasets/s-and-p-500/main/data/data.csv
for s in TB3MS:tb3 EXUSAL:aud EXCHUS:cny EXTAUS:twd; do
  curl -sSL -o "${s#*:}.csv" "https://fred.stlouisfed.org/graph/fredgraph.csv?id=${s%%:*}"
done
