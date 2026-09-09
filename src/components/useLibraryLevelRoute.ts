import { useSearchParams } from 'react-router-dom'

export default function useLibraryLevelRoute<Level extends string>(levels: readonly Level[]) {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedLevel = searchParams.get('level')
  const selectedLevel = levels.includes(requestedLevel as Level) ? (requestedLevel as Level) : null

  const setSelectedLevel = (level: Level) => setSearchParams({ level })
  const clearSelectedLevel = () => setSearchParams({})

  return { selectedLevel, setSelectedLevel, clearSelectedLevel }
}
