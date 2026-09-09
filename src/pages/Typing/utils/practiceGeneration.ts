import { stripNotation } from '../components/WordPanel/components/Word/Notation'
import type {
  JLPTLevel,
  PracticeDocument,
  PracticeGenerationRequest,
  PracticeGenerator,
  PracticeLength,
  PracticeScenario,
  Word,
} from '@/typings'

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']
const PRACTICE_SCENARIOS: PracticeScenario[] = ['travel', 'izakaya', 'small-talk', 'random']
const PRACTICE_LENGTHS: PracticeLength[] = ['short', 'medium', 'long']
export const ARTICLE_SENTENCE_RANGE = [3, 30] as const

const scenarioLabels: Record<Exclude<PracticeScenario, 'random'>, string> = {
  travel: '日本旅遊',
  izakaya: '居酒屋／餐廳',
  'small-talk': '陌生人閒聊',
}

/** ChatGPT 文章匯入與 mock generator 共用的可維護文字契約。 */
export const PRACTICE_GENERATION_PROMPT_CONTRACT = {
  quality: [
    '文章必須是有前後關係的小情境、短故事或短對話，不可為零散例句。',
    '使用日本成年人自然日文；避免動漫台詞、過度書面、幼兒化與中文直譯感。',
    '敬語須符合對象：店員與客人合理使用敬語，陌生人聊天可較口語。',
    'JLPT 只代表大約難度，不是官方認證；不可為追求等級而犧牲自然程度。',
    '每句輸出 name、notation、trans；notation 的去除讀音結果必須等於 name，trans 為自然繁體中文。',
  ],
  jlpt: {
    N5: '最基本日常句型、短句、常見動詞與形容詞、少量基本漢字。',
    N4: '一般生活與旅遊對話、常見連接表達與基本動詞變化，句子較 N5 完整自然。',
    N3: '可包含理由、假設、經驗與感想，句子稍長且接近正常成年人聊天。',
    N2: '使用較自然複雜的連接與語氣，可表達細微理由、態度與意見。',
    N1: '自然成年人程度，可有細膩語氣與較複雜表達，仍限於所選日常情境。',
  } satisfies Record<JLPTLevel, string>,
  scenarios: {
    travel: '依 topic 選擇機場、車站、問路、電車、飯店、景點、購物或旅行交流的一個合理小情境。',
    izakaya: '可串連訂位、人數、入座、點酒菜、問推薦、加點、店員互動、結帳或鄰桌聊天。',
    'small-talk': '可自然涵蓋初次見面、來日本原因、去過地點、興趣、工作、食物、旅行、推薦與結束聊天。',
  } satisfies Record<Exclude<PracticeScenario, 'random'>, string>,
} as const

