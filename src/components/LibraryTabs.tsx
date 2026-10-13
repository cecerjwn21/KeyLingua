import ProductIcon from './ProductIcon'
import { useUiTranslation } from '@/i18n/useUiTranslation'
import { BookOpenText, LibraryBig } from 'lucide'
import { Link } from 'react-router-dom'

export default function LibraryTabs({
  current,
  language = 'japanese',
}: {
  current: 'article' | 'dialogue' | 'vocabulary'
  language?: 'japanese' | 'english'
}) {
  const { t } = useUiTranslation()
  const itemClass = (active: boolean) =>
    `inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-[background-color,color,transform] duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 active:scale-[0.97] ${
      active
        ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500 dark:text-white'
        : 'text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
    }`

  return (
    <nav aria-label={t('library.navigation')} className="grid w-full grid-cols-2 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
      <Link
        to={language === 'english' ? '/en/dialogues' : '/ja/articles'}
        className={itemClass(current === 'article' || current === 'dialogue')}
        aria-current={current === 'article' || current === 'dialogue' ? 'page' : undefined}
      >
        <ProductIcon icon={BookOpenText} size={16} />
        {t(language === 'english' ? 'library.dialogue.tab' : 'library.article.tab')}
      </Link>
      <Link
        to={language === 'english' ? '/en/vocabulary' : '/ja/vocabulary'}
        className={itemClass(current === 'vocabulary')}
        aria-current={current === 'vocabulary' ? 'page' : undefined}
      >
        <ProductIcon icon={LibraryBig} size={16} />
        {t('library.vocabulary.tab')}
      </Link>
    </nav>
  )
}
