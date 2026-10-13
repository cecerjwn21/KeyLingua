import { buildLibraryImportPrompt, getDefaultLibraryImportRules } from './importPrompts'
import type { LibraryImportKind, LibraryImportOutputMode } from './importPrompts'
import ProductIcon from '@/components/ProductIcon'
import { buildVocabularyExclusionConstraint, createVocabularyContentRegistry } from '@/contentRegistry/vocabularyRegistry'
import { useUiTranslation } from '@/i18n/useUiTranslation'
import { englishVocabularyLibraryAtom, libraryImportRulesAtom, vocabularyLibraryAtom } from '@/store'
import { Dialog } from '@headlessui/react'
import { useAtom, useAtomValue } from 'jotai'
import { Check, FileDown, Pencil, RotateCcw, Smartphone, X } from 'lucide'
import { useEffect, useMemo, useRef, useState } from 'react'

export default function PromptDisclosure({ kind }: { kind: LibraryImportKind }) {
  const [rules, setRules] = useAtom(libraryImportRulesAtom)
  const japaneseLibrary = useAtomValue(vocabularyLibraryAtom)
  const englishLibrary = useAtomValue(englishVocabularyLibraryAtom)
  const { t } = useUiTranslation()
  const [copiedMode, setCopiedMode] = useState<LibraryImportOutputMode | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isResetConfirming, setIsResetConfirming] = useState(false)
  const [editableRules, setEditableRules] = useState('')
  const resetTimer = useRef<ReturnType<typeof setTimeout>>()
  const currentRules = rules[kind] ?? getDefaultLibraryImportRules(kind)
  const isVocabulary = kind === 'japanese-vocabulary' || kind === 'english-vocabulary'
  const [generationLevel, setGenerationLevel] = useState(kind === 'japanese-vocabulary' ? 'N3' : 'A2')
  const [generationTopic, setGenerationTopic] = useState('')
  const [generationCount, setGenerationCount] = useState(50)
  const registry = useMemo(() => createVocabularyContentRegistry(japaneseLibrary, englishLibrary), [englishLibrary, japaneseLibrary])

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    },
    [],
  )

  const copyPrompt = async (mode: LibraryImportOutputMode) => {
    try {
      const generationContext = isVocabulary
        ? {
            level: generationLevel,
            topic: generationTopic.trim(),
            count: generationCount,
            duplicateConstraint: buildVocabularyExclusionConstraint(registry, {
              language: kind === 'japanese-vocabulary' ? ('japanese' as const) : ('english' as const),
              level: generationLevel,
              topic: generationTopic,
            }),
          }
        : undefined
      await navigator.clipboard.writeText(buildLibraryImportPrompt(kind, mode, currentRules, generationContext))
      setCopiedMode(mode)
      if (resetTimer.current) clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => setCopiedMode(null), 1800)
    } catch {
      setCopiedMode(null)
    }
  }

  const openEditor = () => {
    setEditableRules(currentRules)
    setIsResetConfirming(false)
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    setIsEditorOpen(false)
    setIsResetConfirming(false)
  }

  const saveRules = () => {
    setRules((current) => ({ ...current, [kind]: editableRules }))
    closeEditor()
  }

  const resetRules = () => {
    const defaultRules = getDefaultLibraryImportRules(kind)
    setEditableRules(defaultRules)
    setRules((current) => ({ ...current, [kind]: defaultRules }))
    setIsResetConfirming(false)
  }

  return (
    <details className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/60">
      <summary className="cursor-pointer select-none font-medium text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-100">
        {t('import.prompt.title')}
      </summary>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{t('import.prompt.description')}</p>
      {isVocabulary && (
        <div className="mt-4 grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)_7rem]">
          <label className="min-w-0 text-xs font-medium text-slate-600 dark:text-slate-300">
            {t('import.prompt.level')}
            <select className="app-select mt-1 w-full" value={generationLevel} onChange={(event) => setGenerationLevel(event.target.value)}>
              {(kind === 'japanese-vocabulary' ? ['N5', 'N4', 'N3', 'N2', 'N1'] : ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0 text-xs font-medium text-slate-600 dark:text-slate-300">
            {t('import.prompt.topic')}
            <input
              className="app-select mt-1 w-full"
              value={generationTopic}
              placeholder={t('import.prompt.topicPlaceholder')}
              onChange={(event) => setGenerationTopic(event.target.value)}
            />
          </label>
          <label className="min-w-0 text-xs font-medium text-slate-600 dark:text-slate-300">
            {t('import.prompt.count')}
            <input
              className="app-select mt-1 w-full"
              type="number"
              min={1}
              max={500}
              value={generationCount}
              onChange={(event) => setGenerationCount(Math.max(1, Math.min(500, Number(event.target.value) || 1)))}
            />
          </label>
        </div>
      )}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button type="button" className="app-button app-button-secondary justify-center" onClick={() => void copyPrompt('mobile')}>
          <ProductIcon icon={copiedMode === 'mobile' ? Check : Smartphone} size={16} />
          {copiedMode === 'mobile' ? t('import.prompt.copied') : t('import.prompt.mobile')}
        </button>
        <button type="button" className="app-button app-button-secondary justify-center" onClick={() => void copyPrompt('desktop')}>
          <ProductIcon icon={copiedMode === 'desktop' ? Check : FileDown} size={16} />
          {copiedMode === 'desktop' ? t('import.prompt.copied') : t('import.prompt.desktop')}
        </button>
        <button type="button" className="app-button app-button-secondary justify-center" onClick={openEditor}>
          <ProductIcon icon={Pencil} size={16} />
          {t('import.prompt.editRules')}
        </button>
      </div>
      <Dialog open={isEditorOpen} onClose={closeEditor} className="relative z-[60]">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto p-4 sm:flex sm:items-center sm:justify-center">
          <Dialog.Panel
            data-testid="library-import-rules-editor"
            className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-6"
          >
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">編輯 ChatGPT 生成規則</Dialog.Title>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              這些規則只補充內容風格；正式 JSON 欄位、驗證與輸出格式仍由系統固定保留。
            </p>
            <label
              className="mt-5 flex flex-col gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
              htmlFor={`library-import-rules-${kind}`}
            >
              內容生成規則
              <textarea
                id={`library-import-rules-${kind}`}
                className="min-h-56 w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-3 text-base leading-6 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100 dark:focus:ring-indigo-900"
                value={editableRules}
                onChange={(event) => setEditableRules(event.target.value)}
              />
            </label>
            {isResetConfirming && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
                <p>確定要還原此類型的預設生成規則嗎？目前尚未儲存的修改也會被取代。</p>
                <div className="mt-3 flex flex-wrap justify-end gap-3">
                  <button type="button" className="app-button app-button-secondary" onClick={() => setIsResetConfirming(false)}>
                    取消還原
                  </button>
                  <button type="button" className="app-button app-button-primary" onClick={resetRules}>
                    <ProductIcon icon={RotateCcw} size={16} />
                    確認還原預設
                  </button>
                </div>
              </div>
            )}
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button type="button" className="app-button app-button-secondary" onClick={closeEditor}>
                <ProductIcon icon={X} size={16} />
                取消
              </button>
              <button type="button" className="app-button app-button-secondary" onClick={() => setIsResetConfirming(true)}>
                <ProductIcon icon={RotateCcw} size={16} />
                還原預設
              </button>
              <button type="button" className="app-button app-button-primary" onClick={saveRules}>
                <ProductIcon icon={Check} size={16} />
                儲存
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </details>
  )
}
