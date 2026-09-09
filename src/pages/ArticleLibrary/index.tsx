import LibraryBackButton from '@/components/LibraryBackButton'
import LibraryCompletionCard from '@/components/LibraryCompletionCard'
import { LibraryCompletionProgress } from '@/components/LibraryCompletionCard'
import LibraryEmptyState from '@/components/LibraryEmptyState'
import LibraryLevelCard from '@/components/LibraryLevelCard'
import LibraryPageHeader from '@/components/LibraryPageHeader'
import ProductIcon from '@/components/ProductIcon'
import useLibraryLevelRoute from '@/components/useLibraryLevelRoute'
import PracticeDocumentActions from '@/pages/Typing/components/PracticeDocumentActions'
import { importChatGPTPracticeDocument } from '@/pages/Typing/utils/practiceImport'
import {
  currentVocabularySetIdAtom,
  englishPracticeDocumentIdAtom,
  englishVocabularySetIdAtom,
  getLibraryCompletionKey,
  libraryCompletionAtom,
  pastedPracticeDocumentsAtom,
  practiceDocumentIdAtom,
  practiceSourceAtom,
} from '@/store'
import type { PracticeDocument } from '@/typings'
import { Dialog } from '@headlessui/react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Pencil, Play, Settings2, Trash2 } from 'lucide'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const

const ArticleCard = ({
  document,
  onStart,
  onEdit,
  onDelete,
  completed,
  manage,
}: {
  document: PracticeDocument
  onStart: (document: PracticeDocument) => void
  onEdit?: (document: PracticeDocument) => void
  onDelete?: (document: PracticeDocument) => void
  completed: boolean
  manage: boolean
}) => (
  <LibraryCompletionCard
    data-testid={`article-card-${document.id}`}
    completed={completed}
    showCompletionStatus={!manage}
    actions={
      manage ? (
        <>
          {onDelete && (
            <button type="button" className="app-button app-button-destructive" onClick={() => onDelete(document)}>
              <ProductIcon icon={Trash2} size={16} />
              刪除
            </button>
          )}
          {onEdit && (
            <button type="button" className="app-button app-button-secondary" onClick={() => onEdit(document)}>
              <ProductIcon icon={Pencil} size={16} />
              編輯
            </button>
          )}
        </>
      ) : (
        <button type="button" className="app-button app-button-primary" onClick={() => onStart(document)}>
          <ProductIcon icon={Play} size={16} />
          開始練習
        </button>
      )
    }
  >
    <h3 className="break-words text-xl font-semibold text-gray-900 dark:text-gray-100">{document.title}</h3>
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
      {document.jlptLevel && <span>JLPT：{document.jlptLevel}</span>}
      {document.scenario && <span>情境：{document.scenario}</span>}
    </div>
  </LibraryCompletionCard>
)

