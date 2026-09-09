import PracticeDocumentActions from '../PracticeDocumentActions'
import Tooltip from '@/components/Tooltip'
import { mockPracticeGenerator, validateGeneratedPracticeDocument } from '@/pages/Typing/utils/practiceGeneration'
import { JAPANESE_PRACTICE_DOCUMENT_ID, scenarioPracticeDocuments } from '@/resources/practiceDocuments'
import {
  currentChapterAtom,
  chatGPTPracticeDocumentIdsAtom,
  currentDictInfoAtom,
  currentPracticeDocumentAtom,
  isPracticeModeAtom,
  isReviewModeAtom,
  pastedPracticeDocumentsAtom,
  practiceDocumentIdAtom,
} from '@/store'
import type { PracticeDocument, PracticeGenerationRequest } from '@/typings'
import range from '@/utils/range'
import { Dialog, Listbox, Transition } from '@headlessui/react'
import { useAtom, useAtomValue } from 'jotai'
import { Fragment, useState } from 'react'
import { NavLink } from 'react-router-dom'
import IconCheck from '~icons/tabler/check'

export const DictChapterButton = () => {
  const currentDictInfo = useAtomValue(currentDictInfoAtom)
  const currentPracticeDocument = useAtomValue(currentPracticeDocumentAtom)
  const isPracticeMode = useAtomValue(isPracticeModeAtom)
  const [currentChapter, setCurrentChapter] = useAtom(currentChapterAtom)
  const [, setPracticeDocumentId] = useAtom(practiceDocumentIdAtom)
  const [pastedPracticeDocuments, setPastedPracticeDocuments] = useAtom(pastedPracticeDocumentsAtom)
  const chatGPTPracticeDocumentIds = useAtomValue(chatGPTPracticeDocumentIdsAtom)
  const chapterCount = currentDictInfo.chapterCount
  const isReviewMode = useAtomValue(isReviewModeAtom)
  const [isGenerationDialogOpen, setIsGenerationDialogOpen] = useState(false)
  const [generatedPreview, setGeneratedPreview] = useState<PracticeDocument | null>(null)
  const [generationError, setGenerationError] = useState('')
  const [generationRequest, setGenerationRequest] = useState<PracticeGenerationRequest>({
    jlptLevel: 'N4',
    scenario: 'izakaya',
    length: 'medium',
    topic: '',
  })

  const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (event.key === ' ') {
      event.preventDefault()
    }
  }
  const selectJapaneseFixture = () => {
    setCurrentChapter(0)
    setPracticeDocumentId(JAPANESE_PRACTICE_DOCUMENT_ID)
  }
  const selectPracticeDocument = (document: PracticeDocument) => {
    setCurrentChapter(0)
    setPracticeDocumentId(document.id)
  }
  const returnToDictionary = () => {
    setCurrentChapter(0)
    setPracticeDocumentId(null)
  }
  const generatePracticeDocument = async () => {
    try {
      const document = await mockPracticeGenerator.generate(generationRequest)
      const validation = validateGeneratedPracticeDocument(document, generationRequest.length)
      if (!validation.valid) throw new Error('文章資料驗證失敗。')
      setGeneratedPreview(document)
      setGenerationError('')
      setIsGenerationDialogOpen(false)
    } catch {
      setGenerationError('文章產生失敗，請再試一次。')
    }
  }
  const startGeneratedPractice = () => {
    if (!generatedPreview) return
    setPastedPracticeDocuments((documents) => [generatedPreview, ...documents.filter((document) => document.id !== generatedPreview.id)])
    selectPracticeDocument(generatedPreview)
    setGeneratedPreview(null)
  }
  return (
    <>
      <Tooltip content="词典切换">
        <NavLink
          className="block rounded-lg px-3 py-1 text-lg transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white focus:outline-none dark:text-white dark:text-opacity-60 dark:hover:text-opacity-100"
          to="/gallery"
        >
          {currentPracticeDocument?.title ?? currentDictInfo.name} {isReviewMode && '错题复习'}
        </NavLink>
      </Tooltip>
      {isPracticeMode ? (
        <button
          type="button"
          onClick={returnToDictionary}
          className="rounded-lg px-3 py-1 text-lg transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white focus:outline-none dark:text-white dark:text-opacity-60 dark:hover:text-opacity-100"
        >
          切回單字模式
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-1">
          <span className="px-2 text-sm text-gray-500 dark:text-gray-400">日文練習</span>
          {scenarioPracticeDocuments.map((document) => (
            <button
              key={document.id}
              type="button"
              onClick={() => selectPracticeDocument(document)}
              className="rounded-lg px-3 py-1 text-lg transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white focus:outline-none dark:text-white dark:text-opacity-60 dark:hover:text-opacity-100"
            >
              {document.scenario}
            </button>
          ))}
          <PracticeDocumentActions onStartPractice={selectPracticeDocument} />
          <button
            type="button"
            onClick={() => {
              setGenerationError('')
              setIsGenerationDialogOpen(true)
            }}
            className="rounded-lg px-3 py-1 text-lg transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white focus:outline-none dark:text-white dark:text-opacity-60 dark:hover:text-opacity-100"
          >
            AI 產生練習文章
          </button>
          {pastedPracticeDocuments.map((document) => (
            <button
              key={document.id}
              type="button"
              onClick={() => selectPracticeDocument(document)}
              className="rounded-lg px-3 py-1 text-lg transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white focus:outline-none dark:text-white dark:text-opacity-60 dark:hover:text-opacity-100"
            >
              {chatGPTPracticeDocumentIds.includes(document.id) ? `ChatGPT｜${document.title}` : document.title}
            </button>
          ))}
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={selectJapaneseFixture}
              className="rounded-lg px-3 py-1 text-lg transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white focus:outline-none dark:text-white dark:text-opacity-60 dark:hover:text-opacity-100"
            >
              日文句子測試
            </button>
          )}
        </div>
      )}
      {!isReviewMode && (
        <Tooltip content="章节切换">
          <Listbox value={currentChapter} onChange={setCurrentChapter}>
            <Listbox.Button
              onKeyDown={handleKeyDown}
              className="rounded-lg px-3 py-1 text-lg transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white focus:outline-none dark:text-white dark:text-opacity-60 dark:hover:text-opacity-100"
            >
              第 {currentChapter + 1} 章
            </Listbox.Button>
            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
              <Listbox.Options className="listbox-options z-10 w-32">
                {range(0, chapterCount, 1).map((index) => (
                  <Listbox.Option key={index} value={index}>
                    {({ selected }) => (
                      <div className="group flex cursor-pointer items-center justify-between">
                        {selected ? (
                          <span className="listbox-options-icon">
                            <IconCheck className="focus:outline-none" />
                          </span>
                        ) : null}
                        <span>第 {index + 1} 章</span>
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </Listbox>
        </Tooltip>
      )}
      <Dialog open={isGenerationDialogOpen} onClose={setIsGenerationDialogOpen} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <Dialog.Title className="text-xl font-medium text-gray-900 dark:text-gray-100">AI 產生練習文章</Dialog.Title>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">目前使用測試生成資料</p>
            <div className="mt-4 flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-200" htmlFor="practice-generation-level">
                程度
                <select
                  id="practice-generation-level"
                  value={generationRequest.jlptLevel}
                  onChange={(event) =>
                    setGenerationRequest((request) => ({
                      ...request,
                      jlptLevel: event.target.value as PracticeGenerationRequest['jlptLevel'],
                    }))
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  {['N5', 'N4', 'N3', 'N2', 'N1'].map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-200" htmlFor="practice-generation-scenario">
                情境
                <select
                  id="practice-generation-scenario"
                  value={generationRequest.scenario}
                  onChange={(event) =>
                    setGenerationRequest((request) => ({
                      ...request,
                      scenario: event.target.value as PracticeGenerationRequest['scenario'],
                    }))
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="travel">日本旅遊</option>
                  <option value="izakaya">居酒屋／餐廳</option>
                  <option value="small-talk">陌生人閒聊</option>
                  <option value="random">隨機</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-200" htmlFor="practice-generation-length">
                篇幅
                <select
                  id="practice-generation-length"
                  value={generationRequest.length}
                  onChange={(event) =>
                    setGenerationRequest((request) => ({ ...request, length: event.target.value as PracticeGenerationRequest['length'] }))
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="short">短篇（3～5 句）</option>
                  <option value="medium">中篇（6～8 句）</option>
                  <option value="long">長篇（9～12 句）</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-200" htmlFor="practice-generation-topic">
                想練習的內容（選填）
                <input
                  id="practice-generation-topic"
                  value={generationRequest.topic ?? ''}
                  onChange={(event) => setGenerationRequest((request) => ({ ...request, topic: event.target.value }))}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="在居酒屋和隔壁桌的人聊天"
                />
              </label>
              {generationError && (
                <p role="alert" className="text-sm text-red-600">
                  {generationError}
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" className="my-btn-primary bg-gray-400" onClick={() => setIsGenerationDialogOpen(false)}>
                  取消
                </button>
                <button type="button" className="my-btn-primary" onClick={generatePracticeDocument}>
                  產生文章
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      <Dialog open={generatedPreview !== null} onClose={() => setGeneratedPreview(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <Dialog.Title className="text-xl font-medium text-gray-900 dark:text-gray-100">{generatedPreview?.title}</Dialog.Title>
            {generatedPreview && (
              <div className="mt-4 space-y-2 text-gray-700 dark:text-gray-200">
                <p>JLPT：{generatedPreview.jlptLevel}</p>
                <p>情境：{generatedPreview.scenario}</p>
                <p>句數：{generatedPreview.sentences.length} 句</p>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="my-btn-primary bg-gray-400"
                onClick={() => {
                  setGeneratedPreview(null)
                  setIsGenerationDialogOpen(true)
                }}
              >
                重新產生
              </button>
              <button type="button" className="my-btn-primary" onClick={startGeneratedPractice}>
                開始練習
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  )
}
