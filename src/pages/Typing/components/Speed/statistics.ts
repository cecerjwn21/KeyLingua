export const calculateCPM = (correctCount: number, seconds: number): number => {
  if (seconds <= 0) {
    return 0
  }

  return Math.round((correctCount / seconds) * 60)
}
