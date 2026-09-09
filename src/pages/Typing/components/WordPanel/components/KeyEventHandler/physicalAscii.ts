const shiftedDigitCharacters = ')!@#$%^&*('

const physicalAsciiPunctuation: Record<string, readonly [string, string]> = {
  Space: [' ', ' '],
  Backquote: ['`', '~'],
  Minus: ['-', '_'],
  Equal: ['=', '+'],
  BracketLeft: ['[', '{'],
  BracketRight: [']', '}'],
  Backslash: ['\\', '|'],
  Semicolon: [';', ':'],
  Quote: ["'", '"'],
  Comma: [',', '<'],
  Period: ['.', '>'],
  Slash: ['/', '?'],
}

export const getPhysicalAsciiCharacter = (
  event: Pick<KeyboardEvent, 'code' | 'shiftKey' | 'altKey' | 'ctrlKey' | 'metaKey'>,
): string | null => {
  if (event.altKey || event.ctrlKey || event.metaKey) return null

  const letter = event.code.match(/^Key([A-Z])$/)?.[1]
  if (letter) return event.shiftKey ? letter : letter.toLowerCase()

  const digit = event.code.match(/^Digit([0-9])$/)?.[1]
  if (digit) return event.shiftKey ? shiftedDigitCharacters[Number(digit)] : digit

  const punctuation = physicalAsciiPunctuation[event.code]
  return punctuation?.[event.shiftKey ? 1 : 0] ?? null
}
