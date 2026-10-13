// skin.js
// Apple Music 风格歌词页皮肤组件
// 双栏布局：左侧封面+控制，右侧 AMLL 歌词
import { LyricPlayer as CoreLyricPlayer } from '@applemusic-like-lyrics/core'
import '@applemusic-like-lyrics/core/style.css'
import { buildAmllLyricLines } from './convert-lyrics.js'
import { normalizeSettings, clamp } from './settings.js'

const QUALITY_MAP = {
  '128': 'SD',
  '320': 'HQ',
  flac: 'SQ',
  high: 'HR',
  viper_tape: 'VPT',
  viper_clear: 'VPC',
  viper_atmos: 'VPA',
}

const QUALITY_LABELS = {
  '128': '标准',
  '320': '高品质',
  flac: '无损',
  high: 'Hi-Res',
  viper_tape: '蝰蛇母带',
  viper_clear: '蝰蛇超清',
  viper_atmos: '蝰蛇全景声',
}

function formatTime(seconds) {
  const s = Math.floor(Math.max(0, seconds))
  const m = Math.floor(s / 60)
  return m + ':' + (s % 60 < 10 ? '0' : '') + (s % 60)
}

// AMLL RAF 配置
const TARGET_FPS = 60
const FRAME_INTERVAL = 1000 / TARGET_FPS
const SET_TIME_INTERVAL = 1000 / 30
const OVERSCAN_PX = 200
// 相邻两次 setCurrentTime 的时间推进超过该值即判定为跳转。正常播放约 33ms
// （setCurrentTime 的节流间隔），该阈值远大于掉帧波动，足以捕获小幅跳转。
const SEEK_JUMP_MS = 250
// 跳转后继续驱动弹簧动画收敛的时长，需覆盖大跨度位移的滑动时间
const SEEK_SETTLE_MS = 1200

