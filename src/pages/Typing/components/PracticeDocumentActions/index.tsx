import { importChatGPTPracticeDocuments } from '@/pages/Typing/utils/practiceImport'
import ProductIcon from '@/components/ProductIcon'
import JsonFilePicker from '@/pages/LibraryImport/JsonFilePicker'
import PromptDisclosure from '@/pages/LibraryImport/PromptDisclosure'
import ValidationResult from '@/pages/LibraryImport/ValidationResult'
import { createPastedPracticeDocument } from '@/pages/Typing/utils/practiceText'
import { chatGPTPracticeDocumentIdsAtom, pastedPracticeDocumentsAtom } from '@/store'
import type { PracticeDocument } from '@/typings'
import { Dialog } from '@headlessui/react'
import { useSetAtom } from 'jotai'
import { useState } from 'react'
import { Check, ClipboardPaste, Upload, X } from 'lucide'

type PracticeDocumentActionsProps = {
  onStartPractice: (document: PracticeDocument) => void
  showTextPaste?: boolean
  onImported?: (count: number) => void
}

export default function PracticeDocumentActions({ onStartPractice, showTextPaste = true, onImported }: PracticeDocumentActionsProps) {
  const setPastedPracticeDocuments = useSetAtom(pastedPracticeDocumentsAtom)
  const setChatGPTPracticeDocumentIds = useSetAtom(chatGPTPracticeDocumentIdsAtom)
  const [isPasteDialogOpen, setIsPasteDialogOpen] = useState(false)
  const [pastedTitle, setPastedTitle] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [pasteError, setPasteError] = useState('')
  const [isChatGPTImportDialogOpen, setIsChatGPTImportDialogOpen] = useState(false)
  const [chatGPTImportText, setChatGPTImportText] = useState('')
  const [chatGPTImportFileTexts, setChatGPTImportFileTexts] = useState<string[]>([])
  const [chatGPTImportFileNames, setChatGPTImportFileNames] = useState<string[]>([])
  const [chatGPTImportError, setChatGPTImportError] = useState('')
  const [chatGPTImportPreview, setChatGPTImportPreview] = useState<PracticeDocument[]>([])

  const saveDocument = (document: PracticeDocument) => {
    setPastedPracticeDocuments((documents) => [document, ...documents.filter((item) => item.id !== document.id)])
  }

  const createPastedDocument = () => {
    try {
      const document = createPastedPracticeDocument({
        id: `pasted-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        title: pastedTitle,
        text: pastedText,
      })
      saveDocument(document)
      setPasteError('')
      setIsPasteDialogOpen(false)
      onStartPractice(document)
    } catch (error) {
      setPasteError(error instanceof Error ? error.message : '建立文章時發生錯誤。')
    }
  }

  const validateChatGPTImport = (texts: string[]) => {
    const result = importChatGPTPracticeDocuments(texts)
    if (!result.documents) {
      setChatGPTImportPreview([])
      setChatGPTImportError(result.error ?? '文章資料格式錯誤。')
      return
    }
    setChatGPTImportPreview(result.documents)
    setChatGPTImportError('')
  }

  const saveChatGPTImport = () => {
    if (chatGPTImportPreview.length === 0) return
    setPastedPracticeDocuments((documents) => [
      ...chatGPTImportPreview,
      ...documents.filter((document) => !chatGPTImportPreview.some((preview) => preview.id === document.id)),
    ])
    setChatGPTPracticeDocumentIds((ids) => [
      ...chatGPTImportPreview.map((document) => document.id),
      ...ids.filter((id) => !chatGPTImportPreview.some((preview) => preview.id === id)),
    ])
    onImported?.(chatGPTImportPreview.length)
    setChatGPTImportPreview([])
    setChatGPTImportText('')
    setChatGPTImportFileTexts([])
    setChatGPTImportFileNames([])
    setChatGPTImportError('')
    setIsChatGPTImportDialogOpen(false)
  }

  const readChatGPTImportFile = async (files: File[]) => {
    const texts = await Promise.all(files.map((file) => file.text()))
    setChatGPTImportText(texts.join('\n\n'))
    setChatGPTImportFileTexts(texts)
    setChatGPTImportFileNames(files.map((file) => file.name))
    setChatGPTImportPreview([])
    setChatGPTImportError('')
  }

  return (
    <>
      {showTextPaste && <button
        type="button"
        onClick={() => setIsPasteDialogOpen(true)}
        className="app-button app-button-secondary"
      >
        <ProductIcon icon={ClipboardPaste} size={17} />
        貼上自己的文章
      </button>}
      <button
        type="button"
        onClick={() => {
          setChatGPTImportError('')
          setChatGPTImportPreview([])
          setIsChatGPTImportDialogOpen(true)
        }}
        className="app-button app-button-primary"
      >
        <ProductIcon icon={Upload} size={17} />
        匯入文章
      </button>
      <Dialog open={isPasteDialogOpen} onClose={setIsPasteDialogOpen} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
          <Dialog.Panel className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <Dialog.Title className="text-xl font-medium text-gray-900 dark:text-gray-100">貼上自己的文章</Dialog.Title>
            <div className="mt-4 flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-200" htmlFor="pasted-practice-title">
                文章名稱
                <input
                  id="pasted-practice-title"
                  value={pastedTitle}
                  onChange={(event) => setPastedTitle(event.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="我的文章"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-200" htmlFor="pasted-practice-text">
                文章內容
                <textarea
                  id="pasted-practice-text"
                  value={pastedText}
                  onChange={(event) => setPastedText(event.target.value)}
                  className="min-h-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="貼上日文、中文或英文文章"
                />
              </label>
              {pasteError && (
                <p role="alert" className="text-sm text-red-600">
                  {pasteError}
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" className="my-btn-primary bg-gray-400" onClick={() => setIsPasteDialogOpen(false)}>
                  取消
                </button>
                <button type="button" className="my-btn-primary" onClick={createPastedDocument}>
                  開始練習
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      <Dialog open={isChatGPTImportDialogOpen} onClose={setIsChatGPTImportDialogOpen} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
          <Dialog.Panel className="mx-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            <Dialog.Title className="text-xl font-medium text-gray-900 dark:text-gray-100">匯入文章</Dialog.Title>
            {chatGPTImportPreview.length > 0 ? (
              <ValidationResult
                successMessage={chatGPTImportPreview.length === 1 ? '文章驗證成功' : `已驗證 ${chatGPTImportPreview.length} 篇文章`}
                summary={(
                  <>
                    <p>{chatGPTImportPreview.length === 1 ? '標題：' : '第一篇標題：'}{chatGPTImportPreview[0].title}</p>
                    <p>程度：{chatGPTImportPreview[0].jlptLevel}</p>
                    <p>情境：{chatGPTImportPreview[0].scenario || '未提供'}</p>
                    <p>句數：{chatGPTImportPreview[0].sentences.length}</p>
                  </>
                )}
                checks={['日文原文', 'Furigana', '繁中翻譯', 'JLPT 與句數']}
                confirmLabel="確認匯入文章"
                onBack={() => setChatGPTImportPreview([])}
                onConfirm={saveChatGPTImport}
              />
            ) : (
              <div className="mt-5 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1">
                <p className="text-sm text-gray-700 dark:text-gray-200">將 ChatGPT 產生的文章資料貼到下方。</p>
                <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-200" htmlFor="chatgpt-practice-json">
                  文章 JSON
                  <textarea
                    id="chatgpt-practice-json"
                    value={chatGPTImportText}
                    onChange={(event) => {
                      setChatGPTImportText(event.target.value)
                      setChatGPTImportFileTexts([])
                      setChatGPTImportFileNames([])
                      setChatGPTImportPreview([])
                      setChatGPTImportError('')
                    }}
                    className="min-h-40 w-full flex-1 resize-y rounded-xl border border-gray-300 bg-white px-3 py-3 font-mono text-base leading-6 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100 dark:focus:ring-indigo-900 sm:min-h-60"
                    placeholder={'{"title":"文章標題","jlptLevel":"N4","scenario":"izakaya","sentences":[...]}'}
                  />
                </label>
                <JsonFilePicker selectedFileNames={chatGPTImportFileNames} onFilesSelected={(files) => void readChatGPTImportFile(files)} />
                <PromptDisclosure kind="japanese-article" />
                {chatGPTImportError && (
                  <p role="alert" className="text-sm text-red-600">
                    {chatGPTImportError}
                  </p>
                )}
                <div className="flex flex-wrap justify-end gap-3">
                  <button type="button" className="app-button app-button-secondary" onClick={() => setIsChatGPTImportDialogOpen(false)}>
                    <ProductIcon icon={X} size={16} />
                    取消
                  </button>
                  <button
                    type="button"
                    className="app-button app-button-primary"
                    onClick={() => validateChatGPTImport(chatGPTImportFileTexts.length > 0 ? chatGPTImportFileTexts : [chatGPTImportText])}
                  >
                    <ProductIcon icon={Check} size={16} />
                    驗證文章
                  </button>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  )
}
