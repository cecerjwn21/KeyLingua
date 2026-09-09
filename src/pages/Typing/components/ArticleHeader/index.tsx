import PracticeSettings from '../PracticeSettings'
import SoundSwitcher from '../SoundSwitcher'
import StartButton from '../StartButton'
import LibraryBackButton from '@/components/LibraryBackButton'
import ProductIcon from '@/components/ProductIcon'
import Tooltip from '@/components/Tooltip'
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
import { Eye, EyeOff, Moon, Sun, Volume2, VolumeX } from 'lucide'
import { useAtom, useAtomValue } from 'jotai'
import { useEffect, useMemo, useState } from 'react'

export default function ArticleHeader({ isLoading }: { isLoading: boolean }) {
  const currentPractice = useAtomValue(currentTypingPracticeAtom)
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
  const selectedVoice = isEnglish
    ? resolveEnglishVoice(voices, speechConfig.voiceURI)
    : resolveJapaneseVoice(voices, speechConfig.voiceURI)
  const title =
    currentPractice.kind === 'article' || currentPractice.kind === 'dialogue'
      ? currentPractice.document.title
      : currentPractice.set.title
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
  const returnPath = isEnglish
    ? isVocabulary
      ? '/en/vocabulary'
      : '/en/dialogues'
    : isVocabulary
    ? '/ja/vocabulary'
    : '/ja/articles'
  const returnLabel = isEnglish
    ? isVocabulary
      ? '返回英文單字庫'
      : '返回英文對話庫'
    : isVocabulary
    ? '返回單字庫'
    : '返回文章庫'
  const autoReadLabel = isVocabulary ? '新詞自動朗讀' : '新句自動朗讀'
  const updateSpeechConfig = (update: (current: typeof speechConfig) => typeof speechConfig) => {
    if (isEnglish) setEnglishSpeechConfig(update)
    else setArticleSpeechConfig(update)
  }

  return (
    <header className="container z-20 mx-auto w-full px-3 py-3 sm:px-5 md:px-8 md:py-4">
      <nav
        className="my-card flex w-full min-w-0 flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 sm:p-4 xl:flex-row xl:items-center"
        aria-label={isVocabulary ? '單字練習控制' : isEnglish ? '對話練習控制' : '文章練習控制'}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-3 xl:flex-1">
          <LibraryBackButton label={returnLabel} to={returnPath} />
          <div className="min-w-0 flex-1 border-l border-slate-200 pl-3 dark:border-slate-700">
            <p data-testid="practice-header-title" className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base">
              <span data-testid={!isVocabulary ? 'article-header-title' : undefined}>{title}</span>
            </p>
            <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              {level && (
                <span data-testid={!isVocabulary && !isEnglish ? 'article-header-jlpt' : undefined}>
                  {isEnglish ? 'CEFR' : 'JLPT'}：{level}
                </span>
              )}
              {scenario && <span data-testid="article-header-scenario">情境：{scenario}</span>}
              {dictation.isOpen && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                  <ProductIcon icon={EyeOff} size={13} />
                  默寫中
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
              onClick={() =>
                updateSpeechConfig((current) => ({ ...current, autoReadSentence: !current.autoReadSentence }))
              }
            >
              <ProductIcon icon={speechConfig.autoReadSentence ? Volume2 : VolumeX} size={19} />
            </button>
          </Tooltip>

          <label className="flex min-w-0 flex-1 basis-44 items-center gap-2 text-sm text-slate-600 dark:text-slate-300 sm:max-w-64">
            <span className="sr-only">{isEnglish ? '英文語音' : '日文語音'}</span>
            <ProductIcon icon={Volume2} size={17} className="shrink-0 text-slate-400" />
            <select
              aria-label={isEnglish ? '英文語音' : '日文語音'}
              className="app-select min-w-0 flex-1 truncate"
              disabled={availableVoices.length === 0}
              value={selectedVoice?.voiceURI ?? ''}
              onChange={(event) =>
                updateSpeechConfig((current) => ({ ...current, voiceURI: event.target.value }))
              }
            >
              {availableVoices.length === 0 ? (
                <option value="">瀏覽器預設</option>
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
            <span className="sr-only">{isEnglish ? '英文語速' : '日文語速'}</span>
            <select
              aria-label={isEnglish ? '英文語速' : '日文語速'}
              className="app-select w-[4.75rem]"
              value={String(speechConfig.rate)}
              onChange={(event) =>
                updateSpeechConfig((current) => ({ ...current, rate: Number(event.target.value) }))
              }
            >
              <option value="0.9">0.9x</option>
              <option value="1">1.0x</option>
              <option value="1.1">1.1x</option>
            </select>
          </label>

          {!isEnglish && (
            <Tooltip content="顯示讀音" className="shrink-0">
              <button
                type="button"
                title="顯示讀音"
                className={`app-icon-button ${phoneticConfig.isOpen ? 'app-icon-button-active' : ''}`}
                aria-label="顯示讀音"
                aria-pressed={phoneticConfig.isOpen}
                onClick={() => setPhoneticConfig((current) => ({ ...current, isOpen: !current.isOpen }))}
              >
                <ProductIcon icon={phoneticConfig.isOpen ? Eye : EyeOff} size={19} />
              </button>
            </Tooltip>
          )}

          <Tooltip content="音效設定" className="shrink-0">
            <SoundSwitcher ariaLabel="音效" />
          </Tooltip>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <StartButton isLoading={isLoading} articleMode />
            <Tooltip content="切換深色模式" className="shrink-0">
              <button
                className="app-icon-button"
                type="button"
                aria-label="切換深色模式"
                onClick={() => setIsOpenDarkMode((current) => !current)}
              >
                <ProductIcon icon={isOpenDarkMode ? Moon : Sun} size={19} />
              </button>
            </Tooltip>
            <PracticeSettings language={currentPractice.language} isVocabulary={isVocabulary} voices={voices} />
          </div>
        </div>
      </nav>
    </header>
  )
}
