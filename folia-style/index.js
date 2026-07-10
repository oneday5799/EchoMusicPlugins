// Folia 歌词插件 - EchoMusic 宿主侧桥接
// 负责在歌词视图打开时挂载全屏覆盖层，通过 iframe 加载 Folia 播放器页面，
// 并在宿主播放器状态、歌词、频谱数据和 iframe 页面之间转发消息。

const LEGACY_PAGE_PATH = '/main/plugin/folia-style/player'
const FALLBACK_PATH = '/main/home'

// 宿主播放器的播放模式顺序
const playModeOrder = ['sequential', 'list', 'random', 'single']

// 兼容旧版插件路由
function isLegacyPluginPlayerPath(path) {
  return String(path || '').startsWith(LEGACY_PAGE_PATH)
}

// 从宿主路由对象中提取当前路径
function getRoutePath(ctx) {
  const route = ctx?.router?.currentRoute?.value
  return String(route?.fullPath || route?.path || '')
}

// 拼接插件内文件路径
function getPluginFilePath(ctx, ...parts) {
  const root = String(ctx?.descriptor?.directory || '').replace(/[\\/]+$/, '')
  return [root, ...parts].filter(Boolean).join('/')
}

// 统一处理外部字段
function text(value, fallback = '') {
  const resolved = String(value ?? '').trim()
  return resolved || fallback
}

// 提取歌曲标题
function trackTitle(track) {
  return text(track?.title || track?.name || track?.songname, '未知歌曲')
}

// 提取歌手名
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

// 提取歌手对象数组 [{id, name}]，去重
function trackArtists(track) {
  const raw = [
    ...(Array.isArray(track?.ar) ? track.ar : []),
    ...(Array.isArray(track?.artists) ? track.artists : []),
    ...(Array.isArray(track?.singers) ? track.singers : []),
  ]
  const seen = new Set()
  const result = []
  for (const item of raw) {
    const id = Number(item?.id || 0)
    const name = String(item?.name || item || '').trim()
    if (!name) continue
    const key = id ? String(id) : name
    if (seen.has(key)) continue
    seen.add(key)
    result.push({ id, name })
  }
  if (result.length) return result
  // 兜底：从 artist 字符串拆分
  const artistStr = trackArtist(track)
  if (artistStr && artistStr !== '未知歌手') {
    const id = trackArtistId(track)
    return artistStr.split(/\s*[\/、]\s*/).filter(Boolean).map((name) => ({ id, name }))
  }
  return []
}

// 提取封面地址
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

// 提取歌手 ID
function trackArtistId(track) {
  if (track?.artistId) return Number(track.artistId)
  if (Array.isArray(track?.ar) && track.ar[0]?.id) return Number(track.ar[0].id)
  if (Array.isArray(track?.artists) && track.artists[0]?.id) return Number(track.artists[0].id)
  return null
}

// 提取专辑 ID
function trackAlbumId(track) {
  if (track?.albumId) return Number(track.albumId)
  if (track?.al?.id) return Number(track.al.id)
  if (track?.album?.id) return Number(track.album.id)
  return null
}

// 归一化歌曲对象
function normalizeSong(song) {
  if (!song) return null
  return {
    id: String(song.id ?? song.trackId ?? song.hash ?? ''),
    hash: String(song.hash ?? song.id ?? ''),
    name: trackTitle(song),
    title: trackTitle(song),
    artist: trackArtist(song),
    artists: trackArtists(song),
    artistId: trackArtistId(song),
    cover: trackCover(song),
    coverUrl: trackCover(song),
    album: text(song.album || song.albumName),
    albumId: trackAlbumId(song),
    duration: Number(song.duration || 0),
  }
}

// 提取副歌词（翻译或罗马音）
function lyricSecondary(ctx, line) {
  const lyricStore = ctx.stores.lyric
  if (!line) return ''
  if (typeof lyricStore.lineSecondaryText === 'function') return lyricStore.lineSecondaryText(line)
  if (lyricStore.showTranslation && line.translated) return line.translated
  if (lyricStore.showRomanization && line.romanized) return line.romanized
  return ''
}

