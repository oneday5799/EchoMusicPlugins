export const DEFAULT_SETTINGS = {
  enhanceContrast: false,
  fontScale: 100,
  fontWeight: 850,
  enableBlur: true,
  enableScale: true,
  enableSpring: true,
  fadeWidth: 50,
  alignPosition: 48,
}

const BOOLEAN_SETTINGS = [
  'enhanceContrast',
  'enableBlur',
  'enableScale',
  'enableSpring',
]

const NUMBER_SETTINGS = {
  fontScale: [50, 200],
  fontWeight: [300, 900],
  fadeWidth: [0, 100],
  alignPosition: [0, 100],
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

export function isAllDefaults(values) {
  return Object.keys(DEFAULT_SETTINGS).every((key) => Object.is(values[key], DEFAULT_SETTINGS[key]))
}

export function validateSettings(values) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) return false
  for (const key of BOOLEAN_SETTINGS) {
    if (values[key] !== undefined && typeof values[key] !== 'boolean') return false
  }
  for (const [key, [min, max]] of Object.entries(NUMBER_SETTINGS)) {
    const value = values[key]
    if (value === undefined) continue
    if (!Number.isFinite(value) || value < min || value > max) return false
  }
  return true
}

export function normalizeSettings(value) {
  const s = value && typeof value === 'object' ? value : {}
  return {
    enhanceContrast: Boolean(s.enhanceContrast ?? DEFAULT_SETTINGS.enhanceContrast),
    fontScale: clamp(Number(s.fontScale ?? DEFAULT_SETTINGS.fontScale), ...NUMBER_SETTINGS.fontScale),
    fontWeight: clamp(Number(s.fontWeight ?? DEFAULT_SETTINGS.fontWeight), ...NUMBER_SETTINGS.fontWeight),
    enableBlur: Boolean(s.enableBlur ?? DEFAULT_SETTINGS.enableBlur),
    enableScale: Boolean(s.enableScale ?? DEFAULT_SETTINGS.enableScale),
    enableSpring: Boolean(s.enableSpring ?? DEFAULT_SETTINGS.enableSpring),
    fadeWidth: clamp(Number(s.fadeWidth ?? DEFAULT_SETTINGS.fadeWidth), ...NUMBER_SETTINGS.fadeWidth),
    alignPosition: clamp(Number(s.alignPosition ?? DEFAULT_SETTINGS.alignPosition), ...NUMBER_SETTINGS.alignPosition),
  }
}
