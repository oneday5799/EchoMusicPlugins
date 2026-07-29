// Apple Music 风格播放页 - EchoMusic 宿主侧桥接
// 在歌词视图打开时挂载全屏覆盖层，通过 iframe 加载 Apple Music 风格播放页面，
// 并在宿主播放器状态、歌词和 iframe 页面之间转发消息。

const STORAGE_KEY = 'apple-music-style-settings'
const playModeOrder = ['sequential', 'list', 'random', 'single']

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

function getPluginFilePath(ctx, ...parts) {
  const root = String(ctx?.descriptor?.directory || '').replace(/[\\/]+$/, '')
  return [root, ...parts].filter(Boolean).join('/')
}

function text(value, fallback = '') {
  const resolved = String(value ?? '').trim()
  return resolved || fallback
}

function trackTitle(track) {
  const raw = text(track?.name || track?.title || track?.songname, '')
  if (!raw) return '未知歌曲'
  const dashIndex = raw.indexOf(' - ')
  if (dashIndex > 0) {
    const afterDash = raw.substring(dashIndex + 3).trim()
    if (afterDash) return afterDash
  }
  return raw
}

function trackArtist(track) {
  if (typeof track?.artist === 'string' && track.artist.trim()) return track.artist
  if (typeof track?.author === 'string' && track.author.trim()) return track.author
  const names = [
    ...(Array.isArray(track?.artists) ? track.artists : []),
    ...(Array.isArray(track?.singers) ? track.singers : []),
  ]
    .map((item) => item?.name || item)
    .filter(Boolean)
  return names.length ? names.join(' / ') : '未知歌手'
}

function trackCover(track) {
  return text(
    track?.coverUrl ||
      track?.cover ||
      track?.picUrl ||
      track?.albumCover ||
      track?.albumImg ||
      track?.img ||
      track?.image ||
      track?.cover_url,
  )
}

function trackArtistId(track) {
  if (track?.artistId) return Number(track.artistId)
  if (Array.isArray(track?.ar) && track.ar[0]?.id) return Number(track.ar[0].id)
  if (Array.isArray(track?.artists) && track.artists[0]?.id) return Number(track.artists[0].id)
  return null
}

function trackAlbumId(track) {
  if (track?.albumId) return Number(track.albumId)
  if (track?.al?.id) return Number(track.al.id)
  if (track?.album?.id) return Number(track.album.id)
  return null
}

function normalizeSong(song) {
  if (!song) return null
  return {
    id: String(song.id ?? song.trackId ?? song.hash ?? ''),
    hash: String(song.hash ?? song.id ?? ''),
    name: trackTitle(song),
    title: trackTitle(song),
    artist: trackArtist(song),
    artistId: trackArtistId(song),
    cover: trackCover(song),
    coverUrl: trackCover(song),
    album: text(song.album || song.albumName),
    albumId: trackAlbumId(song),
    duration: Number(song.duration || 0),
  }
}

function lyricSecondary(ctx, line) {
  const lyricStore = ctx.stores.lyric
  if (!line) return ''
  if (typeof lyricStore.lineSecondaryText === 'function') return lyricStore.lineSecondaryText(line)
  if (lyricStore.showTranslation && line.translated) return line.translated
  if (lyricStore.showRomanization && line.romanized) return line.romanized
  return ''
}

function lyricCharacters(line) {
  const characters = Array.isArray(line?.characters) ? line.characters : []
  return characters
    .map((character) => {
      const startTime = Number(character?.startTime ?? 0)
      const endTime = Number(character?.endTime ?? character?.startTime ?? 0)
      return {
        text: String(character?.text ?? ''),
        startTime: Number.isFinite(startTime) ? startTime : 0,
        endTime: Number.isFinite(endTime) ? endTime : 0,
      }
    })
    .filter((character) => character.text)
}

function normalizeLyricLine(ctx, line, index, lines) {
  const startMs = Math.max(0, Math.round(Number(line?.time || 0) * 1000))
  const nextStartMs = Math.max(0, Math.round(Number(lines[index + 1]?.time || 0) * 1000))
  return {
    time_ms: startMs,
    text: text(line?.text),
    secondary: lyricSecondary(ctx, line),
    translated: line?.translated || '',
    romanized: line?.romanized || '',
    characters: lyricCharacters(line),
    duration_ms: nextStartMs > startMs ? Math.max(400, nextStartMs - startMs) : 4800,
  }
}

