import EnglishDeleteDialog from './components/EnglishDeleteDialog'
import EnglishJsonDialog from './components/EnglishJsonDialog'
import EnglishLibraryHeader from './components/EnglishLibraryHeader'
import { importEnglishVocabularySets } from './utils/englishPractice'
import type { EnglishImportInput } from './utils/englishPractice'
import LibraryBackButton from '@/components/LibraryBackButton'
import LibraryCompletionCard from '@/components/LibraryCompletionCard'
import { LibraryCompletionProgress } from '@/components/LibraryCompletionCard'
import LibraryEmptyState from '@/components/LibraryEmptyState'
import LibraryLevelCard from '@/components/LibraryLevelCard'
import ProductIcon from '@/components/ProductIcon'
import useLibraryLevelRoute from '@/components/useLibraryLevelRoute'
import ValidationResult from '@/pages/LibraryImport/ValidationResult'
import {
  currentVocabularySetIdAtom,
  englishPracticeDocumentIdAtom,
  englishVocabularyLibraryAtom,
  englishVocabularySetIdAtom,
  getLibraryCompletionKey,
  libraryCompletionAtom,
  practiceDocumentIdAtom,
  practiceSourceAtom,
} from '@/store'
import { CEFR_LEVELS } from '@/typings'
import type { CEFRLevel, EnglishVocabularySet } from '@/typings'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Pencil, Play, Settings2, Trash2, Upload } from 'lucide'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type EditorMode = 'import' | 'edit'
type EnglishVocabularyImportPreview = Exclude<ReturnType<typeof importEnglishVocabularySets>, { error: string }>

