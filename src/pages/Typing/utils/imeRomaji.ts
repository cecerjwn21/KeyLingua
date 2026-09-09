const singleKanaRomaji: Record<string, string> = {
  あ: 'a',
  い: 'i',
  う: 'u',
  え: 'e',
  お: 'o',
  か: 'ka',
  き: 'ki',
  く: 'ku',
  け: 'ke',
  こ: 'ko',
  さ: 'sa',
  し: 'shi',
  す: 'su',
  せ: 'se',
  そ: 'so',
  た: 'ta',
  ち: 'chi',
  つ: 'tsu',
  て: 'te',
  と: 'to',
  な: 'na',
  に: 'ni',
  ぬ: 'nu',
  ね: 'ne',
  の: 'no',
  は: 'ha',
  ひ: 'hi',
  ふ: 'fu',
  へ: 'he',
  ほ: 'ho',
  ま: 'ma',
  み: 'mi',
  む: 'mu',
  め: 'me',
  も: 'mo',
  や: 'ya',
  ゆ: 'yu',
  よ: 'yo',
  ら: 'ra',
  り: 'ri',
  る: 'ru',
  れ: 're',
  ろ: 'ro',
  わ: 'wa',
  を: 'wo',
  ん: 'n',
  が: 'ga',
  ぎ: 'gi',
  ぐ: 'gu',
  げ: 'ge',
  ご: 'go',
  ざ: 'za',
  じ: 'ji',
  ず: 'zu',
  ぜ: 'ze',
  ぞ: 'zo',
  だ: 'da',
  ぢ: 'ji',
  づ: 'zu',
  で: 'de',
  ど: 'do',
  ば: 'ba',
  び: 'bi',
  ぶ: 'bu',
  べ: 'be',
  ぼ: 'bo',
  ぱ: 'pa',
  ぴ: 'pi',
  ぷ: 'pu',
  ぺ: 'pe',
  ぽ: 'po',
  ゔ: 'vu',
  ぁ: 'xa',
  ぃ: 'xi',
  ぅ: 'xu',
  ぇ: 'xe',
  ぉ: 'xo',
  ゃ: 'xya',
  ゅ: 'xyu',
  ょ: 'xyo',
  ゎ: 'xwa',
  ゕ: 'xka',
  ゖ: 'xke',
  ー: '-',
}

const combinedKanaRomaji: Record<string, string> = {
  きゃ: 'kya',
  きゅ: 'kyu',
  きょ: 'kyo',
  しゃ: 'sha',
  しゅ: 'shu',
  しょ: 'sho',
  しぇ: 'she',
  ちゃ: 'cha',
  ちゅ: 'chu',
  ちょ: 'cho',
  ちぇ: 'che',
  にゃ: 'nya',
  にゅ: 'nyu',
  にょ: 'nyo',
  ひゃ: 'hya',
  ひゅ: 'hyu',
  ひょ: 'hyo',
  みゃ: 'mya',
  みゅ: 'myu',
  みょ: 'myo',
  りゃ: 'rya',
  りゅ: 'ryu',
  りょ: 'ryo',
  ぎゃ: 'gya',
  ぎゅ: 'gyu',
  ぎょ: 'gyo',
  じゃ: 'ja',
  じゅ: 'ju',
  じょ: 'jo',
  じぇ: 'je',
  びゃ: 'bya',
  びゅ: 'byu',
  びょ: 'byo',
  ぴゃ: 'pya',
  ぴゅ: 'pyu',
  ぴょ: 'pyo',
  てぃ: 'thi',
  でぃ: 'dhi',
  ふぁ: 'fa',
  ふぃ: 'fi',
  ふぇ: 'fe',
  ふぉ: 'fo',
  うぃ: 'wi',
  うぇ: 'we',
  うぉ: 'who',
  ゔぁ: 'va',
  ゔぃ: 'vi',
  ゔぇ: 've',
  ゔぉ: 'vo',
}

const normalizeKatakana = (text: string) =>
  Array.from(text, (character) => {
    const codePoint = character.codePointAt(0)
    if (codePoint !== undefined && codePoint >= 0x30a1 && codePoint <= 0x30f6) {
      return String.fromCodePoint(codePoint - 0x60)
    }
    return character
  }).join('')

const getUnitRomaji = (unit: string) => combinedKanaRomaji[unit] ?? singleKanaRomaji[unit] ?? unit

export const splitKanaIntoImeUnits = (kana: string): string[] => {
  const normalized = normalizeKatakana(kana)
  const units: string[] = []

  for (let index = 0; index < normalized.length; ) {
    const pair = normalized.slice(index, index + 2)
    if (combinedKanaRomaji[pair]) {
      units.push(pair)
      index += 2
    } else {
      units.push(normalized[index])
      index += 1
    }
  }

  return units
}

export const kanaToImeRomaji = (kana: string): string => {
  const units = splitKanaIntoImeUnits(kana)

  return units
    .map((unit, index) => {
      if (unit !== 'っ') return getUnitRomaji(unit)

      const nextRomaji = units[index + 1] ? getUnitRomaji(units[index + 1]) : ''
      const nextConsonant = nextRomaji.match(/^[bcdfghjklmpqrstvwxyz]/)?.[0]
      return nextConsonant ?? 'xtsu'
    })
    .join('')
}

export const getSpecialKanaHint = (kana: string, context = ''): string[] | null => {
  const normalized = normalizeKatakana(kana)
  if (normalized === 'っ') {
    return ['促音', '下一個子音打兩次', context ? `${context} → ${kanaToImeRomaji(context)}` : 'きって → kitte', '單獨輸入：xtsu / ltsu']
  }
  if (normalized === 'ん') return ['n', '有歧義時可輸入 nn']
  if (normalized === 'ー') return ['長音符號', '-']

  const smallKanaName: Record<string, string> = {
    ぁ: 'あ',
    ぃ: 'い',
    ぅ: 'う',
    ぇ: 'え',
    ぉ: 'お',
    ゃ: 'や',
    ゅ: 'ゆ',
    ょ: 'よ',
    ゎ: 'わ',
  }
  const fullSizeKana = smallKanaName[normalized]
  if (fullSizeKana) return [`小寫「${fullSizeKana}」`, `${kanaToImeRomaji(normalized)} / l${kanaToImeRomaji(fullSizeKana)}`]

  return null
}