const fixtureSentences: Record<Exclude<PracticeScenario, 'random'>, Word[]> = {
  travel: [
    {
      name: 'すみません、東京駅へ行きたいです。',
      notation: 'すみません、東京(とうきょう)駅(えき)へ行(い)きたいです。',
      trans: ['不好意思，我想去東京車站。'],
    },
    {
      name: 'この電車は東京駅に止まりますか。',
      notation: 'この電車(でんしゃ)は東京(とうきょう)駅(えき)に止(と)まりますか。',
      trans: ['這班電車會停東京車站嗎？'],
    },
    { name: 'はい、次の次の駅です。', notation: 'はい、次(つぎ)の次(つぎ)の駅(えき)です。', trans: ['會，是下下站。'] },
    {
      name: 'ありがとうございます。助かりました。',
      notation: 'ありがとうございます。助(たす)かりました。',
      trans: ['謝謝您，幫了我大忙。'],
    },
    {
      name: '東京駅でホテルの方向をもう一度確認しました。',
      notation: '東京(とうきょう)駅(えき)でホテルの方向(ほうこう)をもう一度(いちど)確認(かくにん)しました。',
      trans: ['我在東京車站再確認了一次飯店的方向。'],
    },
    {
      name: '案内板を見ると、八重洲口から出るようです。',
      notation: '案内板(あんないばん)を見(み)ると、八重洲口(やえすぐち)から出(で)るようです。',
      trans: ['看了指示牌後，似乎要從八重洲口出去。'],
    },
    {
      name: '迷わずに着けて、ほっとしました。',
      notation: '迷(まよ)わずに着(つ)けて、ほっとしました。',
      trans: ['順利抵達後，我鬆了一口氣。'],
    },
    {
      name: 'チェックインの前に、近くの店も少し見て回りました。',
      notation: 'チェックインの前(まえ)に、近(ちか)くの店(みせ)も少(すこ)し見(み)て回(まわ)りました。',
      trans: ['入住前，我也稍微逛了一下附近的店。'],
    },
    {
      name: '明日は早めに出て、浅草へ行く予定です。',
      notation: '明日(あした)は早(はや)めに出(で)て、浅草(あさくさ)へ行(い)く予定(よてい)です。',
      trans: ['明天預計早點出門去淺草。'],
    },
  ],
  izakaya: [
    {
      name: 'こんばんは、二人ですが、席はありますか。',
      notation: 'こんばんは、二人(ふたり)ですが、席(せき)はありますか。',
      trans: ['晚安，兩位，還有座位嗎？'],
    },
    { name: 'はい、こちらの席へどうぞ。', notation: 'はい、こちらの席(せき)へどうぞ。', trans: ['好的，請到這邊的座位。'] },
    {
      name: 'まず、生ビールを二つお願いします。',
      notation: 'まず、生(なま)ビールを二(ふた)つお願(ねが)いします。',
      trans: ['先來兩杯生啤酒，麻煩了。'],
    },
    { name: 'おすすめの料理はありますか。', notation: 'おすすめの料理(りょうり)はありますか。', trans: ['有推薦的料理嗎？'] },
    {
      name: '今日のおすすめは、さばの塩焼きです。',
      notation: '今日(きょう)のおすすめは、さばの塩焼(しおや)きです。',
      trans: ['今天的推薦是鹽烤鯖魚。'],
    },
    {
      name: 'では、それと枝豆をお願いします。',
      notation: 'では、それと枝豆(えだまめ)をお願(ねが)いします。',
      trans: ['那就那個和毛豆，麻煩了。'],
    },
    {
      name: '隣の席の人が、おいしそうですねと話しかけてくれました。',
      notation: '隣(となり)の席(せき)の人(ひと)が、おいしそうですねと話(はな)しかけてくれました。',
      trans: ['隔壁座位的人對我搭話說：「看起來很好吃呢。」'],
    },
    {
      name: '旅行中だと話すと、おすすめの店を教えてくれました。',
      notation: '旅行中(りょこうちゅう)だと話(はな)すと、おすすめの店(みせ)を教(おし)えてくれました。',
      trans: ['我說正在旅行後，他告訴我推薦的店家。'],
    },
    {
      name: '楽しい時間だったので、もう一杯だけ頼みました。',
      notation: '楽(たの)しい時間(じかん)だったので、もう一杯(いっぱい)だけ頼(たの)みました。',
      trans: ['因為時光很愉快，我又多點了一杯。'],
    },
  ],
  'small-talk': [
    {
      name: 'はじめまして、台湾から来ました。',
      notation: 'はじめまして、台湾(たいわん)から来(き)ました。',
      trans: ['初次見面，我從台灣來。'],
    },
    { name: '日本へはよく来るんですか。', notation: '日本(にほん)へはよく来(く)るんですか。', trans: ['你常來日本嗎？'] },
    {
      name: '今回で三回目ですが、まだ行きたい場所がたくさんあります。',
      notation: '今回(こんかい)で三回目(さんかいめ)ですが、まだ行(い)きたい場所(ばしょ)がたくさんあります。',
      trans: ['這次是第三次，但還有很多想去的地方。'],
    },
    { name: 'どんなところが好きですか。', notation: 'どんなところが好(す)きですか。', trans: ['你喜歡什麼樣的地方？'] },
    {
      name: 'にぎやかな街も好きですが、静かな町を歩くのも好きです。',
      notation: 'にぎやかな街(まち)も好(す)きですが、静(しず)かな町(まち)を歩(ある)くのも好(す)きです。',
      trans: ['我喜歡熱鬧的街道，也喜歡走在安靜的小鎮。'],
    },
    {
      name: 'それなら、朝早くの鎌倉がおすすめですよ。',
      notation: 'それなら、朝(あさ)早(はや)くの鎌倉(かまくら)がおすすめですよ。',
      trans: ['那樣的話，我推薦清晨的鎌倉。'],
    },
    {
      name: 'ありがとうございます。明日の予定に入れてみます。',
      notation: 'ありがとうございます。明日(あした)の予定(よてい)に入(い)れてみます。',
      trans: ['謝謝，我會試著排進明天的行程。'],
    },
    {
      name: '普段はどんな仕事をしているんですか。',
      notation: '普段(ふだん)はどんな仕事(しごと)をしているんですか。',
      trans: ['你平常從事什麼工作呢？'],
    },
    {
      name: 'デザインの仕事です。休みの日は写真を撮っています。',
      notation: 'デザインの仕事(しごと)です。休(やす)みの日(ひ)は写真(しゃしん)を撮(と)っています。',
      trans: ['我是做設計工作的。休假時會拍照。'],
    },
    {
      name: '話していたら、あっという間に時間が過ぎましたね。',
      notation: '話(はな)していたら、あっという間(ま)に時間(じかん)が過(す)ぎましたね。',
      trans: ['聊著聊著，時間一下子就過去了呢。'],
    },
  ],
}

