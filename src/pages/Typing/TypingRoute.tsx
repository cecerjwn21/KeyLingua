import TypingPage from './index'
import { currentTypingPracticeAtom } from '@/store'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

export default function TypingRoute({ language }: { language?: 'japanese' | 'english' }) {
  const currentPractice = useAtomValue(currentTypingPracticeAtom)
  const [storageMounted, setStorageMounted] = useState(false)
  const location = useLocation()
  const isLegacyDictionary = new URLSearchParams(location.search).has('legacy-dictionary')

  useEffect(() => setStorageMounted(true), [])

  if (isLegacyDictionary) return <TypingPage />
  if (!storageMounted) return null
  if (currentPractice && (!language || currentPractice.language === language)) return <TypingPage />
  return <Navigate to={language === 'english' ? '/en/dialogues' : '/ja/articles'} replace />
}
