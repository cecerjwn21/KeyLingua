import { useUiTranslation } from '@/i18n/useUiTranslation'
import { Link } from 'react-router-dom'

export default function LanguageSelector({ current }: { current: 'japanese' | 'english' }) {
  const { t } = useUiTranslation()
  const itemClass = (active: boolean) =>
    `inline-flex h-10 min-w-0 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold transition-[background-color,color,transform] duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 active:scale-[0.97] ${
      active
        ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-200'
        : 'text-slate-600 hover:bg-white/70 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-700/70 dark:hover:text-white'
    }`

  return (
    <nav aria-label={t('learningLanguage.label')} className="grid w-full grid-cols-2 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
      <Link to="/en/dialogues" className={itemClass(current === 'english')} aria-current={current === 'english' ? 'page' : undefined}>
        {t('learningLanguage.english')}
      </Link>
      <Link to="/ja/articles" className={itemClass(current === 'japanese')} aria-current={current === 'japanese' ? 'page' : undefined}>
        {t('learningLanguage.japanese')}
      </Link>
    </nav>
  )
}
