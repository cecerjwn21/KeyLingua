import { translateUi } from './catalog'
import type { UiTranslationKey } from './catalog'
import { uiLocaleAtom } from '@/store'
import { useAtomValue } from 'jotai'
import { useCallback } from 'react'

export const useUiTranslation = () => {
  const locale = useAtomValue(uiLocaleAtom)
  const t = useCallback(
    (key: UiTranslationKey, parameters?: Record<string, string | number>) => translateUi(locale, key, parameters),
    [locale],
  )
  return { locale, t }
}
