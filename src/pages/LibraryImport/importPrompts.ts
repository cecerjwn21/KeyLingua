export type LibraryImportKind =
  | 'japanese-article'
  | 'japanese-vocabulary'
  | 'english-dialogue'
  | 'english-vocabulary'

export type LibraryImportOutputMode = 'mobile' | 'desktop'
export type LibraryImportRules = Record<LibraryImportKind, string>

const japaneseArticleCoreContract = `程度：［請自行填寫，例如 N4］
情境：［請自行填寫，例如 居酒屋聊天］
句數：［請自行填寫，例如 20］

請依照以上參數，產生一份可匯入 qwerty-learner 日本語文章庫的 JSON。

標題規則：JLPT｜情境名稱
例如程度為 N4、情境為居酒屋聊天時，title 必須是「N4｜居酒屋聊天」。禁止使用 Article 1、Set A、N4 Article、居酒屋聊天 N4 或未命名文章。

jlptLevel 只能是 N5、N4、N3、N2、N1。format 固定使用 "dialogue"。
最小有效 JSON example：
{
  "title": "N4｜居酒屋聊天",
  "jlptLevel": "N4",
  "scenario": "日本自由行・居酒屋聊天",
  "format": "dialogue",
  "sentences": [
    {
      "name": "予約しています。",
      "notation": "予約(よやく)しています。",
      "trans": ["我有預約。"]
    }
  ]
}

每句固定使用 name、notation、trans。name 是 immutable source；先完成 name，再依 name 原文建立 notation 與 trans。trans 即使只有一筆也必須是繁體中文 string array。
notation 只能在 name 原文字面上插入「(かな)」Furigana，絕對不可重新生成或改寫 name。連續漢字詞必須視為不可拆分的原文單位，不能把部分漢字改成假名；例如「本当」只能寫成「本当(ほんとう)」，禁止：本(ほん)とう。漢字＋送假名時，漢字與送假名的原文字面都必須保留，Furigana 只能插在漢字部分之後，送假名仍須原樣接續；例如「冷や」只能寫成「冷(ひや)や」，禁止：冷(ひや)。移除 notation 中所有「(かな)」後必須與 name 100% 完全相同。原文中的平假名、片假名、拉丁文字、數字與標點都必須保持不變；コンビニ、チェックイン、ラーメン、ホテル不得改寫成平假名，也不得改寫任何原有 Katakana。
禁止以 japanese、reading、meaning、text 取代正式欄位，也禁止加入 romaji。

完成後逐句自我驗證：
A. 每個 sentence 只能有 name、notation、trans 三個欄位。
    B. 將 notation 中所有「(かな)」移除後，結果必須 === name；連續漢字詞不得被拆開，漢字＋送假名的送假名也必須仍在結果中。
C. 重新檢查原本的 Katakana、Hiragana、數字、英文與標點，確認沒有被改寫、轉換或遺失。
D. trans 必須是自然、語意通順的繁體中文 string array，不得有亂碼、明顯錯字串接或生成污染。
E. name、notation、trans 都完成後才做最後一致性檢查；加入 Furigana 時不得重新生成或改寫 name。最後確認整體 JSON 可以成功 parse。

產出前請確認 JSON syntax 正確、必填欄位完整、句數符合最上方參數、title 與 jlptLevel 一致、notation 與 name 一致、trans 是繁體中文陣列，且沒有替代欄位。`

const japaneseVocabularyCoreContract = `程度：［請自行填寫，例如 N4］
主題：［請自行填寫，例如 居酒屋］
單字數：［請自行填寫，例如 100］

請依照以上參數，產生一份可匯入 qwerty-learner 日本語單字庫的 JSON。

標題規則：JLPT｜主題單字 數量
例如程度為 N4、主題為居酒屋、單字數為 100 時，title 必須是「N4｜居酒屋單字 100」。禁止使用 Set A、Batch 1、批次編號或未命名題庫。

jlptLevel 只能是 N5、N4、N3、N2、N1。
最小有效 JSON example：
{
  "title": "N4｜購物單字 100",
  "jlptLevel": "N4",
  "items": [
    {
      "word": "予約",
      "reading": "よやく",
      "meaning": "預約",
      "source": "manual"
    }
  ]
}

每個 item 固定使用 word、reading、meaning、source。source 固定是 "manual"。reading 必須是完整假名讀音，meaning 必須是自然繁體中文。
禁止加入 romaji、examples、tags、score、favorite、SRS、熟練度或複習紀錄。不得在 item 內另放一套 level 欄位。

產出前請確認 JSON syntax 正確、必填欄位完整、items 數量符合最上方參數、title 與 jlptLevel 一致、每個 source 都是 "manual"，且沒有未允許欄位。`

