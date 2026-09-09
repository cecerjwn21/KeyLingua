import ProductIcon from '@/components/ProductIcon'
import { libraryImportRulesAtom } from '@/store'
import { Dialog } from '@headlessui/react'
import { useAtom } from 'jotai'
import { Check, FileDown, Pencil, RotateCcw, Smartphone, X } from 'lucide'
import { useEffect, useRef, useState } from 'react'
import { buildLibraryImportPrompt, getDefaultLibraryImportRules } from './importPrompts'
import type { LibraryImportKind, LibraryImportOutputMode } from './importPrompts'

export default function PromptDisclosure({ kind }: { kind: LibraryImportKind }) {
  const [rules, setRules] = useAtom(libraryImportRulesAtom)
  const [copiedMode, setCopiedMode] = useState<LibraryImportOutputMode | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isResetConfirming, setIsResetConfirming] = useState(false)
  const [editableRules, setEditableRules] = useState('')
  const resetTimer = useRef<ReturnType<typeof setTimeout>>()
  const currentRules = rules[kind] ?? getDefaultLibraryImportRules(kind)

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    },
    [],
  )

  const copyPrompt = async (mode: LibraryImportOutputMode) => {
    try {
      await navigator.clipboard.writeText(buildLibraryImportPrompt(kind, mode, currentRules))
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
        給 ChatGPT 的格式
      </summary>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
        手機版會要求直接回傳純 JSON；電腦版會要求建立可下載的 UTF-8 JSON 檔案。程度、情境或數量請在貼到 ChatGPT 後修改提示詞最上方。
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button type="button" className="app-button app-button-secondary justify-center" onClick={() => void copyPrompt('mobile')}>
          <ProductIcon icon={copiedMode === 'mobile' ? Check : Smartphone} size={16} />
          {copiedMode === 'mobile' ? '已複製' : '複製手機版提示詞'}
        </button>
        <button type="button" className="app-button app-button-secondary justify-center" onClick={() => void copyPrompt('desktop')}>
          <ProductIcon icon={copiedMode === 'desktop' ? Check : FileDown} size={16} />
          {copiedMode === 'desktop' ? '已複製' : '複製電腦版提示詞'}
        </button>
        <button type="button" className="app-button app-button-secondary justify-center" onClick={openEditor}>
          <ProductIcon icon={Pencil} size={16} />
          編輯生成規則
        </button>
      </div>
      <Dialog open={isEditorOpen} onClose={closeEditor} className="relative z-[60]">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto p-4 sm:flex sm:items-center sm:justify-center">
          <Dialog.Panel data-testid="library-import-rules-editor" className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">編輯 ChatGPT 生成規則</Dialog.Title>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">這些規則只補充內容風格；正式 JSON 欄位、驗證與輸出格式仍由系統固定保留。</p>
            <label className="mt-5 flex flex-col gap-2 text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor={`library-import-rules-${kind}`}>
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
                  <button type="button" className="app-button app-button-secondary" onClick={() => setIsResetConfirming(false)}>取消還原</button>
                  <button type="button" className="app-button app-button-primary" onClick={resetRules}><ProductIcon icon={RotateCcw} size={16} />確認還原預設</button>
                </div>
              </div>
            )}
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button type="button" className="app-button app-button-secondary" onClick={closeEditor}><ProductIcon icon={X} size={16} />取消</button>
              <button type="button" className="app-button app-button-secondary" onClick={() => setIsResetConfirming(true)}><ProductIcon icon={RotateCcw} size={16} />還原預設</button>
              <button type="button" className="app-button app-button-primary" onClick={saveRules}><ProductIcon icon={Check} size={16} />儲存</button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </details>
  )
}
