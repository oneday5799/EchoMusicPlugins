// Apple Music 风格播放页 - lyricsPage 皮肤插件
// 通过 ctx.ui.lyricsPage.register() 注册双栏布局皮肤，
// 左侧封面+控制，右侧 AMLL 渲染歌词。

import { createSkinComponent } from './skin.js'

const STORAGE_KEY = 'apple-music-style-settings'

const DEFAULT_SETTINGS = {
  enhanceContrast: false,
  fontScale: 100,
  fontWeight: 850,
  enableBlur: true,
  enableScale: true,
  enableSpring: true,
  fadeWidth: 50,
  alignPosition: 48,
  showTranslation: false,
  showRomanization: false,
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

function normalizeSettings(value) {
  const s = value && typeof value === 'object' ? value : {}
  return {
    enhanceContrast: Boolean(s.enhanceContrast ?? DEFAULT_SETTINGS.enhanceContrast),
    fontScale: clamp(Number(s.fontScale ?? DEFAULT_SETTINGS.fontScale), 50, 200),
    fontWeight: clamp(Number(s.fontWeight ?? DEFAULT_SETTINGS.fontWeight), 300, 900),
    enableBlur: Boolean(s.enableBlur ?? DEFAULT_SETTINGS.enableBlur),
    enableScale: Boolean(s.enableScale ?? DEFAULT_SETTINGS.enableScale),
    enableSpring: Boolean(s.enableSpring ?? DEFAULT_SETTINGS.enableSpring),
    fadeWidth: clamp(Number(s.fadeWidth ?? DEFAULT_SETTINGS.fadeWidth), 0, 100),
    alignPosition: clamp(Number(s.alignPosition ?? DEFAULT_SETTINGS.alignPosition), 0, 100),
    showTranslation: Boolean(s.showTranslation ?? DEFAULT_SETTINGS.showTranslation),
    showRomanization: Boolean(s.showRomanization ?? DEFAULT_SETTINGS.showRomanization),
  }
}

const SETTINGS_CSS = `
.amms-settings {
  display: grid;
  gap: 14px;
  color: var(--color-text-main);
}
.amms-settings-row {
  display: grid;
  gap: 7px;
}
.amms-settings-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}
.amms-settings-title {
  font-size: 13px;
  font-weight: 760;
}
.amms-settings-hint {
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.45;
}
.amms-settings-actions {
  display: justify;
  justify-content: flex-end;
  gap: 8px;
}
`

let saveTimer = 0
const scheduleSave = (ctx, getSettings) => {
  if (saveTimer) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    saveTimer = 0
    const s = getSettings()
    if (s) ctx.storage.set(STORAGE_KEY, normalizeSettings(s)).catch(() => {})
  }, 240)
}

