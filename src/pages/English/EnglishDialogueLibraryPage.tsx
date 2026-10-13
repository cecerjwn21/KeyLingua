import EnglishDeleteDialog from './components/EnglishDeleteDialog'
import EnglishJsonDialog from './components/EnglishJsonDialog'
import EnglishLibraryHeader from './components/EnglishLibraryHeader'
import { importEnglishDialogueDocuments } from './utils/englishPractice'
import type { EnglishImportInput } from './utils/englishPractice'
import LibraryBackButton from '@/components/LibraryBackButton'
import LibraryCompletionCard from '@/components/LibraryCompletionCard'
import { LibraryCompletionProgress } from '@/components/LibraryCompletionCard'
import LibraryEmptyState from '@/components/LibraryEmptyState'
import LibraryLevelCard from '@/components/LibraryLevelCard'
import ProductIcon from '@/components/ProductIcon'
import useLibraryLevelRoute from '@/components/useLibraryLevelRoute'
import { useUiTranslation } from '@/i18n/useUiTranslation'
import ValidationResult from '@/pages/LibraryImport/ValidationResult'
import {
  currentVocabularySetIdAtom,
  englishPracticeDocumentIdAtom,
  englishPracticeDocumentsAtom,
  englishVocabularySetIdAtom,
  getLibraryCompletionKey,
  libraryCompletionAtom,
  practiceDocumentIdAtom,
  practiceSourceAtom,
} from '@/store'
import { CEFR_LEVELS } from '@/typings'
import type { EnglishPracticeDocument } from '@/typings'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Pencil, Play, Settings2, Trash2, Upload } from 'lucide'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type EditorMode = 'import' | 'edit'

const DialogueCard = ({
  document,
  manage,
  onStart,
  onEdit,
  onDelete,
  completed,
}: {
  document: EnglishPracticeDocument
  manage: boolean
  onStart: () => void
  onEdit: () => void
  onDelete: () => void
  completed: boolean
}) => {
  const { t } = useUiTranslation()
  return (
    <LibraryCompletionCard
      data-testid={`english-dialogue-card-${document.id}`}
      completed={completed}
      showCompletionStatus={!manage}
      actions={
        !manage ? (
          <button type="button" className="app-button app-button-primary" onClick={onStart}>
            <ProductIcon icon={Play} size={16} />
            {t('library.startPractice')}
          </button>
        ) : (
          <>
            <button type="button" className="app-button app-button-destructive" onClick={onDelete}>
              <ProductIcon icon={Trash2} size={16} />
              {t('library.delete')}
            </button>
            <button type="button" className="app-button app-button-secondary" onClick={onEdit}>
              <ProductIcon icon={Pencil} size={16} />
              {t('library.edit')}
            </button>
          </>
        )
      }
    >
      <h3 className="break-words text-xl font-semibold text-gray-900 dark:text-gray-100">{document.title}</h3>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
        CEFR：{document.level}・{t('library.sentenceCount', { count: document.sentences.length })}
      </p>
    </LibraryCompletionCard>
  )
}

