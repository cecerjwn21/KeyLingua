import PracticeSettings from '../PracticeSettings'
import SoundSwitcher from '../SoundSwitcher'
import StartButton from '../StartButton'
import LibraryBackButton from '@/components/LibraryBackButton'
import ProductIcon from '@/components/ProductIcon'
import Tooltip from '@/components/Tooltip'
import { useUiTranslation } from '@/i18n/useUiTranslation'
import {
  articleSpeechConfigAtom,
  currentTypingPracticeAtom,
  englishSpeechConfigAtom,
  isOpenDarkModeAtom,
  phoneticConfigAtom,
  wordDictationConfigAtom,
} from '@/store'
import { getEnglishVoices, resolveEnglishVoice } from '@/utils/englishVoices'
import { getJapaneseVoices, resolveJapaneseVoice } from '@/utils/japaneseVoices'
import { formatSpeechVoiceLabel } from '@/utils/speechVoiceLabel'
import { useAtom, useAtomValue } from 'jotai'
import { Eye, EyeOff, Moon, Sun, Volume2, VolumeX } from 'lucide'
import { useEffect, useMemo, useState } from 'react'

export default function ArticleHeader({ isLoading }: { isLoading: boolean }) {
  const currentPractice = useAtomValue(currentTypingPracticeAtom)
  const { t } = useUiTranslation()
  const dictation = useAtomValue(wordDictationConfigAtom)
  const [phoneticConfig, setPhoneticConfig] = useAtom(phoneticConfigAtom)
  const [articleSpeechConfig, setArticleSpeechConfig] = useAtom(articleSpeechConfigAtom)
  const [englishSpeechConfig, setEnglishSpeechConfig] = useAtom(englishSpeechConfigAtom)
  const [isOpenDarkMode, setIsOpenDarkMode] = useAtom(isOpenDarkModeAtom)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const japaneseVoices = useMemo(() => getJapaneseVoices(voices), [voices])
  const englishVoices = useMemo(() => getEnglishVoices(voices), [voices])

  useEffect(() => {
    const synth = window.speechSynthesis
    if (!synth) return

    const refreshVoices = () => setVoices(synth.getVoices())
    refreshVoices()
    synth.addEventListener?.('voiceschanged', refreshVoices)
    return () => synth.removeEventListener?.('voiceschanged', refreshVoices)
  }, [])

  if (!currentPractice) return null

  const isEnglish = currentPractice.language === 'english'
  const speechConfig = isEnglish ? englishSpeechConfig : articleSpeechConfig
  const availableVoices = isEnglish ? englishVoices : japaneseVoices
  const selectedVoice = isEnglish ? resolveEnglishVoice(voices, speechConfig.voiceURI) : resolveJapaneseVoice(voices, speechConfig.voiceURI)
  const title =
    currentPractice.kind === 'article' || currentPractice.kind === 'dialogue' ? currentPractice.document.title : currentPractice.set.title
  const level =
    currentPractice.kind === 'article'
      ? currentPractice.document.jlptLevel
      : currentPractice.kind === 'dialogue'
      ? currentPractice.document.level
      : currentPractice.language === 'english'
      ? currentPractice.set.level
      : currentPractice.set.jlptLevel
  const scenario = currentPractice.kind === 'article' ? currentPractice.document.scenario : undefined
  const isVocabulary = currentPractice.kind === 'vocabulary'
  const returnPath = isEnglish ? (isVocabulary ? '/en/vocabulary' : '/en/dialogues') : isVocabulary ? '/ja/vocabulary' : '/ja/articles'
  const returnLabel = isEnglish
    ? isVocabulary
      ? t('library.backEnglishVocabulary')
      : t('library.backEnglishDialogue')
    : isVocabulary
    ? t('library.backVocabulary')
    : t('library.backArticle')
  const autoReadLabel = t(isVocabulary ? 'typing.autoReadWord' : 'typing.autoReadSentence')
  const updateSpeechConfig = (update: (current: typeof speechConfig) => typeof speechConfig) => {
    if (isEnglish) setEnglishSpeechConfig(update)
    else setArticleSpeechConfig(update)
  }

  return (
    <header className="container z-20 mx-auto w-full px-3 py-3 sm:px-5 md:px-8 md:py-4">
      <nav
        className="my-card flex w-full min-w-0 flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 sm:p-4 xl:flex-row xl:items-center"
        aria-label={t(isVocabulary ? 'typing.vocabularyControls' : isEnglish ? 'typing.dialogueControls' : 'typing.articleControls')}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-3 xl:flex-1">
          <LibraryBackButton label={returnLabel} to={returnPath} />
          <div className="min-w-0 flex-1 border-l border-slate-200 pl-3 dark:border-slate-700">
            <p
              data-testid="practice-header-title"
              className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base"
            >
              <span data-testid={!isVocabulary ? 'article-header-title' : undefined}>{title}</span>
            </p>
            <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              {level && (
                <span data-testid={!isVocabulary && !isEnglish ? 'article-header-jlpt' : undefined}>
                  {isEnglish ? 'CEFR' : 'JLPT'}：{level}
                </span>
              )}
              {scenario && <span data-testid="article-header-scenario">{t('result.scenario', { scenario })}</span>}
              {dictation.isOpen && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                  <ProductIcon icon={EyeOff} size={13} />
                  {t('typing.dictationActive')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          data-testid="practice-header-controls"
          className="flex min-w-0 shrink-0 flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700 xl:flex-nowrap xl:border-l xl:border-t-0 xl:pl-3 xl:pt-0"
        >
          <Tooltip content={autoReadLabel} className="shrink-0">
            <button
              type="button"
              className={`app-icon-button ${speechConfig.autoReadSentence ? 'app-icon-button-active' : ''}`}
              aria-label={autoReadLabel}
              aria-pressed={speechConfig.autoReadSentence}
              onClick={() => updateSpeechConfig((current) => ({ ...current, autoReadSentence: !current.autoReadSentence }))}
            >
              <ProductIcon icon={speechConfig.autoReadSentence ? Volume2 : VolumeX} size={19} />
            </button>
          </Tooltip>

          <label className="sm:max-w-64 flex min-w-0 flex-1 basis-44 items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="sr-only">{t(isEnglish ? 'typing.englishVoice' : 'typing.japaneseVoice')}</span>
            <ProductIcon icon={Volume2} size={17} className="shrink-0 text-slate-400" />
            <select
              aria-label={t(isEnglish ? 'typing.englishVoice' : 'typing.japaneseVoice')}
              className="app-select min-w-0 flex-1 truncate"
              disabled={availableVoices.length === 0}
              value={selectedVoice?.voiceURI ?? ''}
              onChange={(event) => updateSpeechConfig((current) => ({ ...current, voiceURI: event.target.value }))}
            >
              {availableVoices.length === 0 ? (
                <option value="">{t('typing.browserDefault')}</option>
              ) : (
                availableVoices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {formatSpeechVoiceLabel(voice)}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="shrink-0">
            <span className="sr-only">{t(isEnglish ? 'typing.englishRate' : 'typing.japaneseRate')}</span>
            <select
              aria-label={t(isEnglish ? 'typing.englishRate' : 'typing.japaneseRate')}
              className="app-select w-[4.75rem]"
              value={String(speechConfig.rate)}
              onChange={(event) => updateSpeechConfig((current) => ({ ...current, rate: Number(event.target.value) }))}
            >
              <option value="0.9">0.9x</option>
              <option value="1">1.0x</option>
              <option value="1.1">1.1x</option>
            </select>
          </label>

          {!isEnglish && (
            <Tooltip content={t('typing.showReading')} className="shrink-0">
              <button
                type="button"
                title={t('typing.showReading')}
                className={`app-icon-button ${phoneticConfig.isOpen ? 'app-icon-button-active' : ''}`}
                aria-label={t('typing.showReading')}
                aria-pressed={phoneticConfig.isOpen}
                onClick={() => setPhoneticConfig((current) => ({ ...current, isOpen: !current.isOpen }))}
              >
                <ProductIcon icon={phoneticConfig.isOpen ? Eye : EyeOff} size={19} />
              </button>
            </Tooltip>
          )}

          <Tooltip content={t('typing.sound')} className="shrink-0">
            <SoundSwitcher ariaLabel={t('typing.sound')} />
          </Tooltip>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <StartButton isLoading={isLoading} articleMode />
            <Tooltip content={t(isOpenDarkMode ? 'theme.toLight' : 'theme.toDark')} className="shrink-0">
              <button
                className="app-icon-button"
                type="button"
                title={t(isOpenDarkMode ? 'theme.toLight' : 'theme.toDark')}
                aria-label={t(isOpenDarkMode ? 'theme.toLight' : 'theme.toDark')}
                onClick={() => setIsOpenDarkMode((current) => !current)}
              >
                <ProductIcon icon={isOpenDarkMode ? Sun : Moon} size={19} />
              </button>
            </Tooltip>
            <PracticeSettings language={currentPractice.language} isVocabulary={isVocabulary} voices={voices} />
          </div>
        </div>
      </nav>
    </header>
  )
}