export function createSkinComponent(ctx) {
  const { defineComponent, h, ref, shallowRef, computed, watch, onMounted, onUnmounted, Teleport } = ctx.vue

  return defineComponent({
    name: 'AppleMusicSkin',
    props: {
      page: { type: Object, required: true },
    },
    setup(props) {
      const skin = ctx.ui.lyricsPage.useSkin()
      const settings = computed(() => normalizeSettings(skin.settings.value))

      // DOM refs
      const playerAreaRef = ref(null)
      const coverImgRef = ref(null)
      const progressTrackRef = ref(null)

      // AMLL
      const amllPlayer = shallowRef(null)

      // RAF state
      let rafId = null
      let lastFrameTime = 0
      let lastSetTimeAt = 0
      let settleUntil = 0
      let lastAppliedTimeMs = Number.NaN
      let seekPending = false
      let disposed = false

      // Progress bar state
      const seeking = ref(false)
      const hoverStartTime = ref(0)

      // Side tools visibility (mirrors the host lyric page tools behaviour)
      const sideToolsHovered = ref(false)
      const hostContentEl = ref(null)
      const sideToolsEl = ref(null)
      const commentBtnEl = ref(null)
      const shareBtnEl = ref(null)

      // --- Computed state from page ---
      const state = computed(() => props.page.state.value)
      const track = computed(() => state.value.track || {})
      const isPlaying = computed(() => state.value.isPlaying)
      const currentTime = computed(() => state.value.currentTime || 0)
      const duration = computed(() => state.value.duration || 0)
      const playMode = computed(() => state.value.playMode || 'list')
      const isFavorite = computed(() => state.value.isFavorite)
      const audioQuality = computed(() => state.value.audioQuality || '')
      const qualityOptions = computed(() => state.value.qualityOptions || [])
      const isCloudSource = computed(() => Boolean(state.value.isCloudSource))
      const hasCloudSource = computed(() => state.value.hasCloudSource)
      const canShare = computed(() => Boolean(state.value.canShare))
      const lyrics = computed(() => state.value.lyrics)
      const lyricLines = computed(() => lyrics.value.lines || [])

      const readTimelineMs = () => {
        if (disposed) return null
        try {
          const timelineMs = Number(props.page.lyrics.getTimelineMs())
          return Number.isFinite(timelineMs) ? timelineMs : null
        } catch {
          return null
        }
      }

      const trackTitle = computed(() => {
        const raw = track.value.name || track.value.title || ''
        if (!raw) return '未知歌曲'
        const dashIndex = raw.indexOf(' - ')
        if (dashIndex > 0) {
          const after = raw.substring(dashIndex + 3).trim()
          if (after) return after
        }
        return raw
      })

      const trackArtist = computed(() => track.value.artist || '未知歌手')
      const coverUrl = computed(() => track.value.coverUrl || track.value.cover || '')

      // --- 专辑 / 歌手跳转 ---
      // 与宿主 SongCard.vue 保持一致：详情页 id 必须是正整数，名称非空才可点击
      const resolveNumericId = (value) => {
        if (value === undefined || value === null) return null
        const parsed = Number.parseInt(String(value), 10)
        if (Number.isNaN(parsed) || parsed <= 0) return null
        return parsed
      }

      const albumDetailId = computed(() => resolveNumericId(track.value.albumId))
      const hasAlbumDetail = computed(() => {
        const name = (track.value.album || track.value.albumName || '').trim()
        return Boolean(albumDetailId.value && name)
      })

      // 优先用结构化的 artists / singers（含 id）；缺失时退回按分隔符切分纯文本，
      // 此时切分出的名字没有 id，不可点击。
      const artistList = computed(() => {
        const source = Array.isArray(track.value.artists) && track.value.artists.length > 0
          ? track.value.artists
          : (Array.isArray(track.value.singers) && track.value.singers.length > 0
              ? track.value.singers
              : [])
        if (source.length > 0) {
          return source
            .filter((item) => item && typeof item.name === 'string' && item.name.trim())
            .map((item) => ({ id: item.id, name: item.name.trim() }))
        }
        return String(track.value.artist || '')
          .split(/[,/、，]/)
          .map((name) => name.trim())
          .filter(Boolean)
          .map((name) => ({ id: undefined, name }))
      })

      const progressPct = computed(() => {
        const d = duration.value
        return d > 0 ? clamp((currentTime.value / d) * 100, 0, 100) : 0
      })

      const currentTimeStr = computed(() => formatTime(currentTime.value))
      const remainTimeStr = computed(() => '-' + formatTime(Math.max(0, duration.value - currentTime.value)))

      const qualityLabel = computed(() =>
        isCloudSource.value ? 'CLD' : (QUALITY_MAP[audioQuality.value] || ''),
      )

      // --- Lyrics mode for AMLL ---
      const lyricsMode = computed(() => {
        const wantTranslation = Boolean(lyrics.value.wantTranslation)
        const wantRomanization = Boolean(lyrics.value.wantRomanization)
        if (wantTranslation && wantRomanization) return 'both'
        if (wantTranslation) return 'translation'
        if (wantRomanization) return 'romanization'
        return 'none'
      })

      const amllLines = computed(() =>
        buildAmllLyricLines(lyricLines.value, lyricsMode.value, false),
      )

      // --- AMLL lifecycle ---
      const rafLoop = (timestamp) => {
        rafId = null
        if (disposed || document.hidden) {
          lastFrameTime = 0
          return
        }
        const elapsed = lastFrameTime > 0 ? timestamp - lastFrameTime : FRAME_INTERVAL
        if (elapsed < FRAME_INTERVAL) {
          rafId = requestAnimationFrame(rafLoop)
          return
        }
        const dt = Math.min(elapsed, 50)
        lastFrameTime = timestamp
        const player = amllPlayer.value
        if (player) {
          const timelineMs = readTimelineMs()
          if (
            timelineMs !== null &&
            lastAppliedTimeMs !== timelineMs &&
            timestamp - lastSetTimeAt >= SET_TIME_INTERVAL
          ) {
            // 跳转必须走 AMLL 的 seek 分支（isSeek=true）：该分支会重置用户滚动
            // 状态、清空缓冲行并改用 seek 专用的稳定弹簧参数。若按普通推进处理，
            // 大跨度跳转会带着残留的滚动偏移停在错误位置——AMLL 文档也明确要求
            // 「用户滚动后点击跳转歌词」时先 resetScroll 再 calcLayout。
            const jumped =
              Number.isFinite(lastAppliedTimeMs) &&
              Math.abs(timelineMs - lastAppliedTimeMs) > SEEK_JUMP_MS
            const isSeek = seekPending || jumped
            player.setCurrentTime(timelineMs, isSeek)
            if (isSeek) {
              // isSeeking 只需在 setCurrentTime 同步触发的布局计算期间为 true；
              // calcLayout 无 await，此刻复位不会影响已套用的 seek 弹簧参数，
              // 却能避免后续普通推进一直沿用 seek 模式。
              player.setIsSeeking(false)
              settleUntil = Math.max(settleUntil, timestamp + SEEK_SETTLE_MS)
            }
            seekPending = false
            lastAppliedTimeMs = timelineMs
            lastSetTimeAt = timestamp
          }
          player.update(dt)
        }
        if (isPlaying.value || timestamp < settleUntil) {
          rafId = requestAnimationFrame(rafLoop)
        } else {
          lastFrameTime = 0
        }
      }

      const requestFrame = () => {
        if (disposed || !amllPlayer.value || document.hidden) return
        settleUntil = performance.now() + 1000
        if (rafId !== null) return
        lastFrameTime = 0
        rafId = requestAnimationFrame(rafLoop)
      }

      const handleVisibilityChange = () => {
        if (disposed) return
        if (document.hidden) {
          if (rafId !== null) cancelAnimationFrame(rafId)
          rafId = null
          lastFrameTime = 0
          amllPlayer.value?.pause()
        } else {
          if (isPlaying.value) amllPlayer.value?.resume()
          lastAppliedTimeMs = Number.NaN
          lastSetTimeAt = 0
          requestFrame()
        }
      }

      const initAmll = () => {
        const host = playerAreaRef.value
        const timelineMs = readTimelineMs()
        if (!host || amllPlayer.value || timelineMs === null) return
        const player = new CoreLyricPlayer()
        host.appendChild(player.getElement())
        player.setOverscanPx(OVERSCAN_PX)
        player.setLyricLines(amllLines.value, timelineMs)
        lastAppliedTimeMs = Number.NaN
        lastSetTimeAt = 0
        seekPending = false
        if (isPlaying.value && !document.hidden) player.resume()
        else player.pause()
        amllPlayer.value = player
        player.addEventListener('line-click', handleLyricLineClick)
        document.addEventListener('visibilitychange', handleVisibilityChange)
        lastFrameTime = performance.now()
        requestFrame()
      }

      const disposeAmll = () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        if (rafId !== null) cancelAnimationFrame(rafId)
        rafId = null
        const player = amllPlayer.value
        if (player) {
          player.removeEventListener('line-click', handleLyricLineClick)
          player.dispose()
          const ro = player.resizeObserver
          ro?.disconnect()
        }
        amllPlayer.value = null
        const host = playerAreaRef.value
        if (host) host.replaceChildren()
      }

      // --- Watchers ---
      watch(amllLines, (lines) => {
        const player = amllPlayer.value
        const timelineMs = readTimelineMs()
        if (!player || timelineMs === null) return
        player.setLyricLines(lines, timelineMs)
        lastAppliedTimeMs = Number.NaN
        lastSetTimeAt = 0
        if (!isPlaying.value || document.hidden) player.pause()
        requestFrame()
      })

      // Cover animation tracking
      let coverAnim = null

      watch(isPlaying, (playing) => {
        const player = amllPlayer.value
        if (playing && !document.hidden) player?.resume()
        else player?.pause()
        requestFrame()

        // Cover scale animation (matching reference)
        const img = coverImgRef.value
        if (img) {
          if (coverAnim) { coverAnim.cancel(); coverAnim = null }
          coverAnim = playing
            ? img.animate(
                [
                  { transform: 'scale(0.75)', offset: 0 },
                  { transform: 'scale(1.1)', offset: 0.6 },
                  { transform: 'scale(1)', offset: 1 },
                ],
                { duration: 500, easing: 'ease', fill: 'forwards' },
              )
            : img.animate(
                [
                  { transform: 'scale(1)', offset: 0 },
                  { transform: 'scale(0.75)', offset: 1 },
                ],
                { duration: 500, easing: 'ease', fill: 'forwards' },
              )
          coverAnim.finished.then(() => { if (!disposed) coverAnim = null }).catch(() => {})
        }
      })

      watch(
        [() => currentTime.value, () => lyrics.value.timeOffset],
        () => requestFrame(),
      )

      // AMLL settings
      watch(
        [
          amllPlayer,
          () => settings.value.alignPosition,
          () => settings.value.enableSpring,
          () => settings.value.enableBlur,
          () => settings.value.enableScale,
          () => settings.value.fadeWidth,
        ],
        ([player, position, spring, blur, scale, fade], prev) => {
          if (!player) return
          const initial = player !== prev?.[0]
          if (initial) player.setAlignAnchor('center')
          if (initial || position !== prev?.[1]) player.setAlignPosition(position / 100)
          if (initial || spring !== prev?.[2]) player.setEnableSpring(spring)
          if (initial || blur !== prev?.[3]) player.setEnableBlur(blur)
          if (initial || scale !== prev?.[4]) player.setEnableScale(scale)
          if (initial || fade !== prev?.[5]) player.setWordFadeWidth(fade / 100)
          requestFrame()
        },
      )

      // --- Actions ---
      const runGuarded = (label, fn) => {
        try {
          const result = fn()
          if (result && typeof result.catch === 'function') {
            result.catch((error) => console.warn(label, error))
          }
        } catch (error) {
          console.warn(label, error)
        }
      }

      const togglePlay = () => props.page.playback.toggle()
      const playPrev = () => props.page.playback.prev()
      const playNext = () => props.page.playback.next()
      const openComments = () =>
        runGuarded('[AppleMusicStyle] 打开评论面板失败', () => props.page.panels.open('comments'))
      // 复用宿主分享逻辑（复制分享链接并由宿主弹出结果提示）。
      // page.share 是 action 包装的，歌词页卸载后会抛错，故走 runGuarded。
      const shareTrack = () =>
        runGuarded('[AppleMusicStyle] 分享歌曲失败', () => props.page.share())

      // 歌词页是覆盖在 RouterView 之上的全屏层（.lyric-overlay-host，fixed inset:0
      // z-index:1300）。只 router.push 的话详情页会被挡在遮罩后面，因此必须先关闭
      // 歌词页再跳转。push 先发起（详情组件异步加载），随后同步关闭遮罩，
      // 这样遮罩淡出时新页面通常已就绪，不会闪一下旧页面。
      const navigateTo = (route) => {
        if (disposed) return
        const router = ctx.router
        if (!router || typeof router.push !== 'function') {
          console.warn('[AppleMusicStyle] 宿主未提供 router，无法跳转到详情页')
          return
        }
        try {
          const result = router.push(route)
          if (result && typeof result.catch === 'function') {
            result.catch((error) => console.warn('[AppleMusicStyle] 详情页跳转失败', error))
          }
        } catch (error) {
          console.warn('[AppleMusicStyle] 详情页跳转失败', error)
        }
        runGuarded('[AppleMusicStyle] 关闭歌词页失败', () => props.page.close())
      }

      const openAlbumDetail = () => {
        if (!hasAlbumDetail.value) return
        navigateTo({ name: 'album-detail', params: { id: String(albumDetailId.value) } })
      }

      const openArtistDetail = (artistId) => {
        const id = resolveNumericId(artistId)
        if (!id) return
        navigateTo({ name: 'artist-detail', params: { id: String(id) } })
      }
      const toggleFavorite = () =>
        runGuarded('[AppleMusicStyle] 收藏切换失败', () => props.page.favorite.toggle())
      const setRandomMode = () => props.page.playback.setMode('random')
      const setListMode = () => props.page.playback.setMode('list')

      const seekTo = (seconds) => {
        seekPending = true
        props.page.playback.seek(Math.max(0, Math.min(seconds, duration.value || 0)))
      }

      // AMLL 的 `line-click` 事件带有 lineIndex，对应 setLyricLines 传入数组的下标
      // （AMLL 的歌词优化只原地改时间戳、不增删行，故下标与 amllLines 严格 1:1）。
      // 注意不能用 evt.line.lyricLine.startTime：AMLL 默认开启 tryAdvanceStartTime，
      // 会把行首提前最多 600ms 用于逐词动画，直接用会跳到行首之前。
      const handleLyricLineClick = (evt) => {
        const index = evt?.lineIndex
        if (!Number.isInteger(index) || index < 0) return
        const startMs = amllLines.value[index]?.startTime
        if (!Number.isFinite(startMs)) return
        // 宿主时间轴 = 播放位置 + 歌词偏移，seek 需反向扣除偏移量
        const offsetMs = Number(lyrics.value.timeOffset) || 0
        seekTo((startMs - offsetMs) / 1000)
      }

      const handleProgressClick = (e) => {
        const rect = progressTrackRef.value?.getBoundingClientRect()
        if (!rect) return
        const pct = clamp((e.clientX - rect.left) / rect.width, 0, 1)
        seekTo(pct * duration.value)
      }

      const handleProgressMouseDown = (e) => {
        seeking.value = true
        handleProgressClick(e)
      }

      const handleProgressMouseEnter = (e) => {
        hoverStartTime.value = Date.now()
        const el = e.currentTarget
        if (el.classList.contains('spring')) {
          const curH = getComputedStyle(el, '::before').height
          el.style.setProperty('--fill-h', curH)
          el.classList.remove('spring')
          void el.offsetWidth
        }
      }

      const handleProgressMouseLeave = (e) => {
        const el = e.currentTarget
        el.style.removeProperty('--fill-h')
        const hoverDuration = Date.now() - hoverStartTime.value
        el.classList.remove('spring')
        if (hoverDuration >= 100) {
          void el.offsetWidth
          el.classList.add('spring')
        }
      }

      const handleProgressAnimationEnd = (e) => {
        e.currentTarget.classList.remove('spring')
      }

      const handleMouseMove = (e) => {
        if (seeking.value) handleProgressClick(e)
      }

      const handleMouseUp = () => {
        seeking.value = false
      }

      const handleQualitySelect = (quality) =>
        runGuarded('[AppleMusicStyle] 音质切换失败', () =>
          quality === 'cloud'
            ? props.page.audio.useCloudSource()
            : props.page.audio.setQuality(quality),
        )

      // Quality popup state
      const showQualityPopup = ref(false)

      const toggleQualityPopup = (e) => {
        e.stopPropagation()
        showQualityPopup.value = !showQualityPopup.value
      }

      const selectQuality = (q) => {
        handleQualitySelect(q)
        showQualityPopup.value = false
      }

      const closeQualityPopup = () => {
        showQualityPopup.value = false
      }

      // Button press animation handlers
      const btnPressTimers = new Map()
      const btnReleasing = new Set()
      const btnReleaseTimers = new Set()

      const handleBtnMouseDown = (e) => {
        const btn = e.currentTarget
        if (btnReleasing.has(btn)) return
        btn.classList.remove('pressing', 'holding', 'releasing')
        void btn.offsetWidth
        btn.classList.add('pressing')
        const timer = setTimeout(() => {
          btn.classList.remove('pressing')
          void btn.offsetWidth
          btn.classList.add('holding')
        }, 200)
        btnPressTimers.set(btn, timer)
      }

      const handleBtnPressEnd = (e) => {
        const btn = e.currentTarget
        clearTimeout(btnPressTimers.get(btn))
        btnPressTimers.delete(btn)
        if (btn.classList.contains('pressing') || btn.classList.contains('holding')) {
          btn.classList.remove('pressing', 'holding')
          void btn.offsetWidth
          btnReleasing.add(btn)
          btn.classList.add('releasing')
          const timer = setTimeout(() => {
            btn.classList.remove('releasing')
            btnReleasing.delete(btn)
            btnReleaseTimers.delete(timer)
          }, 300)
          btnReleaseTimers.add(timer)
        }
      }

      // --- Lifecycle ---
      const handleSideToolsEnter = () => {
        sideToolsHovered.value = true
      }

      const handleSideToolsLeave = (e) => {
        // 侧边工具被传送到 .plugin-lyrics-content 的同级，从内容区移出时
        // 宿主容器会先触发 mouseleave；此时若移入的是工具组本身（含任意
        // 按钮），必须保持显示，否则按钮会先消失导致无法点击。
        if (sideToolsEl.value && sideToolsEl.value.contains(e.relatedTarget)) return
        if (commentBtnEl.value && commentBtnEl.value.contains(e.relatedTarget)) return
        if (shareBtnEl.value && shareBtnEl.value.contains(e.relatedTarget)) return
        sideToolsHovered.value = false
      }

      onMounted(() => {
        disposed = false
        initAmll()
        // Restore cover scale based on current play state
        const img = coverImgRef.value
        if (img) {
          img.style.transform = isPlaying.value ? 'scale(1)' : 'scale(0.75)'
        }
        hostContentEl.value = document.querySelector('.plugin-lyrics-content')
        if (hostContentEl.value) {
          hostContentEl.value.addEventListener('mouseenter', handleSideToolsEnter)
          hostContentEl.value.addEventListener('mouseleave', handleSideToolsLeave)
        }
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        document.addEventListener('click', closeQualityPopup)
      })

      onUnmounted(() => {
        disposed = true
        if (coverAnim) { coverAnim.cancel(); coverAnim = null }
        disposeAmll()
        if (hostContentEl.value) {
          hostContentEl.value.removeEventListener('mouseenter', handleSideToolsEnter)
          hostContentEl.value.removeEventListener('mouseleave', handleSideToolsLeave)
        }
        hostContentEl.value = null
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('click', closeQualityPopup)
        btnPressTimers.forEach((t) => clearTimeout(t))
        btnPressTimers.clear()
        btnReleaseTimers.forEach((t) => clearTimeout(t))
        btnReleaseTimers.clear()
        btnReleasing.clear()
      })

      // --- Render ---
      const renderCover = () =>
        h('div', { class: 'amms-cover-wrap' }, [
          coverUrl.value
            ? h('img', {
                ref: coverImgRef,
                class: 'amms-cover-img',
                src: coverUrl.value,
                draggable: 'false',
                alt: track.value.name || '专辑封面',
              })
            : h('div', { class: 'amms-cover-placeholder' }, '♫'),
        ])

      const renderArtistLine = () => {
        const list = artistList.value
        if (list.length === 0) return trackArtist.value
        const nodes = []
        list.forEach((artist, index) => {
          if (index > 0) {
            nodes.push(h('span', { key: `sep-${index}`, class: 'amms-artist-sep' }, ' / '))
          }
          const id = resolveNumericId(artist.id)
          nodes.push(
            h(
              'span',
              {
                key: `artist-${index}`,
                class: id ? 'amms-artist-link' : '',
                title: id ? `查看歌手：${artist.name}` : undefined,
                onClick: id
                  ? (e) => {
                      e.stopPropagation()
                      openArtistDetail(id)
                    }
                  : undefined,
              },
              artist.name,
            ),
          )
        })
        return nodes
      }

      const renderTrackInfo = () =>
        h('div', { class: 'amms-track-info' }, [
          h('div', { class: 'amms-track-text' }, [
            h(
              'div',
              {
                class: ['amms-track-title', hasAlbumDetail.value ? 'amms-title-link' : ''],
                title: hasAlbumDetail.value
                  ? `查看专辑：${(track.value.album || track.value.albumName || '').trim()}`
                  : undefined,
                onClick: hasAlbumDetail.value
                  ? (e) => {
                      e.stopPropagation()
                      openAlbumDetail()
                    }
                  : undefined,
              },
              trackTitle.value,
            ),
            h('div', { class: 'amms-track-artist' }, renderArtistLine()),
          ]),
          h('div', { class: 'amms-track-actions' }, [
            h(
              'button',
              {
                class: ['amms-action-btn', isFavorite.value ? 'active' : ''],
                title: '收藏',
                onClick: toggleFavorite,
              },
              h(
                'svg',
                { viewBox: '0 0 24 24', fill: isFavorite.value ? 'currentColor' : 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
                h('polygon', { points: '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' }),
              ),
            ),
            h(
              'button',
              {
                class: 'amms-action-btn',
                title: '更多',
                onClick: () => ctx.ui.lyricsPage.openSkins(),
              },
              h(
                'svg',
                { viewBox: '0 0 24 24', fill: 'currentColor' },
                [
                  h('circle', { cx: '5', cy: '12', r: '2' }),
                  h('circle', { cx: '12', cy: '12', r: '2' }),
                  h('circle', { cx: '19', cy: '12', r: '2' }),
                ],
              ),
            ),
          ]),
        ])

      const renderProgress = () =>
        h('div', { class: 'amms-progress-section' }, [
          h(
            'div',
            {
              ref: progressTrackRef,
              class: 'amms-progress-track',
              onMousedown: handleProgressMouseDown,
              onMouseenter: handleProgressMouseEnter,
              onMouseleave: handleProgressMouseLeave,
              onAnimationend: handleProgressAnimationEnd,
            },
            [
              h('div', {
                class: 'amms-progress-fill',
                style: { width: progressPct.value + '%' },
              }),
            ],
          ),
          h('div', { class: 'amms-progress-times' }, [
            h('span', { class: 'amms-progress-time' }, currentTimeStr.value),
            qualityLabel.value
              ? h(
                  'button',
                  {
                    class: 'amms-quality-btn',
                    title: '音质切换',
                    onClick: toggleQualityPopup,
                  },
                  [
                    qualityLabel.value,
                    showQualityPopup.value
                      ? h('div', { class: 'amms-quality-popup', onClick: (e) => e.stopPropagation() }, [
                          hasCloudSource.value
                            ? h(
                                'div',
                                {
                                  class: ['amms-quality-popup-item', isCloudSource.value ? 'active' : ''],
                                  onClick: () => selectQuality('cloud'),
                                },
                                'CLD 云盘',
                              )
                            : null,
                          ...qualityOptions.value.map((q) =>
                            h(
                              'div',
                              {
                                class: [
                                'amms-quality-popup-item',
                                q.value === audioQuality.value && !isCloudSource.value ? 'active' : '',
                                q.disabled ? 'disabled' : '',
                              ],
                              onClick: q.disabled ? undefined : () => selectQuality(q.value),
                            },
                            (QUALITY_MAP[q.value] || q.value) + ' ' + (QUALITY_LABELS[q.value] || ''),
                            ),
                          ),
                        ])
                      : null,
                  ],
                )
              : null,
            h('span', { class: 'amms-progress-time right' }, remainTimeStr.value),
          ]),
        ])

      const renderControls = () =>
        h('div', { class: 'amms-playback-controls' }, [
          h(
            'button',
            {
              class: ['amms-ctrl-btn', 'small', playMode.value === 'random' ? 'active' : ''],
              title: '随机播放',
              onClick: setRandomMode,
              onMousedown: handleBtnMouseDown,
              onMouseup: handleBtnPressEnd,
              onMouseleave: handleBtnPressEnd,
            },
            h(
              'svg',
              { viewBox: '0 0 1024 1024', fill: 'currentColor' },
              h('path', { d: 'M914.2 705L796.4 596.8c-8.7-8-22.7-1.8-22.7 10V688c-69.5-1.8-134-39.7-169.3-99.8l-45.1-77 47-80.2c34.9-59.6 98.6-97.4 167.4-99.8v60.1c0 11.8 14 17.9 22.7 10l117.8-108.1c5.8-5.4 5.8-14.6 0-19.9L796.4 165c-8.7-8-22.7-1.8-22.7 10v76H758c-4.7 0-9.3 0.8-13.5 2.3-36.5 4.7-72 16.6-104.1 35-42.6 24.4-78.3 59.8-103.1 102.2L513 432l-24.3-41.5c-24.8-42.4-60.5-77.7-103.1-102.2C343 263.9 294.5 251 245.3 251H105c-22.1 0-40 17.9-40 40s17.9 40 40 40h140.3c71.4 0 138.3 38.3 174.4 99.9l47 80.2-45.1 77c-36.2 61.7-103 99.9-174.4 99.9H105c-22.1 0-40 17.9-40 40s17.9 40 40 40l142 0.1h0.2c49.1 0 97.6-12.9 140.2-37.3 42.7-24.4 78.3-59.8 103.2-102.2l22.4-38.3 22.4 38.3c24.8 42.4 60.5 77.8 103.2 102.2 33.1 18.9 69.6 30.9 107.3 35.4 3.8 1.2 7.8 1.8 11.9 1.8l15.9 0.1v55c0 11.8 14 17.9 22.7 10L914.2 725c5.9-5.5 5.9-14.7 0-20z' }),
            ),
          ),
          h('div', { class: 'amms-center-btns' }, [
            h(
              'button',
              {
                class: 'amms-ctrl-btn prev-next',
                title: '上一首',
                onClick: playPrev,
                onMousedown: handleBtnMouseDown,
                onMouseup: handleBtnPressEnd,
                onMouseleave: handleBtnPressEnd,
              },
              h(
                'svg',
                { viewBox: '0 0 1760 1024', fill: 'currentColor' },
                [
                  h('path', { d: 'M1583.875213 61.297893L979.727337 410.384197a115.842628 115.842628 0 0 0-58.700524 103.894734 117.401049 117.401049 0 0 0 58.700524 103.894734l604.147876 348.566831a117.401049 117.401049 0 0 0 176.101573-103.894734V163.114732a117.401049 117.401049 0 0 0-176.101573-101.816839z' }),
                  h('path', { d: 'M727.263135 17.662105L64.414735 400.514198a129.348943 129.348943 0 0 0 0 223.373677L727.263135 1006.739968a128.82947 128.82947 0 0 0 193.244204-111.686839V129.348943A128.82947 128.82947 0 0 0 727.263135 17.662105z' }),
                ],
              ),
            ),
            h(
              'button',
              {
                class: 'amms-ctrl-btn play-btn',
                title: '播放/暂停',
                onClick: togglePlay,
                onMousedown: handleBtnMouseDown,
                onMouseup: handleBtnPressEnd,
                onMouseleave: handleBtnPressEnd,
              },
              isPlaying.value
                ? h(
                    'svg',
                    { viewBox: '0 0 1024 1024', fill: 'currentColor' },
                    [
                      h('path', { d: 'M383 95H255c-35.35 0-64 28.65-64 64v704c0 35.35 28.65 64 64 64h128c35.35 0 64-28.65 64-64V159c0-35.35-28.65-64-64-64z' }),
                      h('path', { d: 'M767 95H639c-35.35 0-64 28.65-64 64v704c0 35.35 28.65 64 64 64h128c35.35 0 64-28.65 64-64V159c0-35.35-28.65-64-64-64z' }),
                    ],
                  )
                : h(
                    'svg',
                    { viewBox: '0 0 1024 1024', fill: 'currentColor' },
                    h('path', { d: 'M852.2496 392.448c104.6848 66.0288 104.6272 173.1136 0 239.104l-573.1008 361.472C174.464 1059.04 89.6 1016.0448 89.6 897.1328V126.8608C89.6 7.8848 174.5216-35.0144 279.1488 30.976l573.1008 361.472z' }),
                  ),
            ),
            h(
              'button',
              {
                class: 'amms-ctrl-btn prev-next',
                title: '下一首',
                onClick: playNext,
                onMousedown: handleBtnMouseDown,
                onMouseup: handleBtnPressEnd,
                onMouseleave: handleBtnPressEnd,
              },
              h(
                'svg',
                { viewBox: '0 0 1760 1024', fill: 'currentColor' },
                h('g', { transform: 'translate(1760, 0) scale(-1, 1)' }, [
                  h('path', { d: 'M1583.875213 61.297893L979.727337 410.384197a115.842628 115.842628 0 0 0-58.700524 103.894734 117.401049 117.401049 0 0 0 58.700524 103.894734l604.147876 348.566831a117.401049 117.401049 0 0 0 176.101573-103.894734V163.114732a117.401049 117.401049 0 0 0-176.101573-101.816839z' }),
                  h('path', { d: 'M727.263135 17.662105L64.414735 400.514198a129.348943 129.348943 0 0 0 0 223.373677L727.263135 1006.739968a128.82947 128.82947 0 0 0 193.244204-111.686839V129.348943A128.82947 128.82947 0 0 0 727.263135 17.662105z' }),
                ]),
              ),
            ),
          ]),
          h(
            'button',
            {
              class: ['amms-ctrl-btn', 'small', playMode.value === 'list' ? 'active' : ''],
              title: '列表循环',
              onClick: setListMode,
              onMousedown: handleBtnMouseDown,
              onMouseup: handleBtnPressEnd,
              onMouseleave: handleBtnPressEnd,
            },
            h(
              'svg',
              { viewBox: '0 0 1024 1024', fill: 'currentColor' },
              h('path', {
                d: 'M301.392 805.072v53.856a20 20 0 0 1-33.056 15.104l-117.76-101.84a20 20 0 0 1 0-30.24l117.76-101.84a20 20 0 0 1 33.056 15.12v53.84h332.288c89.344 0 161.856-72.8 161.856-162.72v-9.6a48 48 0 1 1 96 0v9.6c0 142.832-115.408 258.72-257.856 258.72H301.392z m437.216-570.144v-53.856a20 20 0 0 1 33.056-15.104l117.76 101.84a20 20 0 0 1 0 30.24l-117.76 101.84a20 20 0 0 1-33.056-15.12v-53.84H406.32c-89.344 0-161.856 72.8-161.856 162.72v9.6a48 48 0 0 1-96 0v-9.6c0-142.832 115.408-258.72 257.856-258.72h332.288z',
              }),
            ),
          ),
        ])

      return () =>
        h('div', { class: 'amms-root' }, [
          // Blur background
          h('div', {
            class: 'amms-blur-bg',
            style: coverUrl.value
              ? { backgroundImage: `url(${coverUrl.value})` }
              : undefined,
          }),
          // Left panel
          h('div', { class: 'amms-left-panel' }, [
            h('div', { class: 'amms-left-content' }, [
              renderCover(),
              renderTrackInfo(),
              renderProgress(),
              renderControls(),
            ]),
          ]),
          // Right panel - AMLL lyrics
          h('div', {
            class: 'amms-right-panel',
            style: {
              '--amll-font-scale': settings.value.fontScale / 100,
              '--amll-font-weight': settings.value.fontWeight,
              '--amll-text-shadow': settings.value.enhanceContrast
                ? '0 2px 10px rgba(0,0,0,0.62), 0 14px 36px rgba(0,0,0,0.45)'
                : undefined,
              '--amll-unplayed-color': settings.value.enhanceContrast
                ? 'rgba(255,255,255,1)'
                : undefined,
              '--amll-sub-opacity': settings.value.enhanceContrast ? '0.72' : undefined,
              '--amll-bg-opacity': settings.value.enhanceContrast ? '0.58' : undefined,
            },
          }, [
            h('div', {
              class: 'amms-lyrics-container',
            }, [
              h('div', { ref: playerAreaRef, class: 'amms-amll-area' }),
            ]),
          ]),
          // 评论与分享按钮：传送到宿主工具区同级，脱离插件的 isolate 堆叠上下文
          hostContentEl.value
            ? h(Teleport, { to: hostContentEl.value.parentElement }, [
                h(
                  'div',
                  {
                    ref: sideToolsEl,
                    class: 'amms-side-tools',
                    style: {
                      opacity: sideToolsHovered.value ? 1 : 0,
                      pointerEvents: sideToolsHovered.value ? 'auto' : 'none',
                    },
                    onMouseenter: handleSideToolsEnter,
                    onMouseleave: handleSideToolsLeave,
                  },
                  track.value
                    ? [
                        h(
                          'button',
                          {
                            ref: commentBtnEl,
                            class: 'action-icon soft-secondary-action amms-comment-btn',
                            'aria-label': '查看评论',
                            title: '查看评论',
                            onClick: openComments,
                          },
                          h(
                            'svg',
                            {
                              viewBox: '0 0 24 24',
                              fill: 'none',
                              stroke: 'currentColor',
                              'stroke-width': '2',
                              'stroke-linecap': 'round',
                              'stroke-linejoin': 'round',
                            },
                            h('path', {
                              d: 'm3 20l1.3-3.9C1.976 12.663 2.874 8.228 6.4 5.726c3.526-2.501 8.59-2.296 11.845.48c3.255 2.777 3.695 7.266 1.029 10.501C16.608 19.942 11.659 20.922 7.7 19L3 20',
                            }),
                          ),
                        ),
                        h(
                          'button',
                          {
                            ref: shareBtnEl,
                            class: 'action-icon soft-secondary-action amms-share-btn',
                            'aria-label': '分享',
                            title: canShare.value ? '分享' : '当前歌曲无法分享',
                            disabled: !canShare.value,
                            onClick: shareTrack,
                          },
                          h(
                            'svg',
                            {
                              viewBox: '0 0 24 24',
                              fill: 'none',
                              stroke: 'currentColor',
                              'stroke-width': '2',
                              'stroke-linecap': 'round',
                              'stroke-linejoin': 'round',
                            },
                            h('path', {
                              d: 'M3 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0m12-6a3 3 0 1 0 6 0a3 3 0 1 0-6 0m0 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0m-6.3-7.3l6.6-3.4m-6.6 6l6.6 3.4',
                            }),
                          ),
                        ),
                      ]
                    : null,
                ),
              ])
            : null,
        ])
    },
  })
}
