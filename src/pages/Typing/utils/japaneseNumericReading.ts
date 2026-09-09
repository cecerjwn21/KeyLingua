const numberReadings: Record<string, string> = {
  '1': 'いち',
  '2': 'に',
  '3': 'さん',
  '4': 'よん',
  '5': 'ご',
  '6': 'ろく',
  '7': 'なな',
  '8': 'はち',
  '9': 'きゅう',
  '10': 'じゅう',
  '11': 'じゅういち',
  '12': 'じゅうに',
  '13': 'じゅうさん',
  '14': 'じゅうよん',
  '15': 'じゅうご',
  '16': 'じゅうろく',
  '17': 'じゅうなな',
  '18': 'じゅうはち',
  '19': 'じゅうきゅう',
  '20': 'にじゅう',
  '21': 'にじゅういち',
  '22': 'にじゅうに',
  '23': 'にじゅうさん',
  '24': 'にじゅうよん',
  '25': 'にじゅうご',
  '26': 'にじゅうろく',
  '27': 'にじゅうなな',
  '28': 'にじゅうはち',
  '29': 'にじゅうきゅう',
  '30': 'さんじゅう',
  '31': 'さんじゅういち',
}

const numericCounterReadings: Record<string, Record<string, string>> = {
  時: {
    '1': 'いちじ',
    '2': 'にじ',
    '3': 'さんじ',
    '4': 'よじ',
    '5': 'ごじ',
    '6': 'ろくじ',
    '7': 'しちじ',
    '8': 'はちじ',
    '9': 'くじ',
    '10': 'じゅうじ',
  },
  分: {
    '1': 'いっぷん',
    '2': 'にふん',
    '3': 'さんぷん',
    '4': 'よんぷん',
    '5': 'ごふん',
    '6': 'ろっぷん',
    '7': 'ななふん',
    '8': 'はっぷん',
    '9': 'きゅうふん',
    '10': 'じゅっぷん',
  },
  月: {
    '1': 'いちがつ',
    '2': 'にがつ',
    '3': 'さんがつ',
    '4': 'しがつ',
    '5': 'ごがつ',
    '6': 'ろくがつ',
    '7': 'しちがつ',
    '8': 'はちがつ',
    '9': 'くがつ',
    '10': 'じゅうがつ',
    '11': 'じゅういちがつ',
    '12': 'じゅうにがつ',
  },
  年: {
    '1': 'いちねん',
    '2': 'にねん',
    '3': 'さんねん',
    '4': 'よねん',
    '5': 'ごねん',
    '6': 'ろくねん',
    '7': 'ななねん',
    '8': 'はちねん',
    '9': 'きゅうねん',
    '10': 'じゅうねん',
  },
  日: {
    '1': 'ついたち',
    '2': 'ふつか',
    '3': 'みっか',
    '4': 'よっか',
    '5': 'いつか',
    '6': 'むいか',
    '7': 'なのか',
    '8': 'ようか',
    '9': 'ここのか',
    '10': 'とおか',
    '14': 'じゅうよっか',
    '20': 'はつか',
    '24': 'にじゅうよっか',
  },
  人: {
    '1': 'ひとり',
    '2': 'ふたり',
    '3': 'さんにん',
    '4': 'よにん',
    '5': 'ごにん',
    '6': 'ろくにん',
    '7': 'ななにん',
    '8': 'はちにん',
    '9': 'きゅうにん',
    '10': 'じゅうにん',
  },
  個: {
    '1': 'いっこ',
    '2': 'にこ',
    '3': 'さんこ',
    '4': 'よんこ',
    '5': 'ごこ',
    '6': 'ろっこ',
    '7': 'ななこ',
    '8': 'はっこ',
    '9': 'きゅうこ',
    '10': 'じゅっこ',
  },
}

const numericCounterSuffixes: Record<string, string[]> = {
  時: ['じ'],
  分: ['ふん', 'ぷん'],
  月: ['がつ'],
  日: ['にち'],
  年: ['ねん'],
  人: ['にん'],
  個: ['こ'],
}

export const isJapaneseNumericCounter = (value: string): value is keyof typeof numericCounterReadings => value in numericCounterReadings

export const isJapaneseNumericCounterSuffix = (counter: string, reading: string): boolean =>
  isJapaneseNumericCounter(counter) && numericCounterSuffixes[counter].includes(reading)

export const normalizeJapaneseNumericCounters = (text: string): string =>
  text.replace(/([0-9]+)([時分月日年人個])/gu, (match, digits: string, counter: string) => {
    const reading = isJapaneseNumericCounter(counter) ? numericCounterReadings[counter][digits] : undefined
    if (reading) return reading

    if (counter === '日' && numberReadings[digits]) return `${numberReadings[digits]}にち`
    return match
  })