export default function ArticleLibraryPage({ manage = false }: { manage?: boolean }) {
  const [pastedPracticeDocuments, setPastedPracticeDocuments] = useAtom(pastedPracticeDocumentsAtom)
  const libraryCompletion = useAtomValue(libraryCompletionAtom)
  const [practiceDocumentId, setPracticeDocumentId] = useAtom(practiceDocumentIdAtom)
  const setPracticeSource = useSetAtom(practiceSourceAtom)
  const setCurrentVocabularySetId = useSetAtom(currentVocabularySetIdAtom)
  const setEnglishPracticeDocumentId = useSetAtom(englishPracticeDocumentIdAtom)
  const setEnglishVocabularySetId = useSetAtom(englishVocabularySetIdAtom)
  const navigate = useNavigate()
  const [editingDocument, setEditingDocument] = useState<PracticeDocument | null>(null)
  const [editingText, setEditingText] = useState('')
  const [editingPreview, setEditingPreview] = useState<PracticeDocument | null>(null)
  const [editingError, setEditingError] = useState('')
  const [deletingDocument, setDeletingDocument] = useState<PracticeDocument | null>(null)
  const { selectedLevel, setSelectedLevel, clearSelectedLevel } = useLibraryLevelRoute(JLPT_LEVELS)
  const [importSuccess, setImportSuccess] = useState('')
  const filteredDocuments = selectedLevel ? pastedPracticeDocuments.filter((document) => document.jlptLevel === selectedLevel) : []

  const selectDocument = (document: PracticeDocument) => {
    setPracticeDocumentId(document.id)
    setCurrentVocabularySetId(null)
    setEnglishPracticeDocumentId(null)
    setEnglishVocabularySetId(null)
    setPracticeSource({ language: 'japanese', practiceType: 'article', id: document.id })
    navigate('/ja/typing')
  }

  const openEditor = (document: PracticeDocument) => {
    setEditingDocument(document)
    setEditingText(JSON.stringify(document, null, 2))
    setEditingPreview(null)
    setEditingError('')
  }

  const closeEditor = () => {
    setEditingDocument(null)
    setEditingPreview(null)
    setEditingError('')
  }

  const validateEdit = () => {
    if (!editingDocument) return
    const result = importChatGPTPracticeDocument(editingText)
    if (!result.document) {
      setEditingPreview(null)
      setEditingError(result.error ?? '文章資料格式錯誤。')
      return
    }
    setEditingPreview({ ...result.document, id: editingDocument.id, source: editingDocument.source })
    setEditingError('')
  }

  const saveEdit = () => {
    if (!editingPreview) return
    setPastedPracticeDocuments((documents) => documents.map((document) => (document.id === editingPreview.id ? editingPreview : document)))
    closeEditor()
  }

  const deleteDocument = () => {
    if (!deletingDocument) return
    setPastedPracticeDocuments((documents) => documents.filter((document) => document.id !== deletingDocument.id))
    if (practiceDocumentId === deletingDocument.id) setPracticeDocumentId(null)
    setDeletingDocument(null)
  }

  return (
    <main className="library-shell">
      <div className="mx-auto max-w-6xl">
        <LibraryPageHeader
          language="japanese"
          current="article"
          title={manage ? '管理日文文章' : '文章庫'}
          description={manage ? '編輯或刪除已匯入的日文文章。' : '依 JLPT 等級選擇文章，使用同一套練習流程熟悉日文 IME 鍵位。'}
          actions={
            <>
              <PracticeDocumentActions
                showTextPaste={false}
                onStartPractice={selectDocument}
                onImported={(count) => setImportSuccess(count === 1 ? '文章匯入成功' : `已匯入 ${count} 篇文章`)}
              />
              {manage ? (
                <LibraryBackButton label="返回文章庫" to={selectedLevel ? `/ja/articles?level=${selectedLevel}` : '/ja/articles'} />
              ) : selectedLevel ? (
                <Link className="app-button app-button-secondary" to={`/ja/articles/manage?level=${selectedLevel}`}>
                  <ProductIcon icon={Settings2} size={17} />
                  管理
                </Link>
              ) : (
                <button type="button" className="app-button app-button-secondary" disabled>
                  <ProductIcon icon={Settings2} size={17} />
                  管理
                </button>
              )}
            </>
          }
        />
        {importSuccess && (
          <p role="status" className="mt-5 text-sm font-medium text-green-700 dark:text-green-300">
            {importSuccess}
          </p>
        )}

        {manage ? (
          <section className="mt-10" aria-label="日文文章管理清單">
            {filteredDocuments.length === 0 ? (
              <LibraryEmptyState>目前沒有日文文章。匯入 JSON 後即可集中管理。</LibraryEmptyState>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredDocuments.map((document) => (
                  <ArticleCard
                    key={document.id}
                    document={document}
                    manage
                    completed={Boolean(
                      libraryCompletion[getLibraryCompletionKey({ language: 'japanese', practiceType: 'article', id: document.id })],
                    )}
                    onStart={selectDocument}
                    onEdit={openEditor}
                    onDelete={setDeletingDocument}
                  />
                ))}
              </div>
            )}
          </section>
        ) : selectedLevel ? (
          <section className="mt-10" aria-labelledby="jlpt-articles-title">
            <LibraryBackButton label="返回文章庫" onClick={clearSelectedLevel} />
            <h2 id="jlpt-articles-title" className="mt-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {selectedLevel} 對話文章
            </h2>
            {filteredDocuments.length === 0 ? (
              <LibraryEmptyState className="mt-5">
                <span>目前沒有 {selectedLevel} 文章</span>
                <span className="mt-1 block">匯入後會自動依 JLPT 等級出現在這裡。</span>
              </LibraryEmptyState>
            ) : (
              <>
                <p className="mt-2 text-gray-600 dark:text-gray-300">共 {filteredDocuments.length} 篇</p>
                <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {filteredDocuments.map((document) => (
                    <ArticleCard
                      key={document.id}
                      document={document}
                      manage={false}
                      completed={Boolean(
                        libraryCompletion[getLibraryCompletionKey({ language: 'japanese', practiceType: 'article', id: document.id })],
                      )}
                      onStart={selectDocument}
                    />
                  ))}
                </div>
                <LibraryCompletionProgress
                  completed={
                    filteredDocuments.filter(
                      (document) =>
                        libraryCompletion[getLibraryCompletionKey({ language: 'japanese', practiceType: 'article', id: document.id })],
                    ).length
                  }
                  total={filteredDocuments.length}
                  noun="篇"
                />
              </>
            )}
          </section>
        ) : (
          <section className="mt-10" aria-labelledby="jlpt-levels-title">
            <h2 id="jlpt-levels-title" className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              選擇 JLPT 等級
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {JLPT_LEVELS.map((level) => {
                const count = pastedPracticeDocuments.filter((document) => document.jlptLevel === level).length
                return <LibraryLevelCard key={level} level={level} summary={`${count} 篇文章`} onClick={() => setSelectedLevel(level)} />
              })}
            </div>
          </section>
        )}
      </div>
      <Dialog open={Boolean(editingDocument)} onClose={closeEditor} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <Dialog.Title className="text-xl font-medium text-gray-900 dark:text-gray-100">編輯文章</Dialog.Title>
            {editingPreview ? (
              <div className="mt-4 space-y-4 text-gray-700 dark:text-gray-200">
                <p className="font-medium text-green-700 dark:text-green-300">文章驗證成功</p>
                <p>標題：{editingPreview.title}</p>
                <p>句數：{editingPreview.sentences.length}</p>
                <div className="flex justify-end gap-3">
                  <button type="button" className="my-btn-primary bg-gray-400" onClick={() => setEditingPreview(null)}>
                    返回編輯
                  </button>
                  <button type="button" className="my-btn-primary" onClick={saveEdit}>
                    儲存變更
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-200" htmlFor="edit-practice-json">
                  文章 JSON
                  <textarea
                    id="edit-practice-json"
                    value={editingText}
                    onChange={(event) => setEditingText(event.target.value)}
                    className="min-h-64 rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </label>
                {editingError && (
                  <p role="alert" className="text-sm text-red-600">
                    {editingError}
                  </p>
                )}
                <div className="flex justify-end gap-3">
                  <button type="button" className="my-btn-primary bg-gray-400" onClick={closeEditor}>
                    取消
                  </button>
                  <button type="button" className="my-btn-primary" onClick={validateEdit}>
                    驗證文章
                  </button>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
      <Dialog open={Boolean(deletingDocument)} onClose={() => setDeletingDocument(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <Dialog.Title className="text-xl font-medium text-gray-900 dark:text-gray-100">確定要刪除這篇文章嗎？</Dialog.Title>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="my-btn-primary bg-gray-400" onClick={() => setDeletingDocument(null)}>
                取消
              </button>
              <button type="button" className="rounded-lg bg-red-600 px-3 py-1 text-white" onClick={deleteDocument}>
                確認刪除
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </main>
  )
}