function createSettingsComponent(ctx, getSettings, updateSettings) {
  const { defineComponent, h, defineAsyncComponent } = ctx.vue
  const Button = defineAsyncComponent(ctx.ui.components.Button)
  const Slider = defineAsyncComponent(ctx.ui.components.Slider)
  const Switch = defineAsyncComponent(ctx.ui.components.Switch)

  const slider = (label, key, min, max, hint, formatter = (v) => String(v)) =>
    h('div', { class: 'amms-settings-row' }, [
      h('div', { class: 'amms-settings-line' }, [
        h('span', { class: 'amms-settings-title' }, label),
        h('span', { class: 'amms-settings-hint' }, formatter(getSettings()[key])),
      ]),
      h(Slider, {
        modelValue: getSettings()[key],
        min, max, step: 1,
        'onUpdate:modelValue': (value) => {
          updateSettings({ [key]: Number(value) })
          scheduleSave(ctx, getSettings)
        },
      }),
      hint ? h('div', { class: 'amms-settings-hint' }, hint) : null,
    ])

  const toggle = (label, key, hint) =>
    h('div', { class: 'amms-settings-row' }, [
      h('label', { class: 'amms-settings-line' }, [
        h('span', { class: 'amms-settings-title' }, label),
        h(Switch, {
          modelValue: Boolean(getSettings()[key]),
          'onUpdate:modelValue': (value) => {
            updateSettings({ [key]: Boolean(value) })
            scheduleSave(ctx, getSettings)
          },
        }),
      ]),
      hint ? h('div', { class: 'amms-settings-hint' }, hint) : null,
    ])

  return defineComponent({
    name: 'AppleMusicStyleSettings',
    setup() {
      return () =>
        h('div', { class: 'amms-settings' }, [
          toggle('增强对比度', 'enhanceContrast', '保留 AMLL 层次感，同时提高封面背景上的文字可读性。'),
          toggle('歌词缩放', 'enableScale', '开启当前行聚焦缩放效果。'),
          toggle('弹簧动画', 'enableSpring', '开启歌词滚动时的弹簧回弹动画。'),
          toggle('歌词模糊', 'enableBlur', '开启远离焦点行的模糊效果。'),
          toggle('显示翻译', 'showTranslation', '显示歌词的中文翻译。'),
          toggle('显示注音', 'showRomanization', '显示歌词的注音。'),
          slider('字体缩放', 'fontScale', 50, 200, '调整歌词字体大小。', (v) => `${v}%`),
          slider('字体粗细', 'fontWeight', 300, 900, '调整歌词字重。', (v) => String(v)),
          slider('对齐位置', 'alignPosition', 0, 100, '当前歌词行在页面高度中的位置。', (v) => `${v}%`),
          slider('逐字渐变', 'fadeWidth', 0, 100, '控制逐字高亮边缘的柔和宽度。', (v) => `${v}%`),
          h('div', { class: 'amms-settings-actions' }, [
            h(
              Button,
              {
                variant: 'outline',
                size: 'xs',
                onClick: () => {
                  updateSettings(DEFAULT_SETTINGS)
                  scheduleSave(ctx, getSettings)
                },
              },
              { default: () => '恢复默认' },
            ),
          ]),
        ])
    },
  })
}

let pluginState = null
let settingsStyleDispose = null

const SKIN_KEY = JSON.stringify(['apple-music-style', 'apple-music'])

export function activate(ctx) {
  let settingsDispose = null
  let skinDispose = null
  let stopLyricWatch = null

  const getSettings = () => pluginState?.settings
  const updateSettings = (patch) => {
    if (!pluginState) return
    pluginState.settings = normalizeSettings({ ...pluginState.settings, ...patch })
  }

  const activateSkin = () => {
    try {
      ctx.stores.settings.lyricsPageProvider = SKIN_KEY
    } catch (e) {
      console.warn('[AppleMusicStyle] 自动选中皮肤失败', e)
    }
  }

  const initSettings = async () => {
    const stored = await ctx.storage.get(STORAGE_KEY).catch(() => null)
    pluginState = ctx.vue.reactive({ settings: normalizeSettings(stored) })
    settingsStyleDispose = ctx.css.inject(SETTINGS_CSS, { id: 'apple-music-style-settings' })
    settingsDispose = ctx.ui.settings.define({
      title: 'Apple Music 风格播放页',
      description: '调整歌词字体、动画效果和布局设置。',
      component: createSettingsComponent(ctx, getSettings, updateSettings),
    })
  }
  void initSettings()

  const skinComponent = createSkinComponent(ctx)

  skinDispose = ctx.ui.lyricsPage.register({
    id: 'apple-music',
    title: 'Apple Music Style',
    component: skinComponent,
    titlebar: 'host',
    tools: 'host',
    settings: {
      defaults: DEFAULT_SETTINGS,
      component: createSettingsComponent(ctx, getSettings, updateSettings),
      validate: (values) => {
        if (values && typeof values !== 'object') return false
        return true
      },
    },
  })

  // 自动选中皮肤：歌词页打开时自动切换到本插件皮肤
  const currentProvider = () => ctx.stores.settings.lyricsPageProvider
  stopLyricWatch = ctx.vue.watch(
    () => ctx.stores.player.isLyricViewOpen,
    (open) => {
      if (!open) return
      // 延迟一帧等待宿主歌词页初始化后再切换
      setTimeout(activateSkin, 0)
    },
    { immediate: true },
  )

  ctx.dispose(() => {
    if (saveTimer) window.clearTimeout(saveTimer)
    saveTimer = 0
    stopLyricWatch?.()
    skinDispose?.()
    settingsDispose?.()
    settingsStyleDispose?.()
    stopLyricWatch = null
    skinDispose = null
    settingsDispose = null
    settingsStyleDispose = null
    pluginState = null
  })
}

export function deactivate() {}