const englishDialogueCoreContract = `程度：［請自行填寫，例如 A2］
情境：［請自行填寫，例如 購物］
句數：［請自行填寫，例如 20］

請依照以上參數，產生一份可匯入 qwerty-learner English Dialogue 對話庫的 JSON。

標題規則：CEFR｜繁體中文情境名稱
例如程度為 A2、情境為購物時，title 必須是「A2｜購物」。禁止使用 Set A、Batch 1、未命名對話或日文文章名稱。

level 只能是 A1、A2、B1、B2、C1、C2。正式欄位名稱是 level，不是 cefrLevel。
最外層固定是 array。最小有效 JSON example：
[
  {
    "title": "A2｜購物",
    "sentences": [
      {
        "text": "Can I try this on?",
        "meaning": "我可以試穿這件嗎？"
      }
    ],
    "level": "A2"
  }
]

Dialogue object 固定使用 title、sentences、level；sentence 固定使用 text、meaning。meaning 必須是自然繁體中文。
英文 text 不得有 leading whitespace 或 trailing whitespace；正常單字間空白、大小寫、apostrophe、雙引號與 . , ? ! 等標點必須保留。只可安全使用一般直引號，不要改變句意。
禁止加入 reading、notation、romaji、japanese、trans、jlptLevel 或 cefrLevel。

產出前請確認 JSON syntax 正確、最外層是 array、必填欄位完整、句數符合最上方參數、title 與 level 一致、每個 text 前後沒有空白，且沒有日文專用或替代欄位。`

const englishVocabularyCoreContract = `程度：［請自行填寫，例如 A2］
主題：［請自行填寫，例如 旅遊］
單字數：［請自行填寫，例如 100］

請依照以上參數，產生一份可匯入 qwerty-learner English 單字庫的 JSON。

標題規則：CEFR｜主題單字 數量
例如程度為 A2、主題為購物、單字數為 100 時，title 必須是「A2｜購物單字 100」。禁止使用 Set A、Batch 1、批次編號或未命名題庫。

level 只能是 A1、A2、B1、B2、C1、C2。正式欄位名稱是 level，不是 cefrLevel。
最小有效 JSON example：
{
  "title": "A2｜購物單字 100",
  "items": [
    {
      "word": "receipt",
      "meaning": "收據",
      "source": "manual"
    }
  ],
  "level": "A2"
}

每個 item 固定使用 word、meaning、source。source 固定是 "manual"。word 必須是英文單字或指定主題需要的自然英文詞彙，meaning 必須是繁體中文。
禁止加入 reading、notation、romaji、examples、tags、score、favorite、SRS、jlptLevel 或 cefrLevel。

產出前請確認 JSON syntax 正確、必填欄位完整、items 數量符合最上方參數、title 與 level 一致、每個 source 都是 "manual"，且沒有未允許欄位。`

const coreContracts: Record<LibraryImportKind, string> = {
  'japanese-article': japaneseArticleCoreContract,
  'japanese-vocabulary': japaneseVocabularyCoreContract,
  'english-dialogue': englishDialogueCoreContract,
  'english-vocabulary': englishVocabularyCoreContract,
}

