import {
  JLPT_LEVELS,
  findVocabularyDuplicate,
  importVocabularySets,
  validateVocabularyInput,
  validateVocabularySetTitle,
} from './utils/vocabulary'
import LibraryBackButton from '@/components/LibraryBackButton'
import LibraryCompletionCard from '@/components/LibraryCompletionCard'
import { LibraryCompletionProgress } from '@/components/LibraryCompletionCard'
import LibraryEmptyState from '@/components/LibraryEmptyState'
import LibraryLevelCard from '@/components/LibraryLevelCard'
import LibraryPageHeader from '@/components/LibraryPageHeader'
import ProductIcon from '@/components/ProductIcon'
import useLibraryLevelRoute from '@/components/useLibraryLevelRoute'
import JsonFilePicker from '@/pages/LibraryImport/JsonFilePicker'
import PromptDisclosure from '@/pages/LibraryImport/PromptDisclosure'
import ValidationResult from '@/pages/LibraryImport/ValidationResult'
import { starterJapaneseVocabulary } from '@/resources/starter/japaneseVocabulary'
import {
  currentVocabularySetIdAtom,
  englishPracticeDocumentIdAtom,
  englishVocabularySetIdAtom,
  getLibraryCompletionKey,
  libraryCompletionAtom,
  practiceDocumentIdAtom,
  practiceSourceAtom,
  vocabularyLibraryAtom,
} from '@/store'
import type { JLPTLevel, VocabularyItem, VocabularySet, VocabularySource } from '@/typings'
import { Dialog } from '@headlessui/react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Check, FileUp, Pencil, Play, Plus, Settings2, Trash2, X } from 'lucide'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type SourceFilter = 'all' | VocabularySource
type WordEditorState = Pick<VocabularyItem, 'word' | 'reading' | 'meaning' | 'source' | 'sourceTitle'>

const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const blankWordEditor = (): WordEditorState => ({ word: '', reading: '', meaning: '', source: 'manual', sourceTitle: undefined })
const starterVocabularySetIds = new Set(starterJapaneseVocabulary.sets.map(({ id }) => id))
const sourceLabel = (source: VocabularyItem['source'], setId?: string) =>
  setId && starterVocabularySetIds.has(setId) ? '內建 Starter' : source === 'article' ? '來自文章' : '手動新增'

const VocabularySetCard = ({
  set,
  count,
  source,
  completed,
  manage,
  onStart,
  onEdit,
  onDelete,
}: {
  set: VocabularySet
  count: number
  source: string
  completed: boolean
  manage: boolean
  onStart: () => void
  onEdit: () => void
  onDelete: () => void
}) => (
  <LibraryCompletionCard
    data-testid="vocabulary-set-card"
    completed={completed}
    showCompletionStatus={!manage}
    actions={
      manage ? (
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
      ) : (
        <button type="button" className="app-button app-button-primary" disabled={count === 0} onClick={onStart}>
          <ProductIcon icon={Play} size={16} />
          開始練習
        </button>
      )
    }
  >
    <h3 className="break-words text-xl font-semibold text-gray-900 dark:text-gray-100">{set.title}</h3>
    <p className="mt-3 text-gray-600 dark:text-gray-300">{count} 個單字</p>
    <p className="mt-1 break-words text-sm text-gray-500 dark:text-gray-400">來源：{source}</p>
  </LibraryCompletionCard>
)