export const isPracticeGenerationRequest = (value: unknown): value is PracticeGenerationRequest => {
  if (!value || typeof value !== 'object') return false
  const request = value as Partial<PracticeGenerationRequest>
  return (
    JLPT_LEVELS.includes(request.jlptLevel as JLPTLevel) &&
    PRACTICE_SCENARIOS.includes(request.scenario as PracticeScenario) &&
    PRACTICE_LENGTHS.includes(request.length as PracticeLength) &&
    (request.topic === undefined || typeof request.topic === 'string')
  )
}

export type GeneratedDocumentValidation = { valid: boolean; errors: string[] }

export const validateGeneratedPracticeDocument = (document: unknown, _length?: PracticeLength): GeneratedDocumentValidation => {
  const errors: string[] = []
  const candidate = document as Partial<PracticeDocument>
  if (!candidate || typeof candidate !== 'object') return { valid: false, errors: ['文章資料格式錯誤。'] }
  if (typeof candidate.id !== 'string' || !/^generated-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate.id)) errors.push('文章 id 不合法。')
  if (typeof candidate.title !== 'string' || !candidate.title.trim()) errors.push('文章標題不可空白。')
  if (candidate.source !== 'generated') errors.push('文章來源必須為 generated。')
  if (candidate.language !== 'ja') errors.push('文章語言必須為日文。')
  if (!JLPT_LEVELS.includes(candidate.jlptLevel as JLPTLevel)) errors.push('JLPT 程度不合法。')
  const [minimum, maximum] = ARTICLE_SENTENCE_RANGE
  if (!Array.isArray(candidate.sentences) || candidate.sentences.length < minimum || candidate.sentences.length > maximum) {
    errors.push('文章需包含 3 到 30 句。')
  }
  candidate.sentences?.forEach((sentence, index) => {
    if (!sentence.name?.trim()) errors.push(`第 ${index + 1} 句缺少原文。`)
    if (!sentence.notation?.trim()) errors.push(`第 ${index + 1} 句缺少讀音標記。`)
    if (sentence.notation && sentence.name && stripNotation(sentence.notation) !== sentence.name)
      errors.push(`第 ${index + 1} 句讀音標記與原文不一致。`)
    if (/\p{Script=Han}/u.test(sentence.name ?? '') && !/\p{Script=Han}+\([^()]+\)/u.test(sentence.notation ?? '')) {
      errors.push(`第 ${index + 1} 句含漢字但缺少讀音。`)
    }
    if (!Array.isArray(sentence.trans) || !sentence.trans.some((translation) => /[\u3400-\u9fff]/.test(translation?.trim()))) {
      errors.push(`第 ${index + 1} 句缺少繁體中文翻譯。`)
    }
  })
  return { valid: errors.length === 0, errors }
}

const pickScenario = (scenario: PracticeScenario): Exclude<PracticeScenario, 'random'> => {
  if (scenario !== 'random') return scenario
  return (['travel', 'izakaya', 'small-talk'] as const)[Math.floor(Math.random() * 3)]
}

const sentenceCountFor = (length: PracticeLength): number => ({ short: 4, medium: 7, long: 9 }[length])

export const generateMockPracticeDocument = (request: PracticeGenerationRequest): PracticeDocument => {
  if (!isPracticeGenerationRequest(request)) throw new Error('生成設定不合法。')
  const scenario = pickScenario(request.scenario)
  const titleTopic =
    request.topic?.trim() || (scenario === 'travel' ? '在車站問路' : scenario === 'izakaya' ? '晚餐時的交流' : '旅行中的相遇')
  const id = `generated-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  return {
    id,
    title: `${request.jlptLevel}｜${scenarioLabels[scenario]}｜${titleTopic}`,
    source: 'generated',
    language: 'ja',
    jlptLevel: request.jlptLevel,
    scenario: scenarioLabels[scenario],
    sentences: fixtureSentences[scenario].slice(0, sentenceCountFor(request.length)),
  }
}

export class MockPracticeGenerator implements PracticeGenerator {
  async generate(request: PracticeGenerationRequest): Promise<PracticeDocument> {
    return generateMockPracticeDocument(request)
  }
}

export const mockPracticeGenerator = new MockPracticeGenerator()
