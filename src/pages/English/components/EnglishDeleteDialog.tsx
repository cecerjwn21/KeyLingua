import ProductIcon from '@/components/ProductIcon'
import { useUiTranslation } from '@/i18n/useUiTranslation'
import { Dialog } from '@headlessui/react'
import { Trash2, X } from 'lucide'

export default function EnglishDeleteDialog({
  open,
  title,
  itemTitle,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  itemTitle: string
  onClose: () => void
  onConfirm: () => void
}) {
  const { t } = useUiTranslation()
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</Dialog.Title>
          <p className="mt-3 break-words text-gray-600 dark:text-gray-300">{itemTitle}</p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" className="app-button app-button-secondary" onClick={onClose}>
              <ProductIcon icon={X} size={16} />
              {t('common.cancel')}
            </button>
            <button type="button" className="app-button app-button-destructive" onClick={onConfirm}>
              <ProductIcon icon={Trash2} size={16} />
              {t('common.confirmDelete')}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
