import KeyEventHandler from '../KeyEventHandler'
import TextAreaHandler from '../TextAreaHandler'
import { currentDictInfoAtom, isPracticeModeAtom } from '@/store'
import { useAtomValue } from 'jotai'
import type { FormEvent } from 'react'
import { useMemo } from 'react'

export default function InputHandler({ updateInput, target }: { updateInput: (updateObj: WordUpdateAction) => void; target: string }) {
  const dictInfo = useAtomValue(currentDictInfoAtom)
  const isPracticeMode = useAtomValue(isPracticeModeAtom)

  const handler = useMemo(() => {
    if (isPracticeMode) {
      return /^[\x20-\x7e]+$/.test(target) ? (
        <KeyEventHandler inputMode="physical-ascii" updateInput={updateInput} />
      ) : (
        <TextAreaHandler updateInput={updateInput} />
      )
    }

    switch (dictInfo.language) {
      case 'en':
        return <KeyEventHandler updateInput={updateInput} />
      case 'de':
        return <KeyEventHandler updateInput={updateInput} />
      case 'romaji':
        return <KeyEventHandler updateInput={updateInput} />
      case 'code':
        return <TextAreaHandler updateInput={updateInput} />
      default:
        return <TextAreaHandler updateInput={updateInput} />
    }
  }, [dictInfo.language, isPracticeMode, target, updateInput])

  return <>{handler}</>
}
export type WordUpdateAction = WordAddAction | WordDeleteAction | WordCompositionAction

export type WordAddAction = {
  type: 'add'
  value: string
  event: FormEvent<HTMLTextAreaElement> | KeyboardEvent
}

export type WordDeleteAction = {
  type: 'delete'
  length: number
}

// composition api is not ready yet
export type WordCompositionAction = {
  type: 'composition'
  value: string
}
