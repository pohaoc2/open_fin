// 詞彙表資料：全站 <dfn data-term="鍵"> 的提示與 glossary.html 共用
// short：一兩句白話；long：可選，詞彙表頁顯示的較長說明；see：可選，相關頁面（相對網站根目錄）
// cat：分類（option 選擇權相關／credit 債券與信用／fee 費用／insurance 保險／other 其他）
export default {
  // ---------- 選擇權相關 ----------
  "選擇權": {
    cat: "option",
    short: "一種「約定好的權利」。買方付一筆錢，換到未來用約定價格買或賣的權利；賣方收錢，承擔履約的義務。",
    long: "可以把它想成保險或彩券：買方付小錢買保障或機會，賣方收保費但要承擔可能的大額賠付。很多包裝商品的「高利息」，其實就是你在當選擇權的賣方。",
    see: "learn/options.html",
  },
  "賣權": {
    cat: "option",
    short: "一種「跌價保險」。買的人付保費，股價跌破某個價位時，賣的人要賠。",
    long: "賣出賣權＝賣跌價保險：平常收保費，市場大跌時要用約定價格把股票「接下來」，等於承擔下跌損失。FCN、雙元貨幣都藏有賣出賣權。",
    see: "learn/options.html",
  },
  "買權": {
    cat: "option",
    short: "一種「漲價彩券」。買的人付一筆小錢，價格漲超過某個價位時能賺差價。",
    long: "買入買權最多賠掉付出的錢，上漲時可以賺。保本型連動債通常是「債券＋買入買權」。",
    see: "learn/options.html",
  },
  "履約價": {
    cat: "option",
    short: "選擇權約定好的那個價格。價格越過它，選擇權才開始有價值或開始要賠。",
    see: "learn/options.html",
  },
  "權利金": {
    cat: "option",
    short: "買選擇權付的錢，也就是「保費」。賣方收到權利金，買方付出權利金。",
    see: "learn/options.html",
  },
  "敲入": {
    cat: "option",
    short: "價格跌破某條「警戒線」後，保護就消失。敲入後到期若還在下跌，你可能拿回股票而不是現金。",
    long: "常見警戒線是起始價的 60%～70%。重點：只要期間內「碰到一次」就算，之後就算漲回來，條件也已經改變（依各商品條款而定）。",
    see: "products/fcn.html",
  },
  "敲出": {
    cat: "option",
    short: "價格漲到某條線以上時，商品提早結束，本金先還你。好處是早拿回錢，壞處是高利息也提早停了。",
    see: "products/fcn.html",
  },
  "一籃子最差表現": {
    cat: "option",
    short: "商品綁好幾檔股票，但只看「跌最多的那一檔」。綁越多檔，碰到地雷的機會越大，不是越分散。",
    long: "英文常寫 worst-of。分散投資時，一檔跌了別檔可以補；但最差表現條款只算最慘那檔，所以檔數越多風險反而越高，銀行也因此能給比較高的利息。",
    see: "products/fcn.html",
  },
  "名目本金": {
    cat: "option",
    short: "合約計算用的金額，不一定是你實際拿出來的錢。損益是用它來乘的，所以可能比你想像大很多。",
    see: "products/trf.html",
  },
  "槓桿": {
    cat: "option",
    short: "用小錢控制大金額。賺的時候放大，賠的時候也放大。",
    long: "例如 TRF 常見「賺時算 1 倍、賠時算 2 倍」，就是不對稱的槓桿。",
    see: "products/trf.html",
  },
  "波動度": {
    cat: "option",
    short: "價格上上下下的劇烈程度。波動越大，跌價保險越貴，所以包裝商品給的利息也越高——高利息常代表標的很會晃。",
    see: "learn/options.html",
  },
  "遠期合約": {
    cat: "option",
    short: "現在先約好未來某天用某個價格交易，例如三個月後用 31 元換美元。到時不管市價多少都要照約定做。",
    see: "products/trf.html",
  },
  "參與率": {
    cat: "option",
    short: "保本型商品中，指數上漲時你能分到幾成。參與率 50% 代表指數漲 20%，你只分到 10%。",
    see: "products/structured-note.html",
  },

  // ---------- 債券與信用 ----------
  "零息債": {
    cat: "credit",
    short: "中間不配息、到期一次還本的債券。用比面額便宜的價格買，到期領回面額，差價就是利息。",
    see: "learn/bonds.html",
  },
  "發行機構": {
    cat: "credit",
    short: "真正欠你錢的那家公司或銀行。賣你商品的銀行不一定是發行機構，它倒了你可能拿不回錢。",
    see: "learn/credit-risk.html",
  },
  "信用風險": {
    cat: "credit",
    short: "欠你錢的人還不出錢的風險。「保本」只在發行機構沒倒的前提下才成立。",
    see: "learn/credit-risk.html",
  },
  "殖利率": {
    cat: "credit",
    short: "以現在的價格買進、持有到期，平均每年大約能賺幾 %。它不等於「保證報酬」。",
    see: "learn/bonds.html",
  },
  "再投資風險": {
    cat: "credit",
    short: "錢提早還給你時，市場利率可能已經變低，你找不到一樣好的地方放，整體報酬因此下降。",
    see: "learn/bonds.html",
  },
  "保本率": {
    cat: "credit",
    short: "到期時保證還你本金的比例，例如 100% 或 90%。前提是持有到期，而且發行機構沒倒。",
    see: "products/structured-note.html",
  },
  "結構型商品": {
    cat: "credit",
    short: "把債券、選擇權等零件包在一起賣的商品，例如 FCN、連動債、雙元貨幣。看起來是一個產品，裡面其實有好幾個零件。",
    see: "products/index.html",
  },
  "存款保險": {
    cat: "credit",
    short: "銀行倒閉時，政府設立的機構保障一般存款到一定金額。結構型商品、基金、保單通常不在保障範圍內。",
    long: "保障範圍與上限請以中央存款保險公司最新公告為準。在銀行買的東西不等於存款。",
    see: "learn/credit-risk.html",
  },

  // ---------- 費用 ----------
  "合理價": {
    cat: "fee",
    short: "依市場行情算出來的商品真實價值。如果你用 100 元買、合理價只有 97 元，差的 3 元就是你一開始就付掉的隱藏成本。",
    see: "learn/hidden-costs.html",
  },
  "內扣費用": {
    cat: "fee",
    short: "直接從資產裡扣、不會另外開帳單的費用，例如基金管理費。你看不到收據，但淨值每天被悄悄扣一點。",
    see: "learn/hidden-costs.html",
  },
  "通路服務費": {
    cat: "fee",
    short: "基金公司付給銷售機構（銀行、保險公司）的報酬，通常從基金資產裡扣，最後由投資人負擔。",
    see: "learn/hidden-costs.html",
  },
  "前置費用": {
    cat: "fee",
    short: "投資型保單常見：你繳的保費先扣一筆才拿去投資，前幾年扣得特別多。",
    see: "products/ilp.html",
  },
  "保單管理費": {
    cat: "fee",
    short: "投資型保單每月固定從帳戶扣的行政費用，不論賺賠都扣。",
    see: "products/ilp.html",
  },
  "解約費用": {
    cat: "fee",
    short: "在約定年數內提早解約要付的費用，常見前幾年較高、逐年遞減。",
    see: "products/ilp.html",
  },
  "提前贖回": {
    cat: "fee",
    short: "到期前就把錢拿回來。很多結構型商品可以申請，但要用當時的市價、常再被扣一筆，可能拿回比本金少很多。",
    see: "learn/liquidity.html",
  },

  // ---------- 保險 ----------
  "危險保費": {
    cat: "insurance",
    short: "投資型保單裡真正用來買保障的那部分費用，每月從帳戶扣。年紀越大扣越多。",
    see: "products/ilp.html",
  },
  "定期壽險": {
    cat: "insurance",
    short: "只保一段期間（例如 20 年）的純保障壽險，沒有投資功能，所以保費相對便宜。",
    see: "products/ilp.html",
  },
  "保單價值": {
    cat: "insurance",
    short: "投資型保單帳戶裡目前的錢，等於繳的保費扣掉各種費用，再加減投資損益。",
    see: "products/ilp.html",
  },
  "類全委保單": {
    cat: "insurance",
    short: "投資型保單的一種，把錢交給投信代操。常強調「月月配息」，但配息可能來自你自己的本金，而且多一層代操費用。",
    see: "products/ilp.html",
  },

  // ---------- 其他 ----------
  "流動性": {
    cat: "other",
    short: "想拿回現金時能不能快速、不打折地拿回來。定存解約很容易，結構型商品可能很難。",
    see: "learn/liquidity.html",
  },
  "匯率風險": {
    cat: "other",
    short: "錢放在外幣時，換回台幣可能變少。利息 5%，匯率跌 10%，換回來還是虧。",
    see: "learn/fx-risk.html",
  },
  "總報酬": {
    cat: "other",
    short: "價格漲跌加上配息的總和才是真正賺多少。只看配息會漏掉本金縮水的部分。",
    see: "learn/hidden-costs.html",
  },
  "保證金": {
    cat: "other",
    short: "做槓桿交易時押在銀行的擔保金。虧損擴大時銀行會要求補錢，補不出來可能被強制結清。",
    see: "products/trf.html",
  },
  "專業投資人": {
    cat: "other",
    short: "符合一定財力或專業條件、並書面同意的投資人。銀行可以賣給他們更複雜的商品，但部分消費者保護也會變少。",
    long: "財力門檻與條件會調整，請以主管機關最新規定為準。簽同意書前，先問清楚「我會少掉哪些保護」。",
    see: "questions.html",
  },
  "特定金錢信託": {
    cat: "other",
    short: "你把錢交給銀行信託部，指定買某個商品。銀行常用這個方式賣海外基金與結構型商品，信託管理費也是成本之一。",
    see: "learn/hidden-costs.html",
  },
  "KYC": {
    cat: "other",
    short: "「認識你的客戶」：銀行評估你的財力、經驗、能承受多少風險。結果會決定能賣你哪些商品，請要一份副本。",
    see: "questions.html",
  },
  "指數ETF": {
    cat: "other",
    short: "一次買進一整個市場（例如大盤前幾百大公司）的基金，在股票市場交易，費用通常很低。",
    see: "learn/hidden-costs.html",
  },
  // ---------- 補充詞彙 ----------
  "轉換價": { cat: "option", short: "雙元貨幣（DCI）事先約定的匯率。到期時匯率跌破它，你的錢會用這個匯率被換成另一種貨幣。", see: "products/dci.html" },
  "獲利上限": { cat: "option", short: "TRF 累計賺到某個金額就自動結束，賺的有上限；但賠的沒有上限。", see: "products/trf.html" },
  "觀察方式": { cat: "option", short: "商品多久檢查一次價格有沒有跌破門檻。每天檢查比只看到期那天更容易碰到門檻。", see: "products/fcn.html" },
  "強制結清": { cat: "other", short: "虧損太大、保證金不夠時，銀行可以不經你同意直接把部位結掉，虧損就此確定。", see: "products/trf.html" },
  "買賣價差": { cat: "fee", short: "銀行買進和賣出的價格不一樣，中間的差就是銀行賺的。換匯時常見，也叫匯差。", see: "learn/hidden-costs.html" },
  "年化利率": { cat: "other", short: "把短期的利息換算成「一年等於多少 %」。一個月期年化 8%，實際一個月只拿到約 0.67%。" },
  "分離帳戶": { cat: "insurance", short: "投資型保單裡的投資部分，跟保險公司自己的財產分開放。保險公司出事時，這部分原則上受到保護，但投資本身的漲跌仍由你承擔。", see: "products/ilp.html" },
  "信用評等": { cat: "credit", short: "評等機構給發行機構打的「還錢能力分數」，例如 AAA、BBB。分數高不代表不會倒，2008 年就有高評等的機構倒閉。", see: "learn/credit-risk.html" },
  "配息來自本金": { cat: "fee", short: "基金發的「利息」不一定是賺來的，有時是把你自己的本金拿一部分還給你。配息率高不代表報酬率高。", see: "products/monthly-income-fund.html" },
  "淨值": { cat: "other", short: "基金每一單位現在值多少錢。配息之後淨值會往下掉，因為錢是從基金裡拿出來的。", see: "products/monthly-income-fund.html" },
  "高收益債": { cat: "credit", short: "借錢給信用比較差的公司，利息比較高，但公司還不出錢的機率也比較高。以前也叫「垃圾債」。", see: "products/monthly-income-fund.html" },
  "投資等級債": { cat: "credit", short: "信用評等在一定水準以上的公司或政府發的債券，違約機率較低，利息也較低。", see: "learn/credit-risk.html" },
  "配息組成": { cat: "fee", short: "基金配出來的錢，有多少是真的賺來的利息、有多少是本金。基金公司要定期公布，可以自己查。", see: "products/monthly-income-fund.html" },
  "遞延手續費": { cat: "fee", short: "買的時候不收手續費，但太早賣掉要付一筆費用。持有越久費率越低。", see: "products/target-maturity-bond.html" },
  "除息": { cat: "other", short: "配息的那一天，股價會扣掉這次發的股息。股票少了、現金多了，總資產大致不變。", see: "learn/dividends.html" },
  "填息": { cat: "other", short: "除息後股價又漲回除息前的價格。這是公司價值成長帶來的，不配息時股價一樣會漲，所以不算「多賺」。", see: "learn/dividends.html" },
  "市值型ETF": { cat: "other", short: "照公司大小（市值）買進一整個市場的 ETF，越大的公司買越多，很少換股，費用通常較低。", see: "products/high-dividend-etf.html" },
  "高股息ETF": { cat: "other", short: "挑過去或預估配息較多的公司組成的 ETF。配息較多，但換股較頻繁，也不保證總報酬比較高。", see: "products/high-dividend-etf.html" },
  "二代健保補充保費": { cat: "fee", short: "單筆股利或利息達 2 萬元時，會先扣 2.11% 繳給健保（目前規定，以健保署公告為準）。賣股票的價差不用扣。", see: "learn/dividends.html" },
  "收益平準金": { cat: "fee", short: "新投資人買進 ETF 時，付的錢裡屬於「還沒配出去的收益」的部分，會先存起來之後拿來配息，讓配息比較穩。占比高代表配息有一部分來自新投資人的錢。", see: "products/high-dividend-etf.html" },
  "殖利率陷阱": { cat: "other", short: "殖利率＝股息÷股價。股價大跌時殖利率會「看起來」變高，但可能是公司出了問題，之後股息也會減少。", see: "products/high-dividend-etf.html" },
  "證券交易稅": { cat: "fee", short: "賣出股票或 ETF 時政府收的稅。股票 0.3%、多數 ETF 0.1%，買進時不收。", see: "learn/dividends.html" },
  "周轉率": { cat: "fee", short: "基金或 ETF 一年內換掉多少比例的持股。換越多，買賣成本越高，這些成本不在費用率裡。", see: "products/high-dividend-etf.html" },
};

export const categories = {
  option: "選擇權相關",
  credit: "債券與信用",
  fee: "費用",
  insurance: "保險",
  other: "其他",
};
