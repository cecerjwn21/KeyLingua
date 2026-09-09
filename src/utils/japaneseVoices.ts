export const isJapaneseVoice = (voice: SpeechSynthesisVoice) => {
  const language = voice.lang.toLocaleLowerCase()
  return language === 'ja' || language === 'ja-jp'
}

export const getJapaneseVoices = (voices: SpeechSynthesisVoice[]) =>
  voices.filter(isJapaneseVoice).sort((left, right) => {
    const leftScore = Number(left.lang.toLocaleLowerCase() !== 'ja-jp') + Number(!left.localService)
    const rightScore = Number(right.lang.toLocaleLowerCase() !== 'ja-jp') + Number(!right.localService)
    return leftScore - rightScore || left.name.localeCompare(right.name)
  })

export const resolveJapaneseVoice = (voices: SpeechSynthesisVoice[], voiceURI?: string) => {
  const japaneseVoices = getJapaneseVoices(voices)
  return japaneseVoices.find((voice) => voice.voiceURI === voiceURI) ?? japaneseVoices[0]
}
