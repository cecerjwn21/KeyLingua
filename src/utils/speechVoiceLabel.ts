const englishLanguageLabels: Record<string, string> = {
  'en-us': '美式英語',
  'en-gb': '英式英語',
  'en-au': '澳洲英語',
  'en-ca': '加拿大英語',
  'en-hk': '香港英語',
  'en-sg': '新加坡英語',
}

const getLanguageLabel = (lang: string) => {
  const normalized = lang.toLocaleLowerCase().replace('_', '-')
  if (englishLanguageLabels[normalized]) return englishLanguageLabels[normalized]
  if (normalized === 'ja' || normalized === 'ja-jp') return '日語'
  if (normalized.startsWith('en-') || normalized === 'en') return '英語'
  return lang
}

const getDisplayName = (name: string) => {
  const cleaned = name
    .replace(/^Microsoft\s+/i, '')
    .replace(/\s+-\s+(?:English|Japanese)\s*\([^)]*\)\s*$/i, '')
    .replace(/\s+Online\b/gi, '')
    .replace(/\s*\(Natural\)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || name
}

export const formatSpeechVoiceLabel = (voice: SpeechSynthesisVoice) => {
  const parts = [getDisplayName(voice.name), getLanguageLabel(voice.lang)]
  if (/\bnatural\b/i.test(voice.name)) parts.push('自然語音')
  parts.push(voice.localService ? '本機' : '雲端')
  return parts.join('｜')
}
