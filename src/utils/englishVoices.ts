export const isEnglishVoice = (voice: SpeechSynthesisVoice) => voice.lang.toLocaleLowerCase().startsWith('en-')

export const getEnglishVoices = (voices: SpeechSynthesisVoice[]) =>
  voices.filter(isEnglishVoice).sort((left, right) => {
    const languageScore = (voice: SpeechSynthesisVoice) => {
      const language = voice.lang.toLocaleLowerCase()
      if (language === 'en-us') return 0
      if (language === 'en-gb') return 1
      return 2
    }
    return languageScore(left) - languageScore(right) || Number(!left.localService) - Number(!right.localService) || left.name.localeCompare(right.name)
  })

export const resolveEnglishVoice = (voices: SpeechSynthesisVoice[], voiceURI?: string) => {
  const englishVoices = getEnglishVoices(voices)
  return englishVoices.find((voice) => voice.voiceURI === voiceURI) ?? englishVoices[0]
}
