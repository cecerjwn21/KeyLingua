import ProductIcon from './ProductIcon'
import { ArrowRight, ChevronRight } from 'lucide'
import { useState } from 'react'

export default function LibraryLevelCard({
  level,
  summary,
  detail,
  onClick,
}: {
  level: string
  summary: string
  detail?: string
  onClick: () => void
}) {
  const [hovering, setHovering] = useState(false)

  return (
    <button
      type="button"
      className="group flex min-h-40 min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-[border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 active:scale-[0.985] dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-700"
      onClick={onClick}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
    >
      <span className="text-2xl font-bold tracking-[-0.02em] text-slate-950 dark:text-slate-50">{level}</span>
      <span className="mt-3 block break-words text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">{summary}</span>
      {detail && <span className="mt-1 block break-words text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</span>}
      <span className="mt-auto flex items-center justify-between pt-5 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
        查看內容
        <ProductIcon icon={hovering ? ChevronRight : ArrowRight} size={17} />
      </span>
    </button>
  )
}
