// Apple Music 风格播放页 - lyricsPage 皮肤插件
// 通过 ctx.ui.lyricsPage.register() 注册双栏布局皮肤，
// 左侧封面+控制，右侧 AMLL 渲染歌词。

import { createSkinComponent } from './skin.js'
import preview from './preview.js'
import { DEFAULT_SETTINGS, isAllDefaults, validateSettings } from './settings.js'

export { DEFAULT_SETTINGS }

const SKIN_ID = 'apple-music'
const AUTO_SELECT_KEY = 'apple-music-style-auto-select'

function patchStoredSkinConfig(store, skinKey, patchData) {
  const current = {
    ...DEFAULT_SETTINGS,
    ...(store.lyricsPageSkinConfigs[skinKey] ?? {}),
  }
  const next = { ...current, ...patchData }
  if (!validateSettings(next)) return false
  if (isAllDefaults(next)) {
    store.resetLyricSkinConfig(skinKey)
    return true
  }
  const overrides = {}
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (!Object.is(next[key], DEFAULT_SETTINGS[key])) overrides[key] = next[key]
  }
  store.patchLyricSkinConfig(skinKey, overrides)
  return true
}

function buildSettingsUI(h, Button, Slider, Switch, getCurrent, onPatch) {
  const slider = (label, key, min, max, hint, formatter = (v) => String(v)) => {
    const current = getCurrent()[key]
    return h('div', { class: 'amms-settings-row' }, [
      h('div', { class: 'amms-settings-line' }, [
        h('span', { class: 'amms-settings-title' }, label),
        h('span', { class: 'amms-settings-hint' }, formatter(current)),
      ]),
      h(Slider, {
        modelValue: current,
        min, max, step: 1,
        'aria-label': label,
        'onUpdate:modelValue': (value) => onPatch({ [key]: Number(value) }),
      }),
      hint ? h('div', { class: 'amms-settings-hint' }, hint) : null,
    ])
  }

  const toggle = (label, key, hint) =>
    h('div', { class: 'amms-settings-row' }, [
      h('div', { class: 'amms-settings-line' }, [
        h('span', { class: 'amms-settings-title' }, label),
        h(Switch, {
          modelValue: Boolean(getCurrent()[key]),
          'aria-label': label,
          'onUpdate:modelValue': (value) => onPatch({ [key]: Boolean(value) }),
        }),
      ]),
      hint ? h('div', { class: 'amms-settings-hint' }, hint) : null,
    ])

  return h('div', { class: 'amms-settings' }, [
    toggle('增强对比度', 'enhanceContrast', '保留 AMLL 层次感，同时提高封面背景上的文字可读性。'),
    toggle('歌词缩放', 'enableScale', '开启当前行聚焦缩放效果。'),
    toggle('弹簧动画', 'enableSpring', '开启歌词滚动时的弹簧回弹动画。'),
    toggle('歌词模糊', 'enableBlur', '开启远离焦点行的模糊效果。'),
    slider('字体缩放', 'fontScale', 50, 200, '调整歌词字体大小。', (v) => `${v}%`),
    slider('字体粗细', 'fontWeight', 300, 900, '调整歌词字重。'),
    slider('对齐位置', 'alignPosition', 0, 100, '当前歌词行在页面高度中的位置。', (v) => `${v}%`),
    slider('逐字渐变', 'fadeWidth', 0, 100, '控制逐字高亮边缘的柔和宽度。', (v) => `${v}%`),
    h('div', { class: 'amms-settings-actions' }, [
      h(
        Button,
        { variant: 'outline', size: 'xs', onClick: () => onPatch(DEFAULT_SETTINGS) },
        { default: () => '恢复默认' },
      ),
    ]),
  ])
}

function createGlobalSettingsComponent(ctx, skinKey) {
  const { defineComponent, h, defineAsyncComponent } = ctx.vue
  const Button = defineAsyncComponent(ctx.ui.components.Button)
  const Slider = defineAsyncComponent(ctx.ui.components.Slider)
  const Switch = defineAsyncComponent(ctx.ui.components.Switch)

  return defineComponent({
    name: 'AppleMusicStyleGlobalSettings',
    setup() {
      const store = ctx.stores.settings
      const getCurrent = () => ({
        ...DEFAULT_SETTINGS,
        ...(store.lyricsPageSkinConfigs[skinKey] ?? {}),
      })
      const onPatch = (data) => {
        patchStoredSkinConfig(store, skinKey, data)
      }
      return () => buildSettingsUI(h, Button, Slider, Switch, getCurrent, onPatch)
    },
  })
}

function createSkinDrawerSettingsComponent(ctx) {
  const { defineComponent, h, defineAsyncComponent } = ctx.vue
  const Button = defineAsyncComponent(ctx.ui.components.Button)
  const Slider = defineAsyncComponent(ctx.ui.components.Slider)
  const Switch = defineAsyncComponent(ctx.ui.components.Switch)

  return defineComponent({
    name: 'AppleMusicStyleSkinSettings',
    setup() {
      const skin = ctx.ui.lyricsPage.useSkin()
      const getCurrent = () => skin.settings.value || {}
      const onPatch = (data) => {
        const next = { ...getCurrent(), ...data }
        if (isAllDefaults(next)) skin.reset()
        else skin.patch(data)
      }
      return () => buildSettingsUI(h, Button, Slider, Switch, getCurrent, onPatch)
    },
  })
}

function createAutoSelectSkinTask(ctx, skinKey) {
  let disposed = false
  let running = false
  let timer = 0

  const selectOnce = async () => {
    if (disposed || running) return
    running = true
    try {
      const selected = await ctx.storage.get(AUTO_SELECT_KEY)
      if (disposed || selected) return
      const provider = String(ctx.stores.settings.lyricsPageProvider || '').trim()
      if (!provider || provider === 'host' || provider === 'host:cover') {
        ctx.stores.settings.lyricsPageProvider = skinKey
      }
      await ctx.storage.set(AUTO_SELECT_KEY, true)
    } catch (error) {
      console.warn('[AppleMusicStyle] 自动选中皮肤失败', error)
    } finally {
      running = false
    }
  }

  const schedule = () => {
    if (disposed) return
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      timer = 0
      void selectOnce()
    }, 0)
  }

  const dispose = () => {
    disposed = true
    if (timer) window.clearTimeout(timer)
    timer = 0
  }

  return { schedule, dispose }
}

export async function activate(ctx) {
  const skinKey = JSON.stringify([ctx.id, SKIN_ID])
  const skinComponent = createSkinComponent(ctx)

  const settingsDispose = ctx.ui.settings.define({
    title: 'Apple Music Style',
    description: '调整歌词字体、动画效果和布局设置。',
    component: createGlobalSettingsComponent(ctx, skinKey),
  })

  const skinDispose = ctx.ui.lyricsPage.register({
    id: SKIN_ID,
    title: 'Apple Music Style',
    component: skinComponent,
    titlebar: 'host',
    tools: 'host',
    preview,
    settings: {
      defaults: { ...DEFAULT_SETTINGS },
      component: createSkinDrawerSettingsComponent(ctx),
      validate: validateSettings,
    },
  })

  const autoSelectSkinTask = createAutoSelectSkinTask(ctx, skinKey)
  const stopLyricWatch = ctx.vue.watch(
    () => ctx.stores.player.isLyricViewOpen,
    (open) => {
      if (open) autoSelectSkinTask.schedule()
    },
    { immediate: true },
  )

  ctx.dispose(() => {
    autoSelectSkinTask.dispose()
    stopLyricWatch()
    skinDispose()
    settingsDispose()
  })
}

export function deactivate() {}