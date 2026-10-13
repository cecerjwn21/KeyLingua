import ProductIcon from '@/components/ProductIcon'
import { useUiTranslation } from '@/i18n/useUiTranslation'
import { ArrowLeft, Check, Upload } from 'lucide'
import type { ReactNode } from 'react'

export default function ValidationResult({
  successMessage,
  summary,
  checks,
  confirmLabel,
  onBack,
  onConfirm,
}: {
  successMessage: string
  summary: ReactNode
  checks: string[]
  confirmLabel: string
  onBack: () => void
  onConfirm: () => void
}) {
  const { t } = useUiTranslation()
  return (
    <section className="mt-5 min-w-0" aria-live="polite">
      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
        <ProductIcon icon={Check} size={18} />
        <p className="break-words font-semibold">{successMessage}</p>
      </div>
      <div className="mt-4 min-w-0 space-y-1.5 break-words text-sm leading-6 text-slate-700 dark:text-slate-200">{summary}</div>
      <ul className="mt-4 grid min-w-0 gap-2 text-sm text-slate-700 dark:text-slate-200 sm:grid-cols-2">
        {checks.map((check) => (
          <li key={check} className="flex min-w-0 items-start gap-2">
            <ProductIcon icon={Check} size={15} className="mt-1 shrink-0 text-green-600 dark:text-green-300" />
            <span className="break-words">{check}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" className="app-button app-button-secondary justify-center" onClick={onBack}>
          <ProductIcon icon={ArrowLeft} size={16} />
          {t('common.backEdit')}
        </button>
        <button type="button" className="app-button app-button-primary justify-center" onClick={onConfirm}>
          <ProductIcon icon={Upload} size={16} />
          {confirmLabel}
        </button>
      </div>
    </section>
  )
}