// 创建承载 iframe 的覆盖层组件
function createPlayerFrame(ctx, closeOverlay) {
  const { defineComponent, h, ref, onMounted, onBeforeUnmount } = ctx.vue

  return defineComponent({
    name: 'AppleMusicBridgeFrame',
    setup() {
      const iframeRef = ref(null)
      const iframeSrc = ref('')
      const loadError = ref('')
      let ready = false
      let disposed = false
      let lastLyricsKey = ''
      let lyricStoreUnsub = null
      let lastLyricStoreKey = ''
      let stopTrackWatch = null
      let stopVolumeWatch = null
      let stopAppearanceWatch = null
      let commandQueue = Promise.resolve()
      let positionHeartbeatTimer = null

      const postToFrame = (payload) => {
        const target = iframeRef.value?.contentWindow
        if (!target) return
        target.postMessage({ ...payload, source: 'echo-amll-parent' }, '*')
      }

      const ensureLyricLoaded = () => {
        const track = ctx.player.currentTrack.value || ctx.stores.player.currentTrackSnapshot
        const hash = String(
          track?.hash || track?.id || ctx.stores.player.currentTrackId || '',
        ).trim()
        if (!hash) return
        if (
          ctx.stores.lyric.loadedHash === hash &&
          (ctx.stores.lyric.lines.length || ctx.stores.lyric.rawLyric)
        ) {
          return
        }
        void ctx.stores.lyric.fetchLyrics?.(hash, {
          preserveCurrent: true,
          track,
          duration: ctx.stores.player.duration ? ctx.stores.player.duration * 1000 : undefined,
          albumAudioId: track?.albumAudioId || track?.mixSongId,
        })
      }

      const buildLyricsPayload = () => {
        const player = ctx.stores.player
        const lyric = ctx.stores.lyric
        const current = normalizeSong(ctx.player.currentTrack.value || player.currentTrackSnapshot)
        const currentId = String(player.currentTrackId ?? current?.id ?? '')
        const hash = String(current?.hash || currentId || '').trim()
        const loadedHash = String(lyric.loadedHash || '').trim()
        const sourceLines =
          hash && loadedHash === hash && Array.isArray(lyric.lines) ? lyric.lines : []
        const lines = sourceLines
          .map((line, index) => normalizeLyricLine(ctx, line, index, sourceLines))
          .filter((line) => line.text)
        const key = [
          currentId,
          hash,
          loadedHash,
          lines
            .map((line) => [line.time_ms, line.text, line.secondary].join(':'))
            .join('|'),
        ].join('::')
        return {
          key,
          track_id: currentId,
          hash,
          lines,
          lyricsMode: pluginState?.settings?.showTranslation && pluginState?.settings?.showRomanization ? 'both'
            : pluginState?.settings?.showTranslation ? 'translation'
            : pluginState?.settings?.showRomanization ? 'romanization'
            : 'none',
        }
      }

      const buildPositionPayload = (cause) => {
        const player = ctx.stores.player
        return {
          position_ms: Math.max(0, Math.round(Number(player.currentTime || 0) * 1000)),
          duration_ms: Math.max(0, Math.round(Number(player.duration || 0) * 1000)),
          is_playing: Boolean(player.isPlaying),
          cause: cause || 'tick',
        }
      }

      const buildSnapshot = () => {
        const player = ctx.stores.player
        const current = normalizeSong(ctx.player.currentTrack.value || player.currentTrackSnapshot)

        const playlistStore = ctx.stores.playlist
        const favorites = playlistStore?.favorites || []
        const isFavorited = favorites.some((s) => String(s.id) === String(current?.id || ''))

        return {
          track: current,
          currentTrackId: String(player.currentTrackId ?? current?.id ?? ''),
          isPlaying: Boolean(player.isPlaying),
          currentTime: Number(player.currentTime || 0),
          duration: Number(player.duration || current?.duration || 0),
          volume: Number(player.volume ?? 0.8),
          playMode: String(player.playMode || 'list'),
          isFavorited,
        }
      }

      const buildAppearancePayload = () => {
        const settings = ctx.stores.settings || ctx.settings
        const pluginSettings = normalizeSettings(pluginState?.settings)
        let lyricFontFamily = ''
        try {
          if (typeof settings?.buildLyricFontFamily === 'function') {
            lyricFontFamily = settings.buildLyricFontFamily()
          }
        } catch (e) {
          console.warn('[AppleMusicBridge] 读取歌词字体失败', e)
        }
        let playedColor = 'rgba(255, 255, 255, 0.98)'
        let unplayedColor = 'rgba(255, 255, 255, 0.92)'
        let fontScale = pluginSettings.fontScale / 100
        let fontWeight = pluginSettings.fontWeight
        let textShadow = pluginSettings.enhanceContrast
          ? '0 2px 8px rgba(0,0,0,.48), 0 12px 32px rgba(0,0,0,.34)'
          : '0 2px 8px rgba(0,0,0,.26)'
        try {
          const appearance = ctx.stores.lyric?.appearance || settings?.lyricAppearance || {}
          if (appearance.fontFamily) lyricFontFamily = String(appearance.fontFamily).trim() || lyricFontFamily
        } catch (e) {}
        return {
          lyricFontFamily: String(lyricFontFamily || '').trim(),
          playedColor,
          unplayedColor,
          fontScale,
          fontWeight,
          textShadow,
          enhanceContrast: pluginSettings.enhanceContrast,
          enableBlur: pluginSettings.enableBlur,
          enableScale: pluginSettings.enableScale,
          enableSpring: pluginSettings.enableSpring,
          fadeWidth: pluginSettings.fadeWidth / 100,
          alignPosition: pluginSettings.alignPosition / 100,
        }
      }

      const pushAppearance = () => {
        postToFrame({
          type: 'echo-amll:appearance',
          payload: buildAppearancePayload(),
        })
      }

      const pushLyricsData = (force = false) => {
        if (!ready && !force) return
        ensureLyricLoaded()
        const payload = buildLyricsPayload()
        if (!force && payload.key === lastLyricsKey) return
        lastLyricsKey = payload.key
        postToFrame({
          type: 'echo-amll:lyrics-data',
          payload,
        })
      }

      const pushPosition = (cause) => {
        if (!ready) return
        postToFrame({
          type: 'echo-amll:position',
          payload: buildPositionPayload(cause),
        })
      }

      const pushSnapshot = () => {
        ensureLyricLoaded()
        postToFrame({
          type: 'echo-amll:snapshot',
          payload: buildSnapshot(),
        })
      }

      const initLyricStoreSubscription = () => {
        if (lyricStoreUnsub) return
        const lyricStore = ctx.stores.lyric
        const buildStoreKey = (state) =>
          [
            Array.isArray(state?.lines) ? state.lines.length : 0,
            String(state?.loadedHash || ''),
            Boolean(state?.isLoading) ? '1' : '0',
          ].join('::')
        lastLyricStoreKey = buildStoreKey(lyricStore)
        if (typeof lyricStore.$subscribe === 'function') {
          lyricStoreUnsub = lyricStore.$subscribe((mutation, state) => {
            const nextKey = buildStoreKey(state)
            if (nextKey === lastLyricStoreKey) return
            lastLyricStoreKey = nextKey
            pushLyricsData(false)
          })
        }
      }

      const initTrackWatch = () => {
        const getTrackId = () => {
          const player = ctx.stores.player
          const current = ctx.player.currentTrack.value || player.currentTrackSnapshot
          return String(current?.id || current?.hash || player.currentTrackId || '')
        }
        let lastId = getTrackId()
        stopTrackWatch = ctx.vue.watch(
          getTrackId,
          (newId) => {
            if (!newId || newId === lastId) return
            lastId = newId
            pushSnapshot()
            pushLyricsData(true)
            pushPosition('track_change')
          },
        )
      }

      const initVolumeWatch = () => {
        stopVolumeWatch = ctx.vue.watch(
          () => Number(ctx.stores.player.volume ?? 0.8),
          () => {
            if (!ready || disposed) return
            pushSnapshot()
          },
        )
      }

      const initAppearanceWatch = () => {
        const settings = ctx.stores.settings || ctx.settings
        stopAppearanceWatch = ctx.vue.watch(
          () => [
            String(settings?.lyricFont || ''),
            String(settings?.globalFont || ''),
          ].join('::'),
          () => {
            if (!ready || disposed) return
            pushAppearance()
          },
        )
      }

      const startPositionHeartbeat = () => {
        clearInterval(positionHeartbeatTimer)
        positionHeartbeatTimer = setInterval(() => {
          if (!ready || disposed) return
          pushPosition('tick')
        }, 500)
      }

      const stopPositionHeartbeat = () => {
        clearInterval(positionHeartbeatTimer)
        positionHeartbeatTimer = null
      }

      const cyclePlayMode = () => {
        const mode = String(ctx.stores.player.playMode || 'list')
        const index = playModeOrder.indexOf(mode)
        ctx.player.setPlayMode(playModeOrder[(index + 1) % playModeOrder.length])
      }

      const executeCommand = async (data) => {
        if (data.command === 'toggle-play') await ctx.player.toggle()
        else if (data.command === 'play') {
          if (!ctx.stores.player.isPlaying) await ctx.player.toggle()
        } else if (data.command === 'pause') {
          if (ctx.stores.player.isPlaying) await ctx.player.toggle()
        } else if (data.command === 'prev') await ctx.player.prev()
        else if (data.command === 'next') await ctx.player.next()
        else if (data.command === 'seek') ctx.player.seek(Math.max(0, Number(data.value) || 0) / 1000)
        else if (data.command === 'volume') {
          ctx.player.setVolume(Math.max(0, Math.min(1, Number(data.value) || 0)))
        }         else if (data.command === 'cycle-mode') cyclePlayMode()
        else if (data.command === 'set-list-loop') {
          ctx.player.setPlayMode('list')
        }
        else if (data.command === 'set-random') {
          ctx.player.setPlayMode('random')
        }
        else if (data.command === 'close') closeOverlay()
        else if (data.command === 'window-control') {
          const action = String(data.action || '')
          if (['minimize', 'fullscreen', 'maximize', 'close'].includes(action)) {
            window.electron?.windowControl?.(action)
          }
        }
        else if (data.command === 'toggle-favorite') {
          try {
            const playlistStore = ctx.stores.playlist
            const current = ctx.player.currentTrack.value || ctx.stores.player.currentTrackSnapshot
            if (playlistStore && current) {
              const currentId = String(current.id || current.hash || '')
              const favorites = playlistStore.favorites || []
              const isFav = favorites.some((s) => String(s.id) === currentId)
              if (isFav) {
                await playlistStore.removeFromFavorites(currentId)
              } else {
                await playlistStore.addToFavorites(current)
              }
            }
          } catch (e) {
            console.warn('[AppleMusicBridge] toggle-favorite failed', e)
          }
        }
      }

      const pushCommandResultState = () => {
        if (disposed) return
        pushSnapshot()
        pushPosition('command')
      }

      const handleCommand = (data) => {
        commandQueue = commandQueue
          .catch(() => {})
          .then(async () => {
            await executeCommand(data)
            pushCommandResultState()
          })
          .catch((error) => {
            console.warn('[AppleMusicBridge] 命令执行失败', error)
            pushCommandResultState()
          })
      }

      const handleMessage = (event) => {
        const data = event?.data
        if (!data || data.source !== 'echo-amll-child') return

        switch (data.type) {
          case 'echo-amll:ready':
            ready = true
            postToFrame({
              type: 'echo-amll:init',
              payload: {
                pluginVersion: String(ctx.manifest?.version || ''),
              },
            })
            pushSnapshot()
            pushLyricsData(true)
            pushAppearance()
            pushPosition('init')
            break
          case 'echo-amll:command':
            handleCommand(data.payload || data)
            break
        }
      }

      const handleKeydown = (event) => {
        if (event.key !== 'Escape') return
        event.preventDefault()
        event.stopPropagation()
        closeOverlay()
      }

      const loadFrame = async () => {
        const result = await ctx.fs.getFileUrl(getPluginFilePath(ctx, 'apple-music', 'bridge.html'))
        if (disposed) return
        if (!result?.ok || !result.url) {
          loadError.value = result?.error || 'Apple Music 播放器页面加载失败'
          return
        }
        iframeSrc.value = result.url
      }

      onMounted(() => {
        document.body.classList.add('applemusic-overlay-open')
        window.addEventListener('message', handleMessage)
        window.addEventListener('keydown', handleKeydown, true)
        void loadFrame()
        initLyricStoreSubscription()
        initTrackWatch()
        initVolumeWatch()
        initAppearanceWatch()
        startPositionHeartbeat()
      })

      onBeforeUnmount(() => {
        disposed = true
        ready = false
        document.body.classList.remove('applemusic-overlay-open')
        window.removeEventListener('message', handleMessage)
        window.removeEventListener('keydown', handleKeydown, true)
        stopPositionHeartbeat()
        if (lyricStoreUnsub) lyricStoreUnsub()
        lyricStoreUnsub = null
        if (stopTrackWatch) stopTrackWatch()
        stopTrackWatch = null
        if (stopVolumeWatch) stopVolumeWatch()
        stopVolumeWatch = null
        if (stopAppearanceWatch) stopAppearanceWatch()
        stopAppearanceWatch = null
      })

      const renderLoading = () =>
        h('div', { class: 'applemusic-bridge-loading' }, [
          h('div', { class: 'applemusic-bridge-loading-text' }, loadError.value || '正在加载 Apple Music 播放器...'),
          h(
            'button',
            {
              class: 'applemusic-bridge-close',
              type: 'button',
              onClick: closeOverlay,
            },
            '关闭',
          ),
        ])

      return () =>
        h(
          'div',
          {
            class: 'applemusic-bridge-page',
            role: 'dialog',
            'aria-modal': 'true',
          },
          [
            h('div', { class: 'applemusic-bridge-drag-strip' }),
            iframeSrc.value
              ? h('iframe', {
                  ref: iframeRef,
                  class: 'applemusic-bridge-frame',
                  src: iframeSrc.value,
                  allow: 'autoplay; fullscreen',
                  onLoad: () => {
                    ready = true
                    pushSnapshot()
                  },
                })
              : renderLoading(),
          ],
        )
    },
  })
}

