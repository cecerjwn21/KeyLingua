import { TypingContext, TypingStateActionType } from '../../store'
import SpeechVoiceDiagnostics from '../SpeechVoiceDiagnostics'
import ProductIcon from '@/components/ProductIcon'
import { useUiTranslation } from '@/i18n/useUiTranslation'
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
import { useAtom } from 'jotai'
import { Eye, EyeOff, Moon, Settings2, Sun, Volume2, VolumeX, X } from 'lucide'
import { Fragment, useContext } from 'react'

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
  const { t } = useUiTranslation()
  const dictationTypes: Array<{ value: WordDictationType; label: string }> = [
    { value: 'hideAll', label: t('settings.hideAll') },
    { value: 'hideVowel', label: t('settings.hideVowel') },
    { value: 'hideConsonant', label: t('settings.hideConsonant') },
    { value: 'randomHide', label: t('settings.hideRandom') },
  ]
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
            aria-label={t('settings.practice')}
            aria-expanded={open}
            className={`app-icon-button ${open ? 'app-icon-button-active' : ''}`}
            onClick={() => {
              if (!open) dispatch?.({ type: TypingStateActionType.SET_IS_TYPING, payload: false })
            }}
          >
            <ProductIcon icon={open ? X : Settings2} size={20} />
          </Popover.Button>
          {open && <Popover.Overlay className="fixed inset-0 z-[60] bg-slate-950/25 backdrop-blur-[1px] sm:hidden" />}
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
              aria-label={t('settings.practice')}
              className="fixed left-4 right-4 top-20 z-[70] max-h-[calc(100vh-6rem)] origin-top-right overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[22rem]"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-700">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{t('settings.practice')}</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{t('settings.description')}</p>
                </div>
                <span className="mt-0.5 text-slate-400" aria-hidden="true">
                  <ProductIcon icon={Settings2} size={18} />
                </span>
              </div>

              <section className="mt-5 space-y-4" aria-labelledby="dictation-settings-title">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
                  <ProductIcon icon={dictation.isOpen ? EyeOff : Eye} size={18} />
                  <h3 id="dictation-settings-title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t('settings.dictation')}
                  </h3>
                </div>
                <SettingSwitch
                  checked={dictation.isOpen}
                  label={t('settings.dictationMode')}
                  description={t('settings.dictationDescription')}
                  onChange={(checked) =>
                    setDictation((current) => ({ ...current, isOpen: checked, openBy: checked ? 'user' : current.openBy }))
                  }
                />
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t('settings.hideMethod')}
                  <select
                    aria-label={t('settings.hideMethod')}
                    value={dictation.type}
                    disabled={!dictation.isOpen}
                    onChange={(event) => setDictation((current) => ({ ...current, type: event.target.value as WordDictationType }))}
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

              <section
                className="mt-6 space-y-4 border-t border-slate-200 pt-5 dark:border-slate-700"
                aria-label={t('settings.soundDisplay')}
              >
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
                  <ProductIcon icon={speech.autoReadSentence ? Volume2 : VolumeX} size={18} />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('settings.soundDisplay')}</h3>
                </div>
                <SettingSwitch
                  checked={speech.autoReadSentence}
                  label={t(isVocabulary ? 'typing.autoReadWord' : 'typing.autoReadSentence')}
                  description={t('settings.autoReadDescription')}
                  onChange={updateSpeech}
                />
                <SettingSwitch
                  checked={keySounds.isOpen}
                  label={t('settings.keySound')}
                  description={t('settings.keySoundDescription')}
                  onChange={(checked) => setKeySounds((current) => ({ ...current, isOpen: checked }))}
                />
                <SettingSwitch
                  checked={effectSounds.isOpen}
                  label={t('settings.effectSound')}
                  description={t('settings.effectSoundDescription')}
                  onChange={(checked) => setEffectSounds((current) => ({ ...current, isOpen: checked }))}
                />
                {language === 'japanese' && (
                  <SettingSwitch
                    checked={phonetic.isOpen}
                    label={t('typing.showReading')}
                    description={t('settings.readingDescription')}
                    onChange={(checked) => setPhonetic((current) => ({ ...current, isOpen: checked }))}
                  />
                )}
                <button
                  type="button"
                  className="app-button app-button-secondary w-full justify-between"
                  onClick={() => setDarkMode((current) => !current)}
                >
                  <span>{t(darkMode ? 'theme.toLight' : 'theme.toDark')}</span>
                  <ProductIcon icon={darkMode ? Sun : Moon} size={19} />
                </button>
              </section>

              <details
                className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700"
                role="group"
                aria-label={t('settings.advanced')}
              >
                <summary className="cursor-pointer text-sm font-semibold text-slate-900 outline-none marker:text-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 dark:text-slate-100">
                  {t('settings.advanced')}
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
