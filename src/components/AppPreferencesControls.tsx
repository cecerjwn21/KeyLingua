import ProductIcon from './ProductIcon'
import { useUiTranslation } from '@/i18n/useUiTranslation'
import { isOpenDarkModeAtom, uiLocaleAtom } from '@/store'
import { Popover, Transition } from '@headlessui/react'
import { useAtom } from 'jotai'
import { Globe2, Moon, Sun } from 'lucide'
import { Fragment } from 'react'

const localeOptions = [
  { value: 'zh-TW' as const, labelKey: 'locale.zh-TW' as const },
  { value: 'en' as const, labelKey: 'locale.en' as const },
  { value: 'ja' as const, labelKey: 'locale.ja' as const },
]

export default function AppPreferencesControls({ className = '' }: { className?: string }) {
  const [locale, setLocale] = useAtom(uiLocaleAtom)
  const [isDark, setIsDark] = useAtom(isOpenDarkModeAtom)
  const { t } = useUiTranslation()
  const themeLabel = t(isDark ? 'theme.toLight' : 'theme.toDark')

  return (
    <div aria-label={t('appPreferences.label')} className={`flex shrink-0 items-center gap-1 ${className}`}>
      <Popover className="relative">
        {({ close }) => (
          <>
            <Popover.Button type="button" className="app-icon-button" aria-label={t('locale.button')} title={t('locale.button')}>
              <ProductIcon icon={Globe2} size={19} />
            </Popover.Button>
            <Transition
              as={Fragment}
              enter="transition-[opacity,transform] duration-150 ease-out"
              enterFrom="translate-y-1 scale-[0.97] opacity-0"
              enterTo="translate-y-0 scale-100 opacity-100"
              leave="transition-[opacity,transform] duration-100 ease-out"
              leaveFrom="translate-y-0 scale-100 opacity-100"
              leaveTo="translate-y-1 scale-[0.98] opacity-0"
            >
              <Popover.Panel
                role="menu"
                aria-label={t('locale.menu')}
                className="absolute right-0 z-[70] mt-2 w-44 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800"
              >
                {localeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={locale === option.value}
                    className={`min-h-10 flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500 ${
                      locale === option.value
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                    onClick={() => {
                      setLocale(option.value)
                      close()
                    }}
                  >
                    {t(option.labelKey)}
                  </button>
                ))}
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
      <button
        type="button"
        className="app-icon-button"
        aria-label={themeLabel}
        title={themeLabel}
        aria-pressed={isDark}
        onClick={() => setIsDark((current) => !current)}
      >
        <ProductIcon icon={isDark ? Sun : Moon} size={19} />
      </button>
    </div>
  )
}