// 归一化逐字歌词时间轴
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

// 将宿主歌词行转换为 iframe 使用的毫秒结构
function normalizeLyricLine(ctx, line, index, lines) {
  const startMs = Math.max(0, Math.round(Number(line?.time || 0) * 1000))
  const nextStartMs = Math.max(0, Math.round(Number(lines[index + 1]?.time || 0) * 1000))
  return {
    time_ms: startMs,
    text: text(line?.text),
    secondary: lyricSecondary(ctx, line),
    characters: lyricCharacters(line),
    duration_ms: nextStartMs > startMs ? Math.max(400, nextStartMs - startMs) : 4800,
  }
}

// 创建承载 iframe 的覆盖层组件
function createPlayerFrame(ctx, closeOverlay) {
  const { defineComponent, h, ref, onMounted, onBeforeUnmount } = ctx.vue

  return defineComponent({
    name: 'FoliaBridgeFrame',
    setup() {
      const iframeRef = ref(null)
      const iframeSrc = ref('')
      const loadError = ref('')
      let ready = false
      let disposed = false
      let lastLyricsKey = ''
      let lastSpectrumFrame = null
      let spectrumDispose = null
      let lyricStoreUnsub = null
      let lastLyricStoreKey = ''
      let stopTrackWatch = null
      let stopVolumeWatch = null
      let commandQueue = Promise.resolve()
      let positionHeartbeatTimer = null

      // 向 iframe 发送消息
      const postToFrame = (payload) => {
        const target = iframeRef.value?.contentWindow
        if (!target) return
        target.postMessage(
          {
            ...payload,
            source: 'echo-folia-parent',
          },
          '*',
        )
      }

      // 获取当前队列状态
      const getQueueState = () => {
        const activeQueue =
          ctx.playlist.activeQueue?.value ||
          ctx.playlist.getActiveQueue?.() ||
          ctx.stores.playlist.activeQueue ||
          null
        const songs = Array.isArray(activeQueue?.songs) ? activeQueue.songs : []
        return {
          queueId: activeQueue?.id ?? ctx.stores.playlist.activeQueueId ?? null,
          currentTrackId: activeQueue?.currentTrackId ?? null,
          songs,
        }
      }

      // 确保歌词已加载
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

      // 构造歌词 payload
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
            .map((line) =>
              [
                line.time_ms,
                line.text,
                line.secondary,
                line.characters
                  .map((character) =>
                    [character.text, character.startTime, character.endTime].join(','),
                  )
                  .join(';'),
              ].join(':'),
            )
            .join('|'),
        ].join('::')

        return {
          key,
          track_id: currentId,
          hash,
          lines,
          tips: lyric.isLoading ? '歌词加载中...' : lyric.tips || '',
        }
      }

      // 构造位置 payload
      const buildPositionPayload = (cause) => {
        const player = ctx.stores.player
        return {
          position_ms: Math.max(0, Math.round(Number(player.currentTime || 0) * 1000)),
          duration_ms: Math.max(0, Math.round(Number(player.duration || 0) * 1000)),
          is_playing: Boolean(player.isPlaying),
          cause: cause || 'tick',
        }
      }

      // 构造完整快照
      const buildSnapshot = () => {
        const player = ctx.stores.player
        const lyric = ctx.stores.lyric
        const current = normalizeSong(ctx.player.currentTrack.value || player.currentTrackSnapshot)
        const queueState = getQueueState()
        const queue = queueState.songs.map(normalizeSong).filter(Boolean)
        const currentId = String(player.currentTrackId ?? current?.id ?? '')
        const currentQueueTrackId = String(queueState.currentTrackId ?? currentId)
        const currentQueueIndex = queue.findIndex((song) => String(song.id) === currentQueueTrackId)

        // 检查当前歌曲是否已收藏
        const playlistStore = ctx.stores.playlist
        const favorites = playlistStore?.favorites || []
        const isFavorited = favorites.some((s) => String(s.id) === String(current?.id || ''))

        // 封面模糊背景状态
        const settingStore = ctx.stores.settings || ctx.settings
        const coverBlur = Boolean(settingStore?.lyricPageBackgroundBlur)

        return {
          track: current,
          currentTrackId: currentId,
          currentQueueIndex,
          queue,
          queueId: queueState.queueId,
          isPlaying: Boolean(player.isPlaying),
          currentTime: Number(player.currentTime || 0),
          duration: Number(player.duration || current?.duration || 0),
          volume: Number(player.volume ?? 0.8),
          playMode: String(player.playMode || 'list'),
          isFavorited,
          coverBlur,
          lyric: {
            currentIndex: Number(lyric.currentIndex ?? -1),
            tips: lyric.isLoading ? '歌词加载中...' : lyric.tips || '',
          },
        }
      }

      // 构造宿主控制能力 payload
      const buildHostControlsPayload = () => ({
        platform: String(window.electron?.platform || ''),
        showFullscreenButton:
          (ctx.stores.settings || ctx.settings)?.showFullscreenButton !== false,
        canShowMiniPlayer: typeof window.electron?.miniPlayer?.show === 'function',
      })

      // 推送歌词
      const pushLyrics = (force = false) => {
        if (!ready && !force) return
        ensureLyricLoaded()
        const payload = buildLyricsPayload()
        if (!force && payload.key === lastLyricsKey) return
        lastLyricsKey = payload.key
        postToFrame({
          type: 'echo-folia:lyrics',
          payload,
        })
      }

      // 推送位置
      const pushPosition = (cause) => {
        if (!ready) return
        postToFrame({
          type: 'echo-folia:position',
          payload: buildPositionPayload(cause),
        })
      }

      // 推送完整快照
      const pushSnapshot = (force = false) => {
        if (!ready && !force) return
        ensureLyricLoaded()
        postToFrame({
          type: 'echo-folia:snapshot',
          payload: buildSnapshot(),
        })
      }

      // 订阅歌词 store
      const initLyricStoreSubscription = () => {
        if (lyricStoreUnsub) return
        const lyricStore = ctx.stores.lyric
        const buildStoreKey = (state) =>
          [
            Array.isArray(state?.lines) ? state.lines.length : 0,
            String(state?.loadedHash || ''),
            Boolean(state?.isLoading) ? '1' : '0',
            String(state?.tips || ''),
          ].join('::')
        lastLyricStoreKey = buildStoreKey(lyricStore)
        if (typeof lyricStore.$subscribe === 'function') {
          lyricStoreUnsub = lyricStore.$subscribe((mutation, state) => {
            const nextKey = buildStoreKey(state)
            if (nextKey === lastLyricStoreKey) return
            lastLyricStoreKey = nextKey
            pushLyrics(false)
          })
        }
      }

      // 监听曲目切换
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
            pushSnapshot(true)
            pushLyrics(true)
            pushPosition('track_change')
          },
        )
      }

      // 监听音量变更
      const initVolumeWatch = () => {
        stopVolumeWatch = ctx.vue.watch(
          () => Number(ctx.stores.player.volume ?? 0.8),
          () => {
            if (!ready || disposed) return
            pushSnapshot(true)
          },
        )
      }

      // 位置心跳
      const startPositionHeartbeat = () => {
        clearInterval(positionHeartbeatTimer)
        positionHeartbeatTimer = setInterval(() => {
          if (!ready || disposed) return
          pushPosition('tick')
        }, 5000)
      }

      const stopPositionHeartbeat = () => {
        clearInterval(positionHeartbeatTimer)
        positionHeartbeatTimer = null
      }

      // 循环播放模式
      const cyclePlayMode = () => {
        const mode = String(ctx.stores.player.playMode || 'list')
        const index = playModeOrder.indexOf(mode)
        ctx.player.setPlayMode(playModeOrder[(index + 1) % playModeOrder.length])
      }

      // 获取队列中指定索引的歌曲
      const getQueueSongAt = (index) => {
        const normalizedIndex = Number(index)
        if (!Number.isInteger(normalizedIndex) || normalizedIndex < 0) return null
        const queueState = getQueueState()
        const song = queueState.songs[normalizedIndex]
        if (!song?.id && !song?.hash) return null
        return { queueState, song }
      }

      const queueOptions = (queueState) =>
        queueState?.queueId == null ? undefined : { queueId: queueState.queueId }

      // 归一化 iframe 传回的歌曲对象
      const commandSong = (song) => {
        const source = song || {}
        const normalized = normalizeSong(source)
        if (!normalized?.id && !normalized?.hash) return null
        return {
          ...source,
          ...normalized,
          id: String(source.id ?? source.trackId ?? source.hash ?? normalized.id ?? ''),
          hash: text(source.hash || normalized.hash || normalized.id),
          audioUrl: text(source.audioUrl || source.url),
          mixSongId: source.mixSongId ?? source.mixsongid ?? 0,
        }
      }

      // 按队列索引播放
      const playQueueIndex = async (index) => {
        const target = getQueueSongAt(index)
        if (!target) return
        const { queueState, song } = target
        const trackId = song.id || song.hash
        if (!trackId) return
        await ctx.player.playTrack(trackId, {
          playlist: queueState.songs,
          sourceQueueId: queueState.queueId,
        })
      }

      const playCommandSong = async (song) => {
        const target = commandSong(song)
        if (!target) return
        await ctx.player.playSong(target)
      }

      const playNextCommandSong = async (song) => {
        const target = commandSong(song)
        if (!target) return
        await ctx.player.playNext(target)
      }

      const playNextQueueIndex = async (index) => {
        const target = getQueueSongAt(index)
        if (!target) return
        await ctx.player.playNext(target.song, queueOptions(target.queueState))
      }

      const removeQueueIndex = async (index) => {
        const target = getQueueSongAt(index)
        if (!target) return
        const trackId = target.song.id || target.song.hash
        if (!trackId) return
        await ctx.playlist.remove(trackId, target.queueState.queueId)
      }

      const clearQueue = async () => {
        const queueState = getQueueState()
        await ctx.playlist.clear(queueState.queueId)
      }

      const setPlayMode = (mode) => {
        const normalized = String(mode || '')
        if (!playModeOrder.includes(normalized)) return
        ctx.player.setPlayMode(normalized)
      }

      // 执行 iframe 命令
      const executeCommand = async (data) => {
        if (data.command === 'toggle-play') await ctx.player.toggle()
        else if (data.command === 'play') {
          if (!ctx.stores.player.isPlaying) await ctx.player.toggle()
        } else if (data.command === 'pause') {
          if (ctx.stores.player.isPlaying) await ctx.player.toggle()
        } else if (data.command === 'prev') await ctx.player.prev()
        else if (data.command === 'next') await ctx.player.next()
        else if (data.command === 'seek') ctx.player.seek(Math.max(0, Number(data.value) || 0))
        else if (data.command === 'volume') {
          ctx.player.setVolume(Math.max(0, Math.min(1, Number(data.value) || 0)))
        } else if (data.command === 'cycle-mode') cyclePlayMode()
        else if (data.command === 'play-index') await playQueueIndex(Number(data.index))
        else if (data.command === 'play-song') await playCommandSong(data.song)
        else if (data.command === 'queue-play-next-song') await playNextCommandSong(data.song)
        else if (data.command === 'queue-play-next-index') await playNextQueueIndex(Number(data.index))
        else if (data.command === 'queue-remove-index') await removeQueueIndex(Number(data.index))
        else if (data.command === 'queue-clear') await clearQueue()
        else if (data.command === 'set-mode') setPlayMode(data.mode)
        else if (data.command === 'close') closeOverlay()
        else if (data.command === 'mini-player') void window.electron?.miniPlayer?.show?.()
        else if (data.command === 'window-control') {
          const action = String(data.action || '')
          if (['minimize', 'fullscreen', 'maximize', 'close'].includes(action)) {
            window.electron?.windowControl?.(action)
          }
        }
        else if (data.command === 'open-artist') {
          const artistId = Number(data.artistId || 0)
          if (artistId) {
            closeOverlay()
            ctx.router.push({ name: 'artist-detail', params: { id: String(artistId) } }).catch(() => {})
          }
        }
        else if (data.command === 'open-album') {
          const albumId = Number(data.albumId || 0)
          if (albumId) {
            closeOverlay()
            ctx.router.push({ name: 'album-detail', params: { id: String(albumId) } }).catch(() => {})
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
            console.warn('[FoliaBridge] toggle-favorite failed', e)
          }
        }
        else if (data.command === 'toggle-cover-blur') {
          const settingStore = ctx.stores.settings || ctx.settings
          if (settingStore) {
            settingStore.lyricPageBackgroundBlur = !settingStore.lyricPageBackgroundBlur
          }
        }
        else if (data.command === 'set-anim-mode') {
          const mode = String(data.mode || 'yunjie')
          try { window.localStorage.setItem('folia-animMode', mode) } catch {}
        }
        else if (data.command === 'set-intensity') {
          const intensity = String(data.intensity || 'normal')
          try { window.localStorage.setItem('folia-intensity', intensity) } catch {}
        }
      }

      // 命令完成后补发状态
      const pushCommandResultState = () => {
        if (disposed) return
        pushSnapshot(true)
        pushPosition('command')
      }

      // 串行执行命令
      const handleCommand = (data) => {
        commandQueue = commandQueue
          .catch(() => {})
          .then(async () => {
            await executeCommand(data)
            pushCommandResultState()
          })
          .catch((error) => {
            console.warn('[FoliaBridge] 命令执行失败', error)
            pushCommandResultState()
          })
      }

      // 处理来自 iframe 的消息
      const handleMessage = (event) => {
        const data = event?.data
        if (!data || data.source !== 'echo-folia-child') return

        switch (data.type) {
          case 'echo-folia:ready':
            ready = true
            let savedAnimMode = 'yunjie'
            let savedIntensity = 'normal'
            try {
              savedAnimMode = window.localStorage.getItem('folia-animMode') || 'yunjie'
              savedIntensity = window.localStorage.getItem('folia-intensity') || 'normal'
            } catch {}
            postToFrame({
              type: 'echo-folia:init',
              payload: {
                directEnter: true,
                pluginVersion: String(ctx.manifest?.version || ''),
                hostControls: buildHostControlsPayload(),
                settings: {
                  animMode: savedAnimMode,
                  intensity: savedIntensity,
                },
              },
            })
            pushSnapshot(true)
            pushLyrics(true)
            pushPosition('init')
            if (lastSpectrumFrame) {
              postToFrame({
                type: 'echo-folia:spectrum',
                payload: lastSpectrumFrame,
              })
            }
            break
          case 'echo-folia:command':
            handleCommand(data)
            break
          case 'echo-folia:request-snapshot':
            pushSnapshot(true)
            pushLyrics(true)
            pushPosition('init')
            break
        }
      }

      // Escape 关闭覆盖层
      const handleKeydown = (event) => {
        if (event.key !== 'Escape') return
        event.preventDefault()
        event.stopPropagation()
        closeOverlay()
      }

      // 加载 iframe
      const loadFrame = async () => {
        const result = await ctx.fs.getFileUrl(getPluginFilePath(ctx, 'folia', 'bridge.html'))
        if (disposed) return
        if (!result?.ok || !result.url) {
          loadError.value = result?.error || 'Folia 播放器页面加载失败'
          return
        }
        iframeSrc.value = result.url
      }

      onMounted(() => {
        document.body.classList.add('folia-overlay-open')
        window.addEventListener('message', handleMessage)
        window.addEventListener('keydown', handleKeydown, true)
        void loadFrame()
        initLyricStoreSubscription()
        initTrackWatch()
        initVolumeWatch()
        startPositionHeartbeat()

        try {
          spectrumDispose = ctx.audio.spectrum.subscribe(
            { fps: 24, binCount: 64, smoothing: 0.82, scale: 'mel', includeWaveform: true },
            (frame) => {
              lastSpectrumFrame = {
                bins: Array.isArray(frame?.bins) ? frame.bins : [],
                waveform: Array.isArray(frame?.waveform) ? frame.waveform : [],
                rms: Number(frame?.rms || 0),
                peak: Number(frame?.peak || 0),
                state: frame?.state || 'idle',
                timePos: frame?.timePos,
              }
              postToFrame({
                type: 'echo-folia:spectrum',
                payload: lastSpectrumFrame,
              })
            },
          )
        } catch {
          spectrumDispose = null
        }
      })

      onBeforeUnmount(() => {
        disposed = true
        ready = false
        document.body.classList.remove('folia-overlay-open')
        window.removeEventListener('message', handleMessage)
        window.removeEventListener('keydown', handleKeydown, true)
        stopPositionHeartbeat()
        if (lyricStoreUnsub) lyricStoreUnsub()
        lyricStoreUnsub = null
        if (stopTrackWatch) stopTrackWatch()
        stopTrackWatch = null
        if (stopVolumeWatch) stopVolumeWatch()
        stopVolumeWatch = null
        if (spectrumDispose) spectrumDispose()
        spectrumDispose = null
      })

      const renderLoading = () =>
        h('div', { class: 'folia-bridge-loading' }, [
          h('div', { class: 'folia-bridge-loading-text' }, loadError.value || '正在加载 Folia 播放器...'),
          h(
            'button',
            {
              class: 'folia-bridge-close',
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
            class: 'folia-bridge-page',
            role: 'dialog',
            'aria-modal': 'true',
          },
          [
            h('div', { class: 'folia-bridge-drag-strip' }),
            iframeSrc.value
              ? h('iframe', {
                  ref: iframeRef,
                  class: 'folia-bridge-frame',
                  src: iframeSrc.value,
                  allow: 'autoplay; fullscreen',
                  onLoad: () => {
                    ready = true
                    pushSnapshot(true)
                  },
                })
              : renderLoading(),
          ],
        )
    },
  })
}

