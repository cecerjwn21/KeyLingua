import ProductIcon from '@/components/ProductIcon'
import { useUiTranslation } from '@/i18n/useUiTranslation'
import JsonFilePicker from '@/pages/LibraryImport/JsonFilePicker'
import PromptDisclosure from '@/pages/LibraryImport/PromptDisclosure'
import type { LibraryImportKind } from '@/pages/LibraryImport/importPrompts'
import { Dialog } from '@headlessui/react'
import { Check, X } from 'lucide'
import type { ReactNode } from 'react'

export default function EnglishJsonDialog({
  open,
  title,
  label,
  value,
  error,
  confirmLabel,
  promptKind,
  validation,
  fileInputLabel,
  selectedFileNames = [],
  onChange,
  onFilesSelected,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  label: string
  value: string
  error: string
  confirmLabel: string
  promptKind?: LibraryImportKind
  validation?: ReactNode
  fileInputLabel?: string
  selectedFileNames?: string[]
  onChange: (value: string) => void
  onFilesSelected?: (files: File[]) => void
  onClose: () => void
  onConfirm: () => void
}) {
  const { t } = useUiTranslation()
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto p-4 sm:flex sm:items-center sm:justify-center">
        <Dialog.Panel className="mx-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <Dialog.Title className="break-words text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</Dialog.Title>
          {validation ?? (
            <div className="mt-5 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1">
              <label className="flex min-h-0 flex-1 flex-col gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                {label}
                <textarea
                  className="min-h-40 sm:min-h-60 w-full flex-1 resize-y rounded-xl border border-gray-300 bg-white px-3 py-3 font-mono text-base leading-6 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100 dark:focus:ring-indigo-900"
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  spellCheck={false}
                />
              </label>
              {fileInputLabel && onFilesSelected && (
                <JsonFilePicker selectedFileNames={selectedFileNames} onFilesSelected={onFilesSelected} />
              )}
              {promptKind && <PromptDisclosure kind={promptKind} />}
              {error && (
                <p role="alert" className="break-words text-sm text-red-600 dark:text-red-300">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" className="app-button app-button-secondary" onClick={onClose}>
                  <ProductIcon icon={X} size={16} />
                  {t('common.cancel')}
                </button>
                <button type="button" className="app-button app-button-primary" onClick={onConfirm}>
                  <ProductIcon icon={Check} size={16} />
                  {confirmLabel}
                </button>
              </div>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