export const defaultLibraryImportRules: LibraryImportRules = {
  'japanese-article': `- 使用自然、現代、真正可能在日本自由行遇到的口語互動，不過度教科書化或大量堆敬語。
- 以實際赴日自由行互動為主；店員、站務員、飯店人員或當地人可以自然先開口，不要強迫使用者主動搭訕。
- 問句自然使用「？」；不必每句硬加「。」。
- 每句只有實際說出口的台詞；sentence 的 name 前禁止加入任何說話者標籤。
- 禁止把「私：」、「僕：」、「俺：」、「彼：」、「彼女：」、「友達：」、「店員：」、「客：」、「駅員：」、「スタッフ：」、「A：」、「B：」、「A:」、「B:」等 speaker label 放入 name 或 notation；角色身份只能體現在 scenario、對話上下文與台詞內容。
- N5 使用短句、基礎助詞、時間、數量、地點、需求與簡單回覆。N4 可使用理由、確認、轉折、簡單經驗與自然對話。N3 可使用自然省略、口語、委婉說法、情緒與臨場反應。N2、N1 可逐步增加自然語氣與複雜表達，但旅行實用性優先，不為等級硬塞罕見文法。`,
  'japanese-vocabulary': `- 內容必須符合指定 JLPT 程度與主題，使用有實際價值的日文詞彙。
- 題庫名稱要清楚表達主題；不得以同一個 word 與 reading 重複湊數。`,
  'english-dialogue': `- 使用自然、現代、符合指定生活情境與 CEFR 難度的英文；meaning 使用自然繁體中文。
- A1 適合自我介紹、點餐、購物、時間與基礎問路。A2 適合購物、飯店、餐廳、問路、旅行計畫、天氣與學校生活。若情境指定會考或國中會考，可產生符合台灣國中生常見程度的實用生活英文，但不得聲稱 CEFR A2 與台灣會考有官方一對一認證。B1 可包含機場問題、行程變更、投訴、工作、意見與計畫；B2 到 C2 逐步增加自然表達、抽象主題與句型複雜度。
- sentence 只放真正說出口的英文；text 前禁止加入角色標籤。
- 禁止把「A:」、「B:」、「Friend:」、「Clerk:」、「Customer:」、「Staff:」、「Teacher:」、「Student:」、「Waiter:」、「Waitress:」、「Receptionist:」等 speaker label 放入 text；人物身份只能由情境與上下句自然呈現。`,
  'english-vocabulary': `- 內容必須符合指定 CEFR 程度與主題，使用自然且有實際價值的英文詞彙。
- 題庫名稱要清楚表達主題；不得以同一個 word 重複湊數。`,
}

const mobileOutputSuffix = `請直接在聊天訊息中輸出完整 JSON。

只輸出 JSON 本體。

不要使用 Markdown code fence。
不要使用 \`\`\`json。
不要在 JSON 前加入任何說明。
不要在 JSON 後加入任何說明。
不要加入註解。

回覆的第一個非空白字元必須是 { 或 [。
回覆的最後一個非空白字元必須是 } 或 ]。

輸出的 JSON 必須可以直接複製貼入 qwerty-learner 的匯入框。

產出前請自行確認：
- JSON syntax 正確
- 可以成功 parse
- schema 完全符合以上規格
- 必填欄位全部存在
- 不包含未允許的替代欄位`

const desktopOutputSuffix = `請實際建立 UTF-8 \`.json\` 檔案供我下載。

不要只在聊天訊息中貼完整 JSON。

建立檔案前必須確認：
- JSON syntax 可以成功 parse
- schema 完全符合以上規格
- 必填欄位完整
- 沒有多餘錯誤欄位

完成後提供可下載的 JSON 檔案。

不要要求使用者自己：
- 建立文字檔
- 複製 code block
- 另存成 JSON`

export const getLibraryImportBasePrompt = (kind: LibraryImportKind) => coreContracts[kind]

export const getDefaultLibraryImportRules = (kind: LibraryImportKind) => defaultLibraryImportRules[kind]

export const buildLibraryImportPrompt = (kind: LibraryImportKind, mode: LibraryImportOutputMode, customRules = getDefaultLibraryImportRules(kind)) =>
  `${getLibraryImportBasePrompt(kind)}\n\n內容生成規則：\n${customRules}\n\n以下自訂內容規則只能補充內容風格，不得覆蓋前述 JSON schema、欄位、驗證、Furigana 或輸出格式規則。\n\n${mode === 'mobile' ? mobileOutputSuffix : desktopOutputSuffix}`