// 外层组件控制覆盖层显示
function createPlayerOverlay(ctx, overlayOpen, closeOverlay) {
  const { defineComponent, h } = ctx.vue
  const PlayerFrame = createPlayerFrame(ctx, closeOverlay)

  return defineComponent({
    name: 'FoliaOverlayHost',
    setup() {
      return () => (overlayOpen.value ? h(PlayerFrame) : null)
    },
  })
}

// 插件激活入口
export function activate(ctx) {
  const overlayOpen = ctx.vue.ref(false)

  const closeOverlay = () => {
    overlayOpen.value = false
    if (ctx.stores.player.isLyricViewOpen) ctx.player.toggleLyricView(false)
  }

  const openOverlay = () => {
    overlayOpen.value = true
    if (ctx.stores.player.isLyricViewOpen) ctx.player.toggleLyricView(false)
  }

  ctx.ui.teleport(createPlayerOverlay(ctx, overlayOpen, closeOverlay), {
    id: 'folia-style-overlay',
    className: 'folia-overlay-host',
  })

  const stopLyricWatch = ctx.vue.watch(
    () => ctx.stores.player.isLyricViewOpen,
    (open) => {
      if (!open) return
      openOverlay()
    },
    { immediate: true, flush: 'sync' },
  )

  const stopLegacyRouteWatch = ctx.vue.watch(
    () => getRoutePath(ctx),
    (path) => {
      if (!isLegacyPluginPlayerPath(path)) return
      ctx.router.replace(FALLBACK_PATH).catch(() => {})
    },
    { immediate: true },
  )

  ctx.dispose(() => {
    stopLyricWatch()
    stopLegacyRouteWatch()
    closeOverlay()
  })
}

export function deactivate() {}
