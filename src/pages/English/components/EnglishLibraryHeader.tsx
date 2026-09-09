import LibraryPageHeader from '@/components/LibraryPageHeader'
import type { ReactNode } from 'react'

export default function EnglishLibraryHeader({
  current,
  title,
  description,
  actions,
}: {
  current: 'dialogue' | 'vocabulary'
  title: string
  description: string
  actions: ReactNode
}) {
  return <LibraryPageHeader language="english" current={current} title={title} description={description} actions={actions} />
}
