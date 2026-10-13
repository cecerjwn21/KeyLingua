import Loading from './components/Loading'
import './index.css'
import ArticleLibraryPage from './pages/ArticleLibrary'
import EnglishDialogueLibraryPage from './pages/English/EnglishDialogueLibraryPage'
import EnglishVocabularyLibraryPage from './pages/English/EnglishVocabularyLibraryPage'
import { ErrorBook } from './pages/ErrorBook'
import { FriendLinks } from './pages/FriendLinks'
import MobilePage from './pages/Mobile'
import TypingRoute from './pages/Typing/TypingRoute'
import VocabularyPage from './pages/Vocabulary'
import { isOpenDarkModeAtom, uiLocaleAtom } from '@/store'
import { Analytics } from '@vercel/analytics/react'
import 'animate.css'
import { useAtomValue } from 'jotai'
import mixpanel from 'mixpanel-browser'
import process from 'process'
import React, { Suspense, lazy, useEffect } from 'react'
import 'react-app-polyfill/stable'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

const AnalysisPage = lazy(() => import('./pages/Analysis'))
const GalleryPage = lazy(() => import('./pages/Gallery-N'))

if (process.env.NODE_ENV === 'production') {
  // for prod
  mixpanel.init('bdc492847e9340eeebd53cc35f321691')
} else {
  // for dev
  mixpanel.init('5474177127e4767124c123b2d7846e2a', { debug: true })
}

function Root() {
  const darkMode = useAtomValue(isOpenDarkModeAtom)
  const uiLocale = useAtomValue(uiLocaleAtom)
  useEffect(() => {
    darkMode ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark')
  }, [darkMode])
  useEffect(() => {
    document.documentElement.lang = uiLocale
  }, [uiLocale])

  return (
    <React.StrictMode>
      <BrowserRouter basename={REACT_APP_DEPLOY_ENV === 'pages' ? '/qwerty-learner' : ''}>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route index element={<ArticleLibraryPage />} />
            <Route path="/vocabulary" element={<VocabularyPage />} />
            <Route path="/typing" element={<TypingRoute />} />
            <Route path="/ja" element={<Navigate to="/ja/articles" replace />} />
            <Route path="/ja/articles" element={<ArticleLibraryPage />} />
            <Route path="/ja/articles/manage" element={<ArticleLibraryPage manage />} />
            <Route path="/ja/vocabulary" element={<VocabularyPage />} />
            <Route path="/ja/vocabulary/manage" element={<VocabularyPage manage />} />
            <Route path="/ja/typing" element={<TypingRoute language="japanese" />} />
            <Route path="/en" element={<Navigate to="/en/dialogues" replace />} />
            <Route path="/en/dialogues" element={<EnglishDialogueLibraryPage />} />
            <Route path="/en/dialogues/manage" element={<EnglishDialogueLibraryPage manage />} />
            <Route path="/en/vocabulary" element={<EnglishVocabularyLibraryPage />} />
            <Route path="/en/vocabulary/manage" element={<EnglishVocabularyLibraryPage manage />} />
            <Route path="/en/typing" element={<TypingRoute language="english" />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/error-book" element={<ErrorBook />} />
            <Route path="/friend-links" element={<FriendLinks />} />
            <Route path="/mobile" element={<MobilePage />} />
            <Route path="/*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Analytics />
    </React.StrictMode>
  )
}

const container = document.getElementById('root')

container && createRoot(container).render(<Root />)
