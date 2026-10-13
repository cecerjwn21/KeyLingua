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
import {
  type VocabularyDuplicateReview as DuplicateReview,
  applyVocabularyDuplicateDecision,
  createVocabularyContentRegistry,
  reviewVocabularyImport,
} from '@/contentRegistry/vocabularyRegistry'
import { useUiTranslation } from '@/i18n/useUiTranslation'
import ValidationResult from '@/pages/LibraryImport/ValidationResult'
import VocabularyDuplicateReview from '@/pages/LibraryImport/VocabularyDuplicateReview'
import {
  currentVocabularySetIdAtom,
  englishPracticeDocumentIdAtom,
  englishVocabularyLibraryAtom,
  englishVocabularySetIdAtom,
  getLibraryCompletionKey,
  libraryCompletionAtom,
  practiceDocumentIdAtom,
  practiceSourceAtom,
  vocabularyLibraryAtom,
} from '@/store'
import { CEFR_LEVELS } from '@/typings'
import type { EnglishVocabularySet } from '@/typings'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Pencil, Play, Settings2, Trash2, Upload } from 'lucide'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type EditorMode = 'import' | 'edit'
type EnglishVocabularyImportPreview = Exclude<ReturnType<typeof importEnglishVocabularySets>, { error: string }>

export default function EnglishVocabularyLibraryPage({ manage = false }: { manage?: boolean }) {
  const { t } = useUiTranslation()
  const [library, setLibrary] = useAtom(englishVocabularyLibraryAtom)
  const japaneseLibrary = useAtomValue(vocabularyLibraryAtom)
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
  const [duplicateReview, setDuplicateReview] = useState<DuplicateReview | null>(null)
  const [allowedNearIds, setAllowedNearIds] = useState<Set<string>>(new Set())
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
    setDuplicateReview(null)
    setAllowedNearIds(new Set())
  }

  const closeEditor = () => {
    setEditorMode(null)
    setEditingSet(null)
    setEditorFileInputs([])
    setEditorError('')
    setEditorPreview(null)
    setDuplicateReview(null)
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
    const registry = createVocabularyContentRegistry(japaneseLibrary, library)
    const unitsById = new Map(result.sets.map((unit) => [unit.id, unit]))
    const candidates = result.items.flatMap((item) => {
      const unit = unitsById.get(item.setId)
      return unit
        ? [
            {
              language: 'english' as const,
              itemId: item.id,
              unitId: unit.id,
              unitTitle: unit.title,
              level: unit.level,
              word: item.word,
              meaning: item.meaning,
            },
          ]
        : []
    })
    setEditorPreview(result)
    setDuplicateReview(reviewVocabularyImport(registry, candidates))
    setAllowedNearIds(new Set())
    setEditorError('')
  }

  const saveEditor = () => {
    if (!editingSet) {
      if (!editorPreview || !duplicateReview) return
      const acceptedIds = new Set(applyVocabularyDuplicateDecision(duplicateReview, allowedNearIds).map(({ itemId }) => itemId))
      const acceptedItems = editorPreview.items.filter(({ id }) => acceptedIds.has(id))
      const acceptedSetIds = new Set(acceptedItems.map(({ setId }) => setId))
      const acceptedSets = editorPreview.sets.filter(({ id }) => acceptedSetIds.has(id))
      setLibrary((current) => ({
        version: 1,
        sets: [...current.sets, ...acceptedSets],
        items: [...current.items, ...acceptedItems],
      }))
      setNotice(`已匯入 ${acceptedSets.length} 個英文單字題庫`)
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
          title={t(manage ? 'library.englishVocabulary.manageTitle' : 'library.englishVocabulary.title')}
          description={t(manage ? 'library.englishVocabulary.manageDescription' : 'library.englishVocabulary.description')}
          actions={
            <>
              <button type="button" className="app-button app-button-primary" onClick={() => openEditor('import')}>
                <ProductIcon icon={Upload} size={17} />
                {t('library.import')}
              </button>
              {manage ? (
                <LibraryBackButton
                  label={t('library.backVocabulary')}
                  to={selectedLevel ? `/en/vocabulary?level=${selectedLevel}` : '/en/vocabulary'}
                />
              ) : selectedLevel ? (
                <Link className="app-button app-button-secondary" to={`/en/vocabulary/manage?level=${selectedLevel}`}>
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
          <section className="mt-10" aria-label="英文單字題庫管理清單">
            {visibleSets.length === 0 ? (
              <LibraryEmptyState>{t('library.empty.englishVocabularyManage')}</LibraryEmptyState>
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
            <LibraryBackButton label={t('library.backCefrLevels')} onClick={clearSelectedLevel} />
            <h2 id="english-vocabulary-list-title" className="mt-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {t('library.levelVocabularyTitle', { level: selectedLevel })}
            </h2>
            {visibleSets.length === 0 ? (
              <LibraryEmptyState className="mt-5">{t('library.empty.englishVocabularyLevel', { level: selectedLevel })}</LibraryEmptyState>
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
                  noun={t('library.noun.set')}
                />
              </>
            )}
          </section>
        ) : (
          <section className="mt-10" aria-labelledby="cefr-vocabulary-levels-title">
            <h2 id="cefr-vocabulary-levels-title" className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {t('library.selectCefr')}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {CEFR_LEVELS.map((level) => {
                const sets = library.sets.filter((set) => set.level === level)
                const itemCount = sets.reduce((total, set) => total + library.items.filter((item) => item.setId === set.id).length, 0)
                return (
                  <LibraryLevelCard
                    key={level}
                    level={level}
                    summary={t('library.setCount', { count: sets.length })}
                    detail={t('library.wordCount', { count: itemCount })}
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
        title={t(editorMode === 'edit' ? 'import.vocabulary.editEnglishTitle' : 'import.vocabulary.englishTitle')}
        label={t('import.vocabulary.jsonLabel')}
        value={editorText}
        error={editorError}
        confirmLabel={t(editorMode === 'edit' ? 'common.saveChanges' : 'import.vocabulary.validate')}
        promptKind={editorMode === 'import' ? 'english-vocabulary' : undefined}
        validation={
          editorPreview && (
            <ValidationResult
              successMessage={
                editorPreview.sets.length === 1 ? t('import.validation.vocabulary') : `已驗證 ${editorPreview.sets.length} 個英文單字題庫`
              }
              summary={
                <>
                  <p>第一個題庫：{editorPreview.sets[0].title}</p>
                  <p>程度：{editorPreview.sets[0].level}</p>
                  <p>單字數：{editorPreview.items.length}</p>
                  {duplicateReview && (
                    <VocabularyDuplicateReview
                      review={duplicateReview}
                      allowedNearIds={allowedNearIds}
                      onAllowedNearIdsChange={setAllowedNearIds}
                    />
                  )}
                </>
              }
              checks={['title', 'items', 'level', 'word、meaning 與 source']}
              confirmLabel={t('import.vocabulary.confirm')}
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
        title={t('delete.englishVocabulary.title')}
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
  const { t } = useUiTranslation()
  return (
    <LibraryCompletionCard
      data-testid={`english-vocabulary-card-${set.id}`}
      completed={completed}
      showCompletionStatus={!manage}
      actions={
        !manage ? (
          <button type="button" className="app-button app-button-primary" disabled={itemCount === 0} onClick={onStart}>
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
      <h3 className="break-words text-xl font-semibold text-gray-900 dark:text-gray-100">{set.title}</h3>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
        CEFR：{set.level}・{itemCount} 個單字
      </p>
    </LibraryCompletionCard>
  )
}
