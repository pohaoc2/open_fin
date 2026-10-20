# 看懂再買｜包裝型金融商品白話百科

用白話拆解常見的包裝型金融商品：**FCN、DCI 雙元貨幣、TRF、連動債／保本型商品、投資型保單、月配息基金、目標到期債券基金、高股息 ETF**。

每個商品都有：

- **白話拆解卡**：你以為買到什麼、實際上買到什麼、最慘會怎樣
- **錢從哪裡來**：把商品拆成存款、債券、選擇權（保險）、基金
- **銀行賺多少**：常見費用結構
- **壓力測試**：放回 2000、2008、2015、2020、2022 的歷史走勢重跑
- **自組方法**：用現金、債券、指數 ETF、選擇權組出類似效果，以及自組的缺點
- **問理專清單**：附「好的回答」與「警訊」，可列印

> **本站僅供教育，不是投資建議。** 不推薦任何金融機構或商品，不收費、不放廣告、不追蹤。

## 本機預覽

純靜態網站，不需要建置：

```bash
python3 -m http.server 8000
# 開啟 http://localhost:8000
```

（ES module 不能用 `file://` 直接開，需要本機伺服器。）

## 測試

```bash
npm test   # node --test tests/，不需要安裝套件（Node 18+）
```

## 結構

```
index.html              首頁
products/               商品拆解頁（固定模板）
tools/                  壓力測試、費用試算
learn/                  基礎課
questions.html          問理專清單
glossary.html           白話詞彙表（資料在 assets/glossary.js）
cases.html              真實案例
assets/style.css        共用樣式與元件
assets/site.js          主題切換、詞彙提示
assets/engine/          計算引擎（純函數）、圖表、壓力測試元件，介面見 API.md
data/                   歷史資料與來源說明
scripts/                資料下載與轉換
templates/page.html     新頁面模板
```

## 參與

歡迎指正與補充，請先讀 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 授權

- 文字內容：[CC BY-SA 4.0](LICENSE-CONTENT.md)
- 程式碼：[MIT](LICENSE)
- 資料：依各來源授權，見 [data/README.md](data/README.md)
