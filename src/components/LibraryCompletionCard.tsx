import ProductIcon from './ProductIcon'
import { useUiTranslation } from '@/i18n/useUiTranslation'
import clsx from 'clsx'
import { CheckCircle2, Circle, Sparkles } from 'lucide'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type LibraryCompletionCardProps = Omit<ComponentPropsWithoutRef<'article'>, 'children'> & {
  completed: boolean
  children: ReactNode
  actions: ReactNode
  showCompletionStatus?: boolean
}

export default function LibraryCompletionCard({
  completed,
  children,
  actions,
  showCompletionStatus = true,
  className,
  ...props
}: LibraryCompletionCardProps) {
  const { t } = useUiTranslation()
  return (
    <article
      {...props}
      data-completed={completed}
      className={clsx('library-card library-completion-card', completed && 'library-completion-card-completed', className)}
    >
      <div className="library-completion-rail" aria-hidden="true">
        <span data-testid="library-completion-icon" className="library-completion-icon">
          <ProductIcon icon={completed ? CheckCircle2 : Circle} size={20} />
        </span>
        {completed && (
          <span data-testid="library-completion-sparkles" className="library-completion-sparkles">
            <ProductIcon icon={Sparkles} size={11} />
            <ProductIcon icon={Sparkles} size={8} />
          </span>
        )}
      </div>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col pl-7">
        <div className="min-w-0">{children}</div>
        <div data-testid="library-card-actions" className="library-card-actions mt-auto flex flex-wrap items-center gap-2 pt-5">
          {actions}
          {showCompletionStatus && completed && (
            <div data-testid="library-completion-status" className="library-completion-status" aria-label={`${t('library.completed')} 1/1`}>
              <span className="flex items-center justify-center gap-1 font-semibold">
                <ProductIcon icon={CheckCircle2} size={13} />
                {t('library.completed')}
              </span>
              <span className="text-[10px] leading-3 text-emerald-700 dark:text-emerald-300">完成 1/1</span>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export function LibraryCompletionProgress({ completed, total, noun }: { completed: number; total: number; noun: string }) {
  const { t } = useUiTranslation()
  return (
    <p data-testid="library-completion-progress" className="mt-6 text-center text-sm font-medium text-slate-600 dark:text-slate-300">
      {t('library.progress', { completed, total, noun })}
    </p>
  )
}