export default function EnglishVocabularyLibraryPage({ manage = false }: { manage?: boolean }) {
  const [library, setLibrary] = useAtom(englishVocabularyLibraryAtom)
  const libraryCompletion = useAtomValue(libraryCompletionAtom)
  const setEnglishPracticeDocumentId = useSetAtom(englishPracticeDocumentIdAtom)
  const setEnglishVocabularySetId = useSetAtom(englishVocabularySetIdAtom)
  const setJapaneseDocumentId = useSetAtom(practiceDocumentIdAtom)
  const setJapaneseVocabularySetId = useSetAtom(currentVocabularySetIdAtom)
  const setPracticeSource = useSetAtom(practiceSourceAtom)
  const navigate = useNavigate()
  const { selectedLevel, setSelectedLevel, clearSelectedLevel } = useLibraryLevelRoute(CEFR_LEVELS)
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null)
  const [editingSet, setEditingSet] = useState<EnglishVocabularySet | null>(null)
  const [editorText, setEditorText] = useState('')
  const [editorFileInputs, setEditorFileInputs] = useState<EnglishImportInput[]>([])
  const [editorError, setEditorError] = useState('')
  const [editorPreview, setEditorPreview] = useState<EnglishVocabularyImportPreview | null>(null)
  const [deletingSet, setDeletingSet] = useState<EnglishVocabularySet | null>(null)
  const [notice, setNotice] = useState('')

  const openEditor = (mode: EditorMode, set?: EnglishVocabularySet) => {
    const items = set ? library.items.filter((item) => item.setId === set.id) : []
    setEditorMode(mode)
    setEditingSet(set ?? null)
    setEditorText(
      set
        ? JSON.stringify(
            {
              title: set.title,
              level: set.level,
              items: items.map(({ word, meaning, source, sourceTitle }) => ({ word, meaning, source, sourceTitle })),
            },
            null,
            2,
          )
        : '',
    )
    setEditorFileInputs([])
    setEditorError('')
    setEditorPreview(null)
  }

  const closeEditor = () => {
    setEditorMode(null)
    setEditingSet(null)
    setEditorFileInputs([])
    setEditorError('')
    setEditorPreview(null)
  }

  const validateImport = () => {
    const result = importEnglishVocabularySets(editorFileInputs.length > 0 ? editorFileInputs : [{ text: editorText }], {
      version: 1,
      sets: [],
      items: [],
    })
    if ('error' in result) {
      setEditorError(result.error)
      return
    }
    setEditorPreview(result)
    setEditorError('')
  }

  const saveEditor = () => {
    if (!editingSet) {
      if (!editorPreview) return
      setLibrary((current) => ({
        version: 1,
        sets: [...current.sets, ...editorPreview.sets],
        items: [...current.items, ...editorPreview.items],
      }))
      setNotice(`已匯入 ${editorPreview.sets.length} 個英文單字題庫`)
      closeEditor()
      return
    }

    const result = importEnglishVocabularySets(editorFileInputs.length > 0 ? editorFileInputs : [{ text: editorText }], {
      version: 1,
      sets: [],
      items: [],
    })
    if ('error' in result) {
      setEditorError(result.error)
      return
    }
    const replacementSet = { ...result.sets[0], id: editingSet.id, createdAt: editingSet.createdAt }
    const replacementItems = result.items.map((item) => ({ ...item, setId: editingSet.id }))
    setLibrary((current) => ({
      version: 1,
      sets: current.sets.map((set) => (set.id === editingSet.id ? replacementSet : set)),
      items: [...current.items.filter((item) => item.setId !== editingSet.id), ...replacementItems],
    }))
    setNotice('英文單字題庫已更新')
    closeEditor()
  }

  const startPractice = (set: EnglishVocabularySet) => {
    if (!library.items.some((item) => item.setId === set.id)) return
    setEnglishPracticeDocumentId(null)
    setEnglishVocabularySetId(set.id)
    setJapaneseDocumentId(null)
    setJapaneseVocabularySetId(null)
    setPracticeSource({ language: 'english', practiceType: 'vocabulary', id: set.id })
    navigate('/en/typing')
  }

  const deleteVocabularySet = () => {
    if (!deletingSet) return
    setLibrary((current) => ({
      version: 1,
      sets: current.sets.filter((set) => set.id !== deletingSet.id),
      items: current.items.filter((item) => item.setId !== deletingSet.id),
    }))
    setEnglishVocabularySetId((current) => (current === deletingSet.id ? null : current))
    setDeletingSet(null)
    setNotice('英文單字題庫已刪除')
  }

  const visibleSets = selectedLevel ? library.sets.filter((set) => set.level === selectedLevel) : []

  return (
    <main className="library-shell">
      <div className="mx-auto max-w-6xl">
        <EnglishLibraryHeader
          current="vocabulary"
          title={manage ? '管理英文單字題庫' : '單字庫'}
          description={manage ? '以題庫為單位編輯或刪除英文單字。' : '依 CEFR 與主題選擇有名稱的單字題庫，每次只練目前題庫。'}
          actions={
            <>
              <button type="button" className="app-button app-button-primary" onClick={() => openEditor('import')}>
                <ProductIcon icon={Upload} size={17} />
                匯入
              </button>
              {manage ? (
                <LibraryBackButton label="返回單字庫" to={selectedLevel ? `/en/vocabulary?level=${selectedLevel}` : '/en/vocabulary'} />
              ) : selectedLevel ? (
                <Link className="app-button app-button-secondary" to={`/en/vocabulary/manage?level=${selectedLevel}`}>
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
        {notice && (
          <p role="status" className="mt-5 break-words text-sm font-medium text-green-700 dark:text-green-300">
            {notice}
          </p>
        )}

        {manage ? (
          <section className="mt-10" aria-label="英文單字題庫管理清單">
            {visibleSets.length === 0 ? (
              <LibraryEmptyState>目前沒有英文單字題庫。匯入 JSON 後即可集中管理。</LibraryEmptyState>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {visibleSets.map((set) => (
                  <VocabularyCard
                    key={set.id}
                    set={set}
                    itemCount={library.items.filter((item) => item.setId === set.id).length}
                    manage
                    completed={Boolean(
                      libraryCompletion[getLibraryCompletionKey({ language: 'english', practiceType: 'vocabulary', id: set.id })],
                    )}
                    onStart={() => startPractice(set)}
                    onEdit={() => openEditor('edit', set)}
                    onDelete={() => setDeletingSet(set)}
                  />
                ))}
              </div>
            )}
          </section>
        ) : selectedLevel ? (
          <section className="mt-10" aria-labelledby="english-vocabulary-list-title">
            <LibraryBackButton label="返回 CEFR 等級" onClick={clearSelectedLevel} />
            <h2 id="english-vocabulary-list-title" className="mt-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {selectedLevel} 單字題庫
            </h2>
            {visibleSets.length === 0 ? (
              <LibraryEmptyState className="mt-5">目前沒有 {selectedLevel} 英文單字題庫。匯入後會自動依 CEFR 等級歸類。</LibraryEmptyState>
            ) : (
              <>
                <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {visibleSets.map((set) => (
                    <VocabularyCard
                      key={set.id}
                      set={set}
                      itemCount={library.items.filter((item) => item.setId === set.id).length}
                      manage={false}
                      completed={Boolean(
                        libraryCompletion[getLibraryCompletionKey({ language: 'english', practiceType: 'vocabulary', id: set.id })],
                      )}
                      onStart={() => startPractice(set)}
                      onEdit={() => openEditor('edit', set)}
                      onDelete={() => setDeletingSet(set)}
                    />
                  ))}
                </div>
                <LibraryCompletionProgress
                  completed={
                    visibleSets.filter(
                      (set) => libraryCompletion[getLibraryCompletionKey({ language: 'english', practiceType: 'vocabulary', id: set.id })],
                    ).length
                  }
                  total={visibleSets.length}
                  noun="組"
                />
              </>
            )}
          </section>
        ) : (
          <section className="mt-10" aria-labelledby="cefr-vocabulary-levels-title">
            <h2 id="cefr-vocabulary-levels-title" className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              選擇 CEFR 等級
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {CEFR_LEVELS.map((level) => {
                const sets = library.sets.filter((set) => set.level === level)
                const itemCount = sets.reduce((total, set) => total + library.items.filter((item) => item.setId === set.id).length, 0)
                return (
                  <LibraryLevelCard
                    key={level}
                    level={level}
                    summary={`${sets.length} 個題庫`}
                    detail={`${itemCount} 個單字`}
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
        title={editorMode === 'edit' ? '編輯英文單字題庫' : '匯入英文單字題庫'}
        label="單字題庫 JSON"
        value={editorText}
        error={editorError}
        confirmLabel={editorMode === 'edit' ? '儲存變更' : '驗證題庫'}
        promptKind={editorMode === 'import' ? 'english-vocabulary' : undefined}
        validation={
          editorPreview && (
            <ValidationResult
              successMessage={editorPreview.sets.length === 1 ? '單字題庫驗證成功' : `已驗證 ${editorPreview.sets.length} 個英文單字題庫`}
              summary={
                <>
                  <p>第一個題庫：{editorPreview.sets[0].title}</p>
                  <p>程度：{editorPreview.sets[0].level}</p>
                  <p>單字數：{editorPreview.items.length}</p>
                </>
              }
              checks={['title', 'items', 'level', 'word、meaning 與 source']}
              confirmLabel="確認匯入題庫"
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
        open={Boolean(deletingSet)}
        title="刪除英文單字題庫"
        itemTitle={deletingSet?.title ?? ''}
        onClose={() => setDeletingSet(null)}
        onConfirm={deleteVocabularySet}
      />
    </main>
  )
}

function VocabularyCard({
  set,
  itemCount,
  manage,
  completed,
  onStart,
  onEdit,
  onDelete,
}: {
  set: EnglishVocabularySet
  itemCount: number
  manage: boolean
  completed: boolean
  onStart: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <LibraryCompletionCard
      data-testid={`english-vocabulary-card-${set.id}`}
      completed={completed}
      showCompletionStatus={!manage}
      actions={
        !manage ? (
          <button type="button" className="app-button app-button-primary" disabled={itemCount === 0} onClick={onStart}>
            <ProductIcon icon={Play} size={16} />
            開始練習
          </button>
        ) : (
          <>
            <button type="button" className="app-button app-button-destructive" onClick={onDelete}>
              <ProductIcon icon={Trash2} size={16} />
              刪除
            </button>
            <button type="button" className="app-button app-button-secondary" onClick={onEdit}>
              <ProductIcon icon={Pencil} size={16} />
              編輯
            </button>
          </>
        )
      }
    >
      <h3 className="break-words text-xl font-semibold text-gray-900 dark:text-gray-100">{set.title}</h3>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
        CEFR：{set.level}・{itemCount} 個單字
      </p>
    </LibraryCompletionCard>
  )
}
