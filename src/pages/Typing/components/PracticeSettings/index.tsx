import { TypingContext, TypingStateActionType } from '../../store'
import ProductIcon from '@/components/ProductIcon'
import SpeechVoiceDiagnostics from '../SpeechVoiceDiagnostics'
import {
  articleSpeechConfigAtom,
  englishSpeechConfigAtom,
  hintSoundsConfigAtom,
  isOpenDarkModeAtom,
  keySoundsConfigAtom,
  phoneticConfigAtom,
  wordDictationConfigAtom,
} from '@/store'
import type { WordDictationType } from '@/typings'
import { Popover, Switch, Transition } from '@headlessui/react'
import { Eye, EyeOff, Moon, Settings2, Sun, Volume2, VolumeX, X } from 'lucide'
import { useAtom } from 'jotai'
import { Fragment, useContext } from 'react'

const dictationTypes: Array<{ value: WordDictationType; label: string }> = [
  { value: 'hideAll', label: '全部隱藏' },
  { value: 'hideVowel', label: '隱藏母音' },
  { value: 'hideConsonant', label: '隱藏子音' },
  { value: 'randomHide', label: '隨機隱藏' },
]

const SettingSwitch = ({
  checked,
  label,
  description,
  onChange,
}: {
  checked: boolean
  label: string
  description: string
  onChange: (checked: boolean) => void
}) => (
  <div className="flex items-center justify-between gap-4">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
      <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
    </div>
    <Switch checked={checked} onChange={onChange} aria-label={label} className="switch-root shrink-0">
      <span aria-hidden="true" className="switch-thumb" />
    </Switch>
  </div>
)

export default function PracticeSettings({
  language,
  isVocabulary,
  voices,
}: {
  language: 'japanese' | 'english'
  isVocabulary: boolean
  voices: SpeechSynthesisVoice[]
}) {
  const { dispatch } = useContext(TypingContext) ?? {}
  const [dictation, setDictation] = useAtom(wordDictationConfigAtom)
  const [darkMode, setDarkMode] = useAtom(isOpenDarkModeAtom)
  const [keySounds, setKeySounds] = useAtom(keySoundsConfigAtom)
  const [effectSounds, setEffectSounds] = useAtom(hintSoundsConfigAtom)
  const [phonetic, setPhonetic] = useAtom(phoneticConfigAtom)
  const [japaneseSpeech, setJapaneseSpeech] = useAtom(articleSpeechConfigAtom)
  const [englishSpeech, setEnglishSpeech] = useAtom(englishSpeechConfigAtom)
  const speech = language === 'english' ? englishSpeech : japaneseSpeech
  const updateSpeech = (checked: boolean) => {
    if (language === 'english') setEnglishSpeech((current) => ({ ...current, autoReadSentence: checked }))
    else setJapaneseSpeech((current) => ({ ...current, autoReadSentence: checked }))
  }

  return (
    <Popover className="relative shrink-0">
      {({ open }) => (
        <>
          <Popover.Button
            type="button"
            aria-label="練習設定"
            aria-expanded={open}
            className={`app-icon-button ${open ? 'app-icon-button-active' : ''}`}
            onClick={() => {
              if (!open) dispatch?.({ type: TypingStateActionType.SET_IS_TYPING, payload: false })
            }}
          >
            <ProductIcon icon={open ? X : Settings2} size={20} />
          </Popover.Button>
          {open && (
            <Popover.Overlay className="fixed inset-0 z-[60] bg-slate-950/25 backdrop-blur-[1px] sm:hidden" />
          )}
          <Transition
            as={Fragment}
            enter="transition duration-150 ease-out motion-reduce:transition-none"
            enterFrom="translate-y-1 scale-[0.98]"
            enterTo="translate-y-0 scale-100"
            leave="transition duration-100 ease-out motion-reduce:transition-none"
            leaveFrom="translate-y-0 opacity-100 scale-100"
            leaveTo="translate-y-1 opacity-0 scale-[0.98]"
          >
            <Popover.Panel
              role="dialog"
              aria-label="練習設定"
              className="fixed left-4 right-4 top-20 z-[70] max-h-[calc(100vh-6rem)] origin-top-right overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[22rem]"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-700">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-white">練習設定</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">設定會套用到日文與英文共用練習介面。</p>
                </div>
                <span className="mt-0.5 text-slate-400" aria-hidden="true">
                  <ProductIcon icon={Settings2} size={18} />
                </span>
              </div>

              <section className="mt-5 space-y-4" aria-labelledby="dictation-settings-title">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
                  <ProductIcon icon={dictation.isOpen ? EyeOff : Eye} size={18} />
                  <h3 id="dictation-settings-title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    默寫
                  </h3>
                </div>
                <SettingSwitch
                  checked={dictation.isOpen}
                  label="默寫模式"
                  description="只隱藏畫面答案，不改變輸入目標、朗讀、進度或統計。"
                  onChange={(checked) =>
                    setDictation((current) => ({ ...current, isOpen: checked, openBy: checked ? 'user' : current.openBy }))
                  }
                />
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  隱藏方式
                  <select
                    aria-label="默寫隱藏方式"
                    value={dictation.type}
                    disabled={!dictation.isOpen}
                    onChange={(event) =>
                      setDictation((current) => ({ ...current, type: event.target.value as WordDictationType }))
                    }
                    className="app-select mt-2 w-full"
                  >
                    {dictationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              <section className="mt-6 space-y-4 border-t border-slate-200 pt-5 dark:border-slate-700" aria-label="聲音與顯示">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
                  <ProductIcon icon={speech.autoReadSentence ? Volume2 : VolumeX} size={18} />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">聲音與顯示</h3>
                </div>
                <SettingSwitch
                  checked={speech.autoReadSentence}
                  label={isVocabulary ? '新詞自動朗讀' : '新句自動朗讀'}
                  description="開始練習與切換內容時自動朗讀目前題目。"
                  onChange={updateSpeech}
                />
                <SettingSwitch
                  checked={keySounds.isOpen}
                  label="按鍵音"
                  description="輸入正確字元時播放按鍵回饋。"
                  onChange={(checked) => setKeySounds((current) => ({ ...current, isOpen: checked }))}
                />
                <SettingSwitch
                  checked={effectSounds.isOpen}
                  label="效果音"
                  description="保留錯誤與完成時的聲音回饋。"
                  onChange={(checked) => setEffectSounds((current) => ({ ...current, isOpen: checked }))}
                />
                {language === 'japanese' && (
                  <SettingSwitch
                    checked={phonetic.isOpen}
                    label="顯示讀音"
                    description="在日文內容上顯示既有 Furigana 讀音。"
                    onChange={(checked) => setPhonetic((current) => ({ ...current, isOpen: checked }))}
                  />
                )}
                <button
                  type="button"
                  className="app-button app-button-secondary w-full justify-between"
                  onClick={() => setDarkMode((current) => !current)}
                >
                  <span>{darkMode ? '切換為淺色模式' : '切換為深色模式'}</span>
                  <ProductIcon icon={darkMode ? Moon : Sun} size={19} />
                </button>
              </section>

              <details className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700" role="group" aria-label="進階">
                <summary className="cursor-pointer text-sm font-semibold text-slate-900 outline-none marker:text-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 dark:text-slate-100">
                  進階
                </summary>
                <SpeechVoiceDiagnostics voices={voices} />
              </details>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  )
}
