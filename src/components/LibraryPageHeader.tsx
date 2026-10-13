import AppPreferencesControls from './AppPreferencesControls'
import LibraryNavigation from './LibraryNavigation'
import type { ReactNode } from 'react'

type LibraryPageHeaderProps = {
  language: 'japanese' | 'english'
  current: 'article' | 'dialogue' | 'vocabulary'
  title: string
  description: string
  actions: ReactNode
}

export default function LibraryPageHeader({ language, current, title, description, actions }: LibraryPageHeaderProps) {
  return (
    <header className="library-page-header">
      <div className="min-w-0 flex-1">
        <LibraryNavigation language={language} current={current} />
        <h1 className="mt-6 break-words text-4xl font-bold tracking-[-0.025em] text-slate-950 dark:text-slate-50 sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">{description}</p>
      </div>
      <div className="flex max-w-full flex-col gap-3 sm:items-end">
        <AppPreferencesControls />
        <div className="flex max-w-full flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
      </div>
    </header>
  )
}
