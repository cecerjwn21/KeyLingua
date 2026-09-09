import ProductIcon from './ProductIcon'
import { FolderOpen } from 'lucide'
import type { ReactNode } from 'react'

export default function LibraryEmptyState({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`library-empty-state ${className}`}>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
        <ProductIcon icon={FolderOpen} size={21} />
      </span>
      <p className="mt-4 break-words text-center text-sm leading-6 text-slate-600 dark:text-slate-300">{children}</p>
    </div>
  )
}
