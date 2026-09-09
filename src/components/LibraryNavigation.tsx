import LanguageSelector from './LanguageSelector'
import LibraryTabs from './LibraryTabs'

export default function LibraryNavigation({
  language,
  current,
}: {
  language: 'japanese' | 'english'
  current: 'article' | 'dialogue' | 'vocabulary'
}) {
  return (
    <div data-testid="library-navigation" className="grid w-60 max-w-full gap-2">
      <LanguageSelector current={language} />
      <LibraryTabs current={current} language={language} />
    </div>
  )
}