export default function VocabularyPage({ manage = false }: { manage?: boolean }) {
  const [library, setLibrary] = useAtom(vocabularyLibraryAtom)
  const libraryCompletion = useAtomValue(libraryCompletionAtom)
  const setCurrentVocabularySetId = useSetAtom(currentVocabularySetIdAtom)
  const setPracticeDocumentId = useSetAtom(practiceDocumentIdAtom)
  const setPracticeSource = useSetAtom(practiceSourceAtom)
  const setEnglishPracticeDocumentId = useSetAtom(englishPracticeDocumentIdAtom)
  const setEnglishVocabularySetId = useSetAtom(englishVocabularySetIdAtom)
  const navigate = useNavigate()
  const { selectedLevel, setSelectedLevel, clearSelectedLevel } = useLibraryLevelRoute(JLPT_LEVELS)
  const [managingSetId, setManagingSetId] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [notice, setNotice] = useState('')

  const [isSetEditorOpen, setIsSetEditorOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<VocabularySet | null>(null)
  const [setTitle, setSetTitle] = useState('')
  const [setLevel, setSetLevel] = useState<JLPTLevel>('N5')
  const [setEditorError, setSetEditorError] = useState('')
  const [deletingSet, setDeletingSet] = useState<VocabularySet | null>(null)

  const [isWordEditorOpen, setIsWordEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<VocabularyItem | null>(null)
  const [wordEditor, setWordEditor] = useState<WordEditorState>(blankWordEditor())
  const [wordEditorError, setWordEditorError] = useState('')
  const [deletingItem, setDeletingItem] = useState<VocabularyItem | null>(null)

  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importSources, setImportSources] = useState<Array<{ text: string; filename?: string }>>([])
  const [importTitle, setImportTitle] = useState('')
  const [importPreview, setImportPreview] = useState<Exclude<ReturnType<typeof importVocabularySets>, { error: string }> | null>(null)
  const [importError, setImportError] = useState('')

  const managingSet = library.sets.find((set) => set.id === managingSetId)
  const levelSets = selectedLevel ? library.sets.filter((set) => set.jlptLevel === selectedLevel) : []
  const managingItems = managingSet ? library.items.filter((item) => item.setId === managingSet.id) : []
  const filteredItems = sourceFilter === 'all' ? managingItems : managingItems.filter((item) => (item.source ?? 'manual') === sourceFilter)

  const counts = useMemo(
    () =>
      Object.fromEntries(
        JLPT_LEVELS.map((level) => {
          const sets = library.sets.filter((set) => set.jlptLevel === level)
          const setIds = new Set(sets.map((set) => set.id))
          return [level, { sets: sets.length, items: library.items.filter((item) => setIds.has(item.setId)).length }]
        }),
      ) as Record<JLPTLevel, { sets: number; items: number }>,
    [library],
  )

  const openSetEditor = (set?: VocabularySet) => {
    setEditingSet(set ?? null)
    setSetTitle(set?.title ?? '')
    setSetLevel(set?.jlptLevel ?? selectedLevel ?? 'N5')
    setSetEditorError('')
    setIsSetEditorOpen(true)
  }

  const saveSet = () => {
    const title = validateVocabularySetTitle(setTitle)
    if (typeof title !== 'string') {
      setSetEditorError(title.error)
      return
    }
    if (editingSet) {
      setLibrary((current) => ({
        ...current,
        sets: current.sets.map((set) => (set.id === editingSet.id ? { ...set, title } : set)),
      }))
    } else {
      const set: VocabularySet = { id: createId('vocabulary-set'), title, jlptLevel: setLevel, createdAt: new Date().toISOString() }
      setLibrary((current) => ({ ...current, sets: [...current.sets, set] }))
      setSelectedLevel(setLevel)
    }
    setIsSetEditorOpen(false)
    setEditingSet(null)
  }

  const openWordEditor = (item?: VocabularyItem) => {
    if (!managingSet) return
    setEditingItem(item ?? null)
    setWordEditor(
      item
        ? { word: item.word, reading: item.reading, meaning: item.meaning, source: item.source ?? 'manual', sourceTitle: item.sourceTitle }
        : blankWordEditor(),
    )
    setWordEditorError('')
    setIsWordEditorOpen(true)
  }

  const saveWord = () => {
    if (!managingSet) return
    const candidate = validateVocabularyInput(
      { ...wordEditor, jlptLevel: managingSet.jlptLevel, setId: managingSet.id },
      editingItem?.id,
      managingSet.id,
    )
    if (typeof candidate === 'string') {
      setWordEditorError(candidate)
      return
    }
    if (findVocabularyDuplicate(candidate, library.items)) {
      setWordEditorError(`${candidate.word} 已存在於目前題庫`)
      return
    }
    setLibrary((current) => ({
      ...current,
      items: editingItem ? current.items.map((item) => (item.id === editingItem.id ? candidate : item)) : [candidate, ...current.items],
    }))
    setIsWordEditorOpen(false)
    setEditingItem(null)
  }

  const validateImport = (sources: Array<{ text: string; filename?: string }>, pastedTitle?: string) => {
    const result = importVocabularySets(sources, library, pastedTitle)
    if ('error' in result) {
      setImportPreview(null)
      setImportError(result.error)
      return
    }
    setImportPreview(result)
    setImportError('')
  }

  const readImportFiles = async (files: File[]) => {
    const sources = await Promise.all(files.map(async (file) => ({ text: await file.text(), filename: file.name })))
    setImportSources(sources)
    setImportText(sources.map(({ text }) => text).join('\n\n'))
    setImportPreview(null)
    setImportError('')
  }

  const saveImport = () => {
    if (!importPreview) return
    setLibrary((current) => ({
      ...current,
      sets: [...current.sets, ...importPreview.sets],
      items: [...current.items, ...importPreview.items],
    }))
    setNotice(`已匯入 ${importPreview.sets.length} 個題庫・${importPreview.items.length} 個單字`)
    setImportPreview(null)
    setImportText('')
    setImportSources([])
    setImportTitle('')
    setIsImportOpen(false)
  }

  const startPractice = (set: VocabularySet) => {
    if (!library.items.some((item) => item.setId === set.id)) return
    setPracticeDocumentId(null)
    setCurrentVocabularySetId(set.id)
    setEnglishPracticeDocumentId(null)
    setEnglishVocabularySetId(null)
    setPracticeSource({ language: 'japanese', practiceType: 'vocabulary', id: set.id })
    navigate('/ja/typing')
  }

  const sourceSummary = (set: VocabularySet) => {
    if (starterVocabularySetIds.has(set.id)) return '內建 Starter'
    const sources = new Set(library.items.filter((item) => item.setId === set.id).map((item) => item.source ?? 'manual'))
    if (sources.size > 1) return '混合來源'
    return sources.has('article') ? '來自文章' : '手動新增'
  }

  return (
    <main className="library-shell">
      <div className="mx-auto max-w-6xl">
        <LibraryPageHeader
          language="japanese"
          current="vocabulary"
          title={manage ? '管理日文單字題庫' : '單字庫'}
          description={manage ? '以題庫為單位編輯或刪除日文單字。' : '依 JLPT 與主題整理日文單字，每次只練目前選擇的題庫。'}
          actions={
            <>
              <button type="button" className="app-button app-button-secondary" onClick={() => openSetEditor()}>
                <ProductIcon icon={Plus} size={17} />
                新增題庫
              </button>
              <button
                type="button"
                className="app-button app-button-primary"
                onClick={() => {
                  setImportPreview(null)
                  setImportSources([])
                  setImportError('')
                  setIsImportOpen(true)
                }}
              >
                <ProductIcon icon={FileUp} size={17} />
                匯入題庫
              </button>
              {manage ? (
                <LibraryBackButton label="返回單字庫" to={selectedLevel ? `/ja/vocabulary?level=${selectedLevel}` : '/ja/vocabulary'} />
              ) : selectedLevel ? (
                <Link className="app-button app-button-secondary" to={`/ja/vocabulary/manage?level=${selectedLevel}`}>
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
          <p role="status" className="mt-5 text-sm font-medium text-green-700 dark:text-green-300">
            {notice}
          </p>
        )}

        {managingSet ? (
          <section className="mt-10">
            <LibraryBackButton
              label="返回題庫管理"
              onClick={() => {
                setManagingSetId(null)
                setSourceFilter('all')
              }}
            />
            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{managingSet.title}</h2>
                <p className="mt-1 text-gray-600 dark:text-gray-300">
                  JLPT：{managingSet.jlptLevel}・{managingItems.length} 個單字
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="my-btn-primary" onClick={() => openSetEditor(managingSet)}>
                  修改題庫名稱
                </button>
                <button type="button" className="my-btn-primary" onClick={() => openWordEditor()}>
                  新增單字
                </button>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="來源篩選">
              {(['all', 'article', 'manual'] as const).map((filter) => {
                const label = filter === 'all' ? '全部' : filter === 'article' ? '來自文章' : '手動新增'
                const active = sourceFilter === filter
                return (
                  <button
                    key={filter}
                    type="button"
                    aria-pressed={active}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? 'border-indigo-500 bg-indigo-500 text-white dark:border-indigo-400 dark:bg-indigo-500 dark:text-white'
                        : 'border-slate-300 bg-transparent text-slate-700 hover:border-indigo-400 hover:text-indigo-700 dark:border-slate-600 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-white'
                    }`}
                    onClick={() => setSourceFilter(filter)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            {filteredItems.length === 0 ? (
              <LibraryEmptyState className="mt-5">目前沒有符合條件的單字。</LibraryEmptyState>
            ) : (
              <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <article key={item.id} data-testid="vocabulary-item-card" data-vocabulary-id={item.id} className="library-card">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{item.word}</h3>
                    <p className="mt-2 text-lg text-gray-700 dark:text-gray-200">{item.reading}</p>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">{item.meaning}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                        {sourceLabel(item.source, item.setId)}
                      </span>
                      {item.sourceTitle && <span className="text-gray-500 dark:text-gray-400">{item.sourceTitle}</span>}
                    </div>
                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-indigo-300 px-3 py-1 text-indigo-700 dark:border-indigo-500 dark:text-indigo-300"
                        onClick={() => openWordEditor(item)}
                      >
                        編輯
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-red-300 px-3 py-1 text-red-700 dark:border-red-500 dark:text-red-300"
                        onClick={() => setDeletingItem(item)}
                      >
                        刪除
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : manage ? (
          <section className="mt-10" aria-label="日文單字題庫管理清單">
            {levelSets.length === 0 ? (
              <LibraryEmptyState>目前沒有日文單字題庫。建立或匯入後即可集中管理。</LibraryEmptyState>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {levelSets.map((set) => {
                  const count = library.items.filter((item) => item.setId === set.id).length
                  const completionKey = getLibraryCompletionKey({ language: 'japanese', practiceType: 'vocabulary', id: set.id })
                  return (
                    <VocabularySetCard
                      key={set.id}
                      set={set}
                      count={count}
                      source={sourceSummary(set)}
                      completed={Boolean(libraryCompletion[completionKey])}
                      manage
                      onStart={() => startPractice(set)}
                      onEdit={() => {
                        setManagingSetId(set.id)
                        setSourceFilter('all')
                      }}
                      onDelete={() => setDeletingSet(set)}
                    />
                  )
                })}
              </div>
            )}
          </section>
        ) : selectedLevel ? (
          <section className="mt-10">
            <LibraryBackButton label="返回單字庫" onClick={clearSelectedLevel} />
            <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">{selectedLevel} 單字題庫</h2>
            {levelSets.length === 0 ? (
              <LibraryEmptyState className="mt-5">目前沒有 {selectedLevel} 題庫。建立或匯入後會顯示在這裡。</LibraryEmptyState>
            ) : (
              <>
                <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {levelSets.map((set) => {
                    const count = library.items.filter((item) => item.setId === set.id).length
                    const completionKey = getLibraryCompletionKey({ language: 'japanese', practiceType: 'vocabulary', id: set.id })
                    return (
                      <VocabularySetCard
                        key={set.id}
                        set={set}
                        count={count}
                        source={sourceSummary(set)}
                        completed={Boolean(libraryCompletion[completionKey])}
                        manage={false}
                        onStart={() => startPractice(set)}
                        onEdit={() => {
                          setManagingSetId(set.id)
                          setSourceFilter('all')
                        }}
                        onDelete={() => setDeletingSet(set)}
                      />
                    )
                  })}
                </div>
                <LibraryCompletionProgress
                  completed={
                    levelSets.filter(
                      (set) => libraryCompletion[getLibraryCompletionKey({ language: 'japanese', practiceType: 'vocabulary', id: set.id })],
                    ).length
                  }
                  total={levelSets.length}
                  noun="組"
                />
              </>
            )}
          </section>
        ) : (
          <section className="mt-10">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">選擇 JLPT 等級</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {JLPT_LEVELS.map((level) => (
                <LibraryLevelCard
                  key={level}
                  level={level}
                  summary={`${counts[level].sets} 個題庫・${counts[level].items} 個單字`}
                  onClick={() => setSelectedLevel(level)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <Dialog open={isSetEditorOpen} onClose={() => setIsSetEditorOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <Dialog.Title className="text-xl font-medium text-gray-900 dark:text-gray-100">
              {editingSet ? '修改題庫名稱' : '新增題庫'}
            </Dialog.Title>
            <div className="mt-4 grid gap-4">
              <label className="text-sm text-gray-700 dark:text-gray-200">
                題庫名稱
                <input
                  aria-label="題庫名稱"
                  value={setTitle}
                  onChange={(event) => setSetTitle(event.target.value)}
                  className="mt-1 w-full rounded-lg border p-2 text-gray-900"
                />
              </label>
              {!editingSet && (
                <label className="text-sm text-gray-700 dark:text-gray-200">
                  JLPT 等級
                  <select
                    aria-label="JLPT 等級"
                    value={setLevel}
                    onChange={(event) => setSetLevel(event.target.value as JLPTLevel)}
                    className="mt-1 w-full rounded-lg border p-2 text-gray-900"
                  >
                    {JLPT_LEVELS.map((level) => (
                      <option key={level}>{level}</option>
                    ))}
                  </select>
                </label>
              )}
              {setEditorError && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-300">
                  {setEditorError}
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" className="my-btn-primary bg-gray-400" onClick={() => setIsSetEditorOpen(false)}>
                  取消
                </button>
                <button type="button" className="my-btn-primary" onClick={saveSet}>
                  {editingSet ? '儲存題庫名稱' : '建立題庫'}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <Dialog open={isWordEditorOpen} onClose={() => setIsWordEditorOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <Dialog.Title className="text-xl font-medium text-gray-900 dark:text-gray-100">
              {editingItem ? '編輯單字' : '新增單字'}
            </Dialog.Title>
            <div className="mt-4 grid gap-3">
              <label className="text-sm text-gray-700 dark:text-gray-200">
                單字
                <input
                  aria-label="單字"
                  value={wordEditor.word}
                  onChange={(event) => setWordEditor({ ...wordEditor, word: event.target.value })}
                  className="mt-1 w-full rounded-lg border p-2 text-gray-900"
                />
              </label>
              <label className="text-sm text-gray-700 dark:text-gray-200">
                讀音
                <input
                  aria-label="讀音"
                  value={wordEditor.reading}
                  onChange={(event) => setWordEditor({ ...wordEditor, reading: event.target.value })}
                  className="mt-1 w-full rounded-lg border p-2 text-gray-900"
                />
              </label>
              <label className="text-sm text-gray-700 dark:text-gray-200">
                意思
                <input
                  aria-label="意思"
                  value={wordEditor.meaning}
                  onChange={(event) => setWordEditor({ ...wordEditor, meaning: event.target.value })}
                  className="mt-1 w-full rounded-lg border p-2 text-gray-900"
                />
              </label>
              <label className="text-sm text-gray-700 dark:text-gray-200">
                來源
                <select
                  aria-label="來源"
                  value={wordEditor.source ?? 'manual'}
                  onChange={(event) => setWordEditor({ ...wordEditor, source: event.target.value as VocabularySource })}
                  className="mt-1 w-full rounded-lg border p-2 text-gray-900"
                >
                  <option value="manual">手動新增</option>
                  <option value="article">來自文章</option>
                </select>
              </label>
              {wordEditor.source === 'article' && (
                <label className="text-sm text-gray-700 dark:text-gray-200">
                  來源文章
                  <input
                    aria-label="來源文章"
                    value={wordEditor.sourceTitle ?? ''}
                    onChange={(event) => setWordEditor({ ...wordEditor, sourceTitle: event.target.value || undefined })}
                    className="mt-1 w-full rounded-lg border p-2 text-gray-900"
                  />
                </label>
              )}
              {wordEditorError && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-300">
                  {wordEditorError}
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" className="my-btn-primary bg-gray-400" onClick={() => setIsWordEditorOpen(false)}>
                  取消
                </button>
                <button type="button" className="my-btn-primary" onClick={saveWord}>
                  {editingItem ? '儲存變更' : '儲存單字'}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <Dialog open={isImportOpen} onClose={setIsImportOpen} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto p-4 sm:flex sm:items-center sm:justify-center">
          <Dialog.Panel className="mx-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            <Dialog.Title className="text-xl font-medium text-gray-900 dark:text-gray-100">匯入題庫</Dialog.Title>
            {importPreview ? (
              <ValidationResult
                successMessage={
                  importPreview.sets.length === 1
                    ? '單字題庫驗證成功'
                    : `已驗證 ${importPreview.sets.length} 個題庫・${importPreview.items.length} 個單字`
                }
                summary={
                  <>
                    <p>標題：{importPreview.sets[0].title}</p>
                    <p>程度：{importPreview.sets[0].jlptLevel}</p>
                    <p>單字數：{importPreview.items.length}</p>
                    {importPreview.duplicates.length > 0 && <p>題庫內重複單字會略過。</p>}
                  </>
                }
                checks={['word', 'reading', 'meaning', 'source', '題庫 schema']}
                confirmLabel="確認匯入題庫"
                onBack={() => setImportPreview(null)}
                onConfirm={saveImport}
              />
            ) : (
              <div className="mt-5 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1">
                <label className="text-sm text-gray-700 dark:text-gray-200">
                  題庫名稱
                  <input
                    aria-label="題庫名稱"
                    value={importTitle}
                    onChange={(event) => {
                      setImportTitle(event.target.value)
                      setImportPreview(null)
                      setImportError('')
                    }}
                    className="mt-1 w-full rounded-lg border bg-white p-2 text-base text-gray-900 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
                    placeholder="貼上舊 JSON array 時必填"
                  />
                </label>
                <label className="flex min-h-0 flex-1 flex-col gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  單字 JSON
                  <textarea
                    aria-label="單字 JSON"
                    value={importText}
                    onChange={(event) => {
                      setImportText(event.target.value)
                      setImportSources([])
                      setImportPreview(null)
                      setImportError('')
                    }}
                    className="min-h-40 sm:min-h-60 w-full flex-1 resize-y rounded-xl border border-gray-300 bg-white px-3 py-3 font-mono text-base leading-6 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100 dark:focus:ring-indigo-900"
                  />
                </label>
                <JsonFilePicker
                  selectedFileNames={importSources.map(({ filename }) => filename ?? '')}
                  onFilesSelected={(files) => void readImportFiles(files)}
                />
                <PromptDisclosure kind="japanese-vocabulary" />
                {importError && (
                  <p role="alert" className="text-sm text-red-600 dark:text-red-300">
                    {importError}
                  </p>
                )}
                <div className="flex flex-wrap justify-end gap-3">
                  <button type="button" className="app-button app-button-secondary" onClick={() => setIsImportOpen(false)}>
                    <ProductIcon icon={X} size={16} />
                    取消
                  </button>
                  <button
                    type="button"
                    className="app-button app-button-primary"
                    onClick={() =>
                      validateImport(importSources.length > 0 ? importSources : [{ text: importText }], importTitle || undefined)
                    }
                  >
                    <ProductIcon icon={Check} size={16} />
                    驗證題庫
                  </button>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      <Dialog open={deletingSet !== null} onClose={() => setDeletingSet(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <Dialog.Title className="text-xl font-medium text-gray-900 dark:text-gray-100">確定要刪除這個題庫嗎？</Dialog.Title>
            <p className="mt-2 text-gray-600 dark:text-gray-300">題庫內所有單字會一併刪除。</p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" className="app-button app-button-secondary" onClick={() => setDeletingSet(null)}>
                <ProductIcon icon={X} size={16} />
                取消
              </button>
              <button
                type="button"
                className="app-button app-button-destructive"
                onClick={() => {
                  if (deletingSet) {
                    setLibrary((current) => ({
                      ...current,
                      sets: current.sets.filter((set) => set.id !== deletingSet.id),
                      items: current.items.filter((item) => item.setId !== deletingSet.id),
                    }))
                  }
                  setDeletingSet(null)
                }}
              >
                <ProductIcon icon={Trash2} size={16} />
                確認刪除題庫
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      <Dialog open={deletingItem !== null} onClose={() => setDeletingItem(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <Dialog.Title className="text-xl font-medium text-gray-900 dark:text-gray-100">確定要刪除這個單字嗎？</Dialog.Title>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" className="app-button app-button-secondary" onClick={() => setDeletingItem(null)}>
                <ProductIcon icon={X} size={16} />
                取消
              </button>
              <button
                type="button"
                className="app-button app-button-destructive"
                onClick={() => {
                  if (deletingItem) {
                    setLibrary((current) => ({
                      ...current,
                      items: current.items.filter((item) => item.id !== deletingItem.id),
                    }))
                  }
                  setDeletingItem(null)
                }}
              >
                <ProductIcon icon={Trash2} size={16} />
                確認刪除
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </main>
  )
}