function createPlayerOverlay(ctx, overlayOpen, closeOverlay) {
  const { defineComponent, h } = ctx.vue
  const PlayerFrame = createPlayerFrame(ctx, closeOverlay)

  return defineComponent({
    name: 'AppleMusicOverlayHost',
    setup() {
      return () => (overlayOpen.value ? h(PlayerFrame) : null)
    },
  })
}

const SETTINGS_CSS = `
.echo-amll-settings {
  display: grid;
  gap: 14px;
  color: var(--color-text-main);
}

.echo-amll-settings-row {
  display: grid;
  gap: 7px;
}

.echo-amll-settings-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.echo-amll-settings-title {
  font-size: 13px;
  font-weight: 760;
}

.echo-amll-settings-hint {
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.echo-amll-settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
`

let saveTimer = 0
const scheduleSave = (ctx) => {
  if (saveTimer) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    saveTimer = 0
    if (!pluginState) return
    ctx.storage.set(STORAGE_KEY, normalizeSettings(pluginState.settings)).catch(() => {})
  }, 240)
}

const updatePluginSettings = (ctx, patch) => {
  if (!pluginState) return
  pluginState.settings = normalizeSettings({ ...pluginState.settings, ...patch })
  scheduleSave(ctx)
}

function createSettingsComponent(ctx) {
  const { defineComponent, h, defineAsyncComponent } = ctx.vue
  const Button = defineAsyncComponent(ctx.ui.components.Button)
  const Slider = defineAsyncComponent(ctx.ui.components.Slider)
  const Switch = defineAsyncComponent(ctx.ui.components.Switch)

  const slider = (label, key, min, max, hint, formatter = (v) => String(v)) =>
    h('div', { class: 'echo-amll-settings-row' }, [
      h('div', { class: 'echo-amll-settings-line' }, [
        h('span', { class: 'echo-amll-settings-title' }, label),
        h('span', { class: 'echo-amll-settings-hint' }, formatter(pluginState.settings[key])),
      ]),
      h(Slider, {
        modelValue: pluginState.settings[key],
        min, max, step: 1,
        'onUpdate:modelValue': (value) => updatePluginSettings(ctx, { [key]: Number(value) }),
      }),
      hint ? h('div', { class: 'echo-amll-settings-hint' }, hint) : null,
    ])

  const toggle = (label, key, hint) =>
    h('div', { class: 'echo-amll-settings-row' }, [
      h('label', { class: 'echo-amll-settings-line' }, [
        h('span', { class: 'echo-amll-settings-title' }, label),
        h(Switch, {
          modelValue: Boolean(pluginState.settings[key]),
          'onUpdate:modelValue': (value) => updatePluginSettings(ctx, { [key]: Boolean(value) }),
        }),
      ]),
      hint ? h('div', { class: 'echo-amll-settings-hint' }, hint) : null,
    ])

  return defineComponent({
    name: 'AppleMusicStyleSettings',
    setup() {
      return () =>
        h('div', { class: 'echo-amll-settings' }, [
          toggle('增强对比度', 'enhanceContrast', '保留 AMLL 层次感，同时提高封面背景上的文字可读性。'),
          toggle('歌词缩放', 'enableScale', '开启当前行聚焦缩放效果。'),
          toggle('弹簧动画', 'enableSpring', '开启歌词滚动时的弹簧回弹动画。'),
          toggle('歌词模糊', 'enableBlur', '开启远离焦点行的模糊效果。'),
          toggle('显示翻译', 'showTranslation', '显示歌词的中文翻译。'),
          toggle('显示注音', 'showRomanization', '显示歌词的注音。'),
          slider(
            '字体缩放',
            'fontScale',
            50, 200,
            '调整歌词字体大小。',
            (v) => `${v}%`,
          ),
          slider(
            '字体粗细',
            'fontWeight',
            300, 900,
            '调整歌词字重。',
            (v) => String(v),
          ),
          slider(
            '对齐位置',
            'alignPosition',
            0, 100,
            '当前歌词行在页面高度中的位置。',
            (v) => `${v}%`,
          ),
          slider(
            '逐字渐变',
            'fadeWidth',
            0, 100,
            '控制逐字高亮边缘的柔和宽度。',
            (v) => `${v}%`,
          ),
          h('div', { class: 'echo-amll-settings-actions' }, [
            h(
              Button,
              {
                variant: 'outline',
                size: 'xs',
                onClick: () => updatePluginSettings(ctx, DEFAULT_SETTINGS),
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

export function activate(ctx) {
  const overlayOpen = ctx.vue.ref(false)
  let settingsDispose = null

  const initSettings = async () => {
    const stored = await ctx.storage.get(STORAGE_KEY).catch(() => null)
    pluginState = ctx.vue.reactive({ settings: normalizeSettings(stored) })
    settingsStyleDispose = ctx.css.inject(SETTINGS_CSS, { id: 'apple-music-style-settings' })
    settingsDispose = ctx.ui.settings.define({
      title: 'Apple Music 风格播放页',
      description: '调整歌词字体、动画效果和布局设置。',
      component: createSettingsComponent(ctx),
    })
  }
  void initSettings()

  const closeOverlay = () => {
    overlayOpen.value = false
    if (ctx.stores.player.isLyricViewOpen) ctx.player.toggleLyricView(false)
  }

  const openOverlay = () => {
    overlayOpen.value = true
    if (ctx.stores.player.isLyricViewOpen) ctx.player.toggleLyricView(false)
  }

  ctx.ui.teleport(createPlayerOverlay(ctx, overlayOpen, closeOverlay), {
    id: 'apple-music-style-overlay',
    className: 'applemusic-overlay-host',
  })

  const stopLyricWatch = ctx.vue.watch(
    () => ctx.stores.player.isLyricViewOpen,
    (open) => {
      if (!open) return
      openOverlay()
    },
    { immediate: true, flush: 'sync' },
  )

  ctx.dispose(() => {
    if (saveTimer) window.clearTimeout(saveTimer)
    saveTimer = 0
    stopLyricWatch()
    closeOverlay()
    settingsDispose?.()
    settingsStyleDispose?.()
    settingsDispose = null
    settingsStyleDispose = null
    pluginState = null
  })
}

export function deactivate() {}
