// Apple Music 风格播放页 - lyricsPage 皮肤插件
// 通过 ctx.ui.lyricsPage.register() 注册双栏布局皮肤，
// 左侧封面+控制，右侧 AMLL 渲染歌词。

import { createSkinComponent } from './skin.js'

export const DEFAULT_SETTINGS = {
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

const SKIN_KEY = JSON.stringify(['apple-music-style', 'apple-music'])

function createSettingsComponent(ctx) {
  const { defineComponent, h, defineAsyncComponent } = ctx.vue
  const Button = defineAsyncComponent(ctx.ui.components.Button)
  const Slider = defineAsyncComponent(ctx.ui.components.Slider)
  const Switch = defineAsyncComponent(ctx.ui.components.Switch)

  return defineComponent({
    name: 'AppleMusicStyleSettings',
    setup() {
      const skin = ctx.ui.lyricsPage.useSkin()

      const current = (key) => skin.settings.value?.[key] ?? DEFAULT_SETTINGS[key]

      const slider = (label, key, min, max, hint, formatter = (v) => String(v)) =>
        h('div', { class: 'amms-settings-row' }, [
          h('div', { class: 'amms-settings-line' }, [
            h('span', { class: 'amms-settings-title' }, label),
            h('span', { class: 'amms-settings-hint' }, formatter(current(key))),
          ]),
          h(Slider, {
            modelValue: current(key),
            min, max, step: 1,
            'onUpdate:modelValue': (value) => {
              skin.patch({ [key]: Number(value) })
            },
          }),
          hint ? h('div', { class: 'amms-settings-hint' }, hint) : null,
        ])

      const toggle = (label, key, hint) =>
        h('div', { class: 'amms-settings-row' }, [
          h('label', { class: 'amms-settings-line' }, [
            h('span', { class: 'amms-settings-title' }, label),
            h(Switch, {
              modelValue: Boolean(current(key)),
              'onUpdate:modelValue': (value) => {
                skin.patch({ [key]: Boolean(value) })
              },
            }),
          ]),
          hint ? h('div', { class: 'amms-settings-hint' }, hint) : null,
        ])

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
                onClick: () => skin.patch(DEFAULT_SETTINGS),
              },
              { default: () => '恢复默认' },
            ),
          ]),
        ])
    },
  })
}

export function activate(ctx) {
  let skinDispose = null
  let stopLyricWatch = null

  const skinComponent = createSkinComponent(ctx)

  skinDispose = ctx.ui.lyricsPage.register({
    id: 'apple-music',
    title: 'Apple Music Style',
    component: skinComponent,
    titlebar: 'host',
    tools: 'host',
    settings: {
      defaults: DEFAULT_SETTINGS,
      component: createSettingsComponent(ctx),
      validate: (values) => {
        if (values && typeof values !== 'object') return false
        return true
      },
    },
  })

  const activateSkin = () => {
    try {
      ctx.stores.settings.lyricsPageProvider = SKIN_KEY
    } catch (e) {
      console.warn('[AppleMusicStyle] 自动选中皮肤失败', e)
    }
  }

  stopLyricWatch = ctx.vue.watch(
    () => ctx.stores.player.isLyricViewOpen,
    (open) => {
      if (!open) return
      setTimeout(activateSkin, 0)
    },
    { immediate: true },
  )

  ctx.dispose(() => {
    stopLyricWatch?.()
    skinDispose?.()
    stopLyricWatch = null
    skinDispose = null
  })
}

export function deactivate() {}
