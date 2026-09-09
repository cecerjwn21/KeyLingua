import type { PracticeDocument } from '@/typings'

export const JAPANESE_PRACTICE_DOCUMENT_ID = 'fixture-japanese-001'

export const japanesePracticeDocument: PracticeDocument = {
  id: JAPANESE_PRACTICE_DOCUMENT_ID,
  title: '日文測試文章',
  source: 'fixture',
  language: 'ja',
  sentences: [
    {
      name: '昨日、友達と映画を見に行きました。',
      notation: '昨日(きのう)、友達(ともだち)と映画(えいが)を見(み)に行(い)きました。',
      trans: ['昨天和朋友一起去看電影了。'],
    },
    {
      name: '映画を見たあと、一緒に晩ご飯を食べました。',
      notation: '映画(えいが)を見(み)たあと、一緒(いっしょ)に晩(ばん)ご飯(はん)を食(た)べました。',
      trans: ['看完電影後，一起吃了晚餐。'],
    },
    {
      name: '今日は家で日本語を勉強します。',
      notation: '今日(きょう)は家(いえ)で日本語(にほんご)を勉強(べんきょう)します。',
      trans: ['今天會在家學日文。'],
    },
  ],
}

export const scenarioPracticeDocuments: PracticeDocument[] = [
  {
    id: 'japanese-travel-n4',
    title: '第一次到日本旅行',
    source: 'fixture',
    language: 'ja',
    jlptLevel: 'N4',
    scenario: '日本旅遊',
    sentences: [
      {
        name: '日本旅行の初日、駅でホテルへの出口が分からなくなりました。',
        notation: '日本(にほん)旅行(りょこう)の初日(しょにち)、駅(えき)でホテルへの出口(でぐち)が分(わ)からなくなりました。',
        trans: ['日本旅行的第一天，我在車站找不到前往飯店的出口。'],
      },
      {
        name: '駅員さんに「このホテルへはどう行けばいいですか」と聞きました。',
        notation: '駅員(えきいん)さんに「このホテルへはどう行(い)けばいいですか」と聞(き)きました。',
        trans: ['我問站務人員：「要怎麼去這間飯店呢？」'],
      },
      {
        name: '駅員さんは地図を見ながら、乗る電車を教えてくれました。',
        notation: '駅員(えきいん)さんは地図(ちず)を見(み)ながら、乗(の)る電車(でんしゃ)を教(おし)えてくれました。',
        trans: ['站務人員一邊看地圖，一邊告訴我該搭哪班電車。'],
      },
      {
        name: '「次の駅で降りて、二番出口から出てください」と言われました。',
        notation: '「次(つぎ)の駅(えき)で降(お)りて、二番(にばん)出口(でぐち)から出(で)てください」と言(い)われました。',
        trans: ['他告訴我：「請在下一站下車，從二號出口出去。」'],
      },
      {
        name: 'ホテルに着いてから、受付で予約した名前を伝えました。',
        notation: 'ホテルに着(つ)いてから、受付(うけつけ)で予約(よやく)した名前(なまえ)を伝(つた)えました。',
        trans: ['到飯店後，我在櫃檯告知預約的名字。'],
      },
      {
        name: '部屋の鍵を受け取って、やっと少し安心しました。',
        notation: '部屋(へや)の鍵(かぎ)を受(う)け取(と)って、やっと少(すこ)し安心(あんしん)しました。',
        trans: ['拿到房間鑰匙後，我終於稍微放心了。'],
      },
    ],
  },
  {
    id: 'izakaya-n4',
    title: '居酒屋的晚餐',
    source: 'fixture',
    language: 'ja',
    jlptLevel: 'N4',
    scenario: '居酒屋',
    sentences: [
      {
        name: 'こんばんは、七時に予約しているチョンです。',
        notation: 'こんばんは、七時(しちじ)に予約(よやく)しているチョンです。',
        trans: ['晚安，我是晚上七點有預約的鍾。'],
      },
      {
        name: '二人ですが、席はありますか。',
        notation: '二人(ふたり)ですが、席(せき)はありますか。',
        trans: ['我們兩位，還有位子嗎？'],
      },
      {
        name: 'とりあえず、生ビールを二つお願いします。',
        notation: 'とりあえず、生(なま)ビールを二(ふた)つお願(ねが)いします。',
        trans: ['先來兩杯生啤酒。'],
      },
      {
        name: 'おすすめの料理はありますか。',
        notation: 'おすすめの料理(りょうり)はありますか。',
        trans: ['有推薦的料理嗎？'],
      },
      {
        name: 'この焼き鳥と、枝豆をお願いします。',
        notation: 'この焼(や)き鳥(とり)と、枝豆(えだまめ)をお願(ねが)いします。',
        trans: ['這份烤雞肉串和毛豆，麻煩了。'],
      },
      {
        name: 'すみません、もう一杯ビールをください。',
        notation: 'すみません、もう一杯(いっぱい)ビールをください。',
        trans: ['不好意思，請再給我一杯啤酒。'],
      },
      {
        name: 'お会計をお願いします。',
        notation: 'お会計(かいけい)をお願(ねが)いします。',
        trans: ['麻煩幫我結帳。'],
      },
    ],
  },
  {
    id: 'small-talk-n4',
    title: '旅途中和陌生人閒聊',
    source: 'fixture',
    language: 'ja',
    jlptLevel: 'N4',
    scenario: '陌生人閒聊',
    sentences: [
      {
        name: 'はじめまして、私は台湾から来ました。',
        notation: 'はじめまして、私(わたし)は台湾(たいわん)から来(き)ました。',
        trans: ['初次見面，我從台灣來。'],
      },
      {
        name: '日本へは何度来ましたか。',
        notation: '日本(にほん)へは何度(なんど)来(き)ましたか。',
        trans: ['你來日本幾次了？'],
      },
      {
        name: '今回が二回目です。',
        notation: '今回(こんかい)が二回目(にかいめ)です。',
        trans: ['這次是第二次。'],
      },
      {
        name: '旅行が好きで、いろいろな町を見てみたいです。',
        notation: '旅行(りょこう)が好(す)きで、いろいろな町(まち)を見(み)てみたいです。',
        trans: ['我喜歡旅行，想看看各式各樣的城鎮。'],
      },
      {
        name: '普段はどんな仕事をしていますか。',
        notation: '普段(ふだん)はどんな仕事(しごと)をしていますか。',
        trans: ['你平常從事什麼工作呢？'],
      },
      {
        name: '休日は音楽を聞いたり、カフェに行ったりします。',
        notation: '休日(きゅうじつ)は音楽(おんがく)を聞(き)いたり、カフェに行(い)ったりします。',
        trans: ['休假時我會聽音樂，或去咖啡廳。'],
      },
      {
        name: 'この近くでおすすめの場所はありますか。',
        notation: 'この近(ちか)くでおすすめの場所(ばしょ)はありますか。',
        trans: ['這附近有推薦的地方嗎？'],
      },
      {
        name: '今日は話せてよかったです。',
        notation: '今日(きょう)は話(はな)せてよかったです。',
        trans: ['今天能和你聊天真好。'],
      },
    ],
  },
]

export const practiceDocumentMap: Record<string, PracticeDocument> = {
  [japanesePracticeDocument.id]: japanesePracticeDocument,
  ...Object.fromEntries(scenarioPracticeDocuments.map((document) => [document.id, document])),
}
