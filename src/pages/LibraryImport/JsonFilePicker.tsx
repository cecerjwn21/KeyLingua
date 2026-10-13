import ProductIcon from '@/components/ProductIcon'
import { useUiTranslation } from '@/i18n/useUiTranslation'
import { FilePlus } from 'lucide'
import { useRef } from 'react'

type JsonFilePickerProps = {
  selectedFileNames?: string[]
  onFilesSelected: (files: File[]) => void
  multiple?: boolean
}

export default function JsonFilePicker({ selectedFileNames = [], onFilesSelected, multiple = true }: JsonFilePickerProps) {
  const { t } = useUiTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedNames = selectedFileNames.filter(Boolean)
  const selectedFileLabel = selectedNames.join('、')

  return (
    <div data-testid="json-file-picker" className="min-w-0">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('import.file.select')}</span>
        <input
          ref={inputRef}
          aria-label={t('import.file.select')}
          type="file"
          accept=".json,application/json"
          multiple={multiple}
          className="sr-only"
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? [])
            if (files.length > 0) onFilesSelected(files)
            event.currentTarget.value = ''
          }}
        />
        <button
          type="button"
          aria-label={t('import.file.openPicker')}
          title={t('import.file.select')}
          className="app-button app-button-secondary h-9 w-9 shrink-0 justify-center rounded-lg px-0"
          onClick={() => inputRef.current?.click()}
        >
          <ProductIcon icon={FilePlus} size={18} />
        </button>
      </div>
      {selectedFileLabel && (
        <p title={selectedFileLabel} className="mt-2 truncate text-xs font-normal text-slate-500 dark:text-slate-400">
          {selectedFileLabel}
        </p>
      )}
    </div>
  )
}
