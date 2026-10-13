import type { VocabularyDuplicateReview as DuplicateReview } from '@/contentRegistry/vocabularyRegistry'
import { useUiTranslation } from '@/i18n/useUiTranslation'

export default function VocabularyDuplicateReview({
  review,
  allowedNearIds,
  onAllowedNearIdsChange,
}: {
  review: DuplicateReview
  allowedNearIds: Set<string>
  onAllowedNearIdsChange: (value: Set<string>) => void
}) {
  const { t } = useUiTranslation()
  const duplicateItems = review.items.filter(({ status }) => status !== 'OK')
  if (duplicateItems.length === 0) return null

  return (
    <section aria-labelledby="vocabulary-duplicate-review-title" className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-700">
      <h3 id="vocabulary-duplicate-review-title" className="font-semibold text-slate-900 dark:text-slate-100">
        {t('import.duplicate.title')}
      </h3>
      <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1">
        {duplicateItems.map(({ candidate, status, matches }) => (
          <div key={candidate.itemId} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="break-words font-semibold text-slate-900 dark:text-slate-100">
                  {candidate.word}
                  {candidate.reading ? `（${candidate.reading}）` : ''}
                </p>
                <p className="mt-1 break-words text-slate-600 dark:text-slate-300">{candidate.meaning}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                  status === 'EXACT'
                    ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                    : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100'
                }`}
              >
                {status}
              </span>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              {status === 'EXACT' ? t('import.duplicate.exact') : t('import.duplicate.near')}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
              {matches.slice(0, 3).map((match) => (
                <li key={`${match.unitId}-${match.itemId}`}>
                  {t('import.duplicate.existingUnit', { title: match.unitTitle, level: match.level })}
                </li>
              ))}
            </ul>
            {status === 'NEAR' && (
              <label className="min-h-10 mt-3 inline-flex cursor-pointer items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={allowedNearIds.has(candidate.itemId)}
                  onChange={(event) => {
                    const next = new Set(allowedNearIds)
                    if (event.target.checked) next.add(candidate.itemId)
                    else next.delete(candidate.itemId)
                    onAllowedNearIdsChange(next)
                  }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                {t('import.duplicate.allowNear')}
              </label>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