export default function EnglishDialogueLibraryPage({ manage = false }: { manage?: boolean }) {
  const { t } = useUiTranslation()
  const [documents, setDocuments] = useAtom(englishPracticeDocumentsAtom)
  const libraryCompletion = useAtomValue(libraryCompletionAtom)
  const setEnglishPracticeDocumentId = useSetAtom(englishPracticeDocumentIdAtom)
  const setEnglishVocabularySetId = useSetAtom(englishVocabularySetIdAtom)
  const setJapaneseDocumentId = useSetAtom(practiceDocumentIdAtom)
  const setJapaneseVocabularySetId = useSetAtom(currentVocabularySetIdAtom)
  const setPracticeSource = useSetAtom(practiceSourceAtom)
  const navigate = useNavigate()
  const { selectedLevel, setSelectedLevel, clearSelectedLevel } = useLibraryLevelRoute(CEFR_LEVELS)
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null)
  const [editingDocument, setEditingDocument] = useState<EnglishPracticeDocument | null>(null)
  const [editorText, setEditorText] = useState('')
  const [editorFileInputs, setEditorFileInputs] = useState<EnglishImportInput[]>([])
  const [editorError, setEditorError] = useState('')
  const [editorPreview, setEditorPreview] = useState<EnglishPracticeDocument[] | null>(null)
  const [deletingDocument, setDeletingDocument] = useState<EnglishPracticeDocument | null>(null)
  const [notice, setNotice] = useState('')

  const openEditor = (mode: EditorMode, document?: EnglishPracticeDocument) => {
    setEditorMode(mode)
    setEditingDocument(document ?? null)
    setEditorText(document ? JSON.stringify({ title: document.title, level: document.level, sentences: document.sentences }, null, 2) : '')
    setEditorFileInputs([])
    setEditorError('')
    setEditorPreview(null)
  }

  const closeEditor = () => {
    setEditorMode(null)
    setEditingDocument(null)
    setEditorFileInputs([])
    setEditorError('')
    setEditorPreview(null)
  }

  const validateImport = () => {
    const result = importEnglishDialogueDocuments(editorFileInputs.length > 0 ? editorFileInputs : [{ text: editorText }])
    if ('error' in result) {
      setEditorError(result.error)
      return
    }
    setEditorPreview(result.documents)
    setEditorError('')
  }

  const saveEditor = () => {
    if (!editingDocument) {
      if (!editorPreview) return
      setDocuments((current) => [...current, ...editorPreview])
      setNotice(`已匯入 ${editorPreview.length} 個英文對話單元`)
      closeEditor()
      return
    }

    const result = importEnglishDialogueDocuments(editorFileInputs.length > 0 ? editorFileInputs : [{ text: editorText }])
    if ('error' in result) {
      setEditorError(result.error)
      return
    }
    const replacement = {
      ...result.documents[0],
      id: editingDocument.id,
      source: editingDocument.source,
      createdAt: editingDocument.createdAt,
    }
    setDocuments((current) => current.map((document) => (document.id === editingDocument.id ? replacement : document)))
    setNotice('英文對話已更新')
    closeEditor()
  }

  const startPractice = (document: EnglishPracticeDocument) => {
    setEnglishPracticeDocumentId(document.id)
    setEnglishVocabularySetId(null)
    setJapaneseDocumentId(null)
    setJapaneseVocabularySetId(null)
    setPracticeSource({ language: 'english', practiceType: 'dialogue', id: document.id })
    navigate('/en/typing')
  }

  const deleteDocument = () => {
    if (!deletingDocument) return
    setDocuments((current) => current.filter((document) => document.id !== deletingDocument.id))
    setEnglishPracticeDocumentId((current) => (current === deletingDocument.id ? null : current))
    setDeletingDocument(null)
    setNotice('英文對話已刪除')
  }

  const visibleDocuments = selectedLevel ? documents.filter((document) => document.level === selectedLevel) : []

  return (
    <main className="library-shell">
      <div className="mx-auto max-w-6xl">
        <EnglishLibraryHeader
          current="dialogue"
          title={t(manage ? 'library.englishDialogue.manageTitle' : 'library.englishDialogue.title')}
          description={t(manage ? 'library.englishDialogue.manageDescription' : 'library.englishDialogue.description')}
          actions={
            <>
              <button type="button" className="app-button app-button-primary" onClick={() => openEditor('import')}>
                <ProductIcon icon={Upload} size={17} />
                {t('library.import')}
              </button>
              {manage ? (
                <LibraryBackButton
                  label={t('library.backDialogue')}
                  to={selectedLevel ? `/en/dialogues?level=${selectedLevel}` : '/en/dialogues'}
                />
              ) : selectedLevel ? (
                <Link className="app-button app-button-secondary" to={`/en/dialogues/manage?level=${selectedLevel}`}>
                  <ProductIcon icon={Settings2} size={17} />
                  {t('library.manage')}
                </Link>
              ) : (
                <button type="button" className="app-button app-button-secondary" disabled>
                  <ProductIcon icon={Settings2} size={17} />
                  {t('library.manage')}
                </button>
              )}
            </>
          }
        />
        {notice && (
          <p role="status" className="mt-5 break-words text-sm font-medium text-green-700 dark:text-green-300">
            {notice}
          </p>
        )}

        {manage ? (
          <section className="mt-10" aria-label="英文對話管理清單">
            {visibleDocuments.length === 0 ? (
              <LibraryEmptyState>{t('library.empty.dialogueManage')}</LibraryEmptyState>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {visibleDocuments.map((document) => (
                  <DialogueCard
                    key={document.id}
                    document={document}
                    manage
                    completed={Boolean(
                      libraryCompletion[getLibraryCompletionKey({ language: 'english', practiceType: 'dialogue', id: document.id })],
                    )}
                    onStart={() => startPractice(document)}
                    onEdit={() => openEditor('edit', document)}
                    onDelete={() => setDeletingDocument(document)}
                  />
                ))}
              </div>
            )}
          </section>
        ) : selectedLevel ? (
          <section className="mt-10" aria-labelledby="english-dialogue-list-title">
            <LibraryBackButton label={t('library.backCefrLevels')} onClick={clearSelectedLevel} />
            <h2 id="english-dialogue-list-title" className="mt-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {t('library.levelDialogueTitle', { level: selectedLevel })}
            </h2>
            {visibleDocuments.length === 0 ? (
              <LibraryEmptyState className="mt-5">{t('library.empty.dialogueLevel', { level: selectedLevel })}</LibraryEmptyState>
            ) : (
              <>
                <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {visibleDocuments.map((document) => (
                    <DialogueCard
                      key={document.id}
                      document={document}
                      manage={false}
                      completed={Boolean(
                        libraryCompletion[getLibraryCompletionKey({ language: 'english', practiceType: 'dialogue', id: document.id })],
                      )}
                      onStart={() => startPractice(document)}
                      onEdit={() => openEditor('edit', document)}
                      onDelete={() => setDeletingDocument(document)}
                    />
                  ))}
                </div>
                <LibraryCompletionProgress
                  completed={
                    visibleDocuments.filter(
                      (document) =>
                        libraryCompletion[getLibraryCompletionKey({ language: 'english', practiceType: 'dialogue', id: document.id })],
                    ).length
                  }
                  total={visibleDocuments.length}
                  noun={t('library.noun.unit')}
                />
              </>
            )}
          </section>
        ) : (
          <section className="mt-10" aria-labelledby="cefr-dialogue-levels-title">
            <h2 id="cefr-dialogue-levels-title" className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {t('library.selectCefr')}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {CEFR_LEVELS.map((level) => {
                const levelDocuments = documents.filter((document) => document.level === level)
                const sentenceCount = levelDocuments.reduce((total, document) => total + document.sentences.length, 0)
                return (
                  <LibraryLevelCard
                    key={level}
                    level={level}
                    summary={t('library.dialogueUnitCount', { count: levelDocuments.length })}
                    detail={t('library.sentenceCount', { count: sentenceCount })}
                    onClick={() => setSelectedLevel(level)}
                  />
                )
              })}
            </div>
          </section>
        )}
      </div>

      <EnglishJsonDialog
        open={editorMode !== null}
        title={t(editorMode === 'edit' ? 'import.dialogue.editTitle' : 'import.dialogue.title')}
        label={t('import.dialogue.jsonLabel')}
        value={editorText}
        error={editorError}
        confirmLabel={t(editorMode === 'edit' ? 'common.saveChanges' : 'import.dialogue.validate')}
        promptKind={editorMode === 'import' ? 'english-dialogue' : undefined}
        validation={
          editorPreview && (
            <ValidationResult
              successMessage={
                editorPreview.length === 1 ? t('import.validation.dialogue') : `已驗證 ${editorPreview.length} 個英文對話單元`
              }
              summary={
                <>
                  <p>第一筆標題：{editorPreview[0].title}</p>
                  <p>程度：{editorPreview[0].level}</p>
                  <p>句數：{editorPreview.reduce((total, document) => total + document.sentences.length, 0)}</p>
                </>
              }
              checks={['title', 'sentences', 'level', 'text 與 meaning']}
              confirmLabel={t('import.dialogue.confirm')}
              onBack={() => setEditorPreview(null)}
              onConfirm={saveEditor}
            />
          )
        }
        fileInputLabel={editorMode === 'import' ? '選擇 JSON 檔案' : undefined}
        selectedFileNames={editorFileInputs.map(({ filename }) => filename ?? '')}
        onChange={(value) => {
          setEditorText(value)
          setEditorFileInputs([])
          setEditorPreview(null)
          setEditorError('')
        }}
        onFilesSelected={(files) => {
          void Promise.all(files.map(async (file) => ({ text: await file.text(), filename: file.name }))).then((inputs) => {
            setEditorText(inputs.map(({ text }) => text).join('\n\n'))
            setEditorFileInputs(inputs)
            setEditorError('')
            setEditorPreview(null)
          })
        }}
        onClose={closeEditor}
        onConfirm={editorMode === 'import' ? validateImport : saveEditor}
      />
      <EnglishDeleteDialog
        open={Boolean(deletingDocument)}
        title={t('delete.dialogue.title')}
        itemTitle={deletingDocument?.title ?? ''}
        onClose={() => setDeletingDocument(null)}
        onConfirm={deleteDocument}
      />
    </main>
  )
}
