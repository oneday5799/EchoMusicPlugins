// convert-lyrics.js
// 从宿主 convertLyrics.ts 移植：host LyricLine → AMLL LyricLine 格式转换
// 参考 D:\Code\EchoMusic\src\renderer\views\lyric\amll\convertLyrics.ts

const safeEnd = (startTime, endTime) => Math.max(endTime, startTime + 1)

const buildRubyWords = (line) => {
  const units = line.rubyUnits
  if (!units || units.length === 0) return []
  const words = []
  for (const unit of units) {
    const unitChars = unit.chars ?? []
    if (unitChars.length === 0 && !unit.text) continue
    const first = unitChars[0]
    const last = unitChars[unitChars.length - 1]
    const startTime = first?.startTime ?? unit.startTime
    const endTime = last?.endTime ?? unit.endTime
    words.push({
      startTime,
      endTime: safeEnd(startTime, endTime),
      word: unit.text,
      romanWord: unit.ruby || undefined,
    })
  }
  return words
}

const buildWords = (line, lineStart, lineEnd, withRomanization, asRuby) => {
  const chars = line.characters ?? []
  const words = []

  if (withRomanization && asRuby) {
    const rubyWords = buildRubyWords(line)
    if (rubyWords.length > 0) return rubyWords

    const romans = line.romanizedCharacters
    if (romans && romans.length === chars.length) {
      for (let index = 0; index < chars.length; index++) {
        const char = chars[index]
        if (!char?.text) continue
        words.push({
          startTime: char.startTime,
          endTime: safeEnd(char.startTime, char.endTime),
          word: char.text,
          romanWord: romans[index]?.text || undefined,
        })
      }
      if (words.length > 0) return words
    }
  }

  for (let index = 0; index < chars.length; index++) {
    const char = chars[index]
    if (!char?.text) continue
    const startTime = char.startTime
    words.push({
      startTime,
      endTime: safeEnd(startTime, char.endTime),
      word: char.text,
    })
  }

  if (words.length > 0) return words

  return [{ startTime: lineStart, endTime: safeEnd(lineStart, lineEnd), word: line.text || '' }]
}

const lineRomanizedText = (line) => {
  const romanized = line.romanized?.trim()
  if (romanized) return romanized
  return (line.romanizedCharacters ?? [])
    .map((char) => char.text)
    .join('')
    .trim()
}

/**
 * 将宿主歌词行转换为 AMLL 数据模型。
 * @param {Array} lines - 宿主 LyricLine[] (含 characters, translated, romanized 等)
 * @param {string} mode - 'translation' | 'romanization' | 'both' | 'none'
 * @param {boolean} romanizationAsRuby - 是否以注音模式显示音译
 * @returns {Array} AMLL LyricLine[]
 */
export function buildAmllLyricLines(lines, mode, romanizationAsRuby) {
  const withTranslation = mode === 'translation' || mode === 'both'
  const withRomanization = mode === 'romanization' || mode === 'both'

  return (Array.isArray(lines) ? lines : [])
    .map((line, index, sourceLines) => {
      const chars = line.characters ?? []
      const lineStart = (chars[0]?.startTime ?? Math.round((line.time || 0) * 1000)) || 0
      const lineEnd = Math.max(
        chars[chars.length - 1]?.endTime ?? lineStart + 1000,
        lineStart + 1,
      )

      return {
        words: buildWords(line, lineStart, lineEnd, withRomanization, romanizationAsRuby),
        translatedLyric: withTranslation ? (line.translated ?? '') : '',
        romanLyric: withRomanization && !romanizationAsRuby ? lineRomanizedText(line) : '',
        startTime: lineStart,
        endTime: lineEnd,
        isBG: false,
        isDuet: false,
      }
    })
    .filter((line) => line.words.length > 0)
}
